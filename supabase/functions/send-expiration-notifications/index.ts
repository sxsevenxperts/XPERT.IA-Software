/**
 * send-expiration-notifications — Notificações de expiração de assinatura
 *
 * Execução: Diariamente via GitHub Actions (9 AM UTC)
 * Método: POST /functions/v1/send-expiration-notifications
 *
 * Lógica de notificações:
 * - T-3 dias: "⏰ Subscrição vencendo em 3 dias"
 * - T+0 dias: "❌ Subscrição expirou"
 * - T+25 dias: "🚨 ÚLTIMO AVISO - 5 dias para deletar dados"
 *
 * Requisitos:
 * - FIREBASE_CREDENTIALS: JSON service account do Firebase
 * - push_tokens table: { user_id, token }
 *
 * Tratamento:
 * - Idempotent (safe to run múltiplas vezes)
 * - Retry logic for transient failures
 * - Detailed logging
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ── Firebase Access Token ──────────────────────────────────────────────────
// Uses proper JWT signing with Web Crypto API (Deno runtime)
async function getFirebaseAccessToken(
  credentials: Record<string, unknown>
): Promise<string> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    // Encode header and payload
    const headerEncoded = btoa(JSON.stringify(header));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    // Import private key and sign JWT
    const privateKey = credentials.private_key as string;
    if (!privateKey) {
      throw new Error("Firebase credentials missing private_key");
    }

    const pemKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");

    const binaryKey = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(signatureInput)
    );

    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    const jwt = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[FirebaseAuth] Token response error: ${errBody}`);
      throw new Error(`Firebase token error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as Record<string, string | number | boolean>;
    const token = data.access_token as string;

    if (!token) {
      throw new Error("No access token in response");
    }

    console.log("[FirebaseAuth] Access token generated successfully");
    return token;
  } catch (err) {
    console.error(`[FirebaseAuth] Token generation failed: ${err}`);
    throw err;
  }
}

// ── Send FCM Notification ──────────────────────────────────────────────────
interface FCMMessage {
  message: {
    token: string;
    notification: { title: string; body: string };
    data: Record<string, string>;
  };
}

async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  accessToken: string,
  projectId: string,
  attempt = 1
): Promise<boolean> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  try {
    const payload: FCMMessage = {
      message: {
        token,
        notification: { title, body },
        data: { timestamp: new Date().toISOString() },
      },
    };

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    // Success
    if (res.ok) {
      return true;
    }

    // Token invalid (400, 401) - don't retry
    if (res.status === 400 || res.status === 401) {
      console.warn(`[FCM] Invalid token ${token}: ${res.status}`);
      return false;
    }

    // Transient error (429, 500+) - retry
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
      return sendFCMNotification(token, title, body, accessToken, projectId, attempt + 1);
    }

    console.warn(`[FCM] Failed (attempt ${attempt}): ${res.status}`);
    return false;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
      return sendFCMNotification(token, title, body, accessToken, projectId, attempt + 1);
    }
    console.error(`[FCM] Error: ${err}`);
    return false;
  }
}

// ── Send Notifications for Subscriptions ───────────────────────────────────
interface SubscriptionRow {
  user_id: string;
  expires_at: string;
  profiles: { email: string };
}

interface NotificationStats {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

async function sendNotificationsForSubscriptions(
  subscriptions: SubscriptionRow[],
  supabase: ReturnType<typeof createClient>,
  accessToken: string,
  projectId: string,
  title: string,
  body: string
): Promise<NotificationStats> {
  const stats: NotificationStats = { sent: 0, failed: 0, skipped: 0, errors: [] };

  for (const sub of subscriptions) {
    const userEmail = sub.profiles?.email || "unknown";

    try {
      // Fetch push tokens for user
      const { data: tokens, error: tokenError } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", sub.user_id);

      if (tokenError) {
        console.warn(`[SendNotifications] Token fetch error for ${userEmail}: ${tokenError.message}`);
        stats.errors.push(`${userEmail}: Failed to fetch tokens`);
        stats.skipped++;
        continue;
      }

      if (!tokens || tokens.length === 0) {
        console.log(`[SendNotifications] No tokens for ${userEmail}, skipping`);
        stats.skipped++;
        continue;
      }

      // Send FCM notification for each token
      for (const tokenRecord of tokens) {
        const success = await sendFCMNotification(
          tokenRecord.token,
          title,
          body,
          accessToken,
          projectId
        );

        if (success) {
          stats.sent++;
          console.log(`[SendNotifications] ✅ Sent to ${userEmail}`);
        } else {
          stats.failed++;
          stats.errors.push(`${userEmail}: FCM send failed`);
        }
      }
    } catch (err) {
      console.error(`[SendNotifications] Unexpected error for ${userEmail}: ${err}`);
      stats.errors.push(`${userEmail}: ${err instanceof Error ? err.message : "Unknown error"}`);
      stats.failed++;
    }
  }

  return stats;
}

async function handleRequest(req: Request): Promise<Response> {
  const startTime = Date.now();

  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate method
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const firebaseCredsStr = Deno.env.get("FIREBASE_CREDENTIALS");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[SendNotifications] Missing Supabase credentials");
    return json({ error: "Server configuration error" }, 500);
  }

  if (!firebaseCredsStr) {
    console.error("[SendNotifications] FIREBASE_CREDENTIALS not set");
    return json({ error: "Firebase credentials not configured" }, 500);
  }

  let firebaseCredentials: Record<string, unknown>;
  try {
    firebaseCredentials = JSON.parse(firebaseCredsStr);
  } catch (err) {
    console.error(`[SendNotifications] Invalid Firebase credentials JSON: ${err}`);
    return json({ error: "Invalid Firebase configuration" }, 500);
  }

  const projectId = firebaseCredentials.project_id as string;
  if (!projectId) {
    console.error("[SendNotifications] Firebase credentials missing project_id");
    return json({ error: "Invalid Firebase configuration" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();
  const day3before = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const day25after = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // Get Firebase access token
    let accessToken: string;
    try {
      accessToken = await getFirebaseAccessToken(firebaseCredentials);
    } catch (err) {
      console.error(`[SendNotifications] Firebase auth failed: ${err}`);
      return json({ error: "Firebase authentication failed" }, 500);
    }

    // ── Process Subscriptions ──────────────────────────────────────────────────

    // 1. Expiring in 3 days
    const { data: expiring3days, error: err1 } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at, profiles!inner(email)")
      .eq("status", "active")
      .gte("expires_at", now.toISOString())
      .lte("expires_at", day3before.toISOString());

    if (err1) {
      console.error(`[SendNotifications] Query error (3-day): ${err1.message}`);
      errors.push(`Query error: ${err1.message}`);
    } else if (expiring3days?.length) {
      console.log(`[SendNotifications] Found ${expiring3days.length} subscriptions expiring in 3 days`);
      const stats1 = await sendNotificationsForSubscriptions(
        expiring3days as SubscriptionRow[],
        supabase,
        accessToken,
        projectId,
        "⏰ Subscrição vencendo",
        "Sua subscrição expira em 3 dias. Renove agora para não perder acesso."
      );
      sent += stats1.sent;
      failed += stats1.failed;
      skipped += stats1.skipped;
      errors.push(...stats1.errors);
    } else {
      console.log(`[SendNotifications] No subscriptions expiring in 3 days`);
    }

    // 2. Expiring today
    const { data: expiringToday, error: err2 } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at, profiles!inner(email)")
      .eq("status", "active")
      .lte("expires_at", now.toISOString());

    if (err2) {
      console.error(`[SendNotifications] Query error (today): ${err2.message}`);
      errors.push(`Query error: ${err2.message}`);
    } else if (expiringToday?.length) {
      console.log(`[SendNotifications] Found ${expiringToday.length} subscriptions expiring today`);
      const stats2 = await sendNotificationsForSubscriptions(
        expiringToday as SubscriptionRow[],
        supabase,
        accessToken,
        projectId,
        "❌ Subscrição expirou",
        "Sua subscrição expirou. Seu acesso foi suspenso."
      );
      sent += stats2.sent;
      failed += stats2.failed;
      skipped += stats2.skipped;
      errors.push(...stats2.errors);
    } else {
      console.log(`[SendNotifications] No subscriptions expiring today`);
    }

    // 3. Expired 25+ days ago (final warning)
    const { data: expiredLongAgo, error: err3 } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at, profiles!inner(email)")
      .lte("expires_at", day25after.toISOString())
      .eq("status", "active");

    if (err3) {
      console.error(`[SendNotifications] Query error (25-day): ${err3.message}`);
      errors.push(`Query error: ${err3.message}`);
    } else if (expiredLongAgo?.length) {
      console.log(`[SendNotifications] Found ${expiredLongAgo.length} subscriptions expired 25+ days`);
      const stats3 = await sendNotificationsForSubscriptions(
        expiredLongAgo as SubscriptionRow[],
        supabase,
        accessToken,
        projectId,
        "🚨 ÚLTIMO AVISO",
        "Seus dados serão deletados em 5 dias. Renove agora para recuperar acesso."
      );
      sent += stats3.sent;
      failed += stats3.failed;
      skipped += stats3.skipped;
      errors.push(...stats3.errors);
    } else {
      console.log(`[SendNotifications] No subscriptions expired 25+ days`);
    }

    const duration = Date.now() - startTime;
    console.log(`[SendNotifications] Complete in ${duration}ms: sent=${sent}, failed=${failed}, skipped=${skipped}`);

    return json({
      ok: true,
      sent,
      failed,
      skipped,
      errors: errors.length ? errors : undefined,
      ran_at: now.toISOString(),
      duration_ms: duration,
    });
  } catch (error) {
    console.error("Erro ao enviar notificações:", error);
    return json({ error: String(error) }, 500);
  }
}

Deno.serve(handleRequest);

/**
 * send-expiration-notifications — roda todo dia via cron
 *
 * Envia push notifications via Firebase Cloud Messaging para avisar sobre vencimento
 * - 3 dias antes: "Subscrição expira em 3 dias"
 * - No dia de expiração: "Sua subscrição expirou"
 * - 25 dias após expiração: "ÚLTIMO AVISO - 5 dias para deletar dados"
 *
 * Requer:
 * - FIREBASE_CREDENTIALS: JSON com credenciais do Firebase (service account)
 * - Tokens de push armazenados em push_tokens table
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

// ── Gerar access token do Firebase ──────────────────────────────────────────
async function getFirebaseAccessToken(
  credentials: Record<string, unknown>
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const headerEncoded = btoa(JSON.stringify(header));
  const payloadEncoded = btoa(JSON.stringify(payload));
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Importar chave privada e assinar (simplificado - usar biblioteca em produção)
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signatureInput}.fake_signature`,
    }).toString(),
  });

  const data = (await res.json()) as Record<string, unknown>;
  return (data.access_token as string) || "";
}

// ── Enviar push notification via FCM ────────────────────────────────────────
async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  accessToken: string,
  projectId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: {
              timestamp: new Date().toISOString(),
            },
          },
        }),
      }
    );

    return res.ok;
  } catch {
    return false;
  }
}

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const firebaseCredsStr = Deno.env.get("FIREBASE_CREDENTIALS") || "";

  if (!firebaseCredsStr) {
    return json(
      { error: "FIREBASE_CREDENTIALS não configurado no Supabase" },
      500
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const firebaseCredentials = JSON.parse(firebaseCredsStr) as Record<
    string,
    unknown
  >;
  const projectId = firebaseCredentials.project_id as string;

  const now = new Date();
  const day3before = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const day25after = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);

  let sent = 0;
  const errors: string[] = [];

  try {
    // Obter access token do Firebase uma vez
    const accessToken = await getFirebaseAccessToken(firebaseCredentials);
    if (!accessToken) {
      throw new Error("Falha ao obter access token do Firebase");
    }

    // ── 1. Subscrições que vencem em 3 dias ──────────────────────────────────────
    const { data: expiring3days } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .eq("status", "active")
      .gte("expires_at", now.toISOString())
      .lte("expires_at", day3before.toISOString());

    if (expiring3days?.length) {
      for (const sub of expiring3days) {
        try {
          const { data: tokens } = await supabase
            .from("push_tokens")
            .select("token")
            .eq("user_id", sub.user_id);

          if (tokens?.length) {
            for (const tokenObj of tokens) {
              const success = await sendFCMNotification(
                tokenObj.token as string,
                "⏰ Subscrição vencendo",
                "Sua subscrição expira em 3 dias. Renove agora para não perder acesso.",
                accessToken,
                projectId
              );
              if (success) {
                sent++;
                console.log(
                  `✅ Push enviado para ${sub.user_id}: "Subscrição expira em 3 dias"`
                );
              }
            }
          }
        } catch (err) {
          errors.push(
            `Erro ao enviar notificação para ${sub.user_id}: ${err}`
          );
        }
      }
    }

    // ── 2. Subscrições que expiram hoje ──────────────────────────────────────────
    const { data: expiringToday } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .eq("status", "active")
      .lte("expires_at", now.toISOString());

    if (expiringToday?.length) {
      for (const sub of expiringToday) {
        try {
          const { data: tokens } = await supabase
            .from("push_tokens")
            .select("token")
            .eq("user_id", sub.user_id);

          if (tokens?.length) {
            for (const tokenObj of tokens) {
              const success = await sendFCMNotification(
                tokenObj.token as string,
                "❌ Subscrição expirou",
                "Sua subscrição expirou. Seu acesso foi suspenso.",
                accessToken,
                projectId
              );
              if (success) {
                sent++;
                console.log(
                  `✅ Push enviado para ${sub.user_id}: "Sua subscrição expirou"`
                );
              }
            }
          }
        } catch (err) {
          errors.push(
            `Erro ao enviar notificação para ${sub.user_id}: ${err}`
          );
        }
      }
    }

    // ── 3. Subscrições expiradas há 25 dias (ÚLTIMO AVISO) ─────────────────────────
    const { data: expiredLongAgo } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .lte("expires_at", day25after.toISOString());

    if (expiredLongAgo?.length) {
      for (const sub of expiredLongAgo) {
        try {
          const { data: tokens } = await supabase
            .from("push_tokens")
            .select("token")
            .eq("user_id", sub.user_id);

          if (tokens?.length) {
            for (const tokenObj of tokens) {
              const success = await sendFCMNotification(
                tokenObj.token as string,
                "🚨 ÚLTIMO AVISO",
                "Seus dados serão deletados em 5 dias. Renove agora para recuperar acesso.",
                accessToken,
                projectId
              );
              if (success) {
                sent++;
                console.log(
                  `✅ Push enviado para ${sub.user_id}: "ÚLTIMO AVISO - 5 dias para deletar"`
                );
              }
            }
          }
        } catch (err) {
          errors.push(
            `Erro ao enviar notificação para ${sub.user_id}: ${err}`
          );
        }
      }
    }

    return json({
      ok: true,
      sent,
      errors: errors.length ? errors : undefined,
      ran_at: now.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao enviar notificações:", error);
    return json({ error: String(error) }, 500);
  }
}

Deno.serve(handleRequest);

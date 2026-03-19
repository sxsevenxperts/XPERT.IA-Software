import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const MICROSOFT_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID")!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET")!;

const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/email-proxy`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "status";
    const provider = url.searchParams.get("provider") || "gmail";

    // Para OAuth callback, não precisa de JWT
    if (action === "callback") {
      return await handleCallback(req, provider);
    }

    // Para outras ações, validar JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: missing token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.slice(7);
    const adminDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: userError } = await adminDb.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = user.id;

    // Router
    switch (action) {
      case "auth-url":
        return await getAuthUrl(provider);
      case "status":
        return await getStatus(userId, provider);
      case "disconnect":
        return await disconnect(userId, provider);
      case "send":
        return await sendEmail(req, userId, provider);
      case "list-templates":
        return await listTemplates(userId);
      case "save-template":
        return await saveTemplate(req, userId);
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function getAuthUrl(provider: string) {
  if (provider === "gmail") {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
      access_type: "offline",
      prompt: "consent",
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    return new Response(JSON.stringify({ url }), { headers: corsHeaders });
  } else if (provider === "outlook") {
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      response_type: "code",
      scope: "Mail.Send Mail.Read offline_access",
    });
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
    return new Response(JSON.stringify({ url }), { headers: corsHeaders });
  }
  return new Response(JSON.stringify({ error: "Unknown provider" }), { status: 400, headers: corsHeaders });
}

async function handleCallback(req: Request, provider: string) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return new Response(
      JSON.stringify({ error: "Missing code in callback" }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const adminDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (provider === "gmail") {
      const tokenData = await exchangeCodeForToken(code, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
      const userEmail = await getGoogleUserEmail(tokenData.access_token);

      // TODO: Extrair user_id de state (ver pattern em gcal-proxy)
      // Por ora, retornar sucesso apenas
      return new Response(
        JSON.stringify({
          success: true,
          message: "Gmail connected successfully",
          email: userEmail,
        }),
        { headers: corsHeaders }
      );
    } else if (provider === "outlook") {
      const tokenData = await exchangeCodeForTokenMicrosoft(code, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET);
      const userEmail = await getMicrosoftUserEmail(tokenData.access_token);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Outlook connected successfully",
          email: userEmail,
        }),
        { headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: CALLBACK_URL,
      grant_type: "authorization_code",
    }).toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to exchange code");
  return data;
}

async function exchangeCodeForTokenMicrosoft(code: string, clientId: string, clientSecret: string) {
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: CALLBACK_URL,
      grant_type: "authorization_code",
      scope: "Mail.Send Mail.Read offline_access",
    }).toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to exchange code");
  return data;
}

async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.email;
}

async function getMicrosoftUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.mail || data.userPrincipalName;
}

async function getStatus(userId: string, provider: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .in("chave", [`email_${provider}_access_token`, `email_${provider}_address`])
    .then(async (result) => {
      if (result.error) return result;

      const config: Record<string, string> = {};
      result.data?.forEach((row) => {
        config[row.chave] = row.valor;
      });

      const connected = !!config[`email_${provider}_access_token`];
      return {
        data: {
          connected,
          provider,
          email: config[`email_${provider}_address`] || null,
        },
        error: null,
      };
    });

  return new Response(JSON.stringify(data || error), { headers: corsHeaders });
}

async function disconnect(userId: string, provider: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const keys = [
    `email_${provider}_access_token`,
    `email_${provider}_refresh_token`,
    `email_${provider}_expiry`,
    `email_${provider}_address`,
  ];

  const { error } = await db
    .from("agente_config")
    .delete()
    .eq("user_id", userId)
    .in("chave", keys);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function sendEmail(req: Request, userId: string, provider: string) {
  const body = await req.json();
  const { to, subject, body: emailBody } = body;

  if (!to || !subject || !emailBody) {
    return new Response(
      JSON.stringify({ error: "Missing to, subject, or body" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configData } = await db
    .from("agente_config")
    .select("chave, valor")
    .eq("user_id", userId)
    .in("chave", [`email_${provider}_access_token`, `email_${provider}_refresh_token`]);

  const config: Record<string, string> = {};
  configData?.forEach((row) => {
    config[row.chave] = row.valor;
  });

  const accessToken = config[`email_${provider}_access_token`];
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: `${provider} not connected` }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    if (provider === "gmail") {
      await sendGmailEmail(to, subject, emailBody, accessToken);
    } else if (provider === "outlook") {
      await sendOutlookEmail(to, subject, emailBody, accessToken);
    }

    return new Response(JSON.stringify({ success: true, message: "Email sent" }), { headers: corsHeaders });
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function sendGmailEmail(to: string, subject: string, body: string, accessToken: string) {
  const email = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
  const base64Email = btoa(email).replace(/\+/g, "-").replace(/\//g, "_");

  const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64Email }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || "Failed to send Gmail");
  }
}

async function sendOutlookEmail(to: string, subject: string, body: string, accessToken: string) {
  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || "Failed to send Outlook");
  }
}

async function listTemplates(userId: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "email_templates");

  const templates = data?.[0]?.valor ? JSON.parse(data[0].valor) : [];
  return new Response(JSON.stringify({ templates }), { headers: corsHeaders });
}

async function saveTemplate(req: Request, userId: string) {
  const body = await req.json();
  const { name, content } = body;

  if (!name || !content) {
    return new Response(
      JSON.stringify({ error: "Missing name or content" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get existing templates
  const { data: existing } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "email_templates");

  const templates = existing?.[0]?.valor ? JSON.parse(existing[0].valor) : [];
  templates.push({ id: Date.now(), name, content, createdAt: new Date() });

  const { error } = await db
    .from("agente_config")
    .upsert({
      user_id: userId,
      chave: "email_templates",
      valor: JSON.stringify(templates),
    });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

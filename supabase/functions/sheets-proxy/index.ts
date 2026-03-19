import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/sheets-proxy`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "status";

    // Para OAuth callback, não precisa de JWT
    if (action === "callback") {
      return await handleCallback(req);
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
        return await getAuthUrl();
      case "status":
        return await getStatus(userId);
      case "disconnect":
        return await disconnect(userId);
      case "list-sheets":
        return await listSheets(userId);
      case "create-sheet":
        return await createSheet(req, userId);
      case "append-row":
        return await appendRow(req, userId);
      case "append-multiple":
        return await appendMultiple(req, userId);
      case "get-data":
        return await getData(req, userId);
      case "clear-sheet":
        return await clearSheet(req, userId);
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

async function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
    access_type: "offline",
    prompt: "consent",
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return new Response(JSON.stringify({ url }), { headers: corsHeaders });
}

async function handleCallback(req: Request) {
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
    const tokenData = await exchangeCodeForToken(code);
    const userEmail = await getGoogleUserEmail(tokenData.access_token);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Google Sheets connected successfully",
        email: userEmail,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function exchangeCodeForToken(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: CALLBACK_URL,
      grant_type: "authorization_code",
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

async function getStatus(userId: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .in("chave", ["sheets_access_token", "sheets_email", "sheets_default_spreadsheet_id"]);

  const config: Record<string, string> = {};
  data?.forEach((row) => {
    config[row.chave] = row.valor;
  });

  const connected = !!config.sheets_access_token;
  return new Response(
    JSON.stringify({
      connected,
      email: config.sheets_email || null,
      spreadsheet_id: config.sheets_default_spreadsheet_id || null,
    }),
    { headers: corsHeaders }
  );
}

async function disconnect(userId: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const keys = [
    "sheets_access_token",
    "sheets_refresh_token",
    "sheets_expiry",
    "sheets_email",
    "sheets_default_spreadsheet_id",
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

async function listSheets(userId: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configData } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "sheets_access_token");

  const accessToken = configData?.[0]?.valor;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "Google Sheets not connected" }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();
    return new Response(JSON.stringify({ sheets: data.files || [] }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function createSheet(req: Request, userId: string) {
  const body = await req.json();
  const { title, headers } = body;

  if (!title) {
    return new Response(
      JSON.stringify({ error: "Missing title" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configData } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "sheets_access_token");

  const accessToken = configData?.[0]?.valor;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "Google Sheets not connected" }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    // Create spreadsheet
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { title } }),
    });

    const spreadsheet = await createRes.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // Add headers if provided
    if (headers && headers.length > 0) {
      await appendRow(
        new Request(req.url, {
          method: "POST",
          body: JSON.stringify({
            spreadsheet_id: spreadsheetId,
            range: "Sheet1!A1",
            values: [headers],
          }),
        }),
        userId
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        spreadsheet_id: spreadsheetId,
        title,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function appendRow(req: Request, userId: string) {
  const body = await req.json();
  const { spreadsheet_id, range = "Sheet1!A:Z", values } = body;

  if (!spreadsheet_id || !values) {
    return new Response(
      JSON.stringify({ error: "Missing spreadsheet_id or values" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configData } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "sheets_access_token");

  const accessToken = configData?.[0]?.valor;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "Google Sheets not connected" }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: Array.isArray(values[0]) ? values : [values] }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to append");

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function appendMultiple(req: Request, userId: string) {
  const body = await req.json();
  const { spreadsheet_id, range = "Sheet1!A:Z", values } = body;

  if (!spreadsheet_id || !values || !Array.isArray(values)) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid spreadsheet_id or values" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configData } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "sheets_access_token");

  const accessToken = configData?.[0]?.valor;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "Google Sheets not connected" }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to append");

    return new Response(JSON.stringify({ success: true, rows: values.length }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function getData(req: Request, userId: string) {
  const url = new URL(req.url);
  const spreadsheetId = url.searchParams.get("spreadsheet_id");
  const range = url.searchParams.get("range") || "Sheet1!A:Z";

  if (!spreadsheetId) {
    return new Response(
      JSON.stringify({ error: "Missing spreadsheet_id" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configData } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "sheets_access_token");

  const accessToken = configData?.[0]?.valor;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "Google Sheets not connected" }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await res.json();
    return new Response(JSON.stringify({ values: data.values || [] }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function clearSheet(req: Request, userId: string) {
  const body = await req.json();
  const { spreadsheet_id, range = "Sheet1!A:Z" } = body;

  if (!spreadsheet_id) {
    return new Response(
      JSON.stringify({ error: "Missing spreadsheet_id" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configData } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "sheets_access_token");

  const accessToken = configData?.[0]?.valor;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "Google Sheets not connected" }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${range}:clear`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error("Failed to clear sheet");
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

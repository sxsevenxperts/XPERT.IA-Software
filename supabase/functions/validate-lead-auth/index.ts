import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jwtVerify } from "https://esm.sh/jose@5.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

async function validateLeadAuth(token: string, user_id: string): Promise<Response> {
  try {
    const secret = new TextEncoder().encode(Deno.env.get("JWT_SECRET") || "");
    if (!secret) {
      return new Response(JSON.stringify({ authenticated: false, error: "Config error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Verificar token JWT
    const verified = await jwtVerify(token, secret);
    const tokenUserId = verified.payload.sub as string;

    // Validar que o user_id do token bate com o requisitado
    if (tokenUserId !== user_id) {
      return new Response(JSON.stringify({ authenticated: false, error: "Token mismatch" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Verificar se lead/usuário existe e está ativo
    const { data: user, error: userError } = await supabase
      .from("leads")
      .select("id, user_id, nome, email, stage, ativo")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ authenticated: false, error: "Lead not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (!user.ativo) {
      return new Response(JSON.stringify({ authenticated: false, error: "Lead inactive" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Sucesso! Lead está autenticado e ativo
    return new Response(JSON.stringify({
      authenticated: true,
      lead: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        stage: user.stage,
      },
      message: "Autenticado com sucesso",
    }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ authenticated: false, error: "Invalid token" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ authenticated: false, error: "Missing token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const token = authHeader.substring(7);
    const body = await request.json() as any;
    const user_id = body.lead_id || body.user_id;

    if (!user_id) {
      return new Response(JSON.stringify({ authenticated: false, error: "Missing lead_id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return await validateLeadAuth(token, user_id);
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ authenticated: false, error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
}

Deno.serve(handleRequest);
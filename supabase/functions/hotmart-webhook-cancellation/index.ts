/**
 * hotmart-webhook-cancellation — processa cancelamentos do Hotmart
 *
 * Hotmart envia webhook quando cliente cancela subscrição.
 * Marca a subscrição como "cancelled" para suspensão imediata.
 *
 * POST /functions/v1/hotmart-webhook-cancellation
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

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const body = (await req.json()) as Record<string, unknown>;

    // Hotmart pode enviar em diferentes formatos dependendo do webhook
    // Comum: { subscriber: { email }, transaction: { id } }
    // Ou: { data: { subscriber: { email }, transaction: { id } } }
    const webhookData = (body.data || body) as Record<string, unknown>;
    const subscriber = webhookData.subscriber as Record<string, unknown> || {};
    const transaction = webhookData.transaction as Record<string, unknown> || {};

    const email = (subscriber.email as string) || "";
    const transactionId = (transaction.id as string) || (transaction.transaction_id as string) || "";

    if (!email) {
      console.warn("⚠️  Webhook do Hotmart sem email. Body:", JSON.stringify(body));
      return json({ error: "Email não fornecido", webhook_received: true }, 400);
    }

    console.log(`📩 Webhook Hotmart: Cancelamento para ${email}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── 1. Encontrar usuário pelo email ──────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("email", email)
      .single();

    if (!profile) {
      console.warn(`⚠️  Email não encontrado em profiles: ${email}`);
      return json({ ok: true, webhook_received: true, user_not_found: true }, 200);
    }

    const now = new Date();

    // ── 2. Marcar subscrição como cancelada ───────────────────────────────────────
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: now.toISOString(),
      })
      .eq("user_id", profile.id);

    if (updateError) {
      console.error(`❌ Erro ao marcar subscrição como cancelada: ${updateError.message}`);
      return json({ error: "Erro ao processar cancelamento" }, 500);
    }

    // ── 3. Registrar evento de cancelamento ───────────────────────────────────────
    console.log(`✅ Subscrição cancelada para ${email} (${profile.id})`);

    // Opcional: log para auditoria
    await supabase
      .from("hotmart_transactions")
      .insert({
        user_id: profile.id,
        transaction_id: transactionId || "webhook-cancellation",
        email: profile.email,
        name: profile.name,
        created_at: now.toISOString(),
      })
      .catch(() => null);

    return json({
      ok: true,
      webhook_received: true,
      user: { id: profile.id, email: profile.email },
      status: "cancelled",
      message: "Cancelamento processado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    // Retorna 200 para Hotmart não tentar reenviar, mas loga o erro
    return json(
      {
        ok: false,
        webhook_received: true,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      500
    );
  }
}

Deno.serve(handleRequest);

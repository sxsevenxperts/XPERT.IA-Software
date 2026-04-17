/**
 * reactivate-subscription — reativa subscrição após pagamento
 *
 * POST /functions/v1/reactivate-subscription
 * Body: { user_id, transaction_id }
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
    const userId = (body.user_id as string) || "";
    const transactionId = (body.transaction_id as string) || "";

    if (!userId) return json({ error: "user_id é obrigatório" }, 400);
    if (!transactionId) return json({ error: "transaction_id é obrigatório" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ── 1. Verificar se usuário existe ──────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("id", userId)
      .single();

    if (!profile) {
      console.error(`❌ Usuário não encontrado: ${userId}`);
      return json({ error: "Usuário não encontrado" }, 404);
    }

    console.log(`🔄 Reativando subscrição para ${profile.email} (${userId})`);

    // ── 2. Atualizar subscrição ─────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        expires_at: expiresAt.toISOString(),
        hotmart_transaction: transactionId,
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(`❌ Erro ao atualizar subscrição: ${updateError.message}`);
      return json({ error: "Erro ao reativar subscrição" }, 500);
    }

    // ── 3. Registrar transação ──────────────────────────────────────────────────
    await supabase
      .from("hotmart_transactions")
      .insert({
        user_id: userId,
        transaction_id: transactionId,
        email: profile.email,
        name: profile.name,
        created_at: now.toISOString(),
      })
      .catch(() => null); // Não falha se transação já existe

    console.log(`✅ Subscrição reativada para ${profile.email}`);

    return json({
      ok: true,
      user: { id: userId, email: profile.email, name: profile.name },
      subscription: {
        status: "active",
        plan: "monthly",
        expires_at: expiresAt.toISOString(),
      },
      message: "Subscrição reativada com sucesso! Bem-vindo de volta.",
    });
  } catch (error) {
    console.error("Erro interno:", error);
    return json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      500
    );
  }
}

Deno.serve(handleRequest);

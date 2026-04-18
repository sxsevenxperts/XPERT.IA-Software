/**
 * hotmart-webhook-subscription — processa novas assinaturas do Hotmart
 *
 * Hotmart envia webhook quando cliente completa pagamento e subscrição é criada.
 * Registra transação e cria/atualiza subscrição no Supabase.
 *
 * Esta é a FONTE DE VERDADE para subscrições.
 * Mesmo que o redirect (hotmart-success) falhe, este webhook garante que subscrição é criada.
 *
 * POST /functions/v1/hotmart-webhook-subscription
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
    // ── Validar assinatura HMAC SHA256 do Hotmart ─────────────────────────────
    const signature = req.headers.get("X-Hotmart-Signature") || req.headers.get("x-hotmart-signature") || "";
    const secret = Deno.env.get("HOTMART_WEBHOOK_SECRET") || "";

    if (!signature || !secret) {
      console.error(`❌ 401 Invalid Hotmart signature (missing header or secret)`);
      return json({ error: "401 Invalid Hotmart signature" }, 401);
    }

    // Ler body como texto para validação HMAC
    const bodyText = await req.text();

    // Calcular HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(bodyText);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);

    // Converter para hex (formato que Hotmart envia)
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Comparar assinaturas (case-insensitive)
    if (signature.toLowerCase() !== computedSignature.toLowerCase()) {
      console.error(`❌ 401 Invalid Hotmart signature (mismatch)\nReceived: ${signature}\nComputed: ${computedSignature}`);
      return json({ error: "401 Invalid Hotmart signature" }, 401);
    }

    console.log(`✅ Hotmart signature valid`);

    // Parse body como JSON novamente
    const body = JSON.parse(bodyText) as Record<string, unknown>;

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

    console.log(`📩 Webhook Hotmart: Nova subscrição para ${email}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    // ── 1. Encontrar usuário pelo email ──────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("email", email)
      .single();

    if (!profile) {
      // Usuário ainda não foi criado pelo hotmart-success (ex: erro no redirect)
      // Neste caso, apenas registramos a transação e retornamos sucesso
      // O usuário vai tentar fazer login e isso vai completar o registro
      console.warn(`⚠️  Email não encontrado em profiles: ${email}`);

      try {
        await supabase
          .from("hotmart_transactions")
          .insert({
            user_id: null,
            transaction_id: transactionId || "webhook-new-subscription",
            email: email,
            name: "",
            created_at: now.toISOString(),
          });
      } catch (e) {
        // Ignore if transaction already exists
      }

      return json({
        ok: true,
        webhook_received: true,
        user_not_found: true,
        message: "Usuário ainda não cadastrado. Será criado ao fazer login.",
      }, 200);
    }

    // ── 2. Verificar se subscrição já existe ─────────────────────────────────────
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", profile.id)
      .single();

    if (existingSub) {
      // Subscrição já existe — atualizar status e data de expiração
      // (case: webhook chegou depois do redirect, ou renovação de subscrição)
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          expires_at: expiresAt.toISOString(),
          hotmart_transaction: transactionId,
          updated_at: now.toISOString(),
        })
        .eq("user_id", profile.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar subscrição existente: ${updateError.message}`);
        return json({ error: "Erro ao processar subscrição" }, 500);
      }

      console.log(`🔄 Subscrição renovada para ${email} (${profile.id})`);
    } else {
      // Subscrição não existe — criar nova
      // (case: redirect falhou mas webhook chegou)
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: profile.id,
          status: "active",
          plan: "monthly",
          expires_at: expiresAt.toISOString(),
          hotmart_transaction: transactionId,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });

      if (insertError) {
        console.error(`❌ Erro ao criar subscrição: ${insertError.message}`);
        return json({ error: "Erro ao processar subscrição" }, 500);
      }

      console.log(`✅ Subscrição criada para ${email} (${profile.id})`);
    }

    // ── 3. Registrar/atualizar transação ────────────────────────────────────────
    try {
      await supabase
        .from("hotmart_transactions")
        .insert({
          user_id: profile.id,
          transaction_id: transactionId || "webhook-new-subscription",
          email: profile.email,
          name: profile.name,
          created_at: now.toISOString(),
        });
    } catch (e) {
      // Não falha se transação já existe
    }

    return json({
      ok: true,
      webhook_received: true,
      user: { id: profile.id, email: profile.email },
      subscription: {
        status: "active",
        plan: "monthly",
        expires_at: expiresAt.toISOString(),
      },
      message: "Subscrição processada com sucesso!",
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

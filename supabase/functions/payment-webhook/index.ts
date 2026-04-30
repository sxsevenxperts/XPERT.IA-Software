import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ─── CORS ────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, content-type, stripe-signature, x-asaas-access-token",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ─── STATUS NORMALIZADOS ─────────────────────────────────────────────────────
// Cada gateway usa nomenclaturas diferentes — normalizamos para:
// 'pago' | 'pendente' | 'cancelado'

type LeadPaymentStatus = "pago" | "pendente" | "cancelado";

function normalizeMercadoPagoStatus(status: string): LeadPaymentStatus {
  switch (status?.toLowerCase()) {
    case "approved":
    case "authorized":
      return "pago";
    case "in_process":
    case "pending":
    case "in_mediation":
      return "pendente";
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelado";
    default:
      return "pendente";
  }
}

function normalizeAsaasStatus(status: string): LeadPaymentStatus {
  switch (status?.toUpperCase()) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return "pago";
    case "PENDING":
    case "AWAITING_RISK_ANALYSIS":
    case "AWAITING_CHARGEBACK_REVERSAL":
      return "pendente";
    case "OVERDUE":
    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
    case "DUNNING_REQUESTED":
    case "DUNNING_RECEIVED":
      return "cancelado";
    default:
      return "pendente";
  }
}

function normalizeInfinitePayStatus(status: string): LeadPaymentStatus {
  switch (status?.toLowerCase()) {
    case "paid":
    case "approved":
    case "captured":
      return "pago";
    case "pending":
    case "processing":
    case "waiting":
      return "pendente";
    case "canceled":
    case "cancelled":
    case "declined":
    case "failed":
    case "refunded":
    case "chargedback":
      return "cancelado";
    default:
      return "pendente";
  }
}

function normalizeStripeStatus(eventType: string): LeadPaymentStatus {
  // Stripe usa eventos, não status direto no payload do webhook
  switch (eventType) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
    case "charge.succeeded":
    case "invoice.paid":
      return "pago";
    case "payment_intent.processing":
    case "checkout.session.async_payment_succeeded":
      return "pendente";
    case "payment_intent.payment_failed":
    case "checkout.session.expired":
    case "charge.failed":
    case "charge.refunded":
    case "payment_intent.canceled":
      return "cancelado";
    default:
      return "pendente";
  }
}

// ─── DETECTAR GATEWAY ─────────────────────────────────────────────────────────
type GatewayName = "stripe" | "mercado_pago" | "asaas" | "infinitepay" | "unknown";

function detectGateway(req: Request, body: unknown): GatewayName {
  // Stripe: sempre tem header "stripe-signature"
  if (req.headers.get("stripe-signature")) return "stripe";

  // ASAAS: tem header "asaas-access-token" ou campo "payment" com "status" específicos
  if (req.headers.get("asaas-access-token")) return "asaas";

  const b = body as Record<string, unknown>;

  // Mercado Pago: payload tem campo "action" e "data.id" — ou "type" = "payment"
  if (b?.action || b?.type === "payment" || b?.type === "checkout.preference") {
    return "mercado_pago";
  }

  // ASAAS: payload tem campo "event" como "PAYMENT_*"
  if (typeof b?.event === "string" && (b.event as string).startsWith("PAYMENT_")) {
    return "asaas";
  }

  // InfinitePay: payload tem campo "event" com "payment.*" ou "charge.*"
  if (
    typeof b?.event === "string" &&
    ((b.event as string).startsWith("payment.") ||
      (b.event as string).startsWith("charge."))
  ) {
    return "infinitepay";
  }

  // Stripe fallback: tem campo "type" com "checkout.session.*" ou "payment_intent.*"
  if (
    typeof b?.type === "string" &&
    (
      (b.type as string).startsWith("checkout.") ||
      (b.type as string).startsWith("payment_intent.") ||
      (b.type as string).startsWith("charge.")
    )
  ) {
    return "stripe";
  }

  return "unknown";
}

// ─── EXTRAIR DADOS DO PAYLOAD POR GATEWAY ────────────────────────────────────
interface WebhookExtracted {
  gateway: GatewayName;
  paymentStatus: LeadPaymentStatus;
  gatewayPaymentId: string;   // ID do pagamento/sessão no gateway
  leadExternalRef: string;    // external_reference / metadata.lead_id
  userId: string;             // user_id vindo de metadata ou query param
  eventType: string;
  rawStatus: string;
}

function extractStripe(body: Record<string, unknown>, fallbackUserId: string): WebhookExtracted {
  const eventType = (body.type as string) ?? "";
  const dataObj = (body.data as Record<string, unknown>)?.object as Record<string, unknown> ?? {};
  const metadata = (dataObj.metadata as Record<string, string>) ?? {};

  const paymentId = (dataObj.id as string) ?? (dataObj.payment_intent as string) ?? "";
  const leadRef = metadata.lead_id ?? "";
  const userId = metadata.user_id ?? fallbackUserId;
  const rawStatus = eventType;

  return {
    gateway: "stripe",
    paymentStatus: normalizeStripeStatus(eventType),
    gatewayPaymentId: paymentId,
    leadExternalRef: leadRef,
    userId,
    eventType,
    rawStatus,
  };
}

function extractMercadoPago(body: Record<string, unknown>, fallbackUserId: string): WebhookExtracted {
  // MP pode enviar notificação simplificada (action + data.id)
  // ou o objeto completo dependendo da versão da API
  const action = (body.action as string) ?? (body.type as string) ?? "";
  const dataId = (body.data as Record<string, unknown>)?.id as string ?? "";

  // Status pode vir direto (se for payload completo) ou precisar de consulta à API
  // Aqui tratamos o que vem direto no body
  const status = (body.status as string) ?? "";
  const externalRef = (body.external_reference as string) ?? "";
  const metadata = (body.metadata as Record<string, string>) ?? {};
  const userId = metadata.user_id ?? fallbackUserId;

  return {
    gateway: "mercado_pago",
    paymentStatus: normalizeMercadoPagoStatus(status || action),
    gatewayPaymentId: dataId || (body.id as string) ?? "",
    leadExternalRef: externalRef || metadata.lead_id ?? "",
    userId,
    eventType: action,
    rawStatus: status || action,
  };
}

function extractAsaas(body: Record<string, unknown>, fallbackUserId: string): WebhookExtracted {
  const event = (body.event as string) ?? "";
  const payment = (body.payment as Record<string, unknown>) ?? body;
  const status = (payment.status as string) ?? "";
  const paymentId = (payment.id as string) ?? "";
  const externalRef = (payment.externalReference as string) ?? "";

  // ASAAS não inclui user_id no payload — depende do query param
  return {
    gateway: "asaas",
    paymentStatus: normalizeAsaasStatus(status),
    gatewayPaymentId: paymentId,
    leadExternalRef: externalRef,
    userId: fallbackUserId,
    eventType: event,
    rawStatus: status,
  };
}

function extractInfinitePay(body: Record<string, unknown>, fallbackUserId: string): WebhookExtracted {
  const event = (body.event as string) ?? "";
  const dataObj = (body.data as Record<string, unknown>) ?? body;
  const status = (dataObj.status as string) ?? (body.status as string) ?? "";
  const paymentId = (dataObj.id as string) ?? (body.id as string) ?? "";
  const metadata = (dataObj.metadata as Record<string, string>) ?? {};
  const userId = metadata.user_id ?? fallbackUserId;
  const leadRef = metadata.lead_id ?? (dataObj.reference as string) ?? "";

  return {
    gateway: "infinitepay",
    paymentStatus: normalizeInfinitePayStatus(status),
    gatewayPaymentId: paymentId,
    leadExternalRef: leadRef,
    userId,
    eventType: event,
    rawStatus: status,
  };
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const url = new URL(req.url);
  // user_id pode vir como query param (útil para ASAAS que não manda no body)
  const userIdFromQuery = url.searchParams.get("user_id") ?? "";

  // ── Ler body ─────────────────────────────────────────────────────────────
  let rawBody: string;
  let body: Record<string, unknown>;
  try {
    rawBody = await req.text();
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return json({ error: "Body JSON inválido" }, 400);
  }

  // ── Detectar gateway ─────────────────────────────────────────────────────
  const gateway = detectGateway(req, body);
  console.log(`Webhook recebido — gateway detectado: ${gateway}`);

  // ── Extrair dados normalizados ────────────────────────────────────────────
  let extracted: WebhookExtracted;
  switch (gateway) {
    case "stripe":
      extracted = extractStripe(body, userIdFromQuery);
      break;
    case "mercado_pago":
      extracted = extractMercadoPago(body, userIdFromQuery);
      break;
    case "asaas":
      extracted = extractAsaas(body, userIdFromQuery);
      break;
    case "infinitepay":
      extracted = extractInfinitePay(body, userIdFromQuery);
      break;
    default:
      // Gateway desconhecido — registrar e responder 200 para não gerar reenvio
      console.warn("Gateway desconhecido, payload ignorado:", JSON.stringify(body).slice(0, 200));
      return json({ ok: true, warning: "gateway não reconhecido, evento ignorado" });
  }

  // ── Supabase Admin ────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── 1. Registrar webhook raw na tabela payment_webhooks ───────────────────
  const { error: webhookLogError } = await supabase.from("payment_webhooks").insert({
    gateway: extracted.gateway,
    evento_tipo: extracted.eventType,
    payload: body,
    processado: false,
  });
  if (webhookLogError) {
    console.error("Erro ao logar webhook:", webhookLogError);
    // Continua processando mesmo que o log falhe
  }

  // ── 2. Atualizar tabela `pagamentos` pelo session_id / payment_id ─────────
  let pagamentoId: string | null = null;

  if (extracted.gatewayPaymentId) {
    // Mapear status normalizado para o constraint da tabela pagamentos
    const statusMap: Record<LeadPaymentStatus, string> = {
      pago: "aprovado",
      pendente: "pendente",
      cancelado: "cancelado",
    };
    const dbStatus = statusMap[extracted.paymentStatus];

    const { data: pagamentoRow, error: pagamentoError } = await supabase
      .from("pagamentos")
      .update({
        status: dbStatus,
        ...(extracted.paymentStatus === "pago"
          ? { confirmado_em: new Date().toISOString() }
          : {}),
        webhook_raw: body,
      })
      .eq("session_id", extracted.gatewayPaymentId)
      .select("id, lead_id, user_id")
      .maybeSingle();

    if (pagamentoError) {
      console.error("Erro ao atualizar pagamento:", pagamentoError);
    } else if (pagamentoRow) {
      pagamentoId = pagamentoRow.id as string;
      // Se não tínhamos o lead_id no payload, pegamos do registro
      if (!extracted.leadExternalRef && pagamentoRow.lead_id) {
        extracted.leadExternalRef = pagamentoRow.lead_id as string;
      }
      if (!extracted.userId && pagamentoRow.user_id) {
        extracted.userId = pagamentoRow.user_id as string;
      }
    }
  }

  // ── 3. Atualizar tabela `leads` com o status de pagamento ─────────────────
  let leadUpdated = false;

  if (extracted.leadExternalRef) {
    // Tenta pelo ID direto (UUID) — external_reference pode ser o lead_id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      extracted.leadExternalRef,
    );

    if (isUuid) {
      const { error: leadError } = await supabase
        .from("leads")
        .update({ pagamento_status: extracted.paymentStatus })
        .eq("id", extracted.leadExternalRef);

      if (leadError) {
        console.error("Erro ao atualizar lead por id:", leadError);
      } else {
        leadUpdated = true;
      }
    }

    // Fallback: busca pelo user_id + external_reference como email ou nome
    if (!leadUpdated && extracted.userId) {
      const { error: leadFallbackError } = await supabase
        .from("leads")
        .update({ pagamento_status: extracted.paymentStatus })
        .eq("user_id", extracted.userId)
        .or(
          `email.eq.${extracted.leadExternalRef},telefone.eq.${extracted.leadExternalRef}`,
        );

      if (leadFallbackError) {
        console.error("Erro ao atualizar lead por user_id:", leadFallbackError);
      } else {
        leadUpdated = true;
      }
    }
  } else if (extracted.userId) {
    // Sem external_reference: atualiza o lead mais recente desse user com status pendente
    const { data: latestLead } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", extracted.userId)
      .eq("pagamento_status", "pendente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestLead?.id) {
      const { error: leadLatestError } = await supabase
        .from("leads")
        .update({ pagamento_status: extracted.paymentStatus })
        .eq("id", latestLead.id);

      if (leadLatestError) {
        console.error("Erro ao atualizar lead mais recente:", leadLatestError);
      } else {
        leadUpdated = true;
      }
    }
  }

  // ── 4. Marcar webhook como processado ─────────────────────────────────────
  if (extracted.gatewayPaymentId) {
    await supabase
      .from("payment_webhooks")
      .update({ processado: true, processado_em: new Date().toISOString() })
      .eq("gateway", extracted.gateway)
      .eq("processado", false)
      .order("criado_em", { ascending: false })
      .limit(1);
  }

  // ── Responder 200 para o gateway ──────────────────────────────────────────
  // SEMPRE retornar 200, senão o gateway reenvia indefinidamente
  return json({
    ok: true,
    gateway: extracted.gateway,
    payment_status: extracted.paymentStatus,
    payment_id: extracted.gatewayPaymentId || null,
    lead_updated: leadUpdated,
    pagamento_id: pagamentoId,
  });
}

Deno.serve(handleRequest);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ─── CORS ────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type, apikey",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface PaymentInput {
  amount: number;           // em centavos
  description: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  lead_id?: string;         // opcional — vincula ao lead
}

interface GatewayResult {
  url: string;
  payment_id: string;
}

interface AgenteConfig {
  gateway_padrao: string | null;
  stripe_secret: string | null;
  mercado_pago_access: string | null;
  asaas_api_key: string | null;
  infinitepay_api_key: string | null;
}

// ─── MERCADO PAGO ─────────────────────────────────────────────────────────────
async function createMercadoPago(
  input: PaymentInput,
  accessToken: string,
  userId: string,
): Promise<GatewayResult> {
  const payload = {
    items: [
      {
        title: input.description,
        quantity: 1,
        currency_id: "BRL",
        unit_price: input.amount / 100,
      },
    ],
    payer: {
      name: input.customer_name,
      ...(input.customer_email ? { email: input.customer_email } : {}),
      ...(input.customer_phone
        ? { phone: { number: input.customer_phone } }
        : {}),
    },
    back_urls: {
      success: `${Deno.env.get("APP_URL") ?? ""}/payment/success`,
      failure: `${Deno.env.get("APP_URL") ?? ""}/payment/cancel`,
      pending: `${Deno.env.get("APP_URL") ?? ""}/payment/pending`,
    },
    auto_return: "approved",
    external_reference: input.lead_id ?? "",
    metadata: { user_id: userId, lead_id: input.lead_id ?? "" },
    statement_descriptor: input.description.slice(0, 22),
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json() as {
    id?: string;
    init_point?: string;
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(`Mercado Pago: ${data.message ?? data.error ?? "erro desconhecido"}`);
  }

  return { url: data.init_point!, payment_id: data.id! };
}

// ─── ASAAS ───────────────────────────────────────────────────────────────────
async function createAsaas(
  input: PaymentInput,
  apiKey: string,
  userId: string,
): Promise<GatewayResult> {
  // Primeiro passo: garantir que o customer existe no ASAAS
  const customerPayload: Record<string, string> = {
    name: input.customer_name,
    externalReference: userId,
  };
  if (input.customer_email) customerPayload.email = input.customer_email;
  if (input.customer_phone) customerPayload.mobilePhone = input.customer_phone;

  const custRes = await fetch("https://api.asaas.com/v3/customers", {
    method: "POST",
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerPayload),
  });
  const custData = await custRes.json() as { id?: string; errors?: Array<{ description: string }> };
  if (!custRes.ok) {
    throw new Error(`ASAAS customer: ${custData.errors?.[0]?.description ?? "erro ao criar customer"}`);
  }

  // Segundo passo: criar link de pagamento
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const linkPayload = {
    name: input.description,
    value: input.amount / 100,
    billingType: "UNDEFINED", // permite Pix, boleto ou cartão
    chargeType: "DETACHED",
    endDate: dueDate.toISOString().split("T")[0],
    ...(custData.id ? { subscriptionCycle: undefined } : {}),
    externalReference: input.lead_id ?? userId,
    description: input.description,
  };

  const res = await fetch("https://api.asaas.com/v3/paymentLinks", {
    method: "POST",
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(linkPayload),
  });

  const data = await res.json() as {
    id?: string;
    url?: string;
    errors?: Array<{ description: string }>;
  };

  if (!res.ok) {
    throw new Error(`ASAAS: ${data.errors?.[0]?.description ?? "erro desconhecido"}`);
  }

  return { url: data.url!, payment_id: data.id! };
}

// ─── INFINITEPAY ─────────────────────────────────────────────────────────────
async function createInfinitePay(
  input: PaymentInput,
  apiKey: string,
  userId: string,
): Promise<GatewayResult> {
  const payload = {
    amount: input.amount, // InfinitePay aceita centavos
    currency: "BRL",
    description: input.description,
    payer: {
      name: input.customer_name,
      ...(input.customer_email ? { email: input.customer_email } : {}),
      ...(input.customer_phone ? { phone: input.customer_phone } : {}),
    },
    metadata: {
      user_id: userId,
      lead_id: input.lead_id ?? "",
    },
    notification_url: `${Deno.env.get("APP_URL") ?? ""}/functions/v1/payment-webhook?user_id=${userId}`,
    return_url: `${Deno.env.get("APP_URL") ?? ""}/payment/success`,
  };

  const res = await fetch("https://api.infinitepay.io/v2/payment_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json() as {
    id?: string;
    payment_url?: string;
    url?: string;
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(`InfinitePay: ${data.message ?? data.error ?? "erro desconhecido"}`);
  }

  return { url: data.payment_url ?? data.url!, payment_id: data.id! };
}

// ─── STRIPE ──────────────────────────────────────────────────────────────────
async function createStripe(
  input: PaymentInput,
  secretKey: string,
  userId: string,
): Promise<GatewayResult> {
  // Stripe usa form-encoded para checkout/sessions
  const params = new URLSearchParams({
    "payment_method_types[0]": "card",
    mode: "payment",
    success_url: `${Deno.env.get("APP_URL") ?? ""}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get("APP_URL") ?? ""}/payment/cancel`,
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][product_data][name]": input.description,
    "line_items[0][price_data][unit_amount]": String(input.amount),
    "line_items[0][quantity]": "1",
    "metadata[user_id]": userId,
    "metadata[lead_id]": input.lead_id ?? "",
  });

  if (input.customer_email) params.set("customer_email", input.customer_email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json() as {
    id?: string;
    url?: string;
    error?: { message: string };
  };

  if (!res.ok) {
    throw new Error(`Stripe: ${data.error?.message ?? "erro desconhecido"}`);
  }

  return { url: data.url!, payment_id: data.id! };
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  // ── Autenticação via JWT ──────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Token de autenticação ausente" }, 401);
  }
  const jwt = authHeader.slice(7);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  // Cliente autenticado — para extrair user_id do JWT
  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return json({ error: "Token inválido ou expirado" }, 401);
  }
  const userId = user.id;

  // ── Validar body ─────────────────────────────────────────────────────────
  let body: PaymentInput;
  try {
    body = await req.json() as PaymentInput;
  } catch {
    return json({ error: "Body JSON inválido" }, 400);
  }

  if (!body.amount || typeof body.amount !== "number" || body.amount <= 0) {
    return json({ error: "Campo 'amount' obrigatório (número em centavos, > 0)" }, 400);
  }
  if (!body.description || typeof body.description !== "string") {
    return json({ error: "Campo 'description' obrigatório" }, 400);
  }
  if (!body.customer_name || typeof body.customer_name !== "string") {
    return json({ error: "Campo 'customer_name' obrigatório" }, 400);
  }

  // ── Buscar configurações do cliente no Supabase ───────────────────────────
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: configs, error: configError } = await supabaseAdmin
    .from("agente_config")
    .select("chave, valor")
    .eq("user_id", userId)
    .in("chave", [
      "gateway_padrao",
      "stripe_secret",
      "mercado_pago_access",
      "asaas_api_key",
      "infinitepay_api_key",
    ]);

  if (configError) {
    console.error("Erro ao buscar agente_config:", configError);
    return json({ error: "Erro ao carregar configurações do gateway" }, 500);
  }

  // Mapear rows para objeto tipado
  const cfg: AgenteConfig = {
    gateway_padrao: null,
    stripe_secret: null,
    mercado_pago_access: null,
    asaas_api_key: null,
    infinitepay_api_key: null,
  };

  for (const row of (configs ?? []) as Array<{ chave: string; valor: string }>) {
    const key = row.chave as keyof AgenteConfig;
    if (key in cfg) cfg[key] = row.valor;
  }

  const gateway = cfg.gateway_padrao?.toLowerCase().trim();
  if (!gateway) {
    return json({ error: "Nenhum gateway padrão configurado. Acesse as configurações e defina o gateway_padrao." }, 422);
  }

  // ── Criar cobrança no gateway correto ────────────────────────────────────
  let result: GatewayResult;
  let gatewayName: string;

  try {
    switch (gateway) {
      case "mercado_pago":
      case "mercadopago": {
        if (!cfg.mercado_pago_access) {
          return json({ error: "Credencial 'mercado_pago_access' não configurada" }, 422);
        }
        result = await createMercadoPago(body, cfg.mercado_pago_access, userId);
        gatewayName = "mercado_pago";
        break;
      }
      case "asaas": {
        if (!cfg.asaas_api_key) {
          return json({ error: "Credencial 'asaas_api_key' não configurada" }, 422);
        }
        result = await createAsaas(body, cfg.asaas_api_key, userId);
        gatewayName = "asaas";
        break;
      }
      case "infinitepay":
      case "infinite_pay": {
        if (!cfg.infinitepay_api_key) {
          return json({ error: "Credencial 'infinitepay_api_key' não configurada" }, 422);
        }
        result = await createInfinitePay(body, cfg.infinitepay_api_key, userId);
        gatewayName = "infinitepay";
        break;
      }
      case "stripe": {
        if (!cfg.stripe_secret) {
          return json({ error: "Credencial 'stripe_secret' não configurada" }, 422);
        }
        result = await createStripe(body, cfg.stripe_secret, userId);
        gatewayName = "stripe";
        break;
      }
      default:
        return json({
          error: `Gateway '${gateway}' não suportado. Valores válidos: mercado_pago, asaas, infinitepay, stripe`,
        }, 422);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Erro no gateway:", message);
    return json({ error: message }, 502);
  }

  // ── Registrar na tabela pagamentos ────────────────────────────────────────
  const { error: insertError } = await supabaseAdmin.from("pagamentos").insert({
    user_id: userId,
    lead_id: body.lead_id ?? null,
    gateway: gatewayName,
    status: "pendente",
    valor_cents: body.amount,
    moeda: "brl",
    session_id: result.payment_id,
    descricao: body.description,
  });

  if (insertError) {
    // Não falha a request — o link foi criado no gateway, só o registro falhou
    console.error("Erro ao registrar pagamento no banco:", insertError);
  }

  // ── Resposta ──────────────────────────────────────────────────────────────
  return json({
    url: result.url,
    payment_id: result.payment_id,
    gateway: gatewayName,
  });
}

Deno.serve(handleRequest);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

interface PaymentRequest {
  lead_email: string;
  lead_nome: string;
  amount_cents: number;
  description?: string;
  lead_id?: string;
  user_id: string;
}

async function createMercadoPagoPayment(req: PaymentRequest): Promise<Response> {
  try {
    const mpToken = Deno.env.get("MERCADO_PAGO_TOKEN");
    if (!mpToken) {
      return new Response(JSON.stringify({ success: false, error: "MP not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const payload = {
      items: [{
        title: req.description || "Produto",
        quantity: 1,
        currency_id: "BRL",
        unit_price: req.amount_cents / 100,
      }],
      payer: {
        email: req.lead_email,
        name: req.lead_nome,
      },
      back_urls: {
        success: `${Deno.env.get("APP_URL")}/payment/success`,
        failure: `${Deno.env.get("APP_URL")}/payment/cancel`,
        pending: `${Deno.env.get("APP_URL")}/payment/pending`,
      },
      auto_return: "approved",
      external_reference: req.lead_id || "",
      metadata: {
        user_id: req.user_id,
        lead_id: req.lead_id,
      },
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: data.message || "MP error" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

    await supabase.from("pagamentos").insert({
      user_id: req.user_id,
      lead_id: req.lead_id,
      gateway: "mercado_pago",
      valor_cents: req.amount_cents,
      moeda: "brl",
      status: "pendente",
      session_id: data.id,
      descricao: req.description,
    });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: data.init_point,
        session_id: data.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Missing auth" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const body = await request.json() as PaymentRequest;

    if (!body.lead_email || !body.lead_nome || !body.amount_cents || !body.user_id) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return await createMercadoPagoPayment(body);
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
}

Deno.serve(handleRequest);
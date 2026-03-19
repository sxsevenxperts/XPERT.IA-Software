import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

interface PaymentRequest {
  lead_email: string;
  lead_nome?: string;
  amount_cents: number;
  currency?: string;
  description?: string;
  lead_id?: string;
  user_id: string;
}

async function createStripePayment(req: PaymentRequest): Promise<Response> {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Stripe not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload = new URLSearchParams({
      "payment_method_types[0]": "card",
      "mode": "payment",
      "success_url": `${Deno.env.get("APP_URL")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${Deno.env.get("APP_URL")}/payment/cancel`,
      "customer_email": req.lead_email,
      "line_items[0][price_data][currency]": req.currency || "brl",
      "line_items[0][price_data][product_data][name]": req.description || "Produto",
      "line_items[0][price_data][unit_amount]": req.amount_cents.toString(),
      "line_items[0][quantity]": "1",
      "metadata[lead_id]": req.lead_id || "",
      "metadata[user_id]": req.user_id,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    const session = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: session.error?.message || "Stripe error" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    await supabase.from("pagamentos").insert({
      user_id: req.user_id,
      lead_id: req.lead_id,
      gateway: "stripe",
      valor_cents: req.amount_cents,
      moeda: req.currency || "brl",
      status: "pendente",
      session_id: session.id,
      descricao: req.description,
    });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
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

    if (!body.lead_email || !body.amount_cents || !body.user_id) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return await createStripePayment(body);
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
}

Deno.serve(handleRequest);
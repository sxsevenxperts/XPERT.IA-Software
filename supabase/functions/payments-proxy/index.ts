import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const MERCADOPAGO_API_KEY = Deno.env.get("MERCADOPAGO_API_KEY")!;
const INFINITEPAY_API_KEY = Deno.env.get("INFINITEPAY_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "status";
    const provider = url.searchParams.get("provider") || "asaas";

    // Webhooks não precisam de JWT
    if (action === "webhook-receive") {
      return await handleWebhook(req, provider);
    }

    // Outras ações precisam de JWT
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

    switch (action) {
      case "status":
        return await getStatus(userId, provider);
      case "disconnect":
        return await disconnect(userId, provider);
      case "create-invoice":
        return await createInvoice(req, userId, provider);
      case "list-invoices":
        return await listInvoices(userId, provider);
      case "get-invoice":
        return await getInvoice(url, userId, provider);
      case "send-invoice-email":
        return await sendInvoiceEmail(req, userId, provider);
      case "create-customer":
        return await createCustomer(req, userId, provider);
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

async function getStatus(userId: string, provider: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .in("chave", [
      `payment_provider_${provider}`,
      `payment_${provider}_api_key`,
      `payment_${provider}_customer_id`,
    ]);

  const config: Record<string, string> = {};
  data?.forEach((row) => {
    config[row.chave] = row.valor;
  });

  const connected = config[`payment_provider_${provider}`] === "1" && !!config[`payment_${provider}_api_key`];
  const apiKeyMasked = config[`payment_${provider}_api_key`]
    ? `***${config[`payment_${provider}_api_key`].slice(-4)}`
    : null;

  return new Response(
    JSON.stringify({
      provider,
      connected,
      api_key_masked: apiKeyMasked,
      customer_id: config[`payment_${provider}_customer_id`] || null,
    }),
    { headers: corsHeaders }
  );
}

async function disconnect(userId: string, provider: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const keys = [
    `payment_provider_${provider}`,
    `payment_${provider}_api_key`,
    `payment_${provider}_customer_id`,
    `payment_${provider}_webhook_secret`,
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

async function createInvoice(req: Request, userId: string, provider: string) {
  const body = await req.json();
  const { customer_name, customer_email, amount, due_date, description } = body;

  if (!customer_name || !customer_email || !amount || !due_date) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
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
    .eq("chave", `payment_${provider}_api_key`);

  const apiKey = configData?.[0]?.valor;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: `${provider} not connected` }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    let invoiceData: any;

    if (provider === "asaas") {
      invoiceData = await createAsaasInvoice(apiKey, customer_name, customer_email, amount, due_date, description);
    } else if (provider === "stripe") {
      invoiceData = await createStripeInvoice(apiKey, customer_name, customer_email, amount, due_date, description);
    } else if (provider === "mercadopago") {
      invoiceData = await createMercadopagoInvoice(apiKey, customer_name, customer_email, amount, due_date, description);
    } else if (provider === "infinitepay") {
      invoiceData = await createInfinitepayInvoice(apiKey, customer_name, customer_email, amount, due_date, description);
    }

    // Log payment
    const adminDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await adminDb
      .from("payment_logs")
      .insert({
        user_id: userId,
        provider,
        invoice_id: invoiceData.id,
        status: "pending",
        amount,
        customer_name,
        customer_email,
        due_date,
        metadata: invoiceData,
      });

    return new Response(JSON.stringify({ success: true, invoice: invoiceData }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function createAsaasInvoice(
  apiKey: string,
  customerName: string,
  customerEmail: string,
  amount: number,
  dueDate: string,
  description: string
) {
  const res = await fetch("https://api.asaas.com/v3/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey,
    },
    body: JSON.stringify({
      customer: customerEmail,
      value: amount,
      dueDate,
      description,
      billingType: "BOLETO",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0]?.detail || "Failed to create Asaas invoice");
  return { id: data.id, status: "pending", url: data.invoiceUrl };
}

async function createStripeInvoice(
  apiKey: string,
  customerName: string,
  customerEmail: string,
  amount: number,
  dueDate: string,
  description: string
) {
  // Create or get customer
  const customerRes = await fetch("https://api.stripe.com/v1/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      name: customerName,
      email: customerEmail,
    }).toString(),
  });

  const customer = await customerRes.json();
  if (!customerRes.ok) throw new Error("Failed to create Stripe customer");

  // Create invoice
  const invoiceRes = await fetch("https://api.stripe.com/v1/invoices", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: customer.id,
      due_date: Math.floor(new Date(dueDate).getTime() / 1000).toString(),
      description,
    }).toString(),
  });

  const invoice = await invoiceRes.json();
  if (!invoiceRes.ok) throw new Error("Failed to create Stripe invoice");

  return {
    id: invoice.id,
    status: invoice.status,
    url: invoice.hosted_invoice_url,
  };
}

async function createMercadopagoInvoice(
  apiKey: string,
  customerName: string,
  customerEmail: string,
  amount: number,
  dueDate: string,
  description: string
) {
  const res = await fetch("https://api.mercadopago.com/v1/invoices", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: {
        name: customerName,
        email: customerEmail,
      },
      items: [
        {
          description,
          unit_price: amount,
          quantity: 1,
        },
      ],
      due_date: dueDate,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create Mercado Pago invoice");
  return { id: data.id, status: data.status, url: data.invoice_url };
}

async function createInfinitepayInvoice(
  apiKey: string,
  customerName: string,
  customerEmail: string,
  amount: number,
  dueDate: string,
  description: string
) {
  const res = await fetch("https://api.infinitepay.com/v1/invoices", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_name: customerName,
      customer_email: customerEmail,
      amount,
      due_date: dueDate,
      description,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create InfinitePay invoice");
  return { id: data.id, status: "pending", url: data.invoice_url };
}

async function listInvoices(userId: string, provider: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configData } = await db
    .from("agente_config")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", `payment_${provider}_api_key`);

  const apiKey = configData?.[0]?.valor;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: `${provider} not connected` }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    // Get from payment_logs table
    const { data: logs } = await db
      .from("payment_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .order("created_at", { ascending: false })
      .limit(50);

    return new Response(JSON.stringify({ invoices: logs || [] }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function getInvoice(url: URL, userId: string, provider: string) {
  const invoiceId = url.searchParams.get("invoice_id");
  if (!invoiceId) {
    return new Response(
      JSON.stringify({ error: "Missing invoice_id" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await db
    .from("payment_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("invoice_id", invoiceId)
    .single();

  if (!data) {
    return new Response(
      JSON.stringify({ error: "Invoice not found" }),
      { status: 404, headers: corsHeaders }
    );
  }

  return new Response(JSON.stringify(data), { headers: corsHeaders });
}

async function sendInvoiceEmail(req: Request, userId: string, provider: string) {
  const body = await req.json();
  const { invoice_id, email } = body;

  if (!invoice_id || !email) {
    return new Response(
      JSON.stringify({ error: "Missing invoice_id or email" }),
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
    .eq("chave", `payment_${provider}_api_key`);

  const apiKey = configData?.[0]?.valor;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: `${provider} not connected` }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    // Provider-specific email sending
    if (provider === "asaas") {
      await fetch(`https://api.asaas.com/v3/invoices/${invoice_id}/sendByEmail`, {
        method: "POST",
        headers: { "access_token": apiKey },
      });
    } else if (provider === "stripe") {
      // Stripe sends emails automatically
      return new Response(
        JSON.stringify({ message: "Stripe sends emails automatically" }),
        { headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function createCustomer(req: Request, userId: string, provider: string) {
  const body = await req.json();
  const { name, email } = body;

  if (!name || !email) {
    return new Response(
      JSON.stringify({ error: "Missing name or email" }),
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
    .eq("chave", `payment_${provider}_api_key`);

  const apiKey = configData?.[0]?.valor;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: `${provider} not connected` }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    let customerId: string;

    if (provider === "asaas") {
      const res = await fetch("https://api.asaas.com/v3/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": apiKey,
        },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      customerId = data.id;
    } else if (provider === "stripe") {
      const res = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ name, email }).toString(),
      });
      const data = await res.json();
      customerId = data.id;
    } else {
      return new Response(
        JSON.stringify({ error: `Customer creation not supported for ${provider}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Save customer ID
    const adminDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await adminDb
      .from("agente_config")
      .upsert({
        user_id: userId,
        chave: `payment_${provider}_customer_id`,
        valor: customerId,
      });

    return new Response(
      JSON.stringify({ success: true, customer_id: customerId }),
      { headers: corsHeaders }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function handleWebhook(req: Request, provider: string) {
  // TODO: Implement webhook signature verification per provider
  // Parse webhook data and update payment_logs table
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

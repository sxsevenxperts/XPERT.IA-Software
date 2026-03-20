// Hotmart Webhook Handler for XPERT.IA Addons
// Handles PURCHASE_APPROVED, PURCHASE_CANCELED events
// 
// Expected payload structure:
// {
//   "type": "PURCHASE_APPROVED|PURCHASE_CANCELED|...",
//   "data": {
//     "purchase": {
//       "buyer": {
//         "email": "customer@example.com"
//       },
//       "offer": {
//         "code": "tokens_mini|addon_objecao|addon_agente|..."
//       },
//       "transaction": "TRX123456"
//     }
//   }
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const adminDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Map offer.code to addon details
const ADDON_OFFER_CODES: Record<
  string,
  { type: string; tokens?: number; qty?: number }
> = {
  tokens_mini: { type: "tokens", tokens: 5_000_000 },
  tokens_medio: { type: "tokens", tokens: 10_000_000 },
  tokens_grande: { type: "tokens", tokens: 20_000_000 },
  tokens_max: { type: "tokens", tokens: 50_000_000 },
  addon_objecao: { type: "objecao" },
  addon_agente: { type: "agente", qty: 1 },
  addon_numero: { type: "numero", qty: 1 },
  addon_usuario: { type: "usuario", qty: 1 },
};

async function findUserByEmail(email: string): Promise<string | null> {
  try {
    const { data } = await adminDb
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    return data?.id || null;
  } catch {
    return null;
  }
}

async function activateAddon(
  userId: string,
  offerCode: string,
  transactionId: string
) {
  const addon = ADDON_OFFER_CODES[offerCode];
  if (!addon) {
    throw new Error(`Unknown offer code: ${offerCode}`);
  }

  // Handle token addons
  if (addon.type === "tokens" && addon.tokens) {
    const { error } = await adminDb.rpc("incrementar_tokens", {
      uid: userId,
      qtd: addon.tokens,
    });
    if (error) throw error;
  }
  // Handle objection agent
  else if (addon.type === "objecao") {
    const { error } = await adminDb
      .from("assinaturas")
      .update({ addon_objecao: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw error;
  }
  // Handle extra agents, numbers, users
  else if (["agente", "numero", "usuario"].includes(addon.type)) {
    const column =
      addon.type === "agente"
        ? "agentes_extras"
        : addon.type === "numero"
          ? "numeros_extras"
          : "usuarios_extras_limite";

    const { error } = await adminDb.rpc("incrementar_addon", {
      uid: userId,
      coluna: column,
      qtd: addon.qty || 1,
    });
    if (error) throw error;
  }

  // Record addon purchase history
  await adminDb.from("addon_purchases").insert({
    user_id: userId,
    offer_code: offerCode,
    addon_type: addon.type,
    quantidade: addon.qty || 1,
    hotmart_transaction: transactionId,
    status: "ativo",
  });
}

async function deactivateAddon(
  userId: string,
  offerCode: string,
  transactionId: string
) {
  const addon = ADDON_OFFER_CODES[offerCode];
  if (!addon) return;

  // Mark addon purchase as cancelled
  await adminDb
    .from("addon_purchases")
    .update({ status: "cancelado" })
    .eq("hotmart_transaction", transactionId)
    .eq("user_id", userId);

  // For boolean addons, set to false
  if (addon.type === "objecao") {
    await adminDb
      .from("assinaturas")
      .update({ addon_objecao: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  }
  // For counter addons, decrement (simple approach - could be enhanced)
  else if (["agente", "numero", "usuario"].includes(addon.type)) {
    const column =
      addon.type === "agente"
        ? "agentes_extras"
        : addon.type === "numero"
          ? "numeros_extras"
          : "usuarios_extras_limite";

    const { error } = await adminDb.rpc("incrementar_addon", {
      uid: userId,
      coluna: column,
      qtd: -(addon.qty || 1),
    });
    if (error) console.error("Error decrementing addon:", error);
  }
}

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const payload = await req.json();
    const eventType = payload?.type || "";
    const data = payload?.data?.purchase || {};
    const buyerEmail = data?.buyer?.email || "";
    const offerCode = data?.offer?.code || "";
    const transactionId = data?.transaction || "";

    if (!buyerEmail || !transactionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const userId = await findUserByEmail(buyerEmail);
    if (!userId) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Check if this is an addon purchase (has an offer code that matches our addon map)
    if (offerCode && ADDON_OFFER_CODES[offerCode]) {
      if (eventType === "PURCHASE_APPROVED") {
        await activateAddon(userId, offerCode, transactionId);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Addon ${offerCode} activated`,
          }),
          { status: 200 }
        );
      } else if (
        eventType === "PURCHASE_CANCELED" ||
        eventType === "PURCHASE_REFUNDED"
      ) {
        await deactivateAddon(userId, offerCode, transactionId);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Addon ${offerCode} deactivated`,
          }),
          { status: 200 }
        );
      }
    }

    // For non-addon purchases (regular products), could handle new customer creation
    // This is a placeholder for future product-based purchase handling
    if (eventType === "PURCHASE_APPROVED" && !offerCode) {
      // Could create a new subscription/customer here
      console.log("Non-addon purchase detected, no action taken");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
});

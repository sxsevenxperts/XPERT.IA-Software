/**
 * subscription-cleanup — roda todo dia via cron
 *
 * Regras:
 *  - Após 7 dias sem pagamento  → suspende acesso (status: suspended)
 *  - Após 30 dias sem pagamento → exclui todos os dados do usuário
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

  const supabaseUrl    = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase       = createClient(supabaseUrl, serviceRoleKey);

  const now        = new Date();
  const day7ago    = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const day30ago   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let suspended = 0;
  let deleted   = 0;
  const errors: string[] = [];

  try {
    // ── 1. Buscar todas as subscrições expiradas ────────────────────────────────
    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select("user_id, status, expires_at")
      .lte("expires_at", now.toISOString())
      .in("status", ["active", "suspended"]);

    if (subsError) throw subsError;
    if (!subs?.length) return json({ ok: true, suspended: 0, deleted: 0, message: "Nenhuma subscrição expirada." });

    for (const sub of subs) {
      const expiredAt  = new Date(sub.expires_at);
      const daysSince  = (now.getTime() - expiredAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince >= 30) {
        // ── EXCLUIR todos os dados ──────────────────────────────────────────────
        try {
          const uid = sub.user_id;

          // Apaga dados nas tabelas do app
          await Promise.allSettled([
            supabase.from("corridas").delete().eq("driver_id", uid),
            supabase.from("trips").delete().eq("driver_id", uid),
            supabase.from("expenses").delete().eq("driver_id", uid),
            supabase.from("fuel_logs").delete().eq("driver_id", uid),
            supabase.from("vehicle_maintenance").delete().eq("driver_id", uid),
            supabase.from("driver_documents").delete().eq("driver_id", uid),
            supabase.from("chat_messages").delete().eq("user_id", uid),
            supabase.from("driver_tasks").delete().eq("driver_id", uid),
            supabase.from("hotmart_transactions").delete().eq("user_id", uid),
            supabase.from("payment_history").delete().eq("user_id", uid),
            supabase.from("push_tokens").delete().eq("user_id", uid),
            supabase.from("notification_preferences").delete().eq("user_id", uid),
            supabase.from("referrals").delete().or(`referrer_id.eq.${uid},referred_id.eq.${uid}`),
            supabase.from("subscriptions").delete().eq("user_id", uid),
            supabase.from("profiles").delete().eq("id", uid),
          ]);

          // Exclui o usuário do auth
          await supabase.auth.admin.deleteUser(uid);

          deleted++;
          console.log(`🗑️  Usuário excluído: ${uid} (${daysSince.toFixed(0)} dias sem pagamento)`);
        } catch (err) {
          errors.push(`Erro ao excluir ${sub.user_id}: ${err}`);
        }

      } else if (daysSince >= 7 && sub.status !== "suspended") {
        // ── SUSPENDER acesso ────────────────────────────────────────────────────
        try {
          await supabase.from("subscriptions")
            .update({ status: "suspended", updated_at: now.toISOString() })
            .eq("user_id", sub.user_id);

          // Revoga sessões ativas
          await supabase.auth.admin.signOut(sub.user_id, "others").catch(() => null);

          suspended++;
          console.log(`🔒 Acesso suspenso: ${sub.user_id} (${daysSince.toFixed(0)} dias sem pagamento)`);
        } catch (err) {
          errors.push(`Erro ao suspender ${sub.user_id}: ${err}`);
        }
      }
    }

    return json({
      ok: true,
      suspended,
      deleted,
      errors: errors.length ? errors : undefined,
      ran_at: now.toISOString(),
    });

  } catch (error) {
    console.error("Erro no cleanup:", error);
    return json({ error: String(error) }, 500);
  }
}

Deno.serve(handleRequest);

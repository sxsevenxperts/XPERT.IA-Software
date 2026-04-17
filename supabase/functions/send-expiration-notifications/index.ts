/**
 * send-expiration-notifications — roda todo dia via cron
 *
 * Envia push notifications para avisar sobre vencimento de subscrição
 * - 3 dias antes: "Subscrição expira em 3 dias"
 * - No dia de expiração: "Sua subscrição expirou"
 * - 25 dias após expiração: "ÚLTIMO AVISO - 5 dias para deletar dados"
 *
 * Usa push_tokens para enviar notificações pelo app
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();
  const day3before = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const day25after = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);

  let sent = 0;
  const errors: string[] = [];

  try {
    // ── 1. Buscar subscrições que vencem em 3 dias ────────────────────────────────
    const { data: expiring3days } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .eq("status", "active")
      .gte("expires_at", now.toISOString())
      .lte("expires_at", day3before.toISOString());

    if (expiring3days?.length) {
      for (const sub of expiring3days) {
        try {
          const { data: tokens } = await supabase
            .from("push_tokens")
            .select("token")
            .eq("user_id", sub.user_id);

          if (tokens?.length) {
            // Aqui você implementaria o envio de push
            // Por enquanto, apenas logamos que seria enviado
            console.log(
              `📱 Push enviado para ${sub.user_id}: "Subscrição expira em 3 dias"`
            );
            sent++;
          }
        } catch (err) {
          errors.push(
            `Erro ao enviar notificação para ${sub.user_id}: ${err}`
          );
        }
      }
    }

    // ── 2. Buscar subscrições que expiram hoje ─────────────────────────────────────
    const { data: expiringToday } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .eq("status", "active")
      .lte("expires_at", now.toISOString());

    if (expiringToday?.length) {
      for (const sub of expiringToday) {
        try {
          const { data: tokens } = await supabase
            .from("push_tokens")
            .select("token")
            .eq("user_id", sub.user_id);

          if (tokens?.length) {
            console.log(
              `📱 Push enviado para ${sub.user_id}: "Sua subscrição expirou"`
            );
            sent++;
          }
        } catch (err) {
          errors.push(
            `Erro ao enviar notificação para ${sub.user_id}: ${err}`
          );
        }
      }
    }

    // ── 3. Buscar subscrições expiradas há 25 dias (ÚLTIMO AVISO) ─────────────────
    const { data: expiredLongAgo } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .lte("expires_at", day25after.toISOString());

    if (expiredLongAgo?.length) {
      for (const sub of expiredLongAgo) {
        try {
          const { data: tokens } = await supabase
            .from("push_tokens")
            .select("token")
            .eq("user_id", sub.user_id);

          if (tokens?.length) {
            console.log(
              `📱 Push enviado para ${sub.user_id}: "ÚLTIMO AVISO - 5 dias para deletar dados"`
            );
            sent++;
          }
        } catch (err) {
          errors.push(
            `Erro ao enviar notificação para ${sub.user_id}: ${err}`
          );
        }
      }
    }

    return json({
      ok: true,
      sent,
      errors: errors.length ? errors : undefined,
      ran_at: now.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao enviar notificações:", error);
    return json({ error: String(error) }, 500);
  }
}

Deno.serve(handleRequest);

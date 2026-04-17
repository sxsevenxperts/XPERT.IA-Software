/**
 * send-expiration-warnings — roda todo dia via cron
 *
 * Regras de email:
 *  - 3 dias antes de expirar: "Sua subscrição expira em 3 dias"
 *  - No dia de expiração (suspensão): "Sua conta foi suspensa"
 *  - 25 dias após expiração: "Dados serão deletados em 5 dias"
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

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("⚠️  RESEND_API_KEY não configurada. Simulando envio de email.");
    console.log(`📧 Email para ${to}: ${subject}`);
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "noreply@sevenxperts.solutions",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error(`❌ Erro ao enviar email para ${to}: ${response.statusText}`);
      return false;
    }

    console.log(`✅ Email enviado para ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`❌ Erro na chamada Resend: ${err}`);
    return false;
  }
}

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const minus7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const minus25days = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);

  let emailsSent = 0;
  const errors: string[] = [];

  try {
    // ── 1. Buscar subscrições que expiram em 3 dias ────────────────────────────
    const { data: expiringIn3 } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .gte("expires_at", now.toISOString())
      .lte("expires_at", in3days.toISOString())
      .eq("status", "active");

    if (expiringIn3?.length) {
      console.log(`📧 ${expiringIn3.length} subscrições expiram em 3 dias`);
      for (const sub of expiringIn3) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", sub.user_id)
          .single();

        if (profile?.email) {
          const sent = await sendEmail(
            profile.email,
            "⏰ Sua subscrição EasyDrive expira em 3 dias",
            `
            <h2>Olá ${profile.name || "motorista"}!</h2>
            <p>Sua subscrição ao <strong>EasyDrive</strong> expira em <strong>3 dias</strong>.</p>
            <p>Após a expiração, você perderá acesso a todos os recursos.</p>
            <p><a href="https://easydrive.sevenxperts.solutions/billing" style="background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Renovar Subscrição Agora</a></p>
            <p>Dúvidas? Entre em contato conosco.</p>
            <p>Seven Xperts</p>
            `
          );
          if (sent) emailsSent++;
          else errors.push(`Falha ao enviar aviso 3 dias para ${sub.user_id}`);
        }
      }
    }

    // ── 2. Buscar subscrições que acabaram de expirar (hoje) ───────────────────
    const { data: expiredToday } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .lte("expires_at", now.toISOString())
      .gte("expires_at", new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "active");

    if (expiredToday?.length) {
      console.log(`🔒 ${expiredToday.length} subscrições expiram hoje`);
      for (const sub of expiredToday) {
        // Atualizar status para suspended
        await supabase
          .from("subscriptions")
          .update({ status: "suspended", updated_at: now.toISOString() })
          .eq("user_id", sub.user_id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", sub.user_id)
          .single();

        if (profile?.email) {
          const sent = await sendEmail(
            profile.email,
            "🔒 Sua assinatura EasyDrive foi suspensa",
            `
            <h2>Olá ${profile.name || "motorista"}!</h2>
            <p>Sua subscrição ao <strong>EasyDrive</strong> expirou e sua conta foi <strong>suspensa</strong>.</p>
            <p>Para restaurar o acesso, renove sua assinatura agora mesmo.</p>
            <p><a href="https://easydrive.sevenxperts.solutions/billing" style="background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Renovar Agora</a></p>
            <p><strong>Atenção:</strong> Se você não renovar em 30 dias, seus dados serão deletados permanentemente.</p>
            <p>Seven Xperts</p>
            `
          );
          if (sent) emailsSent++;
          else errors.push(`Falha ao enviar aviso suspensão para ${sub.user_id}`);
        }
      }
    }

    // ── 3. Buscar subscrições suspensas há 25 dias (último aviso antes de deletar) ─
    const { data: lastWarning } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .lte("expires_at", minus25days.toISOString())
      .gte("expires_at", new Date(minus25days.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "suspended");

    if (lastWarning?.length) {
      console.log(`⚠️  ${lastWarning.length} usuários recebem último aviso antes de deletar`);
      for (const sub of lastWarning) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", sub.user_id)
          .single();

        if (profile?.email) {
          const sent = await sendEmail(
            profile.email,
            "⚠️  ÚLTIMO AVISO: Seus dados serão deletados em 5 dias",
            `
            <h2>Olá ${profile.name || "motorista"}!</h2>
            <p><strong>ÚLTIMO AVISO:</strong> Sua conta será <strong>deletada permanentemente em 5 dias</strong>.</p>
            <p>Você ainda pode recuperar sua conta renovando a assinatura agora.</p>
            <p><a href="https://easydrive.sevenxperts.solutions/billing" style="background: #EF4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Renovar Antes que Seja Tarde</a></p>
            <p>Se você não agir, <strong>todos os seus dados serão permanentemente deletados</strong>:</p>
            <ul>
              <li>Histórico de corridas</li>
              <li>Gastos registrados</li>
              <li>Perfil e configurações</li>
              <li>Mensagens</li>
            </ul>
            <p>Renove agora para evitar perder tudo.</p>
            <p>Seven Xperts</p>
            `
          );
          if (sent) emailsSent++;
          else errors.push(`Falha ao enviar último aviso para ${sub.user_id}`);
        }
      }
    }

    console.log(`✅ Emails de aviso enviados: ${emailsSent}`);

    return json({
      ok: true,
      emails_sent: emailsSent,
      errors: errors.length ? errors : undefined,
      ran_at: now.toISOString(),
    });
  } catch (error) {
    console.error("Erro no send-expiration-warnings:", error);
    return json({ error: String(error) }, 500);
  }
}

Deno.serve(handleRequest);

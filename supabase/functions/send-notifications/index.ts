import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Processar fila de notificações
async function processNotificationQueue() {
  // Buscar notificações pendentes
  const { data: queue, error: queueError } = await supabase
    .from("notification_queue")
    .select("*")
    .eq("status", "pendente")
    .order("prioridade", { ascending: false })
    .order("agendado_para", { ascending: true })
    .limit(50)

  if (queueError) {
    console.error("Erro ao buscar fila:", queueError)
    return
  }

  for (const item of queue || []) {
    try {
      await supabase
        .from("notification_queue")
        .update({ status: "enviado" })
        .eq("id", item.id)

      // Salvar no log de notificações
      await supabase.from("notification_log").insert({
        user_id: item.user_id,
        canal: item.canal,
        tipo: item.tipo,
        titulo: item.titulo,
        mensagem: item.mensagem,
        link_ref: item.link_ref,
        status: "enviado",
      })

      console.log(`Notificação ${item.id} enviada via ${item.canal}`)
    } catch (err) {
      console.error(`Erro ao processar notificação ${item.id}:`, err)

      const tentativas = item.tentativas + 1
      await supabase
        .from("notification_queue")
        .update({
          status: tentativas >= item.max_tentativas ? "falha" : "pendente",
          tentativas,
          erro_msg: String(err),
        })
        .eq("id", item.id)
    }
  }
}

Deno.serve(async (req) => {
  // Apenas POST é aceito
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    await processNotificationQueue()

    return new Response(
      JSON.stringify({ success: true, message: "Notificações processadas" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Erro geral:", error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    )
  }
})

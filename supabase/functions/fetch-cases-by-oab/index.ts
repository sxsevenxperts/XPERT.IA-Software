import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { oab, userId, jusbrasil_key } = await req.json()

    if (!oab || !userId) {
      return new Response(
        JSON.stringify({ error: "OAB e userId são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    // Cria cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Buscar casos via JusBrasil API (se houver chave)
    let casesFromAPI: any[] = []

    if (jusbrasil_key) {
      try {
        // Integração com JusBrasil API
        const response = await fetch(`https://api.jusbrasil.com.br/v2/lawyers/${oab}/cases`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jusbrasil_key}`,
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const data = await response.json()
          casesFromAPI = data.cases || []
        }
      } catch (err) {
        console.log("JusBrasil API error (non-blocking):", err)
        // Continua mesmo se JusBrasil falhar
      }
    }

    // Mapear casos da API para o formato do banco
    const casesToInsert = casesFromAPI.map((c: any) => ({
      user_id: userId,
      id: c.id || `SYNC-${Date.now()}-${Math.random()}`,
      cliente: c.client_name || c.partes?.[0]?.nome || 'Cliente de API',
      tipo: c.area || 'Processo Sincronizado',
      status: c.status?.toLowerCase() === 'active' ? 'em_andamento' : 'aguardando',
      advogado: c.lawyer_name || 'API',
      tribunal: c.tribunal || c.court || 'Não especificado',
      protocolo: c.process_number || c.numero_processo || '',
      abertura: c.data_abertura || c.opened_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      prazo: c.data_prazo || c.deadline?.split('T')[0] || null,
      valor: c.valor_causa || c.valor || 'A calcular',
      prioridade: c.prioridade || 'normal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Se não tiver chave JusBrasil, retorna apenas metadados
    if (casesToInsert.length === 0 && !jusbrasil_key) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Integração com JusBrasil requiere chave API. Configure na Configurações → Minha Conta → Chave JusBrasil`,
          cases_synced: 0,
          oab_searched: oab,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    // Inserir casos sincronizados no banco (se houver)
    if (casesToInsert.length > 0) {
      await supabase.from("casos").insert(casesToInsert)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${casesToInsert.length} caso(s) sincronizado(s) pela OAB ${oab}`,
        cases_synced: casesToInsert.length,
        oab_searched: oab,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
})

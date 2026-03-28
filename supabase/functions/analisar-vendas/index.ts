import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Inicializar Anthropic
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)

interface AnalisysRequest {
  loja_id: string
  mes: string // "2025-03"
  historico_vendas: Array<{ data: string; valor: number; quantidade: number }>
  estoque_atual: Array<{ produto: string; quantidade: number; valor_unitario: number }>
  clientes: Array<{ id: string; total_gasto: number; compras: number; ultima_compra: string }>
}

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } })
  }

  try {
    const payload: AnalisysRequest = await req.json()

    // ═══ PREPARAR PROMPT OTIMIZADO ═══
    const prompt = preparePrompt(payload)

    // ═══ CHAMAR CLAUDE API ═══
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    const claudeData = await response.json()

    if (!response.ok) {
      throw new Error(`Claude API error: ${claudeData.error?.message}`)
    }

    // ═══ EXTRAIR ANÁLISE ═══
    const analysis = claudeData.content[0].text
    const tokens_used = claudeData.usage.input_tokens + claudeData.usage.output_tokens

    // ═══ SALVAR ANÁLISE E TOKENS USADOS ═══
    const { error: saveError } = await supabase
      .from("lojas_analises")
      .insert({
        loja_id: payload.loja_id,
        mes: payload.mes,
        tipo_analise: "previsao_vendas_rfm",
        resultado: { analysis, timestamp: new Date().toISOString() },
        tokens_usados: tokens_used,
        custo_tokens: tokens_used * 0.000003, // Custo aproximado: $3 per 1M tokens
      })

    if (saveError) throw saveError

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        tokens_used,
        custo: tokens_used * 0.000003,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})

function preparePrompt(data: AnalisysRequest): string {
  const vendas_ultimos_7_dias = data.historico_vendas
    .filter(v => {
      const d = new Date(v.data)
      const hoje = new Date()
      return (hoje.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7
    })
    .reduce((sum, v) => sum + v.valor, 0)

  const ticket_medio = data.historico_vendas.length > 0
    ? data.historico_vendas.reduce((sum, v) => sum + v.valor, 0) / data.historico_vendas.length
    : 0

  const estoque_valor_total = data.estoque_atual.reduce(
    (sum, e) => sum + e.quantidade * e.valor_unitario,
    0
  )

  return `Você é um analista de varejo especializado em previsões de vendas e segmentação de clientes (RFM).

DADOS DA LOJA PARA ${data.mes}:

📊 VENDAS:
- Últimos 7 dias: R$ ${vendas_ultimos_7_dias.toFixed(2)}
- Ticket médio: R$ ${ticket_medio.toFixed(2)}
- Total de transações: ${data.historico_vendas.length}

📦 ESTOQUE:
- Valor total: R$ ${estoque_valor_total.toFixed(2)}
- Produtos: ${data.estoque_atual.length}

👥 CLIENTES:
- Total único: ${data.clientes.length}
- Ticket médio por cliente: R$ ${data.clientes.length > 0 ? (data.clientes.reduce((s, c) => s + c.total_gasto, 0) / data.clientes.length).toFixed(2) : 0}

HISTÓRICO VENDAS (últimas transações):
${data.historico_vendas
  .slice(-10)
  .map(v => `- ${v.data}: R$ ${v.valor.toFixed(2)} (${v.quantidade} itens)`)
  .join("\n")}

SEGMENTAÇÃO RFM (Top Clientes):
${data.clientes
  .sort((a, b) => b.total_gasto - a.total_gasto)
  .slice(0, 5)
  .map(c => `- Cliente: R$ ${c.total_gasto.toFixed(2)}, ${c.compras} compras, última: ${c.ultima_compra}`)
  .join("\n")}

POR FAVOR, FORNEÇA:
1. 📈 PREVISÃO DE VENDAS para os próximos 7, 14 e 30 dias (com % confiança)
2. 🎯 SEGMENTAÇÃO RFM (VIP, Regular, Em Risco, Dorminhocos)
3. ⚠️ ALERTAS (produtos com baixo estoque, clientes em risco, anomalias)
4. 💡 RECOMENDAÇÕES (ações imediatas para aumentar vendas)

Formato: JSON válido com chaves: previsoes, rfm_scores, alertas, recomendacoes`
}

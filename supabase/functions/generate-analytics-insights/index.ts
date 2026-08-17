import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { json, requireUser, serviceClient } from "../_shared/auth.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true })

  try {
    const { user } = await requireUser(req)
    const admin = serviceClient()
    const [{ data: cases, error: casesError }, { data: fees, error: feesError }] = await Promise.all([
      admin.from("casos").select("status").eq("user_id", user.id),
      admin.from("honorarios").select("valor,status").eq("user_id", user.id),
    ])
    if (casesError) throw casesError
    if (feesError) throw feesError

    const caseRows = cases ?? []
    const feeRows = fees ?? []
    const paidRevenue = feeRows.filter((fee) => fee.status === "pago").reduce((total, fee) => total + Number(fee.valor || 0), 0)
    const closedCases = caseRows.filter((item) => ["ganho", "perdido", "encerrado"].includes(item.status)).length
    const wonCases = caseRows.filter((item) => item.status === "ganho").length
    const insights = [
      caseRows.length ? `${caseRows.length} caso(s) cadastrado(s) no escritório.` : "Cadastre casos para começar a acompanhar a operação.",
      feeRows.length ? `Receita paga registrada: R$ ${paidRevenue.toFixed(2)}.` : "Ainda não há honorários registrados.",
      closedCases ? `Taxa de encerramento atual: ${Math.round((wonCases / closedCases) * 100)}%.` : "Ainda não há casos encerrados para calcular a taxa de sucesso.",
    ]

    const { error: dashboardError } = await admin.from("analytics_dashboard").upsert({
      user_id: user.id,
      casos_ganhos_mes: wonCases,
      taxa_sucesso: closedCases ? (wonCases / closedCases) * 100 : null,
      insights_IA: insights,
      actualizado_em: new Date().toISOString(),
    }, { onConflict: "user_id" })
    if (dashboardError) throw dashboardError

    return json({ success: true, insights, metrics: { cases: caseRows.length, paidRevenue, wonCases, closedCases } })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro ao gerar insights." }, 500)
  }
})

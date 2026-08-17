import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { json, requireUser, serviceClient } from "../_shared/auth.ts"

function csvCell(value: unknown) {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value)
  return `"${text.replaceAll('"', '""')}"`
}

function csv(headers: string[], rows: Record<string, unknown>[]) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true })

  try {
    const { user } = await requireUser(req)
    const body = await req.json()
    const reportType = body.reportType as string
    const format = body.format as string
    const month = body.month as string

    if (format !== "csv") return json({ error: "O formato disponível é CSV." }, 422)
    if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) return json({ error: "Período inválido." }, 400)

    const start = new Date(`${month}-01T00:00:00.000Z`)
    const end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + 1)
    const admin = serviceClient()
    let filename = `relatorio-${month}.csv`
    let headers: string[] = []
    let rows: Record<string, unknown>[] = []

    if (reportType === "prazos") {
      const { data, error } = await admin.from("agenda_eventos")
        .select("titulo,tipo,data_inicio,status,local")
        .eq("user_id", user.id).gte("data_inicio", start.toISOString()).lt("data_inicio", end.toISOString())
        .order("data_inicio")
      if (error) throw error
      filename = `relatorio-prazos-${month}.csv`
      headers = ["titulo", "tipo", "data_inicio", "status", "local"]
      rows = data ?? []
    } else if (reportType === "casos") {
      const { data, error } = await admin.from("casos")
        .select("titulo,area,status,prioridade,numero_processo,created_at")
        .eq("user_id", user.id).gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
        .order("created_at")
      if (error) throw error
      filename = `relatorio-casos-${month}.csv`
      headers = ["titulo", "area", "status", "prioridade", "numero_processo", "created_at"]
      rows = data ?? []
    } else if (reportType === "financeiro") {
      const { data, error } = await admin.from("honorarios")
        .select("descricao,valor,tipo,status,vencimento,pago_em,created_at")
        .eq("user_id", user.id).gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
        .order("created_at")
      if (error) throw error
      filename = `relatorio-financeiro-${month}.csv`
      headers = ["descricao", "valor", "tipo", "status", "vencimento", "pago_em", "created_at"]
      rows = data ?? []
    } else {
      return json({ error: "Tipo de relatório inválido." }, 400)
    }

    const content = csv(headers, rows)
    const { error: auditError } = await admin.from("relatorios_gerados").insert({
      user_id: user.id,
      tipo: reportType,
      parametros: { month, format },
      resultado: { filename, rows: rows.length },
    })
    if (auditError) throw auditError

    return json({ filename, mimeType: "text/csv;charset=utf-8", content, rows: rows.length })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro ao gerar relatório." }, 500)
  }
})

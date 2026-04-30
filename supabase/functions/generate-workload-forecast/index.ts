import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

interface ForecastRequest {
  userId: string
}

/**
 * Classify workload level
 */
function classifyWorkload(
  hours: number,
  avgHours: number
): 'baixa' | 'media' | 'alta' | 'critica' {
  const ratio = hours / avgHours

  if (ratio < 0.8) return 'baixa'
  if (ratio < 1.2) return 'media'
  if (ratio < 1.5) return 'alta'
  return 'critica'
}

/**
 * Generate workload forecast for next 6 months
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { userId }: ForecastRequest = await req.json()

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. Fetch historical workload data
    const { data: workloadHistory, error: historyError } = await supabase
      .from('workload_actuals')
      .select('mes_ano, casos_abertos, horas_trabalhadas, carga_alta_prioridade')
      .eq('user_id', userId)
      .order('mes_ano', { ascending: true })
      .limit(12)

    if (historyError || !workloadHistory || workloadHistory.length < 3) {
      console.log('Insufficient workload data for forecasting')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Dados de carga insuficientes. Mínimo 3 meses necessário.',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. Extract and analyze workload patterns
    const cases = workloadHistory.map((w) => w.casos_abertos)
    const hours = workloadHistory.map((w) => w.horas_trabalhadas)
    const highPriority = workloadHistory.map((w) => w.carga_alta_prioridade)

    const avgCases = cases.reduce((a, b) => a + b) / cases.length
    const avgHours = hours.reduce((a, b) => a + b) / hours.length
    const avgHighPriority = highPriority.reduce((a, b) => a + b) / highPriority.length

    // Calculate trends
    const casesTrend = (cases[cases.length - 1] - cases[0]) / cases[0]
    const hoursTrend = (hours[hours.length - 1] - hours[0]) / hours[0]

    // 3. Generate forecasts for next 6 months
    const baseMonth = new Date()
    baseMonth.setDate(1)

    const forecasts = []
    const recommendations = []

    for (let i = 1; i <= 6; i++) {
      const forecastMonth = new Date(baseMonth)
      forecastMonth.setMonth(forecastMonth.getMonth() + i)

      // Simple trend-based forecast
      const predictedCases = Math.round(avgCases * (1 + casesTrend * (i / 12)))
      const predictedHours = Math.round(avgHours * (1 + hoursTrend * (i / 12)))
      const predictedHighPriority = Math.round(avgHighPriority)

      const workloadLevel = classifyWorkload(predictedHours, avgHours)
      const overloadProbability =
        workloadLevel === 'critica' ? 0.8 : workloadLevel === 'alta' ? 0.4 : 0.1

      const monthString = forecastMonth.toISOString().split('T')[0]

      forecasts.push({
        user_id: userId,
        mes_ano_previsto: monthString,
        casos_esperados: predictedCases,
        horas_estimadas: predictedHours,
        carga_estimada: workloadLevel,
        probabilidade_overload: overloadProbability,
        recomendacoes:
          workloadLevel === 'critica'
            ? [
                'Considere contratar recursos temporários',
                'Priorize casos de alta receita',
                'Adie projetos não-urgentes',
              ]
            : workloadLevel === 'alta'
            ? [
                'Monitore carga diariamente',
                'Redistribua trabalho se necessário',
                'Evite novos compromissos grandes',
              ]
            : ['Situação sob controle', 'Aproveite para melhorias operacionais'],
        confianca_percentual: 85,
        modelo_versao: 'v1-trend-based',
      })
    }

    // 5. Generate recommendations
    if (casesTrend > 0.15) {
      recommendations.push('Tendência de aumento de 15%+ em carga - prepare para expansão')
    }

    if (hoursTrend > 0.2) {
      recommendations.push(
        'Tendência de aumento de 20%+ em horas - considere contratações preventivas'
      )
    }

    const avgCriticalMonths = forecasts.filter((f) => f.carga_estimada === 'critica').length

    if (avgCriticalMonths >= 2) {
      recommendations.push(`${avgCriticalMonths} meses com carga crítica prevista - planeje recursos`)
    }

    // 6. Save forecasts to database
    const { error: insertError } = await supabase
      .from('workload_predictions')
      .upsert(forecasts)

    if (insertError) throw insertError

    // 7. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        forecasts: forecasts.length,
        recommendations,
        criticalMonths: avgCriticalMonths,
        nextForecastDate: new Date(baseMonth.getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Erro na previsão de carga:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

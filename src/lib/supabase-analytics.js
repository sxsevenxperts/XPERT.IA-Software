import { supabase } from './supabase'

/**
 * Buscar dados históricos de receita (últimos 6 meses)
 */
export async function fetchRevenueActuals(userId) {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data, error } = await supabase
      .from('honorarios')
      .select('data_pagamento, valor')
      .eq('user_id', userId)
      .gte('data_pagamento', sixMonthsAgo.toISOString().split('T')[0])
      .order('data_pagamento', { ascending: true })

    if (error) throw error

    // Agrupar por mês
    const byMonth = {}
    data.forEach(item => {
      const month = new Date(item.data_pagamento).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      byMonth[month] = (byMonth[month] || 0) + item.valor
    })

    return {
      data: Object.entries(byMonth).map(([mes, receita]) => ({ mes, receita })),
      error: null
    }
  } catch (error) {
    return { data: [], error }
  }
}

/**
 * Calcular previsões de receita (próximos 6 meses)
 * Usa regressão linear simples
 */
export async function fetchRevenuePredictions(userId) {
  try {
    const { data: historico } = await fetchRevenueActuals(userId)

    if (historico.length < 3) {
      return { data: [], error: new Error('Dados insuficientes para previsão') }
    }

    // Converter receita para números
    const values = historico.map((d, i) => ({ x: i, y: parseFloat(d.receita) }))

    // Calcular média
    const n = values.length
    const sumX = values.reduce((a, v) => a + v.x, 0)
    const sumY = values.reduce((a, v) => a + v.y, 0)
    const sumXY = values.reduce((a, v) => a + v.x * v.y, 0)
    const sumX2 = values.reduce((a, v) => a + v.x * v.x, 0)

    // Coeficientes de regressão linear
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Gerar previsões para próximos 6 meses
    const predictions = []
    const currentDate = new Date()

    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(currentDate)
      forecastDate.setMonth(forecastDate.getMonth() + i)

      const x = n + i - 1
      const prevista = Math.max(0, Math.round(slope * x + intercept))

      // Intervalo de confiança (95%)
      const residualError = Math.sqrt(
        values.reduce((sum, v) => {
          const predicted = slope * v.x + intercept
          return sum + Math.pow(v.y - predicted, 2)
        }, 0) / (n - 2)
      )

      const margin = 1.96 * residualError
      const mes = forecastDate.toLocaleDateString('pt-BR', { month: 'short' })

      predictions.push({
        mes,
        prevista,
        intervaloInferior: Math.max(0, Math.round(prevista - margin)),
        intervaloSuperior: Math.round(prevista + margin)
      })
    }

    return { data: predictions, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

/**
 * Buscar dados históricos de carga de trabalho
 */
export async function fetchWorkloadActuals(userId) {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: casos } = await supabase
      .from('casos')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    // Agrupar por mês
    const byMonth = {}
    casos.forEach(caso => {
      const month = new Date(caso.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      byMonth[month] = (byMonth[month] || 0) + 1
    })

    const data = Object.entries(byMonth).map(([mes, casos]) => ({
      mes,
      casos,
      horas: Math.round(casos * 15) // Estimativa: 15h por caso
    }))

    return { data, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

/**
 * Calcular previsões de carga de trabalho
 */
export async function fetchWorkloadPredictions(userId) {
  try {
    const { data: historico } = await fetchWorkloadActuals(userId)

    if (historico.length < 2) {
      return { data: [], error: new Error('Dados insuficientes') }
    }

    const avgCasos = Math.round(historico.reduce((a, d) => a + d.casos, 0) / historico.length)
    const avgHoras = Math.round(historico.reduce((a, d) => a + d.horas, 0) / historico.length)

    const predictions = []
    const currentDate = new Date()

    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date(currentDate)
      forecastDate.setMonth(forecastDate.getMonth() + i)
      const mes = forecastDate.toLocaleDateString('pt-BR', { month: 'short' })

      // Adicionar variação aleatória (±20%)
      const variacao = 0.8 + Math.random() * 0.4
      const casos = Math.round(avgCasos * variacao)
      const horas = Math.round(avgHoras * variacao)

      let carga = 'média'
      if (horas > 200) carga = 'alta'
      if (horas > 250) carga = 'crítica'
      if (horas < 100) carga = 'baixa'

      predictions.push({
        mes,
        casos,
        horas,
        carga,
        probabilidade_overload: horas > 200 ? Math.round((horas - 200) / 50 * 100) : 0
      })
    }

    return { data: predictions, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

/**
 * Dashboard analytics completo
 */
export async function fetchAnalyticsDashboard(userId) {
  try {
    const [receita, receitaPred, workload, workloadPred] = await Promise.all([
      fetchRevenueActuals(userId),
      fetchRevenuePredictions(userId),
      fetchWorkloadActuals(userId),
      fetchWorkloadPredictions(userId)
    ])

    // Calcular KPIs
    const totalReceita = receita.data.reduce((a, d) => a + d.receita, 0)
    const avgReceita = Math.round(totalReceita / (receita.data.length || 1))
    const proximaReceita = receitaPred.data[0]?.prevista || avgReceita

    // Tendência de receita
    const trend = proximaReceita > avgReceita ? 'up' : proximaReceita < avgReceita ? 'down' : 'stable'
    const change = `${Math.round(((proximaReceita - avgReceita) / (avgReceita || 1)) * 100)}%`

    return {
      kpis: {
        receita: totalReceita,
        proximaReceita,
        trend,
        change,
        taxaSucesso: 72,
        tempoMedio: '8.5 meses'
      },
      receita: receita.data,
      receitaPredictions: receitaPred.data,
      workload: workload.data,
      workloadPredictions: workloadPred.data
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return {
      kpis: {},
      receita: [],
      receitaPredictions: [],
      workload: [],
      workloadPredictions: []
    }
  }
}

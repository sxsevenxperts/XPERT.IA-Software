/**
 * Analytics & Predictions Functions
 * Machine learning models for revenue and workload forecasting
 */

import { supabase } from './supabase'

// ===== REVENUE ACTUALS =====

/**
 * Buscar dados históricos de receita
 */
export async function fetchRevenueActuals(userId, months = 12) {
  const { data, error } = await supabase
    .from('revenue_actuals')
    .select('*')
    .eq('user_id', userId)
    .order('mes_ano', { ascending: false })
    .limit(months)

  return { data, error }
}

/**
 * Registrar receita real do mês
 */
export async function recordRevenueActual(userId, revenueData) {
  const { data, error } = await supabase
    .from('revenue_actuals')
    .upsert([{
      ...revenueData,
      user_id: userId
    }])

  return { data, error }
}

// ===== REVENUE PREDICTIONS =====

/**
 * Buscar previsões de receita
 */
export async function fetchRevenuePredictions(userId, months = 6) {
  const { data, error } = await supabase
    .from('revenue_predictions')
    .select('*')
    .eq('user_id', userId)
    .order('mes_ano_previsto', { ascending: true })
    .limit(months)

  return { data, error }
}

/**
 * Gerar previsões de receita com IA
 */
export async function generateRevenueForecast(userId) {
  try {
    const response = await fetch('/functions/v1/generate-revenue-forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Salvar previsão de receita
 */
export async function savePrediction(userId, predictionData) {
  const { data, error } = await supabase
    .from('revenue_predictions')
    .upsert([{
      ...predictionData,
      user_id: userId
    }])

  return { data, error }
}

// ===== WORKLOAD ACTUALS =====

/**
 * Buscar dados históricos de carga de trabalho
 */
export async function fetchWorkloadActuals(userId, months = 12) {
  const { data, error } = await supabase
    .from('workload_actuals')
    .select('*')
    .eq('user_id', userId)
    .order('mes_ano', { ascending: false })
    .limit(months)

  return { data, error }
}

/**
 * Registrar carga de trabalho real do mês
 */
export async function recordWorkloadActual(userId, workloadData) {
  const { data, error } = await supabase
    .from('workload_actuals')
    .upsert([{
      ...workloadData,
      user_id: userId
    }])

  return { data, error }
}

// ===== WORKLOAD PREDICTIONS =====

/**
 * Buscar previsões de carga de trabalho
 */
export async function fetchWorkloadPredictions(userId, months = 6) {
  const { data, error } = await supabase
    .from('workload_predictions')
    .select('*')
    .eq('user_id', userId)
    .order('mes_ano_previsto', { ascending: true })
    .limit(months)

  return { data, error }
}

/**
 * Gerar previsões de carga de trabalho
 */
export async function generateWorkloadForecast(userId) {
  try {
    const response = await fetch('/functions/v1/generate-workload-forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ===== ANALYTICS DASHBOARD =====

/**
 * Buscar métricas aggregadas do dashboard
 */
export async function fetchAnalyticsDashboard(userId) {
  const { data, error } = await supabase
    .from('analytics_dashboard')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data, error }
}

/**
 * Atualizar métricas do dashboard
 */
export async function updateAnalyticsDashboard(userId, dashboardData) {
  const { data, error } = await supabase
    .from('analytics_dashboard')
    .upsert([{
      ...dashboardData,
      user_id: userId,
      actualizado_em: new Date().toISOString()
    }])

  return { data, error }
}

/**
 * Obter insights gerados por IA
 */
export async function generateAnalyticsInsights(userId) {
  try {
    const response = await fetch('/functions/v1/generate-analytics-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

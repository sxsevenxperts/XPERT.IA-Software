import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Desabilita Navigator Lock para evitar hang indefinido em iOS/Safari/multi-tab
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
})

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export async function updateProfile(userId, profileData) {
  return supabase.from('profiles').upsert([{ id: userId, ...profileData }])
}

// ── Corridas (trips) ─────────────────────────────────────────────────────────

export async function fetchCorridas(userId, filters = {}) {
  let query = supabase
    .from('corridas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.from)   query = query.gte('created_at', filters.from)
  if (filters.to)     query = query.lte('created_at', filters.to)
  if (filters.limit)  query = query.limit(filters.limit)

  return query
}

export async function createCorrida(userId, corridaData) {
  return supabase.from('corridas').insert([{ user_id: userId, ...corridaData }]).select().single()
}

export async function updateCorrida(corridaId, corridaData) {
  return supabase.from('corridas').update(corridaData).eq('id', corridaId).select().single()
}

export async function deleteCorrida(corridaId) {
  return supabase.from('corridas').delete().eq('id', corridaId)
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function fetchExpenses(userId, filters = {}) {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (filters.from) query = query.gte('date', filters.from)
  if (filters.to)   query = query.lte('date', filters.to)

  return query
}

export async function createExpense(userId, expenseData) {
  return supabase.from('expenses').insert([{ user_id: userId, ...expenseData }]).select().single()
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function fetchMessages(limit = 50) {
  return supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit)
}

export async function sendMessage(userId, content) {
  return supabase.from('chat_messages').insert([{ user_id: userId, content }])
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function fetchNotificationPreferences(userId) {
  return supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle()
}

export async function updateNotificationPreferences(userId, prefs) {
  return supabase.from('notification_preferences').upsert([{ user_id: userId, ...prefs }], { onConflict: 'user_id' })
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

/**
 * Verifica o status da assinatura do motorista.
 * Retorna { active, status, plan, expires_at, suspended, days_since_expiry, days_until_delete, reason }
 */
export async function checkSubscription(userId) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return { active: false, reason: 'error' }
    if (!data)  return { active: false, reason: 'not_found' }

    const now       = new Date()
    const expiresAt = new Date(data.expires_at)

    const isExpired   = expiresAt <= now
    const isSuspended = data.status === 'suspended'
    const isActive    = !isExpired && data.status === 'active'

    const daysSinceExpiry = isExpired
      ? Math.floor((now - expiresAt) / (1000 * 60 * 60 * 24))
      : 0

    return {
      active:            isActive,
      plan:              data.plan || 'monthly',
      expires_at:        data.expires_at,
      status:            data.status,
      suspended:         isSuspended,
      days_since_expiry: daysSinceExpiry,
      days_until_delete: isSuspended || isExpired ? Math.max(0, 30 - daysSinceExpiry) : null,
      reason:            isExpired    ? 'expired'
                       : isSuspended ? 'suspended'
                       : data.status !== 'active' ? 'inactive'
                       : null,
    }
  } catch {
    return { active: false, reason: 'error' }
  }
}

/**
 * Aguarda a subscrição ficar ativa (webhook processado) com polling
 * Útil para verificar se o webhook do Hotmart já foi processado
 * @param {string} userId - ID do usuário
 * @param {number} maxWaitTime - Tempo máximo de espera em ms (padrão: 5 minutos)
 * @param {number} pollInterval - Intervalo entre verificações em ms (padrão: 2 segundos)
 * @returns {Promise<boolean>} true se subscrição ficou ativa, false se timeout
 */
export async function waitForSubscription(userId, maxWaitTime = 5 * 60 * 1000, pollInterval = 2000) {
  const startTime = Date.now()
  let checkCount = 0

  while (Date.now() - startTime < maxWaitTime) {
    checkCount++
    const sub = await checkSubscription(userId)

    if (sub.active) {
      console.log(`✅ Subscrição ativa após ${checkCount} verificações`)
      return true
    }

    if (checkCount % 3 === 0) {
      console.log(`⏳ Aguardando webhook... verificação ${checkCount}`)
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  console.error(`⏱️ Timeout após ${checkCount} verificações`)
  return false
}

// ── Admin helpers ─────────────────────────────────────────────────────────────

export const ADMIN_EMAIL = 'sevenxpertssxacademy@gmail.com'

export function checkIsAdmin(email) {
  return email === ADMIN_EMAIL
}

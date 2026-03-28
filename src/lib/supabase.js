import { createClient } from '@supabase/supabase-js'

// Supabase Self-Hosted (EasyPanel)
const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = url && key ? createClient(url, key) : null

// ── Verificar assinatura real ──
export async function checkSubscription(userId) {
  if (!supabase) return { active: true, plan: 'premium' }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status, expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return { active: false, reason: 'not_found' }
    }

    const isExpired = new Date(data.expires_at) < new Date()
    const isActive = data.status === 'active' && !isExpired

    return {
      active: isActive,
      plan: data.plan,
      status: data.status,
      expires_at: data.expires_at,
      reason: isExpired ? 'expired' : (!isActive ? 'cancelled' : null),
    }
  } catch {
    // Fallback: se erro de rede, permite acesso
    return { active: true, plan: 'premium', offline: true }
  }
}

// ── Buscar perfil do motorista ──
export async function getProfile(userId) {
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

// ── Atualizar perfil ──
export async function updateProfile(userId, updates) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Upload avatar ──
export async function uploadAvatar(userId, file) {
  if (!supabase) return null
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (upErr) throw upErr

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatar_url = data.publicUrl + '?t=' + Date.now()

  await updateProfile(userId, { avatar_url })
  return avatar_url
}

// ── Buscar histórico de pagamentos ──
export async function getPaymentHistory(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('payment_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

// ── Verificar se é admin ──
export async function checkIsAdmin(userId) {
  if (!supabase) return false
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role === 'admin'
}

// ── Gerenciar Lojas ──
export async function getLojas(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('lojas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createLoja(userId, lojaData) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('lojas')
    .insert([{ ...lojaData, user_id: userId }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLoja(lojaId, lojaData) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('lojas')
    .update({ ...lojaData, updated_at: new Date().toISOString() })
    .eq('id', lojaId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLoja(lojaId) {
  if (!supabase) return null
  const { error } = await supabase
    .from('lojas')
    .delete()
    .eq('id', lojaId)
  if (error) throw error
  return true
}

export async function getMaxLojasByPlan(planoLojas) {
  const planos = {
    'loja_1': 1,
    'loja_2': 2,
    'loja_3': 3,
    'loja_rede': 999,
  }
  return planos[planoLojas] || 1
}

// ── Smart Market: Autenticação de Loja (Supabase Auth) ──
export async function authenticateLojaSupabase(email, cpfCnpj) {
  if (!supabase) return null

  try {
    // Login com Supabase Auth usando email e CPF/CNPJ como senha
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: cpfCnpj.replace(/\D/g, '') // Remove formatting from CPF/CNPJ
    })

    if (error || !data?.user) {
      return null
    }

    // Fetch loja data
    const { data: loja } = await supabase
      .from('lojas')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    return loja || { id: data.user.id, email: data.user.email }
  } catch {
    return null
  }
}

// ── Smart Market: Autenticação de Loja (Fallback - banco de dados) ──
export async function authenticateLoja(email, cpfCnpj) {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('login_usuario', email)
      .eq('senha_usuario', cpfCnpj.replace(/\D/g, '')) // Remove formatting
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch {
    return null
  }
}

// ── Smart Market: Obter status de assinatura da loja ──
export async function getLojaSubscription(lojaId) {
  if (!supabase) return { active: true, plan: 'premium' }

  try {
    const { data, error } = await supabase
      .from('lojas')
      .select('id, plano, data_expiracao, ativo')
      .eq('id', lojaId)
      .single()

    if (error || !data) {
      return { active: false, reason: 'not_found' }
    }

    const expiresAt = data.data_expiracao ? new Date(data.data_expiracao) : null
    const isExpired = expiresAt && expiresAt < new Date()
    const isActive = data.ativo && !isExpired

    return {
      active: isActive,
      plan: data.plano || 'premium',
      expires_at: data.data_expiracao,
      reason: isExpired ? 'expired' : (!data.ativo ? 'suspended' : null),
    }
  } catch {
    return { active: true, plan: 'premium', offline: true }
  }
}

// ── Smart Market: Obter histórico de pagamentos da loja ──
export async function getLojaPaymentHistory(lojaId) {
  if (!supabase) return []

  try {
    const { data } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false })

    return data || []
  } catch {
    return []
  }
}

// ── Smart Market: Alterar senha da loja ──
export async function changeLojaPassword(lojaId, currentPassword, newPassword) {
  if (!supabase) return null

  try {
    // Verificar sessão atual do Supabase Auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) return { error: 'Sessão expirada. Faça login novamente.' }

    // Validar senha atual re-autenticando
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword.replace(/\D/g, '') || currentPassword
    })

    // Se falhou, tentar sem remover formatação
    if (signInError) {
      const { error: signInError2 } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword
      })
      if (signInError2) return { error: 'Senha atual incorreta' }
    }

    // Atualizar senha no Supabase Auth (bcrypt automático, seguro)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) return { error: 'Erro ao alterar senha' }

    // Atualizar backup no banco
    await supabase
      .from('lojas')
      .update({ senha_usuario: newPassword })
      .eq('id', lojaId)

    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
}

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kyefzktzhviahsodyayd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZWZ6a3R6aHZpYWhzb2R5YXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDU4NTAsImV4cCI6MjA5MDM4MTg1MH0.htprONYYNUmOQAtw5dF0C8Huk4pND2y0PhjJKB2-nN0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Autenticar com email/senha
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/**
 * Criar nova conta
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

/**
 * Fazer logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Obter sessão atual
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Obter usuário atual
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Listeners de autenticação
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return subscription
}

/**
 * Buscar clientes
 */
export async function fetchClientes(userId) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Criar cliente
 */
export async function createCliente(clienteData, userId) {
  const { data, error } = await supabase
    .from('clientes')
    .insert([{ ...clienteData, user_id: userId }])
  return { data, error }
}

/**
 * Buscar casos
 */
export async function fetchCasos(userId) {
  const { data, error } = await supabase
    .from('casos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Criar caso
 */
export async function createCaso(casoData, userId) {
  const { data, error } = await supabase
    .from('casos')
    .insert([{ ...casoData, user_id: userId }])
  return { data, error }
}

/**
 * Buscar honorários
 */
export async function fetchHonorarios(userId) {
  const { data, error } = await supabase
    .from('honorarios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Atualizar perfil do usuário
 */
export async function updateProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert([{ id: userId, ...profileData }])
  return { data, error }
}

/**
 * Buscar perfil do usuário
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// ============================================
// TAREFAS - Task Management
// ============================================

/**
 * Buscar tarefas do usuário
 */
export async function fetchTarefas(userId, casoId = null) {
  let query = supabase
    .from('tarefas')
    .select('*')
    .eq('user_id', userId)
    .order('data_vencimento', { ascending: true })
  
  if (casoId) {
    query = query.eq('caso_id', casoId)
  }
  
  const { data, error } = await query
  return { data, error }
}

/**
 * Criar nova tarefa
 */
export async function createTarefa(tarefaData, userId) {
  const { data, error } = await supabase
    .from('tarefas')
    .insert([{ ...tarefaData, user_id: userId }])
  return { data, error }
}

/**
 * Atualizar tarefa
 */
export async function updateTarefa(tarefaId, tarefaData) {
  const { data, error } = await supabase
    .from('tarefas')
    .update(tarefaData)
    .eq('id', tarefaId)
  return { data, error }
}

/**
 * Deletar tarefa
 */
export async function deleteTarefa(tarefaId) {
  const { data, error } = await supabase
    .from('tarefas')
    .delete()
    .eq('id', tarefaId)
  return { data, error }
}

// ============================================
// ALERTAS - Deadline Alerts
// ============================================

/**
 * Buscar alertas não lidos do usuário
 */
export async function fetchAlertas(userId) {
  const { data, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('user_id', userId)
    .eq('notificacao_lida', false)
    .order('data_alerta', { ascending: true })
  return { data, error }
}

/**
 * Criar novo alerta
 */
export async function createAlerta(alertaData, userId) {
  const { data, error } = await supabase
    .from('alertas')
    .insert([{ ...alertaData, user_id: userId }])
  return { data, error }
}

/**
 * Marcar alerta como lido
 */
export async function marcarAlertaComoLido(alertaId) {
  const { data, error } = await supabase
    .from('alertas')
    .update({ notificacao_lida: true })
    .eq('id', alertaId)
  return { data, error }
}

// ============================================
// TEMPLATES - Document Templates
// ============================================

/**
 * Buscar templates do usuário
 */
export async function fetchTemplates(userId, tipo = null) {
  let query = supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true })
  
  if (tipo) {
    query = query.eq('tipo', tipo)
  }
  
  const { data, error } = await query
  return { data, error }
}

/**
 * Criar novo template
 */
export async function createTemplate(templateData, userId) {
  const { data, error } = await supabase
    .from('templates')
    .insert([{ ...templateData, user_id: userId }])
  return { data, error }
}

/**
 * Atualizar template
 */
export async function updateTemplate(templateId, templateData) {
  const { data, error } = await supabase
    .from('templates')
    .update(templateData)
    .eq('id', templateId)
  return { data, error }
}

/**
 * Deletar template
 */
export async function deleteTemplate(templateId) {
  const { data, error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId)
  return { data, error }
}

// ============================================
// NOTIFICAÇÕES - Notification System
// ============================================

/**
 * Buscar configurações de notificação do usuário
 */
export async function fetchNotificationSettings(userId) {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
  return { data, error }
}

/**
 * Atualizar configuração de notificação
 */
export async function updateNotificationSettings(userId, canal, tipoAlerta, settings) {
  const { data, error } = await supabase
    .from('notification_settings')
    .upsert([{
      user_id: userId,
      canal,
      tipo_alerta: tipoAlerta,
      ...settings
    }])
  return { data, error }
}

/**
 * Buscar histórico de notificações
 */
export async function fetchNotificationLog(userId, limit = 50) {
  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(notificationId) {
  const { data, error } = await supabase
    .from('notification_log')
    .update({ lido_em: new Date().toISOString() })
    .eq('id', notificationId)
  return { data, error }
}

/**
 * Buscar informações de contato (email/telefone)
 */
export async function fetchContactInfo(userId) {
  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

/**
 * Atualizar informações de contato
 */
export async function updateContactInfo(userId, contactData) {
  const { data, error } = await supabase
    .from('contact_info')
    .upsert([{ user_id: userId, ...contactData }])
  return { data, error }
}

/**
 * Enviar notificação (adiciona à fila)
 */
export async function sendNotification(userId, notificationData) {
  const { data, error } = await supabase
    .from('notification_queue')
    .insert([{
      user_id: userId,
      ...notificationData
    }])
  return { data, error }
}

// ============================================
// CALENDAR INTEGRATIONS - Google Calendar & Outlook Sync
// ============================================

/**
 * Buscar integrações de calendário do usuário
 */
export async function fetchCalendarIntegrations(userId) {
  const { data, error } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Criar nova integração de calendário
 */
export async function createCalendarIntegration(integrationData, userId) {
  const { data, error } = await supabase
    .from('calendar_integrations')
    .insert([{ ...integrationData, user_id: userId }])
  return { data, error }
}

/**
 * Atualizar integração de calendário
 */
export async function updateCalendarIntegration(integrationId, integrationData) {
  const { data, error } = await supabase
    .from('calendar_integrations')
    .update(integrationData)
    .eq('id', integrationId)
  return { data, error }
}

/**
 * Deletar integração de calendário
 */
export async function deleteCalendarIntegration(integrationId) {
  const { data, error } = await supabase
    .from('calendar_integrations')
    .delete()
    .eq('id', integrationId)
  return { data, error }
}

/**
 * Buscar eventos de calendário sincronizados
 */
export async function fetchCalendarEvents(userId, dataInicio = null, dataFim = null) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('data_inicio', { ascending: true })
  
  if (dataInicio) {
    query = query.gte('data_inicio', dataInicio)
  }
  if (dataFim) {
    query = query.lte('data_inicio', dataFim)
  }
  
  const { data, error } = await query
  return { data, error }
}

/**
 * Criar evento de calendário
 */
export async function createCalendarEvent(eventData, userId) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([{ ...eventData, user_id: userId }])
  return { data, error }
}

/**
 * Atualizar evento de calendário
 */
export async function updateCalendarEvent(eventId, eventData) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(eventData)
    .eq('id', eventId)
  return { data, error }
}

/**
 * Buscar histórico de sincronizações
 */
export async function fetchCalendarSyncLog(integrationId, limit = 20) {
  const { data, error } = await supabase
    .from('calendar_sync_log')
    .select('*')
    .eq('integration_id', integrationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
}

// ============================================
// CASE PREDICTIONS - IA & Analytics
// ============================================

/**
 * Buscar previsões de um caso
 */
export async function fetchCasePrediction(casoId) {
  const { data, error } = await supabase
    .from('case_predictions')
    .select('*')
    .eq('caso_id', casoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return { data, error }
}

/**
 * Criar/atualizar previsão de caso
 */
export async function saveCasePrediction(casoId, userId, predictionData) {
  const existing = await fetchCasePrediction(casoId)
  
  if (existing.data) {
    // Atualizar
    const { data, error } = await supabase
      .from('case_predictions')
      .update(predictionData)
      .eq('caso_id', casoId)
    return { data, error }
  } else {
    // Criar
    const { data, error } = await supabase
      .from('case_predictions')
      .insert([{
        caso_id: casoId,
        user_id: userId,
        ...predictionData
      }])
    return { data, error }
  }
}

/**
 * Analisar caso com IA (chama Edge Function)
 */
export async function analyzeCaseWithAI(casoData) {
  try {
    const response = await fetch('/functions/v1/analyze-case-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(casoData),
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

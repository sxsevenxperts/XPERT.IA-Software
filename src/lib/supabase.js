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

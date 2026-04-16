/**
 * Auto-onboarding de usuários após compra
 * Cria conta automática com email + CPF como senha
 * Sem necessidade de confirmação por email
 */

import { supabase } from './supabase'

/**
 * Cria conta automática após compra
 * @param {Object} compraData - dados da compra
 *   - email: string (email do cliente)
 *   - cpf: string (CPF - será a senha inicial)
 *   - nome: string (nome completo)
 *   - oab?: string (número OAB/SP 123.456)
 * @returns {Object} { user, session, error }
 */
export async function autoCriarContaAposCompra(compraData) {
  const { email, cpf, nome, oab } = compraData

  if (!email || !cpf || !nome) {
    return { error: 'Email, CPF e nome são obrigatórios' }
  }

  try {
    // 1. Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: cpf, // CPF é a senha inicial
      options: {
        emailRedirectTo: undefined, // Sem email de confirmação
        data: { nome, oab } // Metadados adicionais
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Falha ao criar usuário' }
    }

    // 2. Confirma email automaticamente (sem enviar confirmação)
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      { email_confirm: true }
    )

    if (confirmError) {
      console.warn('Aviso ao confirmar email:', confirmError)
    }

    // 3. Cria perfil do usuário em profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        name: nome,
        oab: oab || null,
        created_at: new Date().toISOString()
      }])

    if (profileError && !profileError.message.includes('duplicate')) {
      console.warn('Aviso ao criar profile:', profileError)
    }

    // 4. Faz login automático
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password: cpf
    })

    if (sessionError) {
      return {
        user: authData.user,
        message: 'Conta criada, mas faça login manualmente',
        error: sessionError.message
      }
    }

    return {
      user: authData.user,
      session: sessionData.session,
      success: true,
      message: `Bem-vindo ${nome}! Sua conta foi criada automaticamente.`
    }
  } catch (err) {
    return { error: err.message || 'Erro ao criar conta' }
  }
}

/**
 * Muda senha no painel (sem email de confirmação)
 * Apenas valida token do usuário logado
 * @param {string} novaSegn
ha - nova senha (sem validação de complexidade)
 * @returns {Object} { success, error }
 */
export async function mudarSenhaPainel(novaSenha) {
  if (!novaSenha || novaSenha.length < 6) {
    return { error: 'Senha deve ter pelo menos 6 caracteres' }
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (error) {
      return { error: error.message }
    }

    return {
      success: true,
      message: 'Senha alterada com sucesso'
    }
  } catch (err) {
    return { error: err.message }
  }
}

/**
 * Valida se CPF segue formato básico (11 dígitos)
 * @param {string} cpf
 * @returns {boolean}
 */
export function validarCPF(cpf) {
  const apenasDigitos = cpf.replace(/\D/g, '')
  return apenasDigitos.length === 11
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 * @param {string} cpf
 * @returns {string}
 */
export function formatarCPF(cpf) {
  const d = cpf.replace(/\D/g, '')
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * lib/claude.js
 * ─────────────────────────────────────────────────────────────────
 * Integração com a API da Anthropic (Claude).
 * A chave API é armazenada pelo advogado nas Configurações do PrevOS
 * e salva de forma segura no Supabase (tabela profiles.claude_api_key).
 *
 * NUNCA insira a chave diretamente no código-fonte.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from './supabase'

/**
 * Recupera a chave Claude API do perfil do usuário logado.
 */
async function getClaudeKey() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('profiles')
    .select('claude_api_key')
    .eq('id', user.id)
    .single()

  if (error || !data?.claude_api_key) {
    throw new Error('Chave da API Claude não configurada. Acesse Configurações → Integrações para adicionar.')
  }
  return data.claude_api_key
}

/**
 * Envia uma mensagem para a API Claude e retorna a resposta como texto.
 *
 * @param {string} userMessage  — prompt / pergunta do advogado
 * @param {string} [system]     — instrução de sistema (opcional)
 * @param {string} [model]      — modelo Claude (default: claude-3-5-sonnet-20241022)
 * @returns {Promise<string>}
 */
export async function callClaude(userMessage, system = '', model = 'claude-3-5-sonnet-20241022') {
  const apiKey = await getClaudeKey()

  const systemPrompt = system || `Você é um assistente jurídico especializado em Direito Brasileiro.
Responda sempre em português, com linguagem técnica e precisa.
Cite sempre os diplomas legais, súmulas e jurisprudências pertinentes.
NÃO faça promessas de resultado — informe apenas o estado atual da legislação e jurisprudência.
Siga rigorosamente o Código de Ética e Disciplina da OAB e a Constituição Federal.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':            'application/json',
      'x-api-key':               apiKey,
      'anthropic-version':       '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    if (response.status === 401) throw new Error('Chave da API Claude inválida. Verifique em Configurações → Integrações.')
    if (response.status === 429) throw new Error('Limite de requisições da API atingido. Aguarde alguns instantes.')
    throw new Error(err?.error?.message || `Erro na API Claude (${response.status}).`)
  }

  const result = await response.json()
  return result.content?.[0]?.text || ''
}

/**
 * Verifica se a chave API está configurada (sem fazer chamada real).
 */
export async function hasClaudeKey() {
  try {
    await getClaudeKey()
    return true
  } catch {
    return false
  }
}

/**
 * Salva a chave Claude API no perfil do usuário.
 *
 * @param {string} apiKey
 */
export async function saveClaudeKey(apiKey) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, claude_api_key: apiKey })

  if (error) throw new Error('Erro ao salvar a chave API.')
  return true
}

/**
 * Testa a chave API enviando uma mensagem simples.
 */
export async function testClaudeKey(apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':            'application/json',
      'x-api-key':               apiKey,
      'anthropic-version':       '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-3-haiku-20240307',
      max_tokens: 10,
      messages:   [{ role: 'user', content: 'Ok' }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Chave inválida ou sem créditos.')
  }
  return true
}

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

import { invokeFunction } from './supabase'

/**
 * Recupera a chave Claude API do perfil do usuário logado.
 */
async function getClaudeKey() {
  const { data, error } = await invokeFunction('integration-credentials', { action: 'status', provider: 'anthropic' })
  if (error) throw new Error('Não foi possível consultar a configuração da Anthropic.')
  return data?.configured === true
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
  const { data, error } = await invokeFunction('ai-assistant', {
    action: 'message', prompt: userMessage, system, model, maxTokens: 4096,
  })
  if (error) throw new Error(error.message || 'Erro ao chamar o assistente de IA.')
  if (data?.error) throw new Error(data.error)
  return data?.text || ''
}

/**
 * Envia um arquivo (imagem ou PDF) + prompt para o Claude e retorna o texto.
 * Lê o arquivo como base64 e usa a API de visão/documentos.
 *
 * @param {File} file
 * @param {string} userPrompt
 * @param {string} [system]
 * @returns {Promise<string>}
 */
export async function callClaudeWithFile(file, userPrompt, system = '') {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const { data, error } = await invokeFunction('ai-assistant', {
    action: 'message',
    prompt: userPrompt,
    system,
    model: 'claude-3-5-sonnet-20241022',
    file: { mediaType: file.type, data: base64 },
  })
  if (error) throw new Error(error.message || 'Erro ao analisar o arquivo.')
  if (data?.error) throw new Error(data.error)
  return data?.text || ''
}

/**
 * Verifica se a chave API está configurada (sem fazer chamada real).
 */
export async function hasClaudeKey() {
  try {
    return await getClaudeKey()
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
  const { data, error } = await invokeFunction('integration-credentials', {
    action: 'set', provider: 'anthropic', value: apiKey,
  })
  if (error || data?.error) throw new Error(data?.error || error?.message || 'Erro ao salvar a chave API.')
  return data?.configured === true
}

/**
 * Testa a chave API enviando uma mensagem simples.
 */
export async function testClaudeKey(apiKey) {
  const { data, error } = await invokeFunction('integration-credentials', {
    action: 'test', provider: 'anthropic', value: apiKey,
  })
  if (error || data?.error) throw new Error(data?.error || error?.message || 'Chave inválida ou sem créditos.')
  return data?.valid === true
}

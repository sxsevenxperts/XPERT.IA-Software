import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = 'https://qfkwqfrnemqregjqxkcr.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma3dxZnJuZW1xcmVnanF4a2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDA2NjYsImV4cCI6MjA4OTYxNjY2Nn0.YbAdy56R0QK_F1lhAB09iggl2PcazRpoc1U-CRd8miA'
const SMART_MARKET_URL = 'https://diversos-smartmarket.yuhqmc.easypanel.host'

// Dados de teste — mude para testar com outros usuários
const TEST_EMAIL = `teste.${Date.now()}@smartmarket.com.br`
const TEST_CPF   = '12345678901'
const TEST_NAME  = 'Loja Teste Smart Market'

export default function SetupTeste() {
  const [log, setLog] = useState([])
  const [status, setStatus] = useState('Aguardando...')
  const [done, setDone] = useState(false)
  const [lojaId, setLojaId] = useState(null)
  const [running, setRunning] = useState(false)

  const addLog = (msg, tipo = 'info') => setLog(prev => [...prev, { msg, tipo }])

  const runFluxo = async () => {
    setRunning(true)
    setLog([])
    setDone(false)
    setLojaId(null)
    setStatus('Executando...')

    try {
      // ── PASSO 1: Simular webhook Hotmart ──────────────────────────────────
      addLog('━━━ PASSO 1: Simular compra Hotmart ━━━', 'sep')
      addLog(`📧 E-mail: ${TEST_EMAIL}`)
      addLog(`🔐 CPF: ${TEST_CPF}`)

      const payload = {
        status: 'approved',
        event_type: 'PURCHASE_APPROVED',
        data: {
          id: `test-${Date.now()}`,
          buyer: {
            email: TEST_EMAIL,
            name: TEST_NAME,
            cpf: TEST_CPF,
          },
          product: { id: 'prod_smartmarket_001', name: 'Smart Market Premium' },
          subscription: { status: 'active', recurrence: 'monthly' },
          payment: { method: 'credit_card' },
        },
      }

      const webhookResp = await fetch(`${SUPABASE_URL}/functions/v1/payment-hotmart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      })

      const webhookData = await webhookResp.json()

      if (!webhookResp.ok || !webhookData.success) {
        addLog(`❌ Webhook falhou (${webhookResp.status}): ${webhookData.error || JSON.stringify(webhookData)}`, 'erro')
        setStatus('❌ Falha no webhook')
        setRunning(false)
        return
      }

      const novoLojaId = webhookData.loja_id
      setLojaId(novoLojaId)
      addLog(`✅ Webhook OK! loja_id: ${novoLojaId}`, 'ok')

      // ── PASSO 2: Verificar loja no banco ─────────────────────────────────
      addLog('━━━ PASSO 2: Verificar loja criada ━━━', 'sep')

      const { data: loja, error: lojaErr } = await supabase
        .from('lojas')
        .select('id, nome, login_usuario, plano, ativo, data_expiracao')
        .eq('id', novoLojaId)
        .single()

      if (lojaErr || !loja) {
        addLog(`❌ Loja não encontrada: ${lojaErr?.message}`, 'erro')
        setStatus('❌ Loja não criada')
        setRunning(false)
        return
      }

      addLog(`✅ Loja encontrada: ${loja.nome}`, 'ok')
      addLog(`   Plano: ${loja.plano} | Ativo: ${loja.ativo}`)
      addLog(`   Expira: ${loja.data_expiracao?.slice(0, 10)}`)

      // ── PASSO 3: Login via Supabase Auth ──────────────────────────────────
      addLog('━━━ PASSO 3: Testar login (Supabase Auth) ━━━', 'sep')

      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_CPF,
      })

      if (authErr) {
        addLog(`⚠️  Auth: ${authErr.message}`, 'aviso')
        addLog('   → Tentando fallback por tabela lojas...', 'info')

        // ── PASSO 3B: Fallback DB ─────────────────────────────────────────
        const { data: lojaFallback, error: fbErr } = await supabase
          .from('lojas')
          .select('*')
          .eq('login_usuario', TEST_EMAIL)
          .eq('senha_usuario', TEST_CPF)
          .single()

        if (fbErr || !lojaFallback) {
          addLog(`❌ Fallback falhou: ${fbErr?.message}`, 'erro')
          setStatus('❌ Login falhou')
          setRunning(false)
          return
        }

        addLog(`✅ Login via fallback OK! Loja: ${lojaFallback.nome}`, 'ok')
      } else {
        addLog(`✅ Login Auth OK! User ID: ${authData.user.id}`, 'ok')
        await supabase.auth.signOut()
      }

      // ── RESULTADO FINAL ───────────────────────────────────────────────────
      addLog('━━━ FLUXO COMPLETO ━━━', 'sep')
      addLog(`✅ Webhook Hotmart → Loja criada`, 'ok')
      addLog(`✅ Login funcionando`, 'ok')
      addLog(`🏪 Loja ID: ${novoLojaId}`, 'ok')
      addLog(`📧 Email: ${TEST_EMAIL}`, 'ok')
      addLog(`🔐 Senha: ${TEST_CPF}`, 'ok')

      setStatus('✅ FLUXO COMPLETO!')
      setDone(true)
    } catch (err) {
      addLog(`❌ Erro inesperado: ${err.message}`, 'erro')
      setStatus('❌ Erro')
    }

    setRunning(false)
  }

  const corPorTipo = (tipo) => ({
    ok: '#22c55e',
    erro: '#ef4444',
    aviso: '#f59e0b',
    sep: '#3b82f6',
    info: '#94a3b8',
  }[tipo] || '#94a3b8')

  return (
    <div style={{
      minHeight: '100dvh', background: '#0f172a', color: '#f1f5f9',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '32px 16px', fontFamily: 'monospace',
    }}>
      <h1 style={{ color: '#22c55e', marginBottom: 4, fontSize: 20 }}>🧪 Teste do Fluxo Completo</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 12, textAlign: 'center' }}>
        Hotmart webhook → criar usuário → criar loja → login
      </p>

      <div style={{
        background: '#1e293b', borderRadius: 12, padding: 20,
        width: '100%', maxWidth: 520, marginBottom: 16,
        border: '1px solid #334155',
      }}>
        <div style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 12, fontSize: 13 }}>
          Status: <span style={{ color: status.startsWith('✅') ? '#22c55e' : status.startsWith('❌') ? '#ef4444' : '#f59e0b' }}>{status}</span>
        </div>

        {log.length === 0 && (
          <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>
            Clique em "Executar Teste" para iniciar o fluxo completo.
          </p>
        )}

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: 12, color: corPorTipo(l.tipo), marginBottom: 3, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {l.msg}
            </div>
          ))}
        </div>
      </div>

      {!running && !done && (
        <button
          onClick={runFluxo}
          style={{
            background: '#22c55e', color: '#0f172a', border: 'none',
            borderRadius: 8, padding: '12px 32px', fontSize: 15,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          Executar Teste
        </button>
      )}

      {running && (
        <div style={{ color: '#64748b', fontSize: 13 }}>⏳ Executando...</div>
      )}

      {done && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/"
            style={{
              background: '#22c55e', color: '#0f172a', borderRadius: 8,
              padding: '12px 24px', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Ir para Login
          </a>
          <a href={`${SMART_MARKET_URL}/?loja_id=${lojaId}`}
            target="_blank" rel="noreferrer"
            style={{
              background: '#3b82f6', color: '#fff', borderRadius: 8,
              padding: '12px 24px', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Abrir Smart Market
          </a>
          <button
            onClick={runFluxo}
            style={{
              background: '#334155', color: '#f1f5f9', border: 'none',
              borderRadius: 8, padding: '12px 24px', fontSize: 14,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Novo Teste
          </button>
        </div>
      )}
    </div>
  )
}

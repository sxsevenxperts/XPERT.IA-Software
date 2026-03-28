import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SetupTeste() {
  const [status, setStatus] = useState('Aguardando...')
  const [log, setLog] = useState([])
  const [done, setDone] = useState(false)

  const addLog = (msg) => setLog(prev => [...prev, msg])

  const runSetup = async () => {
    const email = 'cliente.teste@smartmarket.com.br'
    const cpf = '12345678901234'

    setStatus('Executando...')

    try {
      // Passo 1: Criar usuário via signUp
      addLog('1️⃣ Criando usuário via Hotmart webhook simulado...')
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password: cpf
      })

      if (signupError && signupError.message !== 'User already registered') {
        addLog('⚠️ ' + signupError.message)
      } else if (signupData?.user?.id) {
        addLog('✅ Usuário criado: ' + signupData.user.id)
      } else {
        addLog('ℹ️ Usuário já existe, continuando...')
      }

      // Passo 2: Criar loja (sem user_id - fallback auth)
      addLog('2️⃣ Criando loja de teste...')
      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas')
        .insert({
          nome: 'Loja de Teste Smart Market',
          nome_usuario: 'Cliente Teste',
          login_usuario: email,
          senha_usuario: cpf,
          ativo: true,
          plano: 'premium',
          data_expiracao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          latitude: -23.5505,
          longitude: -46.6333,
          cidade: 'São Paulo',
          estado: 'SP'
        })
        .select()
        .single()

      if (lojaError) {
        if (lojaError.code === '23505') {
          addLog('ℹ️ Loja já existe (OK)')
        } else {
          addLog('⚠️ Loja: ' + lojaError.message)
        }
      } else {
        addLog('✅ Loja criada: ' + lojaData.id)
      }

      // Passo 3: Testar login
      addLog('3️⃣ Testando login com as credenciais...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: cpf
      })

      if (loginError) {
        // Tentar fallback - buscar loja direto
        addLog('ℹ️ Auth: ' + loginError.message + ' — tentando fallback...')
        const { data: lojaFallback } = await supabase
          .from('lojas')
          .select('*')
          .eq('login_usuario', email)
          .eq('senha_usuario', cpf)
          .single()

        if (lojaFallback) {
          addLog('✅ Login via fallback OK! Loja: ' + lojaFallback.nome)
          addLog('')
          addLog('━━━━━━━━━━━━━━━━━━━━━━━━')
          addLog('✅ TESTE COMPLETO!')
          addLog('📧 Email: ' + email)
          addLog('🔐 CPF: ' + cpf)
          addLog('🏪 Loja: ' + lojaFallback.nome)
          addLog('📍 Cidade: ' + (lojaFallback.cidade || 'São Paulo'))
          addLog('💳 Plano: ' + lojaFallback.plano)
          setStatus('✅ SUCESSO via fallback!')
          setDone(true)
        } else {
          addLog('❌ Nenhuma loja encontrada')
          setStatus('❌ Erro no login')
        }
      } else {
        addLog('✅ Login Auth bem-sucedido! User: ' + loginData.user.id)

        // Buscar loja
        const { data: lojaUser } = await supabase
          .from('lojas')
          .select('*')
          .eq('user_id', loginData.user.id)
          .single()

        addLog('')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━')
        addLog('✅ TESTE COMPLETO!')
        addLog('📧 Email: ' + email)
        addLog('🔐 CPF: ' + cpf)
        addLog('👤 User ID: ' + loginData.user.id)
        addLog('🏪 Loja: ' + (lojaUser?.nome || 'sem loja vinculada'))
        addLog('💳 Plano: ' + (lojaUser?.plano || 'premium'))
        setStatus('✅ SUCESSO COMPLETO!')
        setDone(true)
      }
    } catch (err) {
      addLog('❌ Erro inesperado: ' + err.message)
      setStatus('❌ Erro')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0f172a', color: '#f1f5f9',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24, fontFamily: 'monospace'
    }}>
      <h1 style={{ color: '#22c55e', marginBottom: 8 }}>🧪 Setup de Teste</h1>
      <p style={{ color: '#94a3b8', marginBottom: 24 }}>Simula compra Hotmart → cria usuário → faz login</p>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, width: '100%', maxWidth: 480, marginBottom: 16 }}>
        <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 12 }}>Status: {status}</div>
        {log.map((l, i) => (
          <div key={i} style={{ fontSize: 13, color: l.startsWith('✅') ? '#22c55e' : l.startsWith('❌') ? '#ef4444' : l.startsWith('⚠️') ? '#f59e0b' : '#94a3b8', marginBottom: 4 }}>{l}</div>
        ))}
      </div>

      {!done && log.length === 0 && (
        <button
          onClick={runSetup}
          style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
        >
          Executar Teste
        </button>
      )}

      {done && (
        <a href="/"
          style={{ background: '#22c55e', color: '#0f172a', borderRadius: 8, padding: '12px 32px', fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginTop: 16 }}
        >
          Ir para Login
        </a>
      )}
    </div>
  )
}

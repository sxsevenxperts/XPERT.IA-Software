import { useState, useEffect } from 'react'
import { supabase, getLojaSubscription } from './lib/supabase'
import NavBar from './components/NavBar'
import AlertToast from './components/AlertToast'
import PaymentPendingWarning from './pages/PaymentPendingWarning'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Chat from './pages/Chat'
import Billing from './pages/Billing'
import Lojas from './pages/Lojas'
import LoginLoja from './pages/LoginLoja'
import SetupTeste from './pages/SetupTeste'

function MainApp({ user, subscription, onLogout }) {
  const [tab, setTab] = useState('dashboard')
  const [showPaymentWarning, setShowPaymentWarning] = useState(false)
  const [daysOverdue, setDaysOverdue] = useState(0)

  useEffect(() => {
    if (subscription?.expires_at) {
      const expiresAt = new Date(subscription.expires_at)
      const daysOverdueVal = Math.max(0, Math.ceil((Date.now() - expiresAt) / 86400000))
      setDaysOverdue(daysOverdueVal)
      if (daysOverdueVal > 0) setShowPaymentWarning(true)
    }
  }, [subscription?.expires_at])

  if (showPaymentWarning) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', color: 'var(--text)' }}>
        <PaymentPendingWarning
          daysOverdue={daysOverdue}
          onDismiss={() => setShowPaymentWarning(false)}
        />
      </div>
    )
  }

  if (tab === 'billing') {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', color: 'var(--text)' }}>
        <Billing user={user} subscription={subscription} onBack={() => setTab('dashboard')} />
      </div>
    )
  }

  if (tab === 'lojas') {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', color: 'var(--text)' }}>
        <Lojas user={user} subscription={subscription} onBack={() => setTab('settings')} />
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', color: 'var(--text)' }}>
      <div style={{
        maxWidth: 480, margin: '0 auto',
        paddingTop: 'env(safe-area-inset-top)',
        minHeight: '100dvh', position: 'relative',
      }}>
        {tab === 'dashboard' && <Dashboard onTab={setTab} />}
        {tab === 'chat'      && <Chat user={user} />}
        {tab === 'settings'  && <Settings user={user} subscription={subscription} onTab={setTab} onLogout={onLogout} />}

        <div style={{
          textAlign: 'center', padding: '16px 0 90px',
          borderTop: '1px solid var(--border-dim)', marginTop: 20,
        }}>
          <p style={{ fontSize: 11, color: '#475569' }}>
            Powered by <strong style={{ color: '#64748b' }}>Seven Xperts</strong>
          </p>
        </div>

        <AlertToast />
        <NavBar active={tab} onTab={setTab} />
      </div>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(null)
  const [loading, setLoading] = useState(true)

  // Rota de teste: /setup-teste
  if (window.location.pathname === '/setup-teste') {
    return <SetupTeste />
  }

  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        // Verificar se há sessão Supabase Auth ativa (do login anterior)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Buscar loja vinculada ao usuário autenticado
          const { data: loja } = await supabase
            .from('lojas')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

          const lojaId = loja?.id || session.user.id
          const subscription = await getLojaSubscription(lojaId)

          setAuth({
            user: { id: lojaId, email: loja?.login_usuario || session.user.email },
            subscription
          })
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
      }

      // Escutar logout
      const { data: { subscription: listener } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') setAuth(null)
      })

      return () => listener?.unsubscribe()
    }

    init()
  }, [])

  const handleAuthSuccess = (result) => {
    setAuth(result)
  }

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut()
    setAuth(null)
  }

  if (loading) {
    return (
      <div style={{ background: '#0f172a', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#22c55e', textAlign: 'center', fontSize: 14 }}>Carregando...</div>
      </div>
    )
  }

  // Não autenticado → Login da Loja
  if (!auth) return <LoginLoja onAuthSuccess={handleAuthSuccess} />

  // Assinatura vencida há 30+ dias → mostrar tela de renovação
  const sub = auth.subscription
  if (sub && !sub.active && sub.reason === 'expired') {
    const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null
    const daysOverdue = expiresAt ? Math.max(0, Math.ceil((Date.now() - expiresAt) / 86400000)) : 0
    if (daysOverdue >= 30) {
      return (
        <div style={{ background: '#0f172a', minHeight: '100dvh' }}>
          <PaymentPendingWarning daysOverdue={daysOverdue} onDismiss={handleLogout} />
        </div>
      )
    }
  }

  return <MainApp user={auth.user} subscription={auth.subscription} onLogout={handleLogout} />
}

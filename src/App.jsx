import { useState, useEffect } from 'react'
import { supabase, checkSubscription, ADMIN_EMAIL } from './lib/supabase'
import NavBar from './components/NavBar'
import AlertToast from './components/AlertToast'
import Dashboard from './pages/Dashboard'
import ActiveTrip from './pages/ActiveTrip'
import History from './pages/History'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import Analytics from './pages/Analytics'
import Chat from './pages/Chat'
import Billing from './pages/Billing'
import AdminPanel from './pages/AdminPanel'
import Login, { SubscriptionExpired } from './pages/Login'
import HotmartSuccess from './pages/HotmartSuccess'
import WebhookPending from './pages/WebhookPending'
import NotificacaoAutomatica from './pages/NotificacaoAutomatica'
import { useGPS } from './hooks/useGPS'

function MainApp({ sharedRide, user, subscription, onLogout, isAdmin }) {
  const [tab, setTab] = useState('dashboard')

  // ⚡ Inicia GPS em tempo real quando app é aberto
  useGPS()

  if (tab === 'billing') {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', color: 'var(--text)' }}>
        <Billing user={user} subscription={subscription} onBack={() => setTab('dashboard')} />
      </div>
    )
  }

  if (tab === 'admin' && isAdmin) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', color: 'var(--text)' }}>
        <AdminPanel user={user} onLogout={onLogout} />
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
        {tab === 'trip'      && <ActiveTrip sharedRide={sharedRide} />}
        {tab === 'notif'     && <NotificacaoAutomatica />}
        {tab === 'history'   && <History />}
        {tab === 'stats'     && <Stats />}
        {tab === 'analytics' && <Analytics />}
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

function AppRouter() {
  const path = window.location.pathname
  if (path === '/auth/hotmart-success' || path.includes('hotmart-success')) {
    return <HotmartSuccess />
  }
  return <AppMain />
}

export default AppRouter

function AppMain() {
  const [auth, setAuth] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sharedRide, setSharedRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [waitingWebhook, setWaitingWebhook] = useState(false)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Timeout de segurança para evitar infinite loading (ex: Supabase hang)
    const loadingTimeout = setTimeout(() => {
      console.warn('[Auth] Loading timeout - forcing completion')
      setLoading(false)
    }, 5000)

    // Registrar listener SINCRONAMENTE para garantir cleanup correto
    const { data: { subscription: listener } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const sub = await checkSubscription(session.user.id)
          const isAdminUser = session.user.email === ADMIN_EMAIL
          setAuth({ user: session.user, subscription: sub })
          setIsAdmin(isAdminUser)
        } catch {
          const isAdminUser = session.user.email === ADMIN_EMAIL
          setAuth({ user: session.user, subscription: { active: false, reason: 'error' } })
          setIsAdmin(isAdminUser)
        }
      } else if (event === 'SIGNED_OUT') {
        setAuth(null)
        setIsAdmin(false)
      }
    })

    // Carregar sessão existente
    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          try {
            const sub = await checkSubscription(session.user.id)
            const isAdminUser = session.user.email === ADMIN_EMAIL
            setAuth({ user: session.user, subscription: sub })
            setIsAdmin(isAdminUser)
          } catch {
            const isAdminUser = session.user.email === ADMIN_EMAIL
            setAuth({ user: session.user, subscription: { active: false, reason: 'error' } })
            setIsAdmin(isAdminUser)
          }
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    loadSession()

    return () => {
      clearTimeout(loadingTimeout)
      listener?.unsubscribe()
    }
  }, [])

  const handleAuth = async (result) => {
    if (!result?.user) return
    const isAdminUser = result.user.email === ADMIN_EMAIL
    setIsAdmin(isAdminUser)
    // Se a subscription não veio junto (ex: login manual), busca agora
    if (!result.subscription) {
      const sub = await checkSubscription(result.user.id).catch(() => ({ active: false, reason: 'error' }))
      setAuth({ user: result.user, subscription: sub })
    } else {
      setAuth(result)
    }
  }

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
        // Limpar localStorage/sessionStorage do Supabase
        const keys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'))
        keys.forEach(k => localStorage.removeItem(k))
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setAuth(null)
      setIsAdmin(false)
    }
  }

  if (loading) {
    return <div style={{ background: '#000', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', textAlign: 'center' }}>Carregando...</div>
    </div>
  }

  if (auth === null) return <Login onAuth={handleAuth} />

  // Admin bypassa verificação de assinatura
  if (isAdmin) {
    return <AdminPanel user={auth.user} onLogout={handleLogout} />
  }

  // Se subscrição não foi encontrada (webhook pode estar em processamento)
  // Mostrar tela de aguardar webhook
  if (waitingWebhook || (auth.subscription?.reason === 'not_found')) {
    return (
      <WebhookPending
        user={auth.user}
        onSubscriptionReady={(sub) => {
          console.log('✅ Webhook confirmado! Subscr­ição:', sub)
          setWaitingWebhook(false)
          setAuth({ ...auth, subscription: sub })
        }}
      />
    )
  }

  // Bloqueia se expirada/suspensa/inativa
  const subBlocked =
    auth.subscription &&
    !auth.subscription.active &&
    auth.subscription.reason !== 'error'

  if (subBlocked) {
    return <SubscriptionExpired user={auth.user} subscription={auth.subscription} onLogout={handleLogout} />
  }

  return <MainApp sharedRide={sharedRide} user={auth.user} subscription={auth.subscription} onLogout={handleLogout} isAdmin={isAdmin} />
}

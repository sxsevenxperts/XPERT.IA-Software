import { useState, useEffect } from 'react'
import { supabase, signOut, onAuthStateChange } from './lib/supabase'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Casos from './pages/Casos'
import Calculadora from './pages/Calculadora'
import LaudosIA from './pages/LaudosIA'
import Peticoes from './pages/Peticoes'
import Jurisprudencia from './pages/Jurisprudencia'
import JuizVirtual from './pages/JuizVirtual'
import Planejamento from './pages/Planejamento'
import Financeiro from './pages/Financeiro'
import Configuracoes from './pages/Configuracoes'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  // Verificar sessão do Supabase
  useEffect(() => {
    setLoading(true)

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true)
        setUser(session.user)
      }
      setLoading(false)
    })

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true)
        setUser(session.user)
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleLogin = (supabaseUser) => {
    setUser(supabaseUser)
    setIsLoggedIn(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = async () => {
    await signOut()
    setUser(null)
    setIsLoggedIn(false)
    setCurrentPage('login')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'casos', label: 'Casos', icon: '📋' },
    { id: 'calculadora', label: 'Calculadora', icon: '🧮' },
    { id: 'laudos', label: 'Laudos com IA', icon: '🏥' },
    { id: 'peticoes', label: 'Petições IA', icon: '📄' },
    { id: 'jurisprudencia', label: 'Jurisprudência', icon: '⚖️' },
    { id: 'juiz-virtual', label: 'Juiz Virtual', icon: '🏛️' },
    { id: 'planejamento', label: 'Planejamento', icon: '📈' },
    { id: 'financeiro', label: 'Financeiro', icon: '💰' },
    { id: 'configuracoes', label: 'Configurações', icon: '⚙️' },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'clientes':
        return <Clientes />
      case 'casos':
        return <Casos />
      case 'calculadora':
        return <Calculadora />
      case 'laudos':
        return <LaudosIA />
      case 'peticoes':
        return <Peticoes />
      case 'jurisprudencia':
        return <Jurisprudencia />
      case 'juiz-virtual':
        return <JuizVirtual />
      case 'planejamento':
        return <Planejamento />
      case 'financeiro':
        return <Financeiro />
      case 'configuracoes':
        return <Configuracoes />
      default:
        return <Dashboard />
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            animation: 'spin 1s linear infinite',
          }}>⚖️</div>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Carregando PrevOS...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        menuItems={menuItems}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Header currentPage={currentPage} menuItems={menuItems} user={user} />

        {/* Page Content */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

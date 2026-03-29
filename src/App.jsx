import { useState, useEffect } from 'react'

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
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Simulated authentication
  useEffect(() => {
    const savedAuth = localStorage.getItem('prevos_auth')
    if (savedAuth) {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = () => {
    localStorage.setItem('prevos_auth', 'true')
    setIsLoggedIn(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('prevos_auth')
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
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Header currentPage={currentPage} menuItems={menuItems} />

        {/* Page Content */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

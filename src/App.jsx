import { useState, useEffect } from 'react'
import { supabase, signOut } from './lib/supabase'

// Pages
import Login           from './pages/Login'
import Dashboard       from './pages/Dashboard'
import Clientes        from './pages/Clientes'
import Casos           from './pages/Casos'
import Tarefas         from './pages/Tarefas'
import Alertas         from './pages/Alertas'
import Portais         from './pages/Portais'
import Calculadora     from './pages/Calculadora'
import LaudosIA        from './pages/LaudosIA'
import Peticoes        from './pages/Peticoes'
import Jurisprudencia  from './pages/Jurisprudencia'
import JuizVirtual     from './pages/JuizVirtual'
import Planejamento    from './pages/Planejamento'
import Financeiro      from './pages/Financeiro'
import Configuracoes   from './pages/Configuracoes'
import Agenda          from './pages/Agenda'
import Intimacoes      from './pages/Intimacoes'
import Comunicacoes    from './pages/Comunicacoes'
import Reunioes        from './pages/Reunioes'
import AssinaturaDigital from './pages/AssinaturaDigital'
import Relatorios      from './pages/Relatorios'
import AnalyticsDashboard from './pages/AnalyticsDashboard'

// Components
import Sidebar from './components/Sidebar'
import Header  from './components/Header'
import Footer  from './components/Footer'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser]             = useState(null)
  const [tab, setTab]               = useState('dashboard')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setIsLoggedIn(true); setUser(session.user) }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) { setIsLoggedIn(true); setUser(session.user) }
      else               { setIsLoggedIn(false); setUser(null) }
      setLoading(false)
    })
    return () => subscription?.unsubscribe()
  }, [])

  const handleLogin  = (u) => { setUser(u); setIsLoggedIn(true); setTab('dashboard') }
  const handleLogout = async () => { await signOut(); setUser(null); setIsLoggedIn(false) }

  const renderPage = () => {
    switch (tab) {
      case 'dashboard':         return <Dashboard        onTab={setTab} />
      case 'clientes':          return <Clientes />
      case 'casos':             return <Casos />
      case 'tarefas':           return <Tarefas />
      case 'alertas':           return <Alertas />
      case 'portais':           return <Portais />
      case 'agenda':            return <Agenda />
      case 'intimacoes':        return <Intimacoes />
      case 'comunicacoes':      return <Comunicacoes />
      case 'calculadora':       return <Calculadora />
      case 'laudos':            return <LaudosIA />
      case 'peticoes':          return <Peticoes />
      case 'jurisprudencia':    return <Jurisprudencia />
      case 'juiz-virtual':      return <JuizVirtual />
      case 'planejamento':      return <Planejamento />
      case 'financeiro':        return <Financeiro />
      case 'reunioes':          return <Reunioes />
      case 'assinatura':        return <AssinaturaDigital />
      case 'relatorios':        return <Relatorios />
      case 'analytics':         return <AnalyticsDashboard />
      case 'configuracoes':     return <Configuracoes />
      default:                  return <Dashboard onTab={setTab} />
    }
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16, animation:'spin 1s linear infinite' }}>⚖️</div>
          <p style={{ color:'var(--text3)', fontSize:14 }}>Carregando PrevOS...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) return <Login onLogin={handleLogin} />

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar tab={tab} onTab={setTab} user={user} onLogout={handleLogout} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', marginLeft:'var(--sidebar-w)' }}>
        <Header tab={tab} onNewAction={() => {}} />
        <div style={{ flex:1, overflow:'auto', background:'var(--bg)' }}>
          {renderPage()}
        </div>
        <Footer />
      </div>
    </div>
  )
}

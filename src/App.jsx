import { useState } from 'react'
import { useGPS } from './hooks/useGPS'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import ActiveTrip from './pages/ActiveTrip'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  useGPS() // GPS + segurança rodando em segundo plano continuamente

  return (
    <div style={{ background: '#0f172a', minHeight: '100dvh', color: '#f1f5f9' }}>
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        paddingTop: 'env(safe-area-inset-top)',
        minHeight: '100dvh',
        position: 'relative',
      }}>
        {tab === 'dashboard' && <Dashboard onTab={setTab} />}
        {tab === 'trip' && <ActiveTrip />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
        <NavBar active={tab} onTab={setTab} />
      </div>
    </div>
  )
}

import { Home, Navigation, Clock, BarChart2, MessageSquare, Settings } from 'lucide-react'

const tabs = [
  { id: 'dashboard', icon: Home,          label: 'Início' },
  { id: 'trip',      icon: Navigation,    label: 'Corrida' },
  { id: 'history',   icon: Clock,         label: 'Histórico' },
  { id: 'stats',     icon: BarChart2,     label: 'Stats' },
  { id: 'chat',      icon: MessageSquare, label: 'Chat' },
  { id: 'settings',  icon: Settings,      label: 'Config' },
]

export default function NavBar({ active, onTab }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: 'var(--bg2)', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {tabs.map(({ id, icon: Icon, label }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onTab(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? '#3B82F6' : 'var(--text4)',
              transition: 'color 0.15s',
              gap: 3,
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

import { LayoutDashboard, Store, MessageCircle, CreditCard, Settings } from 'lucide-react'

const tabs = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
  { id: 'lojas',     icon: Store,           label: 'Lojas' },
  { id: 'chat',      icon: MessageCircle,   label: 'Chat' },
  { id: 'billing',   icon: CreditCard,      label: 'Plano' },
  { id: 'settings',  icon: Settings,        label: 'Config' },
]

export default function NavBar({ active, onTab }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg)',
      borderTop: '1px solid var(--border-dim)',
      display: 'flex',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(({ id, icon: Icon, label }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onTab(id)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '8px 0 6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? '#22c55e' : '#64748b',
              position: 'relative',
              transition: 'color 0.15s',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400 }}>{label}</span>
            {isActive && (
              <span style={{
                position: 'absolute', bottom: 0, left: '25%', right: '25%',
                height: 2, background: '#22c55e', borderRadius: '2px 2px 0 0',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}

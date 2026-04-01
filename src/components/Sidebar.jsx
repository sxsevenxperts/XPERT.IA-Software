import {
  LayoutDashboard, Users, Briefcase, Calculator,
  Brain, TrendingUp, DollarSign, FileText,
  Settings, LogOut, Scale, Scroll, BarChart2,
  Calendar, Bell, MessageSquare, Video, PenTool,
  BookOpen, Gavel, Search, Shield, ClipboardList,
  Sparkles, CheckSquare
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'PRINCIPAL',
    items: [
      { id: 'dashboard',     label: 'Dashboard',        icon: LayoutDashboard, badge: null },
      { id: 'agenda',        label: 'Agenda & Prazos',  icon: Calendar,        badge: 'NOVO' },
      { id: 'clientes',      label: 'Clientes & CRM',   icon: Users,           badge: null },
      { id: 'casos',         label: 'Casos & Processos',icon: Briefcase,       badge: null },
      { id: 'tarefas',       label: 'Tarefas & Alertas',icon: CheckSquare,     badge: null },
      { id: 'intimacoes',    label: 'Intimações',       icon: Bell,            badge: 'NOVO' },
      { id: 'comunicacoes',  label: 'Comunicações',     icon: MessageSquare,   badge: 'NOVO' },
    ],
  },
  {
    label: 'FERRAMENTAS IA',
    items: [
      { id: 'calculadora',   label: 'Calculadora',      icon: Calculator,      badge: null },
      { id: 'laudos',        label: 'Laudos com IA',    icon: Brain,           badge: 'IA' },
      { id: 'peticoes',      label: 'Petições IA',      icon: Scroll,          badge: 'IA' },
      { id: 'jurisprudencia',label: 'Jurisprudência',   icon: BookOpen,        badge: null },
      { id: 'juiz-virtual',  label: 'Juiz Virtual',     icon: Gavel,           badge: 'IA' },
    ],
  },
  {
    label: 'GESTÃO',
    items: [
      { id: 'planejamento',  label: 'Planejamento',     icon: TrendingUp,      badge: null },
      { id: 'financeiro',    label: 'Financeiro',       icon: DollarSign,      badge: null },
      { id: 'relatorios',    label: 'Relatórios',       icon: BarChart2,       badge: null },
      { id: 'reunioes',      label: 'Reuniões Online',  icon: Video,           badge: 'NOVO' },
      { id: 'assinatura',    label: 'Assinatura Digital',icon: PenTool,        badge: 'NOVO' },
    ],
  },
]

const BADGE_STYLE = {
  'IA':   { bg: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', color: 'white' },
  'NOVO': { bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
}

export default function Sidebar({ tab, onTab, user, onLogout }) {
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD'

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 200,
    }}>
      {/* ── Logo ── */}
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
            flexShrink: 0,
          }}>
            <Scale size={20} color="white" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
              PrevOS
              <Sparkles size={11} color="#8B5CF6" />
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text3)', marginTop: -1, fontWeight: 500, lineHeight: 1.3 }}>
              Sistema Operacional Jurídico
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 9.5, fontWeight: 700, color: 'var(--text4)',
              padding: '8px 10px 4px',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}>
              {group.label}
            </div>

            {group.items.map(item => {
              const Icon   = item.icon
              const active = tab === item.id
              const bs     = item.badge ? BADGE_STYLE[item.badge] : null

              return (
                <button
                  key={item.id}
                  onClick={() => onTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: active
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.1) 100%)'
                      : 'transparent',
                    color: active ? '#93C5FD' : 'var(--text3)',
                    fontWeight: active ? 600 : 400,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: 1,
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3, height: 16,
                      background: 'var(--blue)',
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {bs && (
                    <span style={{
                      fontSize: 8.5, fontWeight: 700,
                      background: bs.bg, color: bs.color,
                      padding: '1.5px 5px', borderRadius: 4, letterSpacing: '0.4px',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}

            {gi < NAV_GROUPS.length - 1 && (
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 6px 0' }} />
            )}
          </div>
        ))}

        {/* Sistema */}
        <div>
          <div style={{
            fontSize: 9.5, fontWeight: 700, color: 'var(--text4)',
            padding: '8px 10px 4px', letterSpacing: '0.8px', textTransform: 'uppercase',
          }}>
            SISTEMA
          </div>
          <button
            onClick={() => onTab('configuracoes')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 8, border: 'none',
              background: tab === 'configuracoes' ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: tab === 'configuracoes' ? '#93C5FD' : 'var(--text3)',
              fontSize: 13, cursor: 'pointer', textAlign: 'left',
              fontWeight: tab === 'configuracoes' ? 600 : 400,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (tab !== 'configuracoes') e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { if (tab !== 'configuracoes') e.currentTarget.style.background = 'transparent' }}
          >
            <Settings size={15} strokeWidth={1.8} />
            Configurações
          </button>
        </div>
      </nav>

      {/* ── User ── */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 10px',
          background: 'var(--bg3)', borderRadius: 9, marginBottom: 4,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.user_metadata?.name || 'Advogado'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'admin@escritorio.com'}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sair"
            style={{ background: 'transparent', border: 'none', color: 'var(--text4)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text4)'}
          >
            <LogOut size={14} />
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text4)', paddingTop: 2 }}>
          PrevOS v2.0 · 2026 · Multi-Área
        </div>
      </div>
    </aside>
  )
}

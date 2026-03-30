import { Bell, Search, Plus, Calendar } from 'lucide-react'
import { useState } from 'react'

const PAGE_TITLES = {
  dashboard:    { title: 'Dashboard',             subtitle: 'Visão geral do escritório' },
  agenda:       { title: 'Agenda & Prazos',       subtitle: 'Compromissos, audiências e prazos processuais' },
  clientes:     { title: 'Clientes & CRM',        subtitle: 'Gestão completa de clientes e relacionamentos' },
  casos:        { title: 'Casos & Processos',     subtitle: 'Acompanhamento processual multi-área' },
  intimacoes:   { title: 'Intimações',            subtitle: 'Controle automático de intimações judiciais' },
  comunicacoes: { title: 'Comunicações',          subtitle: 'Mensagens e atualizações com clientes' },
  calculadora:  { title: 'Calculadora Jurídica',  subtitle: 'Cálculos para todas as áreas do Direito' },
  laudos:       { title: 'Laudos com IA',         subtitle: 'Análise inteligente de laudos e perícias' },
  peticoes:     { title: 'Petições IA',           subtitle: 'Geração automática de peças processuais' },
  jurisprudencia:{ title: 'Jurisprudência',       subtitle: 'Pesquisa e análise preditiva de decisões' },
  'juiz-virtual': { title: 'Juiz Virtual',        subtitle: 'Simulação de sentenças com IA' },
  planejamento: { title: 'Planejamento',          subtitle: 'Cenários estratégicos e viabilidade' },
  financeiro:   { title: 'Financeiro',            subtitle: 'Honorários, recebimentos e cobrança automática' },
  relatorios:   { title: 'Relatórios',            subtitle: 'Analytics, indicadores e relatórios gerenciais' },
  reunioes:     { title: 'Reuniões Online',       subtitle: 'Videoconferências com clientes e peritos' },
  assinatura:   { title: 'Assinatura Digital',    subtitle: 'Assine e gerencie contratos digitalmente' },
  configuracoes:{ title: 'Configurações',         subtitle: 'Escritório, APIs, usuários e integrações' },
}

const today = new Date()

export default function Header({ tab, onNewAction }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const page = PAGE_TITLES[tab] || PAGE_TITLES.dashboard

  const NOTIFS = [
    { id: 1, type: 'warning', text: 'Prazo em 2 dias: Caso #2341 – João Silva', time: 'há 1h' },
    { id: 2, type: 'success', text: 'Honorários recebidos: R$ 4.200 – Maria Gomes', time: 'há 3h' },
    { id: 3, type: 'info',    text: 'Intimação recebida: TRF5 – Proc. 0005432-12', time: 'há 4h' },
    { id: 4, type: 'warning', text: 'Audiência amanhã 14h: Pedro Santos – Trabalhista', time: 'há 5h' },
    { id: 5, type: 'info',    text: 'Laudo analisado IA: CID G35 – 94% confiança', time: 'ontem' },
  ]
  const notifColors = { warning: 'var(--amber)', success: 'var(--green)', info: 'var(--blue)' }

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{page.title}</h1>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{page.subtitle}</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, color: 'var(--text4)', pointerEvents: 'none' }} />
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Buscar clientes, casos, processos..."
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px 6px 30px',
            fontSize: 12.5, color: 'var(--text)', width: 240, outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 12 }}>
        <Calendar size={13} />
        <span style={{ textTransform: 'capitalize' }}>
          {today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            position: 'relative',
            background: notifOpen ? 'var(--blue-dim)' : 'var(--bg3)',
            border: '1px solid ' + (notifOpen ? 'var(--blue)' : 'var(--border)'),
            borderRadius: 8, width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text2)', transition: 'all 0.15s',
          }}
        >
          <Bell size={15} />
          <div style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--red)', border: '1.5px solid var(--bg2)',
          }} />
        </button>

        {notifOpen && (
          <div style={{
            position: 'absolute', top: 42, right: 0, width: 320,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: 'var(--shadow)', zIndex: 300, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Notificações</span>
              <span style={{ fontSize: 10, color: 'var(--blue)', cursor: 'pointer', fontWeight: 500 }}>Marcar todas como lidas</span>
            </div>
            {NOTIFS.map(n => (
              <div key={n.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: notifColors[n.type], marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{n.text}</p>
                  <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onNewAction}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)',
          color: 'white', border: 'none', borderRadius: 8,
          padding: '0 14px', height: 34, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          transition: 'opacity 0.15s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <Plus size={15} />
        Novo
      </button>
    </header>
  )
}

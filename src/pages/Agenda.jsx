import { useState } from 'react'
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, MapPin, Video, AlertTriangle, CheckCircle, Filter } from 'lucide-react'

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const events = [
  { id: 1, date: '2026-03-29', time: '09:00', type: 'audiencia',  title: 'Audiência Trabalhista',      client: 'Fernanda Oliveira',  local: 'TRT – Sala 3',             area: 'Trabalhista',    color: '#EF4444' },
  { id: 2, date: '2026-03-29', time: '14:30', type: 'reuniao',    title: 'Reunião com cliente',         client: 'João Carlos Silva',  local: 'Escritório / Zoom',        area: 'Previdenciário', color: '#3B82F6' },
  { id: 3, date: '2026-03-30', time: '10:00', type: 'prazo',      title: 'Prazo – Recurso Ordinário',   client: 'Ana Lima',           local: 'TRF-5',                    area: 'Previdenciário', color: '#F59E0B' },
  { id: 4, date: '2026-04-01', time: '15:00', type: 'pericia',    title: 'Perícia Médica INSS',         client: 'Pedro Alves Rocha',  local: 'Agência INSS Centro',      area: 'Previdenciário', color: '#8B5CF6' },
  { id: 5, date: '2026-04-02', time: '09:30', type: 'audiencia',  title: 'Audiência de Conciliação',    client: 'Carlos Melo',        local: 'CEJUSC – Sala 1',          area: 'Cível',          color: '#EF4444' },
  { id: 6, date: '2026-04-03', time: '11:00', type: 'prazo',      title: 'Prazo – Manifestação',        client: 'Maria Gomes',        local: 'e-SAJ SP',                 area: 'Família',        color: '#F59E0B' },
  { id: 7, date: '2026-04-05', time: '08:00', type: 'protocolo',  title: 'Protocolo de Petição',        client: 'Roberto Dias',       local: 'TJSP – Digital',           area: 'Consumidor',     color: '#10B981' },
  { id: 8, date: '2026-04-07', time: '16:00', type: 'reuniao',    title: 'Reunião com perito',          client: 'Sandra Costa',       local: 'Consultório Dr. Lima',     area: 'Trabalhista',    color: '#3B82F6' },
]

const typeConfig = {
  audiencia:  { label: 'Audiência',   color: '#EF4444', bg: 'var(--red-dim)',   icon: '⚖️' },
  prazo:      { label: 'Prazo',       color: '#F59E0B', bg: 'var(--amber-dim)', icon: '⏰' },
  reuniao:    { label: 'Reunião',     color: '#3B82F6', bg: 'var(--blue-dim)',  icon: '💬' },
  pericia:    { label: 'Perícia',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: '🏥' },
  protocolo:  { label: 'Protocolo',  color: '#10B981', bg: 'var(--green-dim)', icon: '📤' },
}

export default function Agenda() {
  const [viewMode, setViewMode] = useState('semana')
  const [filterArea, setFilterArea] = useState('todas')
  const [showModal, setShowModal] = useState(false)
  const today = new Date()

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const todayEvents = events.filter(e => e.date === todayStr)
  const upcomingEvents = events.filter(e => e.date > todayStr).slice(0, 6)

  const allEvents = events.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1400 }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['semana','lista'].map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: viewMode === v ? 'var(--blue)' : 'var(--bg2)',
              color: viewMode === v ? 'white' : 'var(--text2)',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {v === 'semana' ? '📅 Semana' : '📋 Lista'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{
            padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg2)', color: 'var(--text2)', fontSize: 12.5,
          }}>
            <option value="todas">Todas as áreas</option>
            <option value="Previdenciário">Previdenciário</option>
            <option value="Trabalhista">Trabalhista</option>
            <option value="Cível">Cível</option>
            <option value="Família">Família</option>
            <option value="Consumidor">Consumidor</option>
          </select>
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', background: 'linear-gradient(135deg, var(--blue), var(--purple))',
            border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={15} /> Novo Compromisso
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18 }}>

        {/* Main content */}
        <div>
          {/* Hoje */}
          {todayEvents.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>HOJE — {today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h3>
              </div>
              {todayEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          )}

          {/* Próximos eventos */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Calendar size={14} color="var(--text3)" />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)' }}>PRÓXIMOS COMPROMISSOS</h3>
            </div>
            {allEvents.filter(e => e.date >= todayStr).filter(e => filterArea === 'todas' || e.area === filterArea).map(ev => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </div>

        {/* Mini calendar + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Mini stats */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Resumo da Semana</h4>
            {[
              { icon: '⚖️', label: 'Audiências',  value: 2, color: 'var(--red)' },
              { icon: '⏰', label: 'Prazos',       value: 3, color: 'var(--amber)' },
              { icon: '💬', label: 'Reuniões',     value: 2, color: 'var(--blue)' },
              { icon: '🏥', label: 'Perícias',     value: 1, color: 'var(--purple)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{s.icon}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Quick add types */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Adicionar Rápido</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <button key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                  background: cfg.bg, border: `1px solid ${cfg.color}30`,
                  borderRadius: 9, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 15 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Integrações */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sincronizar com</h4>
            {[
              { name: 'Google Calendar', icon: '📅', status: 'Conectar' },
              { name: 'Outlook',         icon: '📧', status: 'Conectar' },
              { name: 'iCal',            icon: '🍎', status: 'Conectar' },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span>{s.icon}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{s.name}</span>
                </div>
                <button style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{s.status}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function EventCard({ ev }) {
  const cfg = typeConfig[ev.type] || typeConfig.reuniao
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 16px',
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: '0 12px 12px 0',
      marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52, paddingTop: 2 }}>
        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginTop: 3 }}>{ev.time}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{ev.title}</span>
          <span style={{ fontSize: 10, padding: '1.5px 7px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)' }}>{ev.area}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>👤 {ev.client}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text4)', marginTop: 3 }}>📍 {ev.local}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
        <span style={{ fontSize: 10.5, padding: '2px 8px', background: cfg.bg, color: cfg.color, borderRadius: 5, fontWeight: 600 }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--text4)' }}>
          {new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

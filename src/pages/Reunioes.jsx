import { useState } from 'react'
import { Video, Plus, Calendar, Clock, Users, Link, Copy, ExternalLink, Settings, Mic, MicOff, Camera, PhoneOff } from 'lucide-react'

const meetings = [
  { id: 1, title: 'Consulta Inicial – João Silva',     date: '29/03/2026', time: '14:30', duration: 60,  participants: ['João Carlos Silva'], status: 'proxima',    link: 'https://meet.google.com/abc-defg-hij', tipo: 'Google Meet', area: 'Previdenciário' },
  { id: 2, title: 'Reunião Estratégia – Ana Lima',     date: '30/03/2026', time: '10:00', duration: 45,  participants: ['Ana Beatriz Lima'],  status: 'proxima',    link: 'https://zoom.us/j/123456789',           tipo: 'Zoom',        area: 'Família' },
  { id: 3, title: 'Atualização caso – Carlos Melo',    date: '01/04/2026', time: '15:30', duration: 30,  participants: ['Carlos Eduardo'],    status: 'proxima',    link: 'https://meet.google.com/xyz-abcd-efg', tipo: 'Google Meet', area: 'Previdenciário' },
  { id: 4, title: 'Acordo pré-processual – Fernanda',  date: '25/03/2026', time: '09:00', duration: 90,  participants: ['Fernanda Oliveira'], status: 'realizada',  link: '',                                      tipo: 'Google Meet', area: 'Trabalhista' },
  { id: 5, title: 'Orientação documental – Pedro',     date: '22/03/2026', time: '11:00', duration: 45,  participants: ['Pedro Rocha'],       status: 'realizada',  link: '',                                      tipo: 'Zoom',        area: 'Cível' },
]

const integrations = [
  { name: 'Google Meet', icon: '🎥', color: '#3B82F6', connected: true },
  { name: 'Zoom',        icon: '🔵', color: '#2D8CFF', connected: true },
  { name: 'Microsoft Teams', icon: '🟣', color: '#8B5CF6', connected: false },
  { name: 'WhatsApp Video',  icon: '💚', color: '#25D366', connected: false },
]

export default function Reunioes() {
  const [tab, setTab] = useState('proximas')
  const [showNew, setShowNew] = useState(false)
  const [copied, setCopied] = useState(null)

  const proximas  = meetings.filter(m => m.status === 'proxima')
  const realizadas = meetings.filter(m => m.status === 'realizada')
  const list = tab === 'proximas' ? proximas : realizadas

  const copyLink = (id, link) => {
    navigator.clipboard?.writeText(link)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1200 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Esta semana',   value: 3, icon: '📅', color: 'var(--blue)' },
          { label: 'Este mês',      value: 8, icon: '📊', color: 'var(--purple)' },
          { label: 'Realizadas',    value: 5, icon: '✅', color: 'var(--green)' },
          { label: 'Horas online',  value: '12h', icon: '⏱️', color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        <div>
          {/* Tabs + nova reunião */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
              {['proximas', 'realizadas'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  background: tab === t ? 'var(--blue)' : 'transparent',
                  color: tab === t ? 'white' : 'var(--text3)', transition: 'all 0.15s',
                }}>
                  {t === 'proximas' ? `Próximas (${proximas.length})` : `Realizadas (${realizadas.length})`}
                </button>
              ))}
            </div>
            <button onClick={() => setShowNew(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
              background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none',
              borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={15} /> Nova Reunião
            </button>
          </div>

          {/* Lista */}
          {list.map(m => (
            <div key={m.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14,
              padding: '16px 18px', marginBottom: 10, transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{m.title}</span>
                    <span style={{ fontSize: 10, padding: '1.5px 7px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text4)' }}>{m.area}</span>
                    <span style={{ fontSize: 10, padding: '1.5px 7px', background: m.tipo === 'Zoom' ? 'rgba(45,140,255,0.12)' : 'rgba(59,130,246,0.1)', borderRadius: 4, color: m.tipo === 'Zoom' ? '#2D8CFF' : 'var(--blue)', fontWeight: 600 }}>
                      {m.tipo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
                    <span>📅 {m.date}</span>
                    <span>🕐 {m.time}</span>
                    <span>⏱ {m.duration}min</span>
                    <span>👤 {m.participants.join(', ')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {m.status === 'proxima' && m.link && (
                    <>
                      <button onClick={() => copyLink(m.id, m.link)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                        background: copied === m.id ? 'var(--green-dim)' : 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 8, fontSize: 12, color: copied === m.id ? 'var(--green)' : 'var(--text2)', cursor: 'pointer',
                      }}>
                        <Copy size={12} /> {copied === m.id ? 'Copiado!' : 'Copiar link'}
                      </button>
                      <a href={m.link} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                        background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none',
                        borderRadius: 8, fontSize: 12, color: 'white', fontWeight: 600, textDecoration: 'none',
                      }}>
                        <Video size={13} /> Entrar
                      </a>
                    </>
                  )}
                  {m.status === 'realizada' && (
                    <span style={{ fontSize: 11.5, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ✅ Concluída
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integrations + quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Plataformas</h4>
            {integrations.map(int => (
              <div key={int.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{int.icon}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{int.name}</span>
                </div>
                {int.connected ? (
                  <span style={{ fontSize: 10.5, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>● Conectado</span>
                ) : (
                  <button style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Conectar</button>
                )}
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Criar Reunião Rápida</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 9, color: '#93C5FD', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                🎥 Google Meet — Agora
              </button>
              <button style={{ padding: '10px 14px', background: 'rgba(45,140,255,0.1)', border: '1px solid rgba(45,140,255,0.25)', borderRadius: 9, color: '#2D8CFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                🔵 Zoom — Sala Pessoal
              </button>
              <button style={{ padding: '10px 14px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 9, color: '#25D366', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                💚 Enviar link WhatsApp
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Templates de Convite</h4>
            <p style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 10 }}>Envie automaticamente via WhatsApp ou e-mail.</p>
            <button style={{ width: '100%', padding: '9px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--blue)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              Gerenciar Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

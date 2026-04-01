import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare, SmartphoneIcon, Eye, Trash2, Filter } from 'lucide-react'
import { fetchNotificationLog, markNotificationAsRead } from '../lib/supabase'
import { getCurrentUser } from '../lib/supabase'

const tipoColorMap = {
  prazo: { color: 'var(--red)', bg: 'var(--red-dim)', icon: '⏰' },
  tarefa: { color: 'var(--blue)', bg: 'var(--blue-dim)', icon: '✓' },
  audiencia: { color: 'var(--amber)', bg: 'var(--amber-dim)', icon: '📅' },
  documento: { color: 'var(--purple)', bg: 'var(--purple-dim)', icon: '📄' },
  alerta: { color: 'var(--red)', bg: 'var(--red-dim)', icon: '🔔' },
}

const canalIconMap = {
  email: { Icon: Mail, label: 'Email', color: 'var(--blue)' },
  sms: { Icon: MessageSquare, label: 'SMS', color: 'var(--green)' },
  push: { Icon: Bell, label: 'Push', color: 'var(--purple)' },
  in_app: { Icon: Eye, label: 'In-app', color: 'var(--amber)' },
}

export default function NotificationCenter({ userId, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [filterCanal, setFilterCanal] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      if (userId) {
        const { data } = await fetchNotificationLog(userId, 100)
        setNotifications(data || [])
      }
      setLoading(false)
    }
    loadNotifications()
  }, [userId])

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId)
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, lido_em: new Date().toISOString() } : n
    ))
  }

  const filtered = filterCanal === 'todos' 
    ? notifications 
    : notifications.filter(n => n.canal === filterCanal)

  const naoLidos = notifications.filter(n => !n.lido_em).length

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}>
      <div className="fade-in" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 600, maxHeight: '90vh', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Central de Notificações</h3>
            {naoLidos > 0 && <p style={{ fontSize: 11, color: 'var(--amber)', marginTop: 4 }}>🔔 {naoLidos} não lida{naoLidos !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {['todos', 'email', 'sms', 'push', 'in_app'].map(c => (
            <button key={c} onClick={() => setFilterCanal(c)} style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (filterCanal === c ? 'var(--blue)' : 'var(--border)'),
              background: filterCanal === c ? 'var(--blue-dim)' : 'transparent', color: filterCanal === c ? 'var(--blue-light)' : 'var(--text2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              {c === 'todos' ? 'Todas' : canalIconMap[c]?.label || c}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
              <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Carregando notificações...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
              <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            filtered.map(notif => {
              const tipoInfo = tipoColorMap[notif.tipo] || { color: 'var(--text3)', bg: 'var(--bg3)', icon: '📌' }
              const canalInfo = canalIconMap[notif.canal]
              const CanalIcon = canalInfo?.Icon || Bell
              const lido = !!notif.lido_em

              return (
                <div key={notif.id} style={{
                  background: lido ? 'var(--bg3)' : 'var(--bg2)',
                  border: `1px solid ${lido ? 'var(--border)' : tipoInfo.color}`,
                  borderRadius: 12, padding: '14px', display: 'flex', gap: 12, alignItems: 'flex-start',
                  opacity: lido ? 0.7 : 1, transition: 'all 0.2s'
                }}>
                  <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                    {tipoInfo.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{notif.titulo}</h4>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: tipoInfo.bg, color: tipoInfo.color, fontSize: 10, fontWeight: 600, borderRadius: 4 }}>
                        {tipoInfo.icon} {notif.tipo}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                      {notif.mensagem}
                    </p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text4)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CanalIcon size={14} style={{ color: canalInfo?.color }} />
                        {canalInfo?.label || notif.canal}
                      </span>
                      <span>
                        {new Date(notif.created_at).toLocaleDateString('pt-BR')} {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {!lido && (
                      <button onClick={() => handleMarkAsRead(notif.id)} title="Marcar como lido"
                        style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: 4 }}>
                        <Eye size={14} />
                      </button>
                    )}
                    <button title="Deletar"
                      style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
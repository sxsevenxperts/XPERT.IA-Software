import { useState, useEffect } from 'react'
import { Mail, MessageSquare, Bell, Eye, Toggle2, Save } from 'lucide-react'
import { fetchNotificationSettings, updateNotificationSettings, fetchContactInfo, updateContactInfo } from '../lib/supabase'

const CANAIS = [
  { id: 'email', label: 'Email', icon: Mail, descricao: 'Notificações por email' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, descricao: 'Alertas por mensagem de texto' },
  { id: 'push', label: 'Notificações Push', icon: Bell, descricao: 'Alertas do navegador' },
  { id: 'in_app', label: 'In-app', icon: Eye, descricao: 'Notificações na plataforma' },
]

const TIPOS = [
  { id: 'prazo', label: 'Prazos Críticos', descricao: 'Alertas de prazos vencendo' },
  { id: 'tarefa', label: 'Tarefas', descricao: 'Quando tarefas vencem' },
  { id: 'audiencia', label: 'Audiências', descricao: 'Lembretes de audiências' },
  { id: 'documento', label: 'Documentos', descricao: 'Quando docs são prontos' },
  { id: 'todos', label: 'Todos os Alertas', descricao: 'Receba tudo' },
]

const FREQUENCIAS = [
  { id: 'immediate', label: 'Imediato', descricao: 'Assim que acontecer' },
  { id: '6hours', label: 'A cada 6 horas', descricao: 'Resumido 4x ao dia' },
  { id: 'daily', label: 'Diariamente', descricao: 'Um resumo por dia' },
  { id: 'weekly', label: 'Semanalmente', descricao: 'Um resumo por semana' },
]

export default function NotificationSettings({ userId, onClose }) {
  const [settings, setSettings] = useState([])
  const [contactInfo, setContactInfo] = useState({ email: '', telefone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        const { data: settingsData } = await fetchNotificationSettings(userId)
        setSettings(settingsData || [])

        const { data: contactData } = await fetchContactInfo(userId)
        if (contactData) {
          setContactInfo({ email: contactData.email, telefone: contactData.telefone })
        }
      }
      setLoading(false)
    }
    loadData()
  }, [userId])

  const handleToggleCanal = async (canal, tipoAlerta) => {
    const key = `${canal}-${tipoAlerta}`
    const existing = settings.find(s => s.canal === canal && s.tipo_alerta === tipoAlerta)
    
    if (existing) {
      const updated = { ...existing, ativo: !existing.ativo }
      setSettings(settings.map(s => (s.canal === canal && s.tipo_alerta === tipoAlerta) ? updated : s))
    } else {
      const newSetting = { canal, tipo_alerta: tipoAlerta, ativo: true, frequencia: 'immediate' }
      setSettings([...settings, newSetting])
    }
  }

  const handleFrequencyChange = (canal, tipoAlerta, frequencia) => {
    setSettings(settings.map(s => 
      (s.canal === canal && s.tipo_alerta === tipoAlerta) 
        ? { ...s, frequencia } 
        : s
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const setting of settings) {
        await updateNotificationSettings(userId, setting.canal, setting.tipo_alerta, {
          ativo: setting.ativo,
          frequencia: setting.frequencia
        })
      }

      if (contactInfo.email || contactInfo.telefone) {
        await updateContactInfo(userId, contactInfo)
      }

      alert('Configurações salvas com sucesso!')
      onClose()
    } catch (err) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const getSettingFor = (canal, tipoAlerta) => {
    return settings.find(s => s.canal === canal && s.tipo_alerta === tipoAlerta)
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Configurações de Notificações</h2>

        {/* Contact Info */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Informações de Contato</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" placeholder="seu@email.com" value={contactInfo.email} onChange={e => setContactInfo({...contactInfo, email: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text)' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Telefone (SMS)</label>
              <input type="tel" placeholder="(11) 99999-9999" value={contactInfo.telefone} onChange={e => setContactInfo({...contactInfo, telefone: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text)' }} />
            </div>
          </div>
        </div>

        {/* Canais */}
        {CANAIS.map(canal => {
          const Icon = canal.icon
          return (
            <div key={canal.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: 'var(--blue)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{canal.label}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text3)', margin: '4px 0 0 0' }}>{canal.descricao}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {TIPOS.map(tipo => {
                  const setting = getSettingFor(canal.id, tipo.id)
                  const ativo = setting?.ativo ?? true
                  const frequencia = setting?.frequencia || 'immediate'

                  return (
                    <div key={tipo.id} style={{
                      background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 12,
                      opacity: ativo ? 1 : 0.5
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <input type="checkbox" checked={ativo} onChange={() => handleToggleCanal(canal.id, tipo.id)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }} />
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{tipo.label}</label>
                          <p style={{ fontSize: 10, color: 'var(--text4)', margin: '2px 0 0 0' }}>{tipo.descricao}</p>
                        </div>
                      </div>

                      {ativo && (
                        <select value={frequencia} onChange={e => handleFrequencyChange(canal.id, tipo.id, e.target.value)}
                          style={{
                            width: '100%', padding: '6px 8px', background: 'var(--bg2)', border: '1px solid var(--border)',
                            borderRadius: 6, fontSize: 11, color: 'var(--text2)'
                          }}>
                          {FREQUENCIAS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <button onClick={onClose} disabled={saving} style={{ padding: '10px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text2)', fontSize: 13, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '10px 22px', background: 'linear-gradient(135deg, var(--blue), var(--purple))',
          border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
          boxShadow: '0 4px 14px rgba(59,130,246,0.3)', opacity: saving ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          {saving && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}
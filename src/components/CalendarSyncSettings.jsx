import { useState, useEffect } from 'react'
import { Calendar, Link2, Unlink2, Zap, RefreshCw, Trash2 } from 'lucide-react'
import { fetchCalendarIntegrations, createCalendarIntegration, deleteCalendarIntegration } from '../lib/supabase'
import { getCurrentUser } from '../lib/supabase'

const PROVIDERS = [
  { id: 'google', label: 'Google Calendar', icon: '📅', cor: 'var(--blue)' },
  { id: 'outlook', label: 'Microsoft Outlook', icon: '📆', cor: 'var(--blue)' },
  { id: 'ical', label: 'iCalendar (ICS)', icon: '📋', cor: 'var(--purple)' },
]

export default function CalendarSyncSettings({ userId, onClose }) {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const loadIntegrations = async () => {
      if (userId) {
        const { data } = await fetchCalendarIntegrations(userId)
        setIntegrations(data || [])
      }
      setLoading(false)
    }
    loadIntegrations()
  }, [userId])

  const handleConnectGoogle = async () => {
    // Simular OAuth flow do Google
    alert('Conectando ao Google Calendar... (funcionalidade completa no deploy)')
    
    // Em produção, aqui haveria:
    // 1. Redirecionar para Google OAuth
    // 2. Receber authorization code
    // 3. Trocar por access token
    // 4. Salvar em calendar_integrations
  }

  const handleConnectOutlook = async () => {
    alert('Conectando ao Outlook... (funcionalidade completa no deploy)')
  }

  const handleDisconnect = async (integrationId) => {
    if (confirm('Tem certeza que deseja desconectar este calendário?')) {
      await deleteCalendarIntegration(integrationId)
      setIntegrations(integrations.filter(i => i.id !== integrationId))
    }
  }

  const handleSync = async (integrationId) => {
    setSyncing(true)
    try {
      // Edge Function para sincronizar
      const response = await fetch('/functions/v1/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration_id: integrationId }),
      })
      
      if (response.ok) {
        alert('Sincronização iniciada com sucesso!')
        // Recarregar dados
        const { data } = await fetchCalendarIntegrations(userId)
        setIntegrations(data || [])
      }
    } catch (err) {
      alert('Erro ao sincronizar: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sincronização de Calendários</h2>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>Conecte seus calendários para sincronizar prazos, audiências e tarefas automaticamente</p>
      </div>

      {/* Integrações Disponíveis */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
        {PROVIDERS.map(provider => {
          const connected = integrations.find(i => i.provider === provider.id && i.ativo)
          
          return (
            <div key={provider.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
              padding: 16, display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{ fontSize: 24 }}>{provider.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{provider.label}</h3>
                <p style={{
                  fontSize: 12, color: connected ? 'var(--green)' : 'var(--text3)', margin: '4px 0 0 0'
                }}>
                  {connected ? `✓ Conectado em ${new Date(connected.sincronizado_em).toLocaleDateString('pt-BR')}` : 'Não conectado'}
                </p>
              </div>

              {connected ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleSync(connected.id)} disabled={syncing}
                    style={{
                      padding: '8px 14px', background: 'var(--blue-dim)', border: '1px solid var(--blue)',
                      borderRadius: 8, color: 'var(--blue-light)', fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, opacity: syncing ? 0.5 : 1
                    }}>
                    <RefreshCw size={14} />
                    Sincronizar Agora
                  </button>
                  <button onClick={() => handleDisconnect(connected.id)}
                    style={{
                      padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid var(--red)',
                      borderRadius: 8, color: 'var(--red)', fontSize: 12, cursor: 'pointer'
                    }}>
                    <Unlink2 size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => {
                  if (provider.id === 'google') handleConnectGoogle()
                  else if (provider.id === 'outlook') handleConnectOutlook()
                }}
                  style={{
                    padding: '8px 14px', background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                    border: 'none', borderRadius: 8, color: 'white', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600
                  }}>
                  <Link2 size={14} />
                  Conectar
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Configurações de Sincronização */}
      {integrations.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Configurações de Sincronização</h3>
          
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                Direção da Sincronização
              </label>
              <select defaultValue="bidirecional"
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 9, fontSize: 13, color: 'var(--text)'
                }}>
                <option value="bidirecional">Bidirecional (PrevOS ↔ Calendário)</option>
                <option value="prevos_para_externo">Apenas PrevOS → Calendário</option>
                <option value="externo_para_prevos">Apenas Calendário → PrevOS</option>
              </select>
              <p style={{ fontSize: 11, color: 'var(--text4)', margin: '6px 0 0 0' }}>Bidirecional sincroniza mudanças em ambas as direções automaticamente</p>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                Frequência de Sincronização
              </label>
              <select defaultValue="6hours"
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 9, fontSize: 13, color: 'var(--text)'
                }}>
                <option value="realtime">Em Tempo Real</option>
                <option value="1hour">A cada 1 hora</option>
                <option value="6hours">A cada 6 horas</option>
                <option value="daily">Diariamente</option>
                <option value="manual">Apenas Manual</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'var(--blue-dim)', borderRadius: 8 }}>
              <input type="checkbox" defaultChecked style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label style={{ fontSize: 12, color: 'var(--blue-light)', cursor: 'pointer', margin: 0 }}>
                Sincronizar tarefas e alertas como eventos do calendário
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'var(--green-dim)', borderRadius: 8 }}>
              <input type="checkbox" defaultChecked style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label style={{ fontSize: 12, color: 'var(--green)', cursor: 'pointer', margin: 0 }}>
                Notificar quando eventos são adicionados ao calendário externo
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
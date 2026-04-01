import { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import {
  fetchPortalIntegrations,
  createPortalIntegration,
  deletePortalIntegration,
  syncPortalProcess,
  fetchPortalSyncLog,
} from '../lib/supabase'

export default function PortalIntegrationSettings({ userId, casoId }) {
  const [integrations, setIntegrations] = useState([])
  const [syncLog, setSyncLog] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [syncing, setSyncing] = useState({})
  const [formData, setFormData] = useState({
    portal_tipo: 'trf',
    numero_processo: '',
    frequencia_sync: 'daily',
  })

  // Carregar integrações
  useEffect(() => {
    loadIntegrations()
  }, [userId])

  async function loadIntegrations() {
    setLoading(true)
    const { data, error } = await fetchPortalIntegrations(userId, casoId)
    if (!error && data) {
      setIntegrations(data)
      // Carregar log de sincronizações
      const { data: logData } = await fetchPortalSyncLog(userId)
      if (logData) setSyncLog(logData)
    }
    setLoading(false)
  }

  async function handleAddIntegration(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await createPortalIntegration(
      {
        ...formData,
        caso_id: casoId,
      },
      userId
    )

    if (!error) {
      setFormData({
        portal_tipo: 'trf',
        numero_processo: '',
        frequencia_sync: 'daily',
      })
      setShowForm(false)
      await loadIntegrations()
    }
    setLoading(false)
  }

  async function handleSync(integration) {
    setSyncing((prev) => ({ ...prev, [integration.id]: true }))

    await syncPortalProcess(
      integration.id,
      integration.portal_tipo,
      integration.numero_processo
    )

    await loadIntegrations()
    setSyncing((prev) => ({ ...prev, [integration.id]: false }))
  }

  async function handleDelete(integrationId) {
    if (
      confirm(
        'Tem certeza que deseja remover esta integração de portal judicial?'
      )
    ) {
      setLoading(true)
      await deletePortalIntegration(integrationId)
      await loadIntegrations()
      setLoading(false)
    }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'em andamento': '#3b82f6',
      'suspenso': '#f59e0b',
      'concluso': '#10b981',
      'arquivado': '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            📋 Portais Judiciais
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <Plus size={16} /> Adicionar Portal
          </button>
        </div>
      </div>

      {showForm && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e5e7eb',
          }}
        >
          <form onSubmit={handleAddIntegration}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                  }}
                >
                  Portal
                </label>
                <select
                  value={formData.portal_tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, portal_tipo: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="trf">TRF (Tribunal Regional Federal)</option>
                  <option value="inss">INSS (Instituto Nacional de Seguridade)</option>
                  <option value="cnj">CNJ (Conselho Nacional de Justiça)</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                  }}
                >
                  Número do Processo
                </label>
                <input
                  type="text"
                  placeholder="0000000-00.0000.0.00.0000"
                  value={formData.numero_processo}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_processo: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                  }}
                >
                  Frequência de Sincronização
                </label>
                <select
                  value={formData.frequencia_sync}
                  onChange={(e) =>
                    setFormData({ ...formData, frequencia_sync: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Salvando...' : 'Salvar Integração'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {integrations.length === 0 ? (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6b7280',
            border: '1px dashed #d1d5db',
          }}
        >
          <AlertCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>Nenhuma integração de portal cadastrada</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Adicione portais judiciais para rastrear processos automaticamente
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {integrations.map((integration) => {
            const lastSync = syncLog.find(
              (log) => log.integration_id === integration.id
            )

            return (
              <div
                key={integration.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        width: '40px',
                      }}
                    >
                      {integration.portal_tipo === 'trf' && '⚖️'}
                      {integration.portal_tipo === 'inss' && '🏛️'}
                      {integration.portal_tipo === 'cnj' && '📚'}
                      {integration.portal_tipo === 'outro' && '📋'}
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: '0 0 4px',
                          fontSize: '14px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        {integration.portal_tipo}
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                        {integration.numero_processo}
                      </p>
                      {lastSync && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                          Última sincronização: {new Date(lastSync.data_inicio).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleSync(integration)}
                    disabled={syncing[integration.id]}
                    title="Sincronizar agora"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      opacity: syncing[integration.id] ? 0.6 : 1,
                    }}
                  >
                    <RefreshCw size={14} />
                    {syncing[integration.id] ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                  <button
                    onClick={() => handleDelete(integration.id)}
                    title="Remover integração"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Clock, Scale3d } from 'lucide-react'
import { fetchProcessoStatus } from '../lib/supabase'

export default function ProcessStatusCard({ integrationId, casoId }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatus()
  }, [integrationId])

  async function loadStatus() {
    setLoading(true)
    const { data, error } = await fetchProcessoStatus(integrationId)
    if (!error && data) {
      setStatus(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#6b7280',
        }}
      >
        Carregando status do processo...
      </div>
    )
  }

  if (!status) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b',
        }}
      >
        <AlertCircle size={20} />
        <span style={{ fontSize: '14px' }}>Nenhum status disponível</span>
      </div>
    )
  }

  // Determine status color and icon
  const getStatusColor = (statusAtual) => {
    const mapping = {
      'em andamento': { color: '#3b82f6', icon: Clock, label: 'Em Andamento' },
      'suspenso': { color: '#f59e0b', icon: AlertCircle, label: 'Suspenso' },
      'concluso': { color: '#10b981', icon: CheckCircle2, label: 'Concluído' },
      'arquivado': { color: '#6b7280', icon: Scale3d, label: 'Arquivado' },
    }
    return mapping[statusAtual] || { color: '#6b7280', icon: Scale3d, label: statusAtual }
  }

  const statusInfo = getStatusColor(status.status_atual)
  const StatusIcon = statusInfo.icon

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informada'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: `2px solid ${statusInfo.color}`,
        overflow: 'hidden',
      }}
    >
      {/* Header with status */}
      <div
        style={{
          padding: '16px',
          backgroundColor: `${statusInfo.color}15`,
          borderBottom: `1px solid ${statusInfo.color}30`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: statusInfo.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <StatusIcon size={24} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            {statusInfo.label}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
            Processo #{status.numero_processo}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Last movement */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
              ÚLTIMA MOVIMENTAÇÃO
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#111827',
                lineHeight: '1.5',
                paddingLeft: '12px',
                borderLeft: `3px solid ${statusInfo.color}`,
              }}
            >
              {status.ultima_movimentacao}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              {formatDate(status.data_ultima_movimentacao)}
            </p>
          </div>

          {/* Phase and court */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
            }}
          >
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                FASE PROCESSUAL
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: '500' }}>
                {status.fase_processual}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                JUÍZO ATUAL
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: '500' }}>
                {status.juizo_atual}
              </p>
            </div>
          </div>

          {/* Parties and lawyers */}
          {(status.partes?.length > 0 || status.advogados?.length > 0) && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {status.partes?.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    PARTES
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '20px',
                      fontSize: '13px',
                      color: '#374151',
                      lineHeight: '1.6',
                    }}
                  >
                    {status.partes.map((parte, idx) => (
                      <li key={idx}>{parte}</li>
                    ))}
                  </ul>
                </div>
              )}

              {status.advogados?.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    ADVOGADOS
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '20px',
                      fontSize: '13px',
                      color: '#374151',
                      lineHeight: '1.6',
                    }}
                  >
                    {status.advogados.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recent events */}
          {status.eventos_ultimos_30_dias > 0 && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                borderLeft: '3px solid #10b981',
              }}
            >
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                📊 Atividade Recente
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
                {status.eventos_ultimos_30_dias} evento(s) nos últimos 30 dias
              </p>
            </div>
          )}

          {/* Sync timestamp */}
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#9ca3af',
              textAlign: 'center',
              paddingTop: '8px',
              borderTop: '1px solid #f3f4f6',
            }}
          >
            Atualizado em {formatDate(status.sincronizado_em)}
          </p>
        </div>
      </div>
    </div>
  )
}

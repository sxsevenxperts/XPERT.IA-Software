import { useState, useEffect } from 'react'
import { Scale3d } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PortalIntegrationSettings from '../components/PortalIntegrationSettings'
import ProcessStatusCard from '../components/ProcessStatusCard'

export default function Portais() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) {
      setUser(user)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
        Carregando portais judiciais...
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
        Faça login para acessar os portais judiciais
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '32px' }}>⚖️</div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Portais Judiciais</h1>
        </div>
        <p style={{ margin: '8px 0 0', color: 'var(--text3)', fontSize: '14px' }}>
          Rastreie processos judiciais em tempo real dos principais portais (TRF, INSS, CNJ)
        </p>
      </div>

      {/* Info card */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
          marginBottom: '24px',
        }}
      >
        <p style={{ margin: 0, fontSize: '13px', color: '#075985', lineHeight: '1.6' }}>
          <strong>💡 Dica:</strong> Adicione integrações com os portais judiciais para sincronizar automaticamente o status de seus processos.
          Você receberá notificações quando houver mudanças de status ou novas movimentações.
        </p>
      </div>

      {/* Portal Integration Settings */}
      <div style={{ marginBottom: '32px' }}>
        <PortalIntegrationSettings userId={user.id} />
      </div>

      {/* Process Status Cards */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>
          📊 Status dos Processos
        </h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Placeholder for process status cards - in real implementation, would load from DB */}
          <div
            style={{
              padding: '40px 20px',
              backgroundColor: 'var(--bg2)',
              borderRadius: '8px',
              textAlign: 'center',
              color: 'var(--text3)',
              border: '1px dashed var(--border)',
            }}
          >
            <Scale3d size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>
              Os status dos processos sincronizados aparecerão aqui
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>
          ❓ Dúvidas Frequentes
        </h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>
              Como funciona a sincronização?
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)', lineHeight: '1.5' }}>
              Após adicionar um portal judicial, o PrevOS sincronizará automaticamente o status do seu processo
              de acordo com a frequência definida (horária, diária ou semanal).
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>
              Quais portais são suportados?
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)', lineHeight: '1.5' }}>
              Atualmente suportamos: TRF (Tribunal Regional Federal), INSS (Instituto Nacional de Seguridade)
              e CNJ (Conselho Nacional de Justiça). Mais portais podem ser adicionados conforme necessário.
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>
              Como recebo notificações?
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)', lineHeight: '1.5' }}>
              Quando o status de um processo muda, você recebe uma notificação automática. Configure suas
              preferências de notificações em Alertas & Notificações.
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>
              Posso sincronizar manualmente?
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)', lineHeight: '1.5' }}>
              Sim! Clique no botão "Sincronizar" ao lado de cada portal integrado para forçar uma sincronização
              imediata sem esperar pela próxima sincronização agendada.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

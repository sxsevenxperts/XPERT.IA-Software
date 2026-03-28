import { AlertTriangle, Clock, Trash2, Lock } from 'lucide-react'

export default function PaymentPendingWarning({ daysOverdue, onDismiss }) {
  // Determinar status baseado em dias de atraso
  const getStatus = () => {
    if (daysOverdue >= 30) {
      return {
        icon: Trash2,
        title: 'Acesso Expirado',
        message: 'Sua assinatura foi encerrada e os dados foram removidos do sistema.',
        color: '#ef4444',
        bgColor: '#ef444410',
        borderColor: '#ef444440',
        actionText: 'Renovar Agora',
      }
    }
    if (daysOverdue >= 15) {
      return {
        icon: Lock,
        title: 'Acesso Suspenso',
        message: `Sua assinatura está ${daysOverdue} dias vencida. Acesso suspenso. Renove para recuperar.`,
        color: '#f59e0b',
        bgColor: '#f59e0b10',
        borderColor: '#f59e0b40',
        actionText: 'Renovar Agora',
      }
    }
    return {
      icon: Clock,
      title: 'Assinatura Vencida',
      message: `Sua assinatura venceu há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}. Por favor, renove para continuar usando o Smart Market.`,
      color: '#f59e0b',
      bgColor: '#f59e0b10',
      borderColor: '#f59e0b40',
      actionText: 'Renovar Agora',
    }
  }

  const status = getStatus()
  const Icon = status.icon

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 16,
    }}>
      <div style={{
        background: '#1e293b',
        border: `2px solid ${status.color}`,
        borderRadius: 20,
        padding: 32,
        maxWidth: 420,
        textAlign: 'center',
      }}>
        {/* Ícone */}
        <div style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Icon size={48} color={status.color} />
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          color: status.color,
          marginBottom: 12,
        }}>
          {status.title}
        </h1>

        {/* Mensagem */}
        <p style={{
          fontSize: 14,
          color: '#94a3b8',
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          {status.message}
        </p>

        {/* Info Box */}
        <div style={{
          background: status.bgColor,
          border: `1px solid ${status.borderColor}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}>
          <p style={{
            fontSize: 12,
            color: status.color,
            margin: 0,
            lineHeight: 1.6,
          }}>
            {daysOverdue >= 30 ? (
              <>
                <strong>⚠️ Aviso Importante:</strong> Seus dados foram removidos do sistema após 30 dias de atraso. Renove sua assinatura para restaurar o acesso.
              </>
            ) : daysOverdue >= 15 ? (
              <>
                <strong>🔒 Acesso Suspenso:</strong> Sua assinatura está vencida há {daysOverdue} dias. O acesso será permanentemente removido em {30 - daysOverdue} dia{30 - daysOverdue > 1 ? 's' : ''}.
              </>
            ) : (
              <>
                <strong>⏰ Aviso:</strong> Seu acesso será suspenso em {15 - daysOverdue} dia{15 - daysOverdue > 1 ? 's' : ''} e removido em {30 - daysOverdue} dias.
              </>
            )}
          </p>
        </div>

        {/* Botões */}
        {daysOverdue < 30 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            <button
              onClick={onDismiss}
              style={{
                padding: 12,
                background: '#334155',
                border: 'none',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
            <button
              onClick={() => window.open('https://pay.hotmart.com/L105118951H?off=rol1yfc0', '_blank')}
              style={{
                padding: 12,
                background: status.color,
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {status.actionText}
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.open('https://pay.hotmart.com/L105118951H?off=rol1yfc0', '_blank')}
            style={{
              width: '100%',
              padding: 14,
              background: '#22c55e',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Restaurar Acesso - Renovar Agora
          </button>
        )}
      </div>
    </div>
  )
}

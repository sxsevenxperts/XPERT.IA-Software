import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CreditCard, Star, CheckCircle, Calendar, ArrowLeft } from 'lucide-react'

export default function Billing({ user, subscription, onBack }) {
  const [history, setHistory] = useState([])

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await supabase.from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setHistory(data || [])
    } catch { /* silent */ }
  }, [user.id])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const isActive = subscription?.active
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null

  const features = [
    'Registro ilimitado de corridas',
    'Histórico completo',
    'Estatísticas detalhadas',
    'Chat com outros motoristas',
    'GPS e rastreamento',
    'Controle de gastos e combustível',
    'Alertas de radares',
    'Suporte prioritário',
  ]

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Assinatura</h1>
      </div>

      {/* Status card */}
      <div style={{
        background: isActive
          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        borderRadius: 16, padding: 20, color: 'white', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {isActive ? <CheckCircle size={20} /> : <CreditCard size={20} />}
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {isActive ? 'Plano Ativo' : 'Sem Assinatura Ativa'}
          </span>
        </div>
        <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
          {user.email}
        </p>
        {expiresAt && isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.85 }}>
            <Calendar size={14} />
            Válido até {expiresAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* CTA if not active */}
      {!isActive && (
        <a
          href="https://pay.hotmart.com/Q104879353L?off=j97m36gi"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white', textDecoration: 'none', borderRadius: 12, padding: '16px',
            fontSize: 16, fontWeight: 700, marginBottom: 20,
            boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
          }}
        >
          <Star size={18} fill="white" /> Assinar — R$29/mês
        </a>
      )}

      {/* Features */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 20, marginBottom: 20,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>O que está incluído</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} color="#10B981" />
              <span style={{ fontSize: 14, color: 'var(--text2)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment history */}
      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Histórico de pagamentos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(p => (
              <div key={p.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.description || 'Assinatura EasyDrive'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                  R$ {(p.amount || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

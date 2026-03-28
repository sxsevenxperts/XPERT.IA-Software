import { useState } from 'react'
import { LogIn, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react'
import PaymentPendingWarning from './PaymentPendingWarning'
import { authenticateLojaSupabase, authenticateLoja, getLojaSubscription } from '../lib/supabase'

export default function LoginLoja({ onAuthSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPaymentWarning, setShowPaymentWarning] = useState(false)
  const [daysOverdue, setDaysOverdue] = useState(0)
  const [loginData, setLoginData] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        setError('E-mail e senha são obrigatórios')
        setLoading(false)
        return
      }

      // Tentar autenticar via Supabase Auth primeiro (novo padrão)
      let loja = await authenticateLojaSupabase(email, password)

      // Fallback para autenticação customizada se Supabase Auth falhar
      if (!loja) {
        loja = await authenticateLoja(email, password)
      }

      if (!loja) {
        setError('E-mail ou senha incorretos')
        setLoading(false)
        return
      }

      // Obter status de assinatura
      const subscription = await getLojaSubscription(loja.id)

      // Calcular dias de atraso
      const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null
      const daysOverdueVal = expiresAt ? Math.max(0, Math.ceil((Date.now() - expiresAt) / 86400000)) : 0

      // Se estiver vencido, mostrar aviso
      if (daysOverdueVal > 0) {
        setDaysOverdue(daysOverdueVal)
        setLoginData({
          user: { id: loja.id, email: loja.login_usuario || email },
          subscription
        })
        setShowPaymentWarning(true)
        setLoading(false)
        return
      }

      // Sucesso - chamar callback com dados da loja
      onAuthSuccess({
        user: { id: loja.id, email: loja.login_usuario || email },
        subscription
      })
    } catch (err) {
      setError('Falha ao autenticar. Verifique suas credenciais.')
      setLoading(false)
    }
  }

  const handleDismissWarning = () => {
    setShowPaymentWarning(false)
    setDaysOverdue(0)
    setLoginData(null)
  }

  if (showPaymentWarning) {
    return <PaymentPendingWarning daysOverdue={daysOverdue} onDismiss={handleDismissWarning} />
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
          }}>
            🏪
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#f1f5f9',
            margin: '0 0 8px 0',
          }}>
            Smart Market
          </h1>
          <p style={{
            fontSize: 13,
            color: '#94a3b8',
            margin: 0,
          }}>
            Inteligência para seu Varejo
          </p>
        </div>

        {/* Card de Login */}
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#f1f5f9',
            marginBottom: 8,
          }}>
            Login da Loja
          </h2>
          <p style={{
            fontSize: 13,
            color: '#94a3b8',
            marginBottom: 24,
          }}>
            Acesse sua conta com e-mail e senha
          </p>

          {/* Erro */}
          {error && (
            <div style={{
              background: '#ef444410',
              border: '1px solid #ef444440',
              borderRadius: 12,
              padding: 12,
              marginBottom: 20,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}>
              <AlertCircle size={18} color='#ef4444' style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#ef4444' }}>
                {error}
              </span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
                E-mail da Loja
              </label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='seu@email.com'
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#f1f5f9',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>

            {/* Senha */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
                Senha
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 14px',
                    paddingRight: 40,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 10,
                    color: '#f1f5f9',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p style={{
                fontSize: 11,
                color: '#64748b',
                marginTop: 6,
              }}>
                💡 Use seu CPF/CNPJ como senha
              </p>
            </div>

            {/* Botão Login */}
            <button
              type='submit'
              disabled={loading}
              style={{
                width: '100%',
                padding: 14,
                marginTop: 8,
                background: loading ? '#334155' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.2s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Autenticando...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 14,
          padding: 16,
        }}>
          <p style={{
            fontSize: 11,
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: 0,
          }}>
            <strong style={{ color: '#64748b' }}>Primeira vez?</strong> Você recebeu um e-mail com suas credenciais após a compra.
            <br />
            <strong style={{ color: '#64748b' }}>Esqueceu a senha?</strong> Entre em contato conosco via WhatsApp.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 30,
          padding: '16px 0',
        }}>
          <p style={{
            fontSize: 10,
            color: '#475569',
            margin: 0,
          }}>
            Powered by <strong>Seven Xperts</strong>
          </p>
          <p style={{
            fontSize: 9,
            color: '#334155',
            margin: '4px 0 0 0',
          }}>
            CNPJ 32.794.007/0001-19
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

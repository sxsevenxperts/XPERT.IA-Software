import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Lock, Mail, Shield, Car, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function SubscriptionExpired({ user, subscription, onLogout }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#07101F', padding: 24,
    }}>
      <div style={{
        maxWidth: 400, width: '100%', textAlign: 'center',
        background: '#0B1829', border: '1px solid #1C3050',
        borderRadius: 20, padding: 32,
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏰</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#E8F0FE' }}>Assinatura Expirada</h2>
        <p style={{ color: '#4D7098', marginBottom: 8, fontSize: 14 }}>
          Sua assinatura expirou. Renove para continuar usando o EasyDrive.
        </p>
        <p style={{ fontSize: 12, color: '#2D4F6E', marginBottom: 24 }}>{user?.email}</p>
        <a
          href="https://pay.hotmart.com/Q104879353L?off=j97m36gi"
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'block', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white', borderRadius: 12, padding: '14px',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(16,185,129,0.35)', marginBottom: 12,
          }}
        >
          Renovar Assinatura
        </a>
        <button onClick={onLogout} style={{
          background: 'none', border: '1px solid #1C3050', borderRadius: 12,
          padding: '12px', width: '100%', fontSize: 14, color: '#4D7098', cursor: 'pointer',
        }}>
          Sair
        </button>
      </div>
    </div>
  )
}

export default function Login({ onAuth }) {
  const [perfil, setPerfil] = useState(null) // null | 'motorista' | 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Preencha email e senha.'); return }
    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError('Email ou senha incorretos.'); setLoading(false); return }
      if (data?.user) onAuth({ user: data.user, subscription: null })
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 12px 12px 42px',
    background: '#0F2035', border: '1px solid #1C3050',
    borderRadius: 10, fontSize: 15, color: '#E8F0FE', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight: '100dvh', width: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#07101F',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%)',
      padding: '32px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo oficial */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/logo.png"
            alt="EasyDrive"
            style={{
              width: 260,
              height: 'auto',
              objectFit: 'contain',
              /* Remove gradiente/fundo escuro da imagem */
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 24px rgba(16,185,129,0.5)) brightness(1.05)',
            }}
          />
        </div>

        {/* Seleção de perfil */}
        {!perfil ? (
          <div>
            <p style={{ textAlign: 'center', fontSize: 16, color: '#8BAACB', marginBottom: 20, fontWeight: 500 }}>
              Como você vai entrar?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Motorista */}
              <button
                onClick={() => setPerfil('motorista')}
                style={{
                  background: 'linear-gradient(135deg, #0B1829 0%, #0F2035 100%)',
                  border: '1px solid #1C3050',
                  borderRadius: 16, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10B981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1C3050'}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.2) 100%)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Car size={26} color="#10B981" />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#E8F0FE', marginBottom: 3 }}>Sou Motorista</div>
                  <div style={{ fontSize: 13, color: '#4D7098' }}>Acesse seu painel de corridas e ganhos</div>
                </div>
                <ArrowRight size={18} color="#4D7098" style={{ marginLeft: 'auto' }} />
              </button>

              {/* Administrador */}
              <button
                onClick={() => setPerfil('admin')}
                style={{
                  background: 'linear-gradient(135deg, #0B1829 0%, #0F2035 100%)',
                  border: '1px solid #1C3050',
                  borderRadius: 16, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3B82F6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1C3050'}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.2) 100%)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield size={26} color="#3B82F6" />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#E8F0FE', marginBottom: 3 }}>Sou Administrador</div>
                  <div style={{ fontSize: 13, color: '#4D7098' }}>Gerencie motoristas e assinaturas</div>
                </div>
                <ArrowRight size={18} color="#4D7098" style={{ marginLeft: 'auto' }} />
              </button>
            </div>

            {/* Botão Hotmart */}
            <div style={{ marginTop: 24, borderTop: '1px solid #1C3050', paddingTop: 20 }}>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#4D7098', marginBottom: 12 }}>
                Ainda não tem acesso?
              </p>
              <a
                href="https://pay.hotmart.com/Q104879353L?off=j97m36gi"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white', borderRadius: 12, padding: '14px',
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
                }}
              >
                <Star size={16} fill="white" /> Assinar EasyDrive — R$29/mês
              </a>
            </div>
          </div>

        ) : (
          /* Formulário de login */
          <div>
            {/* Indicador de perfil */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              padding: '10px 14px',
              background: perfil === 'admin' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${perfil === 'admin' ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
              borderRadius: 10,
            }}>
              {perfil === 'admin' ? <Shield size={16} color="#3B82F6" /> : <Car size={16} color="#10B981" />}
              <span style={{ fontSize: 13, fontWeight: 600, color: perfil === 'admin' ? '#3B82F6' : '#10B981' }}>
                {perfil === 'admin' ? 'Acesso Administrador' : 'Acesso Motorista'}
              </span>
              <button
                onClick={() => { setPerfil(null); setError(''); setEmail(''); setPassword('') }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#4D7098', cursor: 'pointer', fontSize: 12 }}
              >
                Trocar
              </button>
            </div>

            <div style={{
              background: '#0B1829', border: '1px solid #1C3050',
              borderRadius: 20, padding: 28,
            }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 20, color: '#E8F0FE' }}>Entrar na conta</h2>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10, padding: '11px 14px', marginBottom: 18,
                  fontSize: 13, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  ⚠ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#8BAACB', display: 'block', marginBottom: 6 }}>E-mail</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4D7098', pointerEvents: 'none' }} />
                    <input
                      type="email" placeholder="seu@email.com" value={email}
                      onChange={e => setEmail(e.target.value)} autoComplete="email"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = perfil === 'admin' ? '#3B82F6' : '#10B981'}
                      onBlur={e => e.target.style.borderColor = '#1C3050'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#8BAACB', display: 'block', marginBottom: 6 }}>Senha</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4D7098', pointerEvents: 'none' }} />
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = perfil === 'admin' ? '#3B82F6' : '#10B981'}
                      onBlur={e => e.target.style.borderColor = '#1C3050'}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4D7098', cursor: 'pointer' }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  style={{
                    marginTop: 4,
                    background: loading ? '#132540' : perfil === 'admin'
                      ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
                      : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white', border: 'none', borderRadius: 12,
                    padding: '14px', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: loading ? 'none' : perfil === 'admin'
                      ? '0 4px 16px rgba(59,130,246,0.4)'
                      : '0 4px 16px rgba(16,185,129,0.4)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? (
                    <><div style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Entrando...</>
                  ) : (
                    <>{perfil === 'admin' ? <Shield size={16} /> : <Car size={16} />} Entrar</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#2D4F6E', marginTop: 20 }}>
          Powered by <strong style={{ color: '#4D7098' }}>Seven Xperts</strong>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

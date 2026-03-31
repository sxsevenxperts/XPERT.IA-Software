import { useState } from 'react'
import { Scale, Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react'
import { signIn, supabase } from '../lib/supabase'
import Footer from '../components/Footer'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('demo@prevos.com.br')
  const [password, setPassword] = useState('demo123456')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Preencha email e senha.'); return }
    setLoading(true)

    try {
      const { data, error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message || 'Credenciais inválidas.')
        setLoading(false)
        return
      }

      if (data?.user) {
        onLogin(data.user)
      }
    } catch (err) {
      setError(err.message || 'Erro ao fazer login.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: [
        'radial-gradient(ellipse at 20% 40%, rgba(59,130,246,0.08) 0%, transparent 55%)',
        'radial-gradient(ellipse at 80% 60%, rgba(139,92,246,0.06) 0%, transparent 55%)',
      ].join(','),
      padding: '40px 20px',
    }}>
      {/* Login Card - 20% larger */}
      <div className="fade-in" style={{ width: '100%', maxWidth: 480, flex: '0 0 auto' }}>

        {/* Logo - 20% larger */}
        <div style={{ textAlign: 'center', marginBottom: 38.4 }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 16.8px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 28px rgba(59,130,246,0.4)',
          }}>
            <Scale size={36} color="white" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 33.6, fontWeight: 800, letterSpacing: '-0.72px' }}>PrevOS</h1>
          <p style={{ fontSize: 15.6, color: 'var(--text3)', marginTop: 6, maxWidth: 336, margin: '6px auto 0' }}>
            Sistema Operacional de Advocacia Inteligente
          </p>
        </div>

        {/* Card - 20% larger */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 21.6, padding: '38.4px',
          boxShadow: 'var(--shadow)',
        }}>
          <h2 style={{ fontSize: 21.6, fontWeight: 700, marginBottom: 4.8 }}>Bem-vindo de volta</h2>
          <p style={{ fontSize: 15.6, color: 'var(--text3)', marginBottom: 28.8 }}>Acesse o painel do seu escritório</p>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10.8, padding: '13.2px 16.8px', marginBottom: 21.6,
              fontSize: 15.6, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 9.6,
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16.8 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 14.4, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 7.2 }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16.8} style={{ position: 'absolute', left: 15.6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="seu@escritorio.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  style={{
                    width: '100%', padding: '13.2px 14.4px 13.2px 45.6px',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 10.8, fontSize: 16.8, color: 'var(--text)', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7.2 }}>
                <label style={{ fontSize: 14.4, fontWeight: 600, color: 'var(--text2)' }}>Senha</label>
                <button type="button" style={{ fontSize: 13.8, color: 'var(--blue)', fontWeight: 500, background: 'none', border: 'none' }}>
                  Esqueceu a senha?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16.8} style={{ position: 'absolute', left: 15.6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '13.2px 48px 13.2px 45.6px',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 10.8, fontSize: 16.8, color: 'var(--text)', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14.4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text4)' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4.8,
                background: loading ? 'var(--bg4)' : 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '15.6px', fontSize: 16.8, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9.6,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',
                transition: 'opacity 0.15s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 19.2, height: 19.2, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Entrando...
                </>
              ) : (
                <>Entrar no PrevOS <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13.2, color: 'var(--text4)', marginTop: 24 }}>
          Demo mode: qualquer e-mail + senha funciona
        </p>
      </div>

      <Footer />
    </div>
  )
}

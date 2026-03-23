import { useState, useEffect } from 'react'
import { supabase, checkSubscription, checkIsAdmin } from '../lib/supabase'
import { Lock, Mail, AlertCircle, CheckCircle, Loader, ArrowLeft, Shield, Car, Copy, Check } from 'lucide-react'

export default function Login({ onAuth }) {
  const [screen, setScreen] = useState('login') // 'login' | 'forgot' | 'sent' | 'credentials'
  const [accountType, setAccountType] = useState('driver') // 'driver' | 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const hasSupabase = !!supabase

  useEffect(() => {
    if (!hasSupabase) { setChecking(false); return }

    const tryLocalSession = () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
        const host = new URL(supabaseUrl).hostname.split('.')[0]
        const key = `sb-${host}-auth-token`
        const stored = JSON.parse(localStorage.getItem(key))
        if (stored?.access_token && stored.expires_at * 1000 > Date.now() + 60000) return stored
      } catch {}
      return null
    }

    const localSession = tryLocalSession()
    if (localSession) {
      checkSubscription(localSession.user.id).then(sub => {
        onAuth({ user: localSession.user, subscription: sub })
      }).catch(() => setChecking(false))
      return
    }

    const timeout = setTimeout(() => setChecking(false), 12000)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (session?.user) {
        const sub = await checkSubscription(session.user.id)
        onAuth({ user: session.user, subscription: sub })
      } else {
        setChecking(false)
      }
    }).catch(() => { clearTimeout(timeout); setChecking(false) })

    const { data: { subscription: listener } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const sub = await checkSubscription(session.user.id)
        onAuth({ user: session.user, subscription: sub })
      }
    })
    return () => listener.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const withTimeout = (promise, ms = 15000) =>
      Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

    try {
      const { data, error: err } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password })
      )

      if (err) {
        if (err.message === 'Invalid login credentials') {
          setError('E-mail ou senha incorretos. Verifique e tente novamente.')
        } else {
          setError(err.message)
        }
        setLoading(false)
        return
      }

      const user = data.user

      // Verificar role
      const isAdmin = user.email === 'sevenxpertssxacademy@gmail.com' || await checkIsAdmin(user.id)

      if (accountType === 'admin' && !isAdmin) {
        await supabase.auth.signOut()
        setError('Esta conta não tem acesso de administrador.')
        setLoading(false)
        return
      }

      if (accountType === 'driver' && isAdmin) {
        await supabase.auth.signOut()
        setError('Esta é uma conta admin. Selecione "Administrador" para entrar.')
        setLoading(false)
        return
      }

      // ⚠️ Se tem temp_password, é primeira vez - mostrar credenciais
      if (user.user_metadata?.temp_password) {
        setCredentials({
          email: user.email,
          password: user.user_metadata.temp_password
        })
        setShowCredentials(true)
        setLoading(false)
        return
      }

      const sub = await checkSubscription(user.id)
      onAuth({ user, subscription: sub })

    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'email') {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const handleContinue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const sub = await checkSubscription(user.id)
        onAuth({ user, subscription: sub })
      }
    } catch {
      setError('Erro ao continuar. Tente novamente.')
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!email) { setError('Digite seu e-mail primeiro'); return }
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?reset=1`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setScreen('sent')
    setLoading(false)
  }

  if (checking) {
    return (
      <div style={S.center}>
        <Loader size={32} color='#3b82f6' style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={S.wrapper}>
      {/* Modal de Credenciais */}
      {showCredentials && credentials && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000080', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 20,
            padding: '32px 24px', maxWidth: 380, width: '100%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ ...S.iconBox, background: '#10b98120' }}>
                <CheckCircle size={36} color='#10b981' />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>Bem-vindo ao EasyDrive!</h2>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                Sua conta foi criada com sucesso. Anote suas credenciais abaixo:
              </p>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>E-mail (Login)</label>
              <div style={{
                display: 'flex', gap: 10, padding: '12px 14px', background: '#111',
                border: '1px solid #2a2a2a', borderRadius: 12, alignItems: 'center'
              }}>
                <code style={{ flex: 1, color: '#f1f5f9', fontSize: 13, fontWeight: 500, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {credentials.email}
                </code>
                <button
                  type='button'
                  onClick={() => handleCopy(credentials.email, 'email')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copiedEmail ? '#10b981' : '#64748b', padding: 4
                  }}
                >
                  {copiedEmail ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={S.label}>Senha</label>
              <div style={{
                display: 'flex', gap: 10, padding: '12px 14px', background: '#111',
                border: '1px solid #2a2a2a', borderRadius: 12, alignItems: 'center'
              }}>
                <code style={{ flex: 1, color: '#f1f5f9', fontSize: 13, fontWeight: 500, fontFamily: 'monospace', letterSpacing: 1 }}>
                  {credentials.password}
                </code>
                <button
                  type='button'
                  onClick={() => handleCopy(credentials.password, 'password')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copiedPassword ? '#10b981' : '#64748b', padding: 4
                  }}
                >
                  {copiedPassword ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Aviso */}
            <div style={{
              background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: 10,
              padding: '12px 14px', marginBottom: 20
            }}>
              <p style={{ fontSize: 12, color: '#f59e0b', margin: 0, lineHeight: 1.5 }}>
                ⚠️ Guarde essas credenciais em local seguro. Não compartilhe com ninguém.
              </p>
            </div>

            <button
              type='button'
              onClick={handleContinue}
              disabled={loading}
              style={{
                ...S.btn,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                marginBottom: 10
              }}
            >
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Continuar'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 10 }}>
              Você está logado e pode entrar no app agora.
            </p>
          </div>
        </div>
      )}

      <div style={S.card}>

        {/* E-mail enviado */}
        {screen === 'sent' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ ...S.iconBox, background: '#22c55e20' }}>
                <CheckCircle size={36} color='#22c55e' />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>E-mail enviado!</h2>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                Enviamos um link de redefinição para <strong style={{ color: '#f1f5f9' }}>{email}</strong>. Verifique sua caixa de entrada.
              </p>
            </div>
            <button onClick={() => { setScreen('login'); setError('') }} style={S.btn}>
              Voltar para o login
            </button>
          </>
        )}

        {/* Esqueceu a senha */}
        {screen === 'forgot' && (
          <>
            <button onClick={() => { setScreen('login'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
              <ArrowLeft size={15} /> Voltar
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Recuperar senha</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Informe seu e-mail para receber o link de redefinição.
            </p>
            <form onSubmit={handleForgot}>
              <label style={S.label}>E-mail</label>
              <div style={S.inputWrap}>
                <Mail size={16} color='#64748b' style={S.icon} />
                <input type='email' value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder='seu@email.com' required style={S.input} />
              </div>
              {error && <Err msg={error} />}
              <button type='submit' disabled={loading} style={S.btn}>
                {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Enviar'}
              </button>
            </form>
          </>
        )}

        {/* Login */}
        {screen === 'login' && (
          <>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img src='/logo.png' alt='EasyDrive' style={{
                width: 240, height: 'auto',
                WebkitMaskImage: 'radial-gradient(ellipse 90% 88% at 50% 58%, black 65%, transparent 86%)',
                maskImage: 'radial-gradient(ellipse 90% 88% at 50% 58%, black 65%, transparent 86%)',
              }} />
            </div>

            {/* Seletor de perfil */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              <button
                type='button'
                onClick={() => { setAccountType('driver'); setError('') }}
                style={{
                  padding: '12px 8px', borderRadius: 12, border: '2px solid',
                  borderColor: accountType === 'driver' ? '#3b82f6' : '#1e293b',
                  background: accountType === 'driver' ? '#3b82f615' : '#0f172a',
                  color: accountType === 'driver' ? '#3b82f6' : '#64748b',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13,
                  transition: 'all 0.15s',
                }}
              >
                <Car size={22} />
                Motorista
              </button>
              <button
                type='button'
                onClick={() => { setAccountType('admin'); setError('') }}
                style={{
                  padding: '12px 8px', borderRadius: 12, border: '2px solid',
                  borderColor: accountType === 'admin' ? '#a855f7' : '#1e293b',
                  background: accountType === 'admin' ? '#a855f715' : '#0f172a',
                  color: accountType === 'admin' ? '#a855f7' : '#64748b',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13,
                  transition: 'all 0.15s',
                }}
              >
                <Shield size={22} />
                Administrador
              </button>
            </div>

            <form onSubmit={handleLogin}>
              <label style={S.label}>E-mail</label>
              <div style={S.inputWrap}>
                <Mail size={16} color='#64748b' style={S.icon} />
                <input type='email' value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder='seu@email.com' required style={S.input} autoComplete='email' />
              </div>

              <label style={S.label}>Senha</label>
              <div style={S.inputWrap}>
                <Lock size={16} color='#64748b' style={S.icon} />
                <input type='password' value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••' required style={S.input} autoComplete='current-password' />
              </div>

              {error && <Err msg={error} />}

              <div style={{ textAlign: 'right', marginBottom: 18, marginTop: -8 }}>
                <button type='button' onClick={() => { setScreen('forgot'); setError('') }}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                  Esqueceu a senha?
                </button>
              </div>

              <button type='submit' disabled={loading} style={{
                ...S.btn,
                background: accountType === 'admin'
                  ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              }}>
                {loading
                  ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 13 }}>Conectando...</span></>
                  : `Entrar como ${accountType === 'admin' ? 'Administrador' : 'Motorista'}`
                }
              </button>

              {loading && (
                <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 10 }}>
                  Pode demorar alguns segundos na primeira vez
                </p>
              )}
            </form>

            {accountType === 'driver' && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 20, lineHeight: 1.6 }}>
                Sem conta?{' '}
                <a href='https://wa.me/5500000000000?text=Quero+assinar+o+EasyDrive'
                  style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  Assinar agora
                </a>
              </p>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Err({ msg }) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center',
      background: '#ef444415', border: '1px solid #ef444440',
      borderRadius: 10, padding: '10px 12px', marginBottom: 14, color: '#ef4444',
    }}>
      <AlertCircle size={14} />
      <span style={{ fontSize: 13 }}>{msg}</span>
    </div>
  )
}

export function SubscriptionExpired({ user, subscription, onLogout }) {
  return (
    <div style={S.wrapper}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ ...S.iconBox, background: '#ef444420' }}>
            <AlertCircle size={36} color='#ef4444' />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>Assinatura vencida</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>{user?.email}</p>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 20, border: '1px solid #334155' }}>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
            Venceu em <strong style={{ color: '#f1f5f9' }}>
              {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('pt-BR') : '—'}
            </strong>. Renove para continuar.
          </p>
        </div>
        <button onClick={() => window.open('https://wa.me/5500000000000?text=Quero+renovar+EasyDrive', '_blank')}
          style={{ ...S.btn, background: '#25D366', marginBottom: 10 }}>
          📱 Renovar via WhatsApp
        </button>
        <button onClick={onLogout}
          style={{ width: '100%', padding: 12, background: 'none', border: '1px solid #334155', borderRadius: 12, color: '#64748b', cursor: 'pointer', fontSize: 14 }}>
          Sair da conta
        </button>
      </div>
    </div>
  )
}

const S = {
  wrapper: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#000' },
  card: { width: '100%', maxWidth: 380, background: '#0d0d0d', borderRadius: 20, padding: '32px 24px', border: '1px solid #1a1a1a' },
  center: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  iconBox: { width: 72, height: 72, background: '#3b82f620', borderRadius: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputWrap: { position: 'relative', marginBottom: 16 },
  icon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' },
  input: { width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '13px 14px 13px 42px', color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
}

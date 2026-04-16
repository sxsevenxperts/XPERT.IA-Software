import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, Eye, EyeOff, Lock, Car, ArrowRight, Shield } from 'lucide-react'

export default function HotmartSuccess() {
  const params = new URLSearchParams(window.location.search)
  const emailFromUrl = params.get('email') || ''
  const nameFromUrl  = params.get('name')  || ''
  const phoneFromUrl = params.get('phone') || ''
  const txId         = params.get('transaction_id') || ''

  const [step, setStep]         = useState(emailFromUrl ? 'create_password' : 'no_email')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  async function handleCreateAccount(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }

    setLoading(true)
    try {
      const supabaseUrl = 'https://untmxmbqgdagfqhmqyvm.supabase.co'

      const res = await fetch(`${supabaseUrl}/functions/v1/create-hotmart-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:          emailFromUrl,
          password,
          name:           nameFromUrl,
          phone:          phoneFromUrl,
          transaction_id: txId,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao criar conta')

      // Login automático com a sessão retornada
      if (data.session) {
        await supabase.auth.setSession(data.session)
      }

      setSuccess(true)

      // Redireciona após 2 segundos
      setTimeout(() => { window.location.href = '/' }, 2000)

    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '13px 14px 13px 44px',
    background: '#0F2035', border: '1px solid #1C3050',
    borderRadius: 10, fontSize: 15, color: '#E8F0FE',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  // ── Sem email na URL ──────────────────────────────────────────────────────────
  if (step === 'no_email') {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Link inválido</h2>
          <p style={{ fontSize: 14, color: '#4D7098', marginBottom: 24 }}>
            Não encontramos seu email neste link. Verifique se o link veio diretamente do Hotmart.
          </p>
          <button onClick={() => window.location.href = '/'} style={btnStyle('#10B981')}>
            Ir para o Login
          </button>
        </div>
      </div>
    )
  }

  // ── Sucesso ───────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={36} color="#10B981" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8F0FE', marginBottom: 8 }}>Conta criada!</h2>
          <p style={{ fontSize: 14, color: '#4D7098', marginBottom: 4 }}>Entrando no EasyDrive...</p>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '16px auto 0' }} />
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  // ── Criar senha ───────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo.png" alt="EasyDrive" style={{ width: 180, mixBlendMode: 'screen', filter: 'drop-shadow(0 0 16px rgba(16,185,129,0.4))' }} />
        </div>

        {/* Card */}
        <div style={{ background: '#0B1829', border: '1px solid #1C3050', borderRadius: 20, padding: 28 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px',
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Car size={26} color="#10B981" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#E8F0FE', marginBottom: 4 }}>
              Compra confirmada!
            </h2>
            <p style={{ fontSize: 13, color: '#4D7098' }}>
              Crie sua senha para acessar o EasyDrive
            </p>
          </div>

          {/* Email (readonly) */}
          <div style={{ background: '#0F2035', border: '1px solid #1C3050', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#4D7098', fontWeight: 600, marginBottom: 3 }}>SEU E-MAIL DE ACESSO</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#10B981' }}>{emailFromUrl}</div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '11px 14px', marginBottom: 16,
              fontSize: 13, color: '#FCA5A5', display: 'flex', gap: 8, alignItems: 'center',
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Senha */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#8BAACB', display: 'block', marginBottom: 6 }}>
                CRIAR SENHA
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4D7098', pointerEvents: 'none' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = '#10B981'}
                  onBlur={e => e.target.style.borderColor = '#1C3050'}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4D7098', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#8BAACB', display: 'block', marginBottom: 6 }}>
                CONFIRMAR SENHA
              </label>
              <div style={{ position: 'relative' }}>
                <Shield size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4D7098', pointerEvents: 'none' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#10B981'}
                  onBlur={e => e.target.style.borderColor = '#1C3050'}
                />
              </div>
            </div>

            {/* Indicador de força */}
            {password.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: password.length >= i * 2
                      ? (password.length >= 8 ? '#10B981' : '#F59E0B')
                      : '#1C3050',
                    transition: 'background 0.2s',
                  }} />
                ))}
                <span style={{ fontSize: 11, color: '#4D7098', marginLeft: 4, whiteSpace: 'nowrap' }}>
                  {password.length < 4 ? 'Fraca' : password.length < 8 ? 'Média' : 'Forte'}
                </span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 4,
                background: loading ? '#132540' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '15px', fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(16,185,129,0.4)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><div style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Criando conta...</>
              ) : (
                <><Car size={17} /> Criar conta e entrar <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#2D4F6E', marginTop: 16 }}>
          Powered by <strong style={{ color: '#4D7098' }}>Seven Xperts</strong>
        </p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh', width: '100%',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: '#07101F',
  backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 60%)',
  padding: '32px 0',
}

function btnStyle(color) {
  return {
    width: '100%', background: `linear-gradient(135deg, ${color} 0%, #059669 100%)`,
    color: 'white', border: 'none', borderRadius: 12, padding: '14px',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  }
}

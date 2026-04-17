import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { LogOut, Users, Zap, Activity, TrendingUp, MapPin, Plus, Copy, Check, AlertCircle } from 'lucide-react'
import { useNPSStats } from '../hooks/useNPSStats'

// ── Constants ──────────────────────────────────────────────────────────────
const PLAN_OPTIONS = {
  monthly: { label: 'Mensal (30 dias)', days: 30 },
  free: { label: 'Gratuito (365 dias)', days: 365 }
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a78bfa',
  pink: '#ec4899',
  bg: {
    primary: '#0f172a',
    card: '#1e293b',
    input: '#0f2035',
  },
  text: {
    primary: '#f1f5f9',
    muted: '#64748b',
    light: '#cbd5e1',
  },
  border: {
    primary: '#334155',
    light: '#1c3050',
  }
}

const RETRY_CONFIG = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminPanel({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', name: '', phone: '', plan: 'monthly' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const messageTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)
  const npsStats = useNPSStats()

  useEffect(() => {
    loadData()
    const interval = setInterval(() => setStats(prev => prev && { ...prev, time: new Date().toLocaleTimeString('pt-BR') }), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  const loadData = useCallback(async () => {
    await Promise.all([loadStats(), loadSubscriptions()])
  }, [])

  const showMessage = useCallback((msg, isError = false) => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    setMessage(msg)
    messageTimeoutRef.current = setTimeout(() => setMessage(''), 5000)
  }, [])

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validateForm = useCallback(() => {
    const errors = {}
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email inválido'
    }
    if (!formData.plan) errors.plan = 'Plano é obrigatório'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const loadStats = useCallback(async (attempt = 1) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString()

      const [
        { count: drivers },
        { count: subs },
        { data: activeData },
        { data: earningsData },
        { data: profilesData },
        { data: corridas },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('corridas').select('user_id').gt('started_at', fiveMinutesAgo),
        supabase.from('corridas').select('user_id, valor_total').gte('created_at', `${todayStr}T00:00:00`).lt('created_at', `${todayStr}T23:59:59`),
        supabase.from('profiles').select('id, meta_daily').gt('meta_daily', 0),
        supabase.from('corridas').select('id').gte('created_at', `${todayStr}T00:00:00`).lt('created_at', `${todayStr}T23:59:59`),
      ])

      const activeSet = new Set(activeData?.map(t => t.user_id) || [])
      const driverEarnings = {}
      earningsData?.forEach(trip => {
        driverEarnings[trip.user_id] = (driverEarnings[trip.user_id] || 0) + (trip.valor_total || 0)
      })

      let drivingGoal = 0
      profilesData?.forEach(profile => {
        if ((driverEarnings[profile.id] || 0) >= profile.meta_daily) drivingGoal++
      })

      setStats({
        drivers: drivers || 0,
        subs: subs || 0,
        driversActive: activeSet.size,
        drivingGoal,
        ridesToday: corridas?.length || 0,
        time: new Date().toLocaleTimeString('pt-BR'),
      })
    } catch (err) {
      console.error(`[Stats] Tentativa ${attempt} falhou:`, err.message)
      if (attempt < RETRY_CONFIG.maxAttempts) {
        await new Promise(r => setTimeout(r, RETRY_CONFIG.delayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1)))
        return loadStats(attempt + 1)
      }
      showMessage('⚠️ Erro ao carregar estatísticas', true)
    }
  }, [showMessage])

  const loadSubscriptions = useCallback(async (attempt = 1) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`id, user_id, status, plan, expires_at, created_at, profiles!inner(email, name)`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setSubscriptions(data || [])
    } catch (err) {
      console.error(`[Subscriptions] Tentativa ${attempt} falhou:`, err.message)
      if (attempt < RETRY_CONFIG.maxAttempts) {
        await new Promise(r => setTimeout(r, RETRY_CONFIG.delayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1)))
        return loadSubscriptions(attempt + 1)
      }
    }
  }, [])

  const handleCreateSubscription = useCallback(async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setValidationErrors({})

    try {
      abortControllerRef.current = new AbortController()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim() || 'Usuário',
          phone: formData.phone.trim() || '',
          plan: formData.plan,
          admin_id: user?.id,
        }),
        signal: abortControllerRef.current.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error?.includes('já cadastrado')) {
          setValidationErrors({ email: 'Email já cadastrado no sistema' })
          showMessage('⚠️ Email já cadastrado', true)
          return
        }
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      const message = `✅ Assinatura criada!\nEmail: ${data.user.email}\nSenha: ${data.credentials.password}\nPlano: ${PLAN_OPTIONS[formData.plan].label}`
      showMessage(message)
      setFormData({ email: '', name: '', phone: '', plan: 'monthly' })
      setShowCreateForm(false)

      await new Promise(r => setTimeout(r, 1000))
      await loadSubscriptions()
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('[CreateSubscription]:', err.message)
      showMessage(`❌ ${err.message}`, true)
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm, user?.id, showMessage, loadSubscriptions])

  const copyToClipboard = useCallback((text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(err => {
      console.error('Copy failed:', err)
      showMessage('❌ Erro ao copiar', true)
    })
  }, [showMessage])

  return (
    <div style={{
      background: COLORS.bg.primary,
      minHeight: '100dvh',
      color: COLORS.text.primary,
      padding: '20px 16px 30px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>🛡️ Admin</h1>
            <p style={{ fontSize: 13, color: COLORS.text.muted, margin: '8px 0 0 0' }}>{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Sair da conta"
            style={{
              background: `${COLORS.danger}20`,
              border: `1px solid ${COLORS.danger}40`,
              borderRadius: 10,
              padding: '10px 14px',
              color: COLORS.danger,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              ':hover': { background: `${COLORS.danger}30` }
            }}
            onMouseEnter={(e) => e.target.style.background = `${COLORS.danger}30`}
            onMouseLeave={(e) => e.target.style.background = `${COLORS.danger}20`}
          >
            <LogOut size={16} />
            Sair
          </button>
        </header>

        {/* Stats Grid */}
        {stats ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { icon: Users, color: COLORS.primary, label: 'Motoristas', value: stats.drivers },
                { icon: Activity, color: COLORS.pink, label: 'Ativos agora', value: stats.driversActive },
                { icon: TrendingUp, color: COLORS.success, label: 'Batendo meta', value: stats.drivingGoal },
                { icon: MapPin, color: COLORS.warning, label: 'Corridas hoje', value: stats.ridesToday },
                { icon: Zap, color: COLORS.info, label: 'Assinaturas', value: stats.subs },
              ].map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div key={i} style={{
                    background: COLORS.bg.card,
                    borderRadius: 14,
                    padding: 16,
                    border: `1px solid ${COLORS.border.primary}`,
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.borderColor = stat.color
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = COLORS.border.primary
                  }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Icon size={18} color={stat.color} />
                      <span style={{ fontSize: 11, color: COLORS.text.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                        {stat.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 32, fontWeight: 900, color: stat.color, margin: 0, lineHeight: 1 }}>
                      {stat.value}
                    </p>
                  </div>
                )
              })}
              <div style={{
                background: COLORS.bg.card,
                borderRadius: 14,
                padding: 16,
                border: `1px solid ${COLORS.border.primary}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>⭐</span>
                  <span style={{ fontSize: 11, color: COLORS.text.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                    Pesquisas
                  </span>
                </div>
                <p style={{ fontSize: 32, fontWeight: 900, color: COLORS.purple, margin: 0, lineHeight: 1 }}>
                  {npsStats.npsCount}
                </p>
              </div>
              <div style={{
                background: COLORS.bg.card,
                borderRadius: 14,
                padding: 16,
                border: `1px solid ${COLORS.border.primary}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>⭐</span>
                  <span style={{ fontSize: 11, color: COLORS.text.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                    Hoje
                  </span>
                </div>
                <p style={{ fontSize: 32, fontWeight: 900, color: COLORS.purple, margin: 0, lineHeight: 1 }}>
                  {npsStats.npsToday}
                </p>
              </div>
            </div>

            <button
              onClick={() => loadData()}
              style={{
                width: '100%',
                padding: 14,
                background: COLORS.primary,
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 28,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.primary
              }}
            >
              🔄 Atualizar dados
            </button>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: COLORS.text.muted,
            fontSize: 14,
          }}>
            <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 12 }}>⏳</div>
            <p>Carregando estatísticas...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Subscription Management */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.text.primary, margin: 0 }}>📋 Assinaturas</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              aria-expanded={showCreateForm}
              style={{
                background: `${COLORS.success}20`,
                border: `1px solid ${COLORS.success}40`,
                borderRadius: 8,
                padding: '9px 13px',
                color: COLORS.success,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${COLORS.success}30`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${COLORS.success}20`
              }}
            >
              <Plus size={16} />
              Nova
            </button>
          </div>

          {message && (
            <div role="alert" style={{
              background: message.includes('❌') ? `${COLORS.danger}20` : `${COLORS.success}20`,
              border: `1px solid ${message.includes('❌') ? `${COLORS.danger}40` : `${COLORS.success}40`}`,
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              fontSize: 12,
              color: message.includes('❌') ? '#fca5a5' : '#86efac',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}>
              {message.includes('❌') ? <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} /> : <Check size={16} style={{ flexShrink: 0, marginTop: 2 }} />}
              <span>{message}</span>
            </div>
          )}

          {showCreateForm && (
            <form onSubmit={handleCreateSubscription} style={{
              background: COLORS.bg.card,
              border: `1px solid ${COLORS.border.primary}`,
              borderRadius: 12,
              padding: 18,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Email Input */}
                <div>
                  <label style={{ fontSize: 11, color: COLORS.text.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (validationErrors.email) setValidationErrors({ ...validationErrors, email: null })
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: COLORS.bg.input,
                      border: validationErrors.email ? `2px solid ${COLORS.danger}` : `1px solid ${COLORS.border.light}`,
                      borderRadius: 8,
                      padding: '11px 13px',
                      color: COLORS.text.primary,
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = validationErrors.email ? COLORS.danger : COLORS.success}
                    onBlur={(e) => e.target.style.borderColor = validationErrors.email ? COLORS.danger : COLORS.border.light}
                  />
                  {validationErrors.email && <p style={{ fontSize: 11, color: COLORS.danger, margin: '6px 0 0 0' }}>⚠️ {validationErrors.email}</p>}
                </div>

                {/* Name Input */}
                <div>
                  <label style={{ fontSize: 11, color: COLORS.text.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    Nome
                  </label>
                  <input
                    type="text"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: COLORS.bg.input,
                      border: `1px solid ${COLORS.border.light}`,
                      borderRadius: 8,
                      padding: '11px 13px',
                      color: COLORS.text.primary,
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.success}
                    onBlur={(e) => e.target.style.borderColor = COLORS.border.light}
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <label style={{ fontSize: 11, color: COLORS.text.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="11 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: COLORS.bg.input,
                      border: `1px solid ${COLORS.border.light}`,
                      borderRadius: 8,
                      padding: '11px 13px',
                      color: COLORS.text.primary,
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.success}
                    onBlur={(e) => e.target.style.borderColor = COLORS.border.light}
                  />
                </div>

                {/* Plan Select */}
                <div>
                  <label style={{ fontSize: 11, color: COLORS.text.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    Plano *
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: COLORS.bg.input,
                      border: `1px solid ${COLORS.border.light}`,
                      borderRadius: 8,
                      padding: '11px 13px',
                      color: COLORS.text.primary,
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.success}
                    onBlur={(e) => e.target.style.borderColor = COLORS.border.light}
                  >
                    {Object.entries(PLAN_OPTIONS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: loading ? COLORS.border.primary : COLORS.success,
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#059669')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.background = COLORS.success)}
                  >
                    {loading ? '⏳ Criando...' : '✅ Criar Assinatura'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    style={{
                      flex: 1,
                      background: COLORS.border.primary,
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px',
                      color: COLORS.text.light,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#475569'}
                    onMouseLeave={(e) => e.currentTarget.style.background = COLORS.border.primary}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Subscriptions List */}
          <div style={{ maxHeight: 450, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {subscriptions.length === 0 ? (
              <div style={{
                background: COLORS.bg.card,
                border: `1px solid ${COLORS.border.primary}`,
                borderRadius: 12,
                padding: 32,
                textAlign: 'center',
                color: COLORS.text.muted,
                fontSize: 13,
              }}>
                <p style={{ margin: 0, marginBottom: 4 }}>📭 Nenhuma assinatura</p>
                <p style={{ margin: 0, fontSize: 11 }}>Crie uma nova para começar</p>
              </div>
            ) : (
              subscriptions.map((sub, idx) => {
                const expiresDate = new Date(sub.expires_at)
                const daysLeft = Math.ceil((expiresDate - new Date()) / (1000 * 60 * 60 * 24))
                const isExpired = daysLeft < 0
                const isWarning = daysLeft < 7

                return (
                  <div key={sub.id} style={{
                    background: COLORS.bg.card,
                    border: `1px solid ${isExpired ? COLORS.danger : isWarning ? COLORS.warning : COLORS.border.primary}20`,
                    borderRadius: 10,
                    padding: 13,
                    marginBottom: idx === subscriptions.length - 1 ? 0 : 8,
                    fontSize: 12,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isExpired ? COLORS.danger : isWarning ? COLORS.warning : COLORS.border.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${isExpired ? COLORS.danger : isWarning ? COLORS.warning : COLORS.border.primary}20`
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: COLORS.text.primary, fontWeight: 700, wordBreak: 'break-word', fontSize: 13 }}>
                          {sub.profiles?.email}
                        </p>
                        <p style={{ margin: '5px 0 0 0', color: COLORS.text.muted, fontSize: 11 }}>
                          {sub.profiles?.name ? sub.profiles.name + ' • ' : ''}{sub.plan === 'monthly' ? '📅 Mensal' : '🎁 Gratuito'}
                        </p>
                        <p style={{
                          margin: '6px 0 0 0',
                          padding: '4px 8px',
                          background: isExpired ? `${COLORS.danger}20` : isWarning ? `${COLORS.warning}20` : `${COLORS.success}20`,
                          color: isExpired ? COLORS.danger : isWarning ? COLORS.warning : COLORS.success,
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          width: 'fit-content',
                        }}>
                          {isExpired ? `❌ Expirado há ${Math.abs(daysLeft)} dias` : `✅ ${daysLeft} dias restantes`}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(sub.id, sub.id)}
                        title="Copiar ID"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedId === sub.id ? COLORS.success : COLORS.text.muted,
                          cursor: 'pointer',
                          padding: 6,
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = copiedId === sub.id ? COLORS.success : COLORS.primary
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = copiedId === sub.id ? COLORS.success : COLORS.text.muted
                        }}
                      >
                        {copiedId === sub.id ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          background: COLORS.bg.card,
          borderRadius: 12,
          padding: 14,
          border: `1px solid ${COLORS.border.primary}`,
          fontSize: 11,
          color: COLORS.text.muted,
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>✅ Painel operacional</p>
          <p style={{ margin: '6px 0 0 0', fontSize: 10 }}>{stats?.time}</p>
        </footer>
      </div>
    </div>
  )
}


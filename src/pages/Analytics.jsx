import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Clock, Zap } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const PERIODS = [
  { id: '30d',  label: '30 dias', days: 30 },
  { id: '90d',  label: '90 dias', days: 90 },
  { id: '6mo',  label: '6 meses', days: 180 },
  { id: '1yr',  label: '1 ano',   days: 365 },
]

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PLATFORM_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']

const fmtBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function Analytics() {
  const [period, setPeriod] = useState('30d')
  const [corridas, setCorridas] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  const days = PERIODS.find(p => p.id === period)?.days || 30

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceISO = since.toISOString()

      const [cRes, eRes] = await Promise.all([
        supabase.from('corridas').select('*')
          .eq('user_id', user.id).eq('status', 'concluida')
          .gte('created_at', sinceISO)
          .order('created_at', { ascending: true }),
        supabase.from('expenses').select('*')
          .eq('user_id', user.id).gte('date', sinceISO.split('T')[0]),
      ])

      if (!mounted) return
      setCorridas(cRes.data || [])
      setExpenses(eRes.data || [])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [days])

  // ────── Revenue trend by day ──────
  const revenueTrend = useMemo(() => {
    const map = new Map()
    corridas.forEach(c => {
      const d = new Date(c.created_at).toISOString().split('T')[0]
      map.set(d, (map.get(d) || 0) + Number(c.valor_total || 0))
    })
    const exMap = new Map()
    expenses.forEach(e => {
      const d = e.date
      exMap.set(d, (exMap.get(d) || 0) + Number(e.amount || e.valor || 0))
    })
    const allDates = [...new Set([...map.keys(), ...exMap.keys()])].sort()
    return allDates.map(d => ({
      date: d.slice(5).replace('-', '/'),
      receita: Number((map.get(d) || 0).toFixed(2)),
      despesa: Number((exMap.get(d) || 0).toFixed(2)),
      lucro:   Number(((map.get(d) || 0) - (exMap.get(d) || 0)).toFixed(2)),
    }))
  }, [corridas, expenses])

  // ────── Workload by day of week ──────
  const workloadByDOW = useMemo(() => {
    const counts = Array(7).fill(0)
    const earnings = Array(7).fill(0)
    corridas.forEach(c => {
      const dow = new Date(c.created_at).getDay()
      counts[dow] += 1
      earnings[dow] += Number(c.valor_total || 0)
    })
    return DAYS_OF_WEEK.map((label, i) => ({
      dia: label,
      corridas: counts[i],
      ganhos: Number(earnings[i].toFixed(2)),
    }))
  }, [corridas])

  // ────── Platform breakdown ──────
  const platformBreakdown = useMemo(() => {
    const map = new Map()
    corridas.forEach(c => {
      const p = c.platform || c.plataforma || 'Outra'
      map.set(p, (map.get(p) || 0) + Number(c.valor_total || 0))
    })
    return [...map.entries()]
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  }, [corridas])

  // ────── KPIs ──────
  const kpis = useMemo(() => {
    const totalReceita = corridas.reduce((s, c) => s + Number(c.valor_total || 0), 0)
    const totalDespesa = expenses.reduce((s, e) => s + Number(e.amount || e.valor || 0), 0)
    const totalCorridas = corridas.length
    const media = totalCorridas > 0 ? totalReceita / totalCorridas : 0
    const lucro = totalReceita - totalDespesa
    const margem = totalReceita > 0 ? (lucro / totalReceita) * 100 : 0
    return { totalReceita, totalDespesa, totalCorridas, media, lucro, margem }
  }, [corridas, expenses])

  // ────── Peak hour ──────
  const peakHour = useMemo(() => {
    const hours = Array(24).fill(0)
    corridas.forEach(c => { hours[new Date(c.created_at).getHours()] += 1 })
    const max = Math.max(...hours)
    return { hour: hours.indexOf(max), count: max }
  }, [corridas])

  // ────── Insights ──────
  const insights = useMemo(() => {
    const out = []
    if (workloadByDOW.length > 0) {
      const best = [...workloadByDOW].sort((a, b) => b.ganhos - a.ganhos)[0]
      if (best.ganhos > 0) out.push(`📈 Seu melhor dia é **${best.dia}** (${fmtBRL(best.ganhos)})`)
    }
    if (peakHour.count > 0) {
      out.push(`⏰ Seu pico de corridas é às **${String(peakHour.hour).padStart(2, '0')}:00h** (${peakHour.count} corridas)`)
    }
    if (platformBreakdown.length > 0) {
      const top = platformBreakdown[0]
      out.push(`🚗 Plataforma com maior receita: **${top.name}** (${fmtBRL(top.value)})`)
    }
    if (kpis.margem > 0) {
      const sign = kpis.margem >= 30 ? '💚' : kpis.margem >= 15 ? '💛' : '🔴'
      out.push(`${sign} Margem de lucro: **${kpis.margem.toFixed(1)}%**`)
    }
    return out
  }, [workloadByDOW, peakHour, platformBreakdown, kpis])

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)' }}>
        <div className="spinning" style={{ display: 'inline-block', fontSize: 32 }}>⚡</div>
        <p style={{ marginTop: 12 }}>Carregando analytics...</p>
      </div>
    )
  }

  if (corridas.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Analytics</h1>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 40, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Sem dados ainda</h3>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>
            Complete algumas corridas para ver suas análises e previsões aqui.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Analytics</h1>
        <Zap size={20} color="var(--amber)" />
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto' }}>
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: 'none', whiteSpace: 'nowrap',
              background: period === p.id ? 'var(--blue)' : 'var(--bg3)',
              color: period === p.id ? 'white' : 'var(--text2)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <KPI icon={DollarSign} label="Receita"  value={fmtBRL(kpis.totalReceita)} color="#10B981" />
        <KPI icon={TrendingDown} label="Despesa" value={fmtBRL(kpis.totalDespesa)} color="#EF4444" />
        <KPI icon={TrendingUp} label="Lucro"    value={fmtBRL(kpis.lucro)}        color={kpis.lucro >= 0 ? '#10B981' : '#EF4444'} />
        <KPI icon={Calendar}   label="Corridas" value={kpis.totalCorridas}        color="#3B82F6" />
      </div>

      {/* Revenue trend */}
      <Section title="📈 Receita x Despesa x Lucro">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueTrend}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--text3)" fontSize={11} />
            <YAxis stroke="var(--text3)" fontSize={11} />
            <Tooltip
              contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => fmtBRL(v)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={2} dot={false} name="Receita" />
            <Line type="monotone" dataKey="despesa" stroke="#EF4444" strokeWidth={2} dot={false} name="Despesa" />
            <Line type="monotone" dataKey="lucro"   stroke="#3B82F6" strokeWidth={2} dot={false} name="Lucro" />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {/* Workload by day of week */}
      <Section title="📅 Carga por dia da semana">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workloadByDOW}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="dia" stroke="var(--text3)" fontSize={11} />
            <YAxis stroke="var(--text3)" fontSize={11} />
            <Tooltip
              contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(v, name) => name === 'ganhos' ? fmtBRL(v) : v}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="corridas" fill="#3B82F6" name="Corridas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ganhos"   fill="#10B981" name="Ganhos (R$)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Platform breakdown */}
      {platformBreakdown.length > 0 && (
        <Section title="🚗 Receita por plataforma">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={platformBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={75}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={11}
              >
                {platformBreakdown.map((_, i) => (
                  <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => fmtBRL(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* Insights */}
      <Section title="💡 Insights">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map((txt, i) => (
            <div key={i} style={{
              padding: '12px 14px', background: 'var(--bg3)',
              borderRadius: 10, fontSize: 13, lineHeight: 1.5, color: 'var(--text2)',
            }}
              dangerouslySetInnerHTML={{ __html: txt.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>') }}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}

function KPI({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 16, marginBottom: 14,
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  )
}

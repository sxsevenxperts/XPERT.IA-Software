import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Users, Briefcase, DollarSign, TrendingUp, AlertTriangle,
  Clock, CheckCircle, ArrowUpRight, ArrowDownRight, Brain,
  FileText, Calendar, ChevronRight
} from 'lucide-react'

/* ── Mock data ── */
const revenueData = [
  { mes: 'Out', receita: 18400, honorarios: 12000 },
  { mes: 'Nov', receita: 24200, honorarios: 15800 },
  { mes: 'Dez', receita: 19800, honorarios: 13200 },
  { mes: 'Jan', receita: 31500, honorarios: 22000 },
  { mes: 'Fev', receita: 28700, honorarios: 19400 },
  { mes: 'Mar', receita: 36200, honorarios: 26800 },
]

const benefitTypes = [
  { name: 'Aposentadoria',  value: 38, color: '#3B82F6' },
  { name: 'BPC/Loas',       value: 24, color: '#8B5CF6' },
  { name: 'Aux. Incapac.',  value: 18, color: '#10B981' },
  { name: 'Revisão',        value: 12, color: '#F59E0B' },
  { name: 'Especial',       value: 8,  color: '#06B6D4' },
]

const urgentCases = [
  { id: 'PRV-0342', client: 'João Carlos Silva', type: 'Aposentadoria por Idade', status: 'Prazo 2 dias', urgency: 'critical', valor: 'R$ 4.200' },
  { id: 'PRV-0389', client: 'Maria Aparecida Costa', type: 'BPC/Loas Idoso', status: 'Prazo 5 dias', urgency: 'warning', valor: 'R$ 1.412' },
  { id: 'PRV-0401', client: 'Pedro Alves Rocha', type: 'Auxílio-Doença', status: 'Aguardando laudo', urgency: 'info', valor: 'R$ 2.800' },
  { id: 'PRV-0378', client: 'Ana Beatriz Lima', type: 'Revisão do Teto', status: 'Em recurso', urgency: 'info', valor: 'R$ 6.500' },
  { id: 'PRV-0355', client: 'Carlos Eduardo Melo', type: 'Aposent. Especial', status: 'Documentação ok', urgency: 'success', valor: 'R$ 3.700' },
]

const recentActivity = [
  { icon: '🧠', text: 'Laudo analisado com IA — CID G35.0 — 94% viabilidade', time: 'há 40min', color: 'var(--purple)' },
  { icon: '✅', text: 'Benefício aprovado: João Silva — Aposent. Programada', time: 'há 2h', color: 'var(--green)' },
  { icon: '💰', text: 'Honorários recebidos: R$ 4.200 — Maria Gomes', time: 'há 3h', color: 'var(--green)' },
  { icon: '📄', text: 'Petição gerada automaticamente — BPC Loas #0389', time: 'há 5h', color: 'var(--blue)' },
  { icon: '⚠️', text: 'Prazo em 2 dias — Caso #0342 — atenção necessária', time: 'ontem', color: 'var(--amber)' },
]

function KpiCard({ icon: Icon, label, value, sub, trend, trendUp, color }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
      flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: color + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 600,
            color: trendUp ? 'var(--green)' : 'var(--red)',
          }}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--text4)' }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginTop: 2 }}>
          {p.name}: R$ {p.value.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard({ onTab }) {
  const urgencyStyle = {
    critical: { bg: 'var(--red-dim)',    color: 'var(--red)',    label: 'Crítico' },
    warning:  { bg: 'var(--amber-dim)',  color: 'var(--amber)',  label: 'Urgente' },
    info:     { bg: 'var(--blue-dim)',   color: 'var(--blue)',   label: 'Em curso' },
    success:  { bg: 'var(--green-dim)',  color: 'var(--green)',  label: 'Pronto' },
  }

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1400 }}>

      {/* ── KPI Row ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <KpiCard icon={Users}      label="Clientes Ativos"    value="127"        sub="12 novos este mês"    trend="+9%"  trendUp color="var(--blue)" />
        <KpiCard icon={Briefcase}  label="Casos em Andamento" value="84"         sub="18 aguardando prazo"  trend="+5%"  trendUp color="var(--purple)" />
        <KpiCard icon={DollarSign} label="Honorários a Receber" value="R$ 92.4k" sub="32 faturas abertas"  trend="+18%" trendUp color="var(--green)" />
        <KpiCard icon={TrendingUp} label="Taxa de Êxito"      value="87,3%"      sub="últimos 12 meses"    trend="+2.1%" trendUp color="var(--amber)" />
      </div>

      {/* ── Row 2: Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: 22 }}>

        {/* Revenue Chart */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Receita & Honorários</h3>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Últimos 6 meses</p>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--blue)' }} /> Receita total
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)' }} /> Honorários êxito
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text4)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="receita"    name="Receita"    stroke="#3B82F6" strokeWidth={2} fill="url(#gradBlue)"  dot={false} />
              <Area type="monotone" dataKey="honorarios" name="Honorários" stroke="#10B981" strokeWidth={2} fill="url(#gradGreen)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Benefit types pie */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Tipos de Benefício</h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Distribuição atual</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={benefitTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {benefitTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => [`${v}%`, '']} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {benefitTypes.map(b => (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{b.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{b.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Cases + Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>

        {/* Urgent cases */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Casos que Precisam de Atenção</h3>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Prazos, pendências e prioridades</p>
            </div>
            <button onClick={() => onTab('casos')} style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {urgentCases.map(c => {
              const s = urgencyStyle[c.urgency]
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px',
                  background: 'var(--bg3)', borderRadius: 10,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', minWidth: 72 }}>{c.id}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.client}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 1 }}>{c.type}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px',
                    background: s.bg, color: s.color, borderRadius: 6, whiteSpace: 'nowrap',
                  }}>
                    {c.status}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', minWidth: 70, textAlign: 'right' }}>{c.valor}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Atividade Recente</h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Últimas ações do sistema</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{a.text}</p>
                  <p style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 3 }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Novo Cliente', icon: '👤', tab: 'clientes', color: 'var(--blue)' },
          { label: 'Calcular Benefício', icon: '🧮', tab: 'calculadora', color: 'var(--purple)' },
          { label: 'Analisar Laudo', icon: '🧠', tab: 'laudos', color: 'var(--cyan)' },
          { label: 'Gerar Petição', icon: '📄', tab: 'peticoes', color: 'var(--green)' },
          { label: 'Ver Financeiro', icon: '💰', tab: 'financeiro', color: 'var(--amber)' },
        ].map(a => (
          <button key={a.tab} onClick={() => onTab(a.tab)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 16px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 9, fontSize: 13, color: 'var(--text2)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
          >
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

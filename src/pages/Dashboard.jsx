import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  Users, Briefcase, DollarSign, TrendingUp, AlertTriangle,
  CheckCircle, ArrowUpRight, ArrowDownRight, Brain,
  Calendar, ChevronRight, Bell, Clock, Sparkles, Scale, CheckSquare
} from 'lucide-react'

const revenueData = [
  { mes: 'Out', receita: 28400, honorarios: 18000 },
  { mes: 'Nov', receita: 34200, honorarios: 22800 },
  { mes: 'Dez', receita: 29800, honorarios: 19200 },
  { mes: 'Jan', receita: 41500, honorarios: 29000 },
  { mes: 'Fev', receita: 38700, honorarios: 25400 },
  { mes: 'Mar', receita: 52200, honorarios: 36800 },
]

const areaDistrib = [
  { name: 'Previdenciário', value: 34, color: '#3B82F6' },
  { name: 'Trabalhista',    value: 22, color: '#8B5CF6' },
  { name: 'Cível',          value: 16, color: '#10B981' },
  { name: 'Família',        value: 11, color: '#F59E0B' },
  { name: 'Consumidor',     value: 9,  color: '#06B6D4' },
  { name: 'Outros',         value: 8,  color: '#6B7280' },
]

const urgentCases = [
  { id: 'PRV-0342', client: 'João Carlos Silva',     type: 'Aposentadoria por Idade',   area: 'Previdenciário', status: 'Prazo 2 dias',      urgency: 'critical', valor: 'R$ 4.200' },
  { id: 'TRB-0189', client: 'Fernanda Oliveira',     type: 'Reclamação Trabalhista',    area: 'Trabalhista',    status: 'Audiência amanhã',  urgency: 'critical', valor: 'R$ 8.500' },
  { id: 'CVL-0401', client: 'Pedro Alves Rocha',     type: 'Indenização por Danos',     area: 'Cível',          status: 'Aguardando laudo',  urgency: 'warning',  valor: 'R$ 12.000' },
  { id: 'FAM-0378', client: 'Ana Beatriz Lima',      type: 'Divórcio Litigioso',        area: 'Família',        status: 'Mediação marcada',  urgency: 'info',     valor: 'R$ 3.800' },
  { id: 'PRV-0355', client: 'Carlos Eduardo Melo',   type: 'Aposent. Especial',         area: 'Previdenciário', status: 'Documentação ok',   urgency: 'success',  valor: 'R$ 3.700' },
]

const recentActivity = [
  { icon: '🧠', text: 'Laudo analisado com IA — CID G35.0 — 94% viabilidade BPC', time: 'há 40min' },
  { icon: '🔔', text: 'Intimação recebida: TRF5 Proc. 0005432-12 — Prazo 5 dias', time: 'há 1h' },
  { icon: '✅', text: 'Sentença favorável: Fernanda Oliveira — Trabalhista #0189', time: 'há 2h' },
  { icon: '💰', text: 'Honorários recebidos: R$ 8.500 — Maria Gomes', time: 'há 3h' },
  { icon: '📄', text: 'Petição gerada automaticamente — Divórcio #FAM-0378', time: 'há 5h' },
]

const deadlines = [
  { date: 'Hoje',    text: 'Audiência – TRT – Fernanda Oliveira', type: 'audiencia' },
  { date: 'Amanhã',  text: 'Prazo recursal – TRF5 – João Silva', type: 'prazo' },
  { date: '01 Abr',  text: 'Protocolo petição – INSS – Ana Lima', type: 'protocolo' },
  { date: '03 Abr',  text: 'Pericia médica – Pedro Rocha – INSS', type: 'pericia' },
]

function KpiCard({ icon: Icon, label, value, sub, trend, trendUp, color }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '18px',
      flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: trendUp ? 'var(--green)' : 'var(--red)' }}>
            {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text4)' }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginTop: 2 }}>{p.name}: R$ {p.value.toLocaleString('pt-BR')}</p>
      ))}
    </div>
  )
}

const deadlineColors = {
  audiencia: 'var(--red)', prazo: 'var(--amber)', protocolo: 'var(--blue)', pericia: 'var(--purple)'
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

      {/* ── Boas-vindas ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 22,
      }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Scale size={22} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Bom dia, Advogado! <span style={{ fontSize: 14 }}>👋</span></div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Você tem <strong style={{ color: 'var(--amber)' }}>3 prazos críticos</strong> esta semana e <strong style={{ color: 'var(--blue)' }}>2 intimações novas</strong> não lidas.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onTab('agenda')} style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', fontWeight: 500 }}>
            Ver Agenda
          </button>
          <button onClick={() => onTab('intimacoes')} style={{ padding: '7px 14px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 8, fontSize: 12, color: 'white', cursor: 'pointer', fontWeight: 600 }}>
            Ver Intimações
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <KpiCard icon={Users}      label="Clientes Ativos"       value="248"        sub="34 novos este mês"     trend="+16%"  trendUp color="var(--blue)" />
        <KpiCard icon={Briefcase}  label="Casos em Andamento"    value="137"        sub="28 aguardando prazo"   trend="+8%"   trendUp color="var(--purple)" />
        <KpiCard icon={CheckSquare} label="Próximas Tarefas"     value="12"         sub="3 hoje, 5 esta semana" trend="+40%" trendUp color="var(--red)" />
        <KpiCard icon={DollarSign} label="Honorários a Receber"  value="R$ 142k"    sub="51 faturas abertas"    trend="+24%"  trendUp color="var(--green)" />
      </div>

      {/* ── Row 2: Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, marginBottom: 22 }}>

        {/* Revenue Chart */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Receita & Honorários</h3>
              <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>Todas as áreas · Últimos 6 meses</p>
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
          <ResponsiveContainer width="100%" height={190}>
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

        {/* Area pie */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Áreas de Atuação</h3>
          <p style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 14 }}>Distribuição de casos</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={areaDistrib} cx="50%" cy="50%" innerRadius={40} outerRadius={62} dataKey="value" strokeWidth={0}>
                {areaDistrib.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => [`${v}%`, '']} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {areaDistrib.map(b => (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: 'var(--text2)' }}>{b.name}</span>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{b.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Cases + Activity + Prazos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 220px', gap: 14 }}>

        {/* Urgent cases */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 13.5, fontWeight: 700 }}>Casos Prioritários</h3>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Prazos críticos e pendências</p>
            </div>
            <button onClick={() => onTab('casos')} style={{ fontSize: 11.5, color: 'var(--blue)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
              Ver todos <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {urgentCases.map(c => {
              const s = urgencyStyle[c.urgency]
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: 'var(--bg3)', borderRadius: 9,
                  border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text4)', minWidth: 68 }}>{c.id}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.client}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{c.type}</div>
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 6px', background: 'var(--bg)', color: 'var(--text4)', borderRadius: 4, whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                    {c.area}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, padding: '2.5px 8px', background: s.bg, color: s.color, borderRadius: 5, whiteSpace: 'nowrap' }}>
                    {c.status}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', minWidth: 65, textAlign: 'right' }}>{c.valor}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prazos */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700 }}>Próximos Prazos</h3>
            <button onClick={() => onTab('agenda')} style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
              Agenda <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {deadlines.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < deadlines.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: deadlineColors[d.type], marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: deadlineColors[d.type] }}>{d.date}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.35, marginTop: 1 }}>{d.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Atividade Recente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>{a.icon}</span>
                <div>
                  <p style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.35 }}>{a.text}</p>
                  <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Novo Cliente', icon: '👤', tab: 'clientes', color: 'var(--blue)' },
          { label: 'Novo Caso',     icon: '📋', tab: 'casos',     color: 'var(--purple)' },
          { label: 'Ver Agenda',    icon: '📅', tab: 'agenda',    color: 'var(--cyan)' },
          { label: 'Analisar Laudo',icon: '🧠', tab: 'laudos',    color: 'var(--green)' },
          { label: 'Gerar Petição', icon: '📄', tab: 'peticoes',  color: 'var(--amber)' },
          { label: 'Financeiro',    icon: '💰', tab: 'financeiro',color: 'var(--green)' },
        ].map(a => (
          <button key={a.tab} onClick={() => onTab(a.tab)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 9, fontSize: 12.5, color: 'var(--text2)',
            transition: 'all 0.15s', cursor: 'pointer',
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

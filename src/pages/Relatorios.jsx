import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Download, FileText, TrendingUp, Users, DollarSign, Briefcase, Filter, Calendar } from 'lucide-react'

const monthlyData = [
  { mes: 'Out', casos: 18, ganhos: 14, honorarios: 28400 },
  { mes: 'Nov', casos: 23, ganhos: 19, honorarios: 34200 },
  { mes: 'Dez', casos: 16, ganhos: 13, honorarios: 24800 },
  { mes: 'Jan', casos: 29, ganhos: 24, honorarios: 41500 },
  { mes: 'Fev', casos: 25, ganhos: 21, honorarios: 38700 },
  { mes: 'Mar', casos: 34, ganhos: 28, honorarios: 52200 },
]

const areaData = [
  { name: 'Previdenciário', value: 47, color: '#3B82F6' },
  { name: 'Trabalhista',    value: 28, color: '#8B5CF6' },
  { name: 'Cível',          value: 19, color: '#10B981' },
  { name: 'Família',        value: 14, color: '#F59E0B' },
  { name: 'Consumidor',     value: 12, color: '#06B6D4' },
  { name: 'Tributário',     value: 8,  color: '#6B7280' },
  { name: 'Outros',         value: 9,  color: '#EC4899' },
]

const desfechoData = [
  { name: 'Procedente',           value: 38, color: '#10B981' },
  { name: 'Acordo',               value: 22, color: '#3B82F6' },
  { name: 'Parcialmente Proc.',   value: 18, color: '#06B6D4' },
  { name: 'Improcedente',         value: 14, color: '#EF4444' },
  { name: 'Em andamento',         value: 8,  color: '#F59E0B' },
]

const topClients = [
  { nome: 'João Carlos Silva',   area: 'Previdenciário', casos: 3, valor: 'R$ 12.400' },
  { nome: 'Fernanda Oliveira',   area: 'Trabalhista',    casos: 2, valor: 'R$ 18.500' },
  { nome: 'Carlos Eduardo Melo', area: 'Previdenciário', casos: 2, valor: 'R$ 9.700' },
  { nome: 'Ana Beatriz Lima',    area: 'Família',        casos: 1, valor: 'R$ 8.200' },
  { nome: 'Pedro Alves Rocha',   area: 'Cível',          casos: 2, valor: 'R$ 24.000' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginTop: 2 }}>
          {p.name}: {typeof p.value === 'number' && p.name.includes('Hon') ? `R$ ${p.value.toLocaleString('pt-BR')}` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('6m')
  const [tipoRelatorio, setTipoRelatorio] = useState('geral')

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1400 }}>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['3m', '6m', '12m', 'ano'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: periodo === p ? 'var(--blue)' : 'var(--bg2)',
              color: periodo === p ? 'white' : 'var(--text3)',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            }}>
              {p === 'ano' ? 'Este ano' : `Últimos ${p}`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, color: 'var(--text2)', cursor: 'pointer' }}>
            <Filter size={13} /> Filtrar
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 8, fontSize: 12.5, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Casos Abertos', value: '137', sub: 'no período', trend: '+12%', trendUp: true, icon: Briefcase, color: 'var(--blue)' },
          { label: 'Taxa de Êxito', value: '82%', sub: 'desfecho favorável', trend: '+3%', trendUp: true, icon: TrendingUp, color: 'var(--green)',
            note: '* Procedente + Acordo + Parcialmente procedente' },
          { label: 'Novos Clientes', value: '68', sub: 'captados no período', trend: '+21%', trendUp: true, icon: Users, color: 'var(--purple)' },
          { label: 'Honorários',    value: 'R$ 219k', sub: 'recebido no período', trend: '+18%', trendUp: true, icon: DollarSign, color: 'var(--amber)' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: k.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={k.color} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: k.trendUp ? 'var(--green)' : 'var(--red)' }}>
                  {k.trendUp ? '↑' : '↓'} {k.trend}
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{k.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>{k.sub}</div>
              {k.note && <div style={{ fontSize: 9.5, color: 'var(--text4)', marginTop: 4, fontStyle: 'italic' }}>{k.note}</div>}
            </div>
          )
        })}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Casos e Desfechos */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Casos & Resultados</h3>
          <p style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 16 }}>Novos casos × desfechos favoráveis</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="casos" name="Casos abertos" fill="#3B82F6" radius={[4,4,0,0]} />
              <Bar dataKey="ganhos" name="Desfecho favorável" fill="#10B981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Honorários */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Evolução Financeira</h3>
          <p style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 16 }}>Honorários recebidos por mês</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text4)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="honorarios" name="Honorários R$" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 280px 1fr', gap: 16, marginBottom: 16 }}>

        {/* Áreas */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Por Área de Direito</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={areaData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                {areaData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {areaData.map(a => (
              <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color }} />
                  <span style={{ color: 'var(--text2)' }}>{a.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{a.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desfechos */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Desfechos</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={desfechoData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                {desfechoData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {desfechoData.map(d => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color }} />
                  <span style={{ color: 'var(--text2)' }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top clientes */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Clientes com Mais Casos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topClients.map((c, i) => (
              <div key={c.nome} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topClients.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {i+1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.area} · {c.casos} caso{c.casos > 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green)' }}>{c.valor}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Relatórios prontos */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Relatórios Prontos para Exportar</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { nome: 'Relatório Gerencial Mensal',    desc: 'Resumo completo do escritório',      icon: '📊' },
            { nome: 'Extrato de Honorários',          desc: 'Recebimentos e pendências',          icon: '💰' },
            { nome: 'Controle de Prazos',             desc: 'Prazos processuais do período',      icon: '⏰' },
            { nome: 'Performance por Área',           desc: 'Métricas por área de atuação',       icon: '📈' },
            { nome: 'Declaração de Atividades OAB',   desc: 'Para registro e prestação de contas',icon: '⚖️' },
            { nome: 'Relatório de Clientes',          desc: 'CRM completo com histórico',         icon: '👥' },
          ].map(r => (
            <button key={r.nome} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: 20 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{r.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

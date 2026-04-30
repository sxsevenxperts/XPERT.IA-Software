import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Award, Clock, DollarSign, Users, Briefcase } from 'lucide-react'

const mockMetrics = {
  taxaSucesso: 91.2,
  tempoMedio: 8.5,
  casosGanhos: 127,
  casosPerdidos: 13,
  receita: 428500,
  clientesAtivos: 248,
}

const revenueData = [
  { mes: 'Jan', receita: 38700, target: 40000 },
  { mes: 'Fev', receita: 42300, target: 40000 },
  { mes: 'Mar', receita: 52200, target: 40000 },
  { mes: 'Abr', receita: 48900, target: 40000 },
  { mes: 'Mai', receita: 55600, target: 40000 },
  { mes: 'Jun', receita: 58200, target: 40000 },
]

const areaDistribution = [
  { name: 'Previdenciário', value: 34, color: '#3B82F6' },
  { name: 'Trabalhista', value: 22, color: '#8B5CF6' },
  { name: 'Cível', value: 16, color: '#10B981' },
  { name: 'Família', value: 11, color: '#F59E0B' },
  { name: 'Consumidor', value: 9, color: '#06B6D4' },
  { name: 'Outros', value: 8, color: '#6B7280' },
]

const successTrend = [
  { mes: 'Jan', taxa: 88.5 },
  { mes: 'Fev', taxa: 89.2 },
  { mes: 'Mar', taxa: 90.1 },
  { mes: 'Abr', taxa: 90.8 },
  { mes: 'Mai', taxa: 91.0 },
  { mes: 'Jun', taxa: 91.2 },
]

function MetricCard({ icon: Icon, label, value, subtext, color }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '18px', flex: 1, minWidth: 0
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: color + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 2 }}>{label}</div>
      {subtext && <div style={{ fontSize: 11, color: 'var(--text4)' }}>{subtext}</div>}
    </div>
  )
}

export default function MetricsDashboard() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard de Métricas</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>Análise detalhada de performance do seu escritório</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        <MetricCard icon={Award} label="Taxa de Êxito" value={mockMetrics.taxaSucesso + '%'} subtext="últimos 12 meses" color="var(--green)" />
        <MetricCard icon={Clock} label="Tempo Médio" value={mockMetrics.tempoMedio + " meses"} subtext="resolução de caso" color="var(--blue)" />
        <MetricCard icon={TrendingUp} label="Casos Ganhos" value={mockMetrics.casosGanhos} subtext={`Perdidos: ${mockMetrics.casosPerdidos}`} color="var(--amber)" />
        <MetricCard icon={DollarSign} label="Receita Anual" value={`R$ ${(mockMetrics.receita / 1000).toFixed(0)}k`} subtext="até ago/2025" color="var(--purple)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 28 }}>
        {/* Revenue Trend */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Receita Mensal vs Meta</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--text3)" />
              <YAxis stroke="var(--text3)" />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)' }} />
              <Line type="monotone" dataKey="receita" stroke="var(--blue)" strokeWidth={2} dot={{ fill: 'var(--blue)', r: 4 }} />
              <Line type="monotone" dataKey="target" stroke="var(--text4)" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate Trend */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Taxa de Êxito (Tendência)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={successTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--text3)" />
              <YAxis stroke="var(--text3)" domain={[85, 95]} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)' }} />
              <Bar dataKey="taxa" fill="var(--green)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Chart */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center'
      }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Distribuição por Área</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={areaDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {areaDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Casos por Área</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {areaDistribution.map(area => (
              <div key={area.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: area.color }} />
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text2)' }}>{area.name}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{area.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
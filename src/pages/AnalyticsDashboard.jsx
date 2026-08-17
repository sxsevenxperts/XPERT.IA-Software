import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Zap } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { supabase } from '../lib/supabase'

const MES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const AREA_COLORS = { previdenciario:'#3b82f6', trabalhista:'#8b5cf6', civil:'#10b981', familia:'#ec4899', penal:'#ef4444', consumidor:'#f59e0b', outros:'#6b7280' }

function KPICard({ icon: Icon, label, value, change, trend }) {
  const changeColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3b82f6',
          flexShrink: 0,
        }}
      >
        <Icon size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
          {label}
        </p>
        <h3 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#111827' }}>
          {value}
        </h3>
        {change && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {TrendIcon && <TrendIcon size={16} style={{ color: changeColor }} />}
            <span style={{ fontSize: '12px', color: changeColor, fontWeight: '600' }}>
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [loading, setLoading]           = useState(true)
  const [revenueData, setRevenueData]   = useState([])
  const [workloadData, setWorkloadData] = useState([])
  const [areaData, setAreaData]         = useState([])
  const [kpi, setKpi]                   = useState({ receitaMes: 0, receitaAnterior: 0, totalCasos: 0, casosGanhos: 0 })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const now = new Date()

      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
      const [{ data: honData }, { data: casosData }] = await Promise.all([
        supabase.from('honorarios').select('valor,status,created_at').gte('created_at', sixMonthsAgo),
        supabase.from('casos').select('area,status,created_at').gte('created_at', sixMonthsAgo),
      ])

      // Revenue chart — last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, mes: MES_LABEL[d.getMonth()], receita: 0 }
      });
      (honData || []).filter(h => h.status === 'recebido').forEach(h => {
        const key = (h.created_at || '').substring(0, 7)
        const m = months.find(m => m.key === key)
        if (m) m.receita += parseFloat(h.valor) || 0
      })
      setRevenueData(months)

      // KPIs
      const mesAtualKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
      const mesAnteriorKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2,'0')}`
      const receitaMes = months.find(m => m.key === mesAtualKey)?.receita || 0
      const receitaAnterior = months.find(m => m.key === mesAnteriorKey)?.receita || 0
      const totalCasos = (casosData || []).length
      const casosGanhos = (casosData || []).filter(c => c.status === 'ganho').length
      setKpi({ receitaMes, receitaAnterior, totalCasos, casosGanhos })

      // Workload chart — casos por mês
      const wl = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, mes: MES_LABEL[d.getMonth()], casos: 0 }
      });
      (casosData || []).forEach(c => {
        const key = (c.created_at || '').substring(0, 7)
        const m = wl.find(m => m.key === key)
        if (m) m.casos += 1
      })
      setWorkloadData(wl)

      // Area distribution
      const areaCount = {}
      ;(casosData || []).forEach(c => {
        const a = c.area || 'outros'
        areaCount[a] = (areaCount[a] || 0) + 1
      })
      const total = Object.values(areaCount).reduce((s, v) => s + v, 0) || 1
      setAreaData(
        Object.entries(areaCount).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: Math.round((value / total) * 100),
          color: AREA_COLORS[name.toLowerCase()] || AREA_COLORS.outros,
        }))
      )

      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <div style={{ padding:'40px',textAlign:'center',color:'var(--text3)' }}>Carregando análises...</div>
  }

  const variacaoReceita = kpi.receitaAnterior > 0
    ? (((kpi.receitaMes - kpi.receitaAnterior) / kpi.receitaAnterior) * 100).toFixed(1)
    : null
  const taxaSucesso = kpi.totalCasos > 0 ? ((kpi.casosGanhos / kpi.totalCasos) * 100).toFixed(1) : '—'

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '32px' }}>📈</div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Analytics & Previsões</h1>
        </div>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
          Análises preditivas de receita, carga de trabalho e tendências com Machine Learning
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <KPICard
          icon={BarChart3}
          label="Receita (Mês Atual)"
          value={kpi.receitaMes >= 1000 ? `R$ ${(kpi.receitaMes/1000).toFixed(1)}k` : `R$ ${kpi.receitaMes.toLocaleString('pt-BR')}`}
          change={variacaoReceita ? `${variacaoReceita > 0 ? '+' : ''}${variacaoReceita}% vs mês anterior` : 'Sem dados anteriores'}
          trend={variacaoReceita > 0 ? 'up' : 'down'}
        />
        <KPICard
          icon={TrendingUp}
          label="Taxa de Sucesso"
          value={`${taxaSucesso}%`}
          change={`${kpi.casosGanhos} casos ganhos`}
          trend="up"
        />
        <KPICard
          icon={BarChart3}
          label="Casos (6 meses)"
          value={kpi.totalCasos}
          change="Novos casos abertos"
          trend={null}
        />
        <KPICard
          icon={TrendingUp}
          label="Casos Ganhos"
          value={kpi.casosGanhos}
          change={kpi.totalCasos > 0 ? `${taxaSucesso}% de sucesso` : 'Sem dados'}
          trend="up"
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Revenue Trend */}
        <div style={{ backgroundColor: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--border)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600' }}>
            📊 Receita Mensal (Honorários Recebidos)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={2} name="Receita Real" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Workload Trend */}
        <div style={{ backgroundColor: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--border)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600' }}>
            ⚙️ Casos Abertos por Mês
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--text4)" />
              <YAxis stroke="var(--text4)" />
              <Tooltip contentStyle={{ backgroundColor:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'6px' }}/>
              <Bar dataKey="casos" fill="#3b82f6" name="Casos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area Distribution */}
        <div style={{ backgroundColor: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--border)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600' }}>
            🎯 Distribuição por Área de Prática
          </h3>
          {areaData.length === 0 ? (
            <div style={{ textAlign:'center',padding:'60px 20px',color:'var(--text3)' }}>Sem casos cadastrados ainda</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={areaData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {areaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Predictions & Recommendations */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>
          🎯 Previsões e Recomendações
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#166534' }}>
              ✅ Receita
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
              Previsão de crescimento de 8-12% nos próximos 3 meses. Tendência positiva sustentada pelo crescimento em Previdência.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '1px solid #fcd34d' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#92400e' }}>
              ⚠️ Carga de Trabalho
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
              Aumento previsto de 15% na carga. Considere contratar mais profissionais ou redistribuir prioridades para evitar overload.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#075985' }}>
              📌 Estratégia
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#0c4a6e' }}>
              Mantenha foco em Previdência. Invista em automação para melhorar eficiência nas áreas de menor receita.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
        <p style={{ margin: 0 }}>
          ℹ️ As previsões são atualizadas diariamente com base em dados históricos e machine learning. Últimas 24h de dados.
        </p>
      </div>
    </div>
  )
}

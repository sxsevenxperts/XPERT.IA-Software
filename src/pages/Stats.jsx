import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart2, TrendingUp, DollarSign, Navigation, Fuel } from 'lucide-react'

export default function Stats() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('week')
  const [loading, setLoading] = useState(true)

  function emptyStats() {
    return {
      totalGanhos: 0, totalKm: 0, totalDespesas: 0,
      avgPerTrip: 0, avgKmPerTrip: 0, avgRating: 0,
      count: 0, lucroLiquido: 0,
    }
  }

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setData(emptyStats())
        setLoading(false)
        return
      }
      const now = new Date()
      const from = new Date()
      if (period === 'week') from.setDate(now.getDate() - 7)
      else if (period === 'month') from.setMonth(now.getMonth() - 1)
      else from.setFullYear(now.getFullYear() - 1)

      const { data: trips } = await supabase.from('corridas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'concluida')
        .gte('created_at', from.toISOString())

      const { data: expenses } = await supabase.from('expenses')
        .select('value, category')
        .eq('user_id', user.id)
        .gte('date', from.toISOString().split('T')[0])

      const list = trips || []
      const totalGanhos = list.reduce((s, t) => s + (t.valor_total || 0), 0)
      const totalKm = list.reduce((s, t) => s + (t.distancia_km || 0), 0)
      const totalDespesas = (expenses || []).reduce((s, e) => s + (e.value || 0), 0)
      const avgPerTrip = list.length ? totalGanhos / list.length : 0
      const avgKmPerTrip = list.length ? totalKm / list.length : 0
      const ratings = list.filter(t => t.avaliacao_cliente).map(t => t.avaliacao_cliente)
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

      setData({
        totalGanhos,
        totalKm,
        totalDespesas,
        avgPerTrip,
        avgKmPerTrip,
        avgRating,
        count: list.length,
        lucroLiquido: totalGanhos - totalDespesas,
      })
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setData(emptyStats())
    }
    setLoading(false)
  }, [period])

  useEffect(() => { loadStats() }, [loadStats])

  const periodTabs = [
    { id: 'week', label: '7 dias' },
    { id: 'month', label: '30 dias' },
    { id: 'year', label: '1 ano' },
  ]

  const statItems = data ? [
    { icon: DollarSign, label: 'Ganhos Brutos', value: `R$ ${data.totalGanhos.toFixed(2)}`, color: '#10B981' },
    { icon: TrendingUp, label: 'Lucro Líquido', value: `R$ ${data.lucroLiquido.toFixed(2)}`, color: data.lucroLiquido >= 0 ? '#10B981' : '#EF4444' },
    { icon: Navigation, label: 'Corridas', value: data.count, color: '#3B82F6' },
    { icon: BarChart2, label: 'Km Rodados', value: `${data.totalKm.toFixed(0)} km`, color: '#6366F1' },
    { icon: DollarSign, label: 'Média/Corrida', value: `R$ ${data.avgPerTrip.toFixed(2)}`, color: '#F59E0B' },
    { icon: Fuel, label: 'Despesas', value: `R$ ${data.totalDespesas.toFixed(2)}`, color: '#EF4444' },
  ] : []

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Estatísticas</h1>

      {/* Period selector */}
      <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 24, border: '1px solid var(--border)' }}>
        {periodTabs.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            flex: 1, padding: '8px', borderRadius: 8, border: 'none',
            background: period === p.id ? '#3B82F6' : 'none',
            color: period === p.id ? 'white' : 'var(--text3)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>{p.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text4)' }}>Carregando...</div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text4)' }}>
          Nenhum dado disponível.
        </div>
      ) : (
        <>
          {/* Avg Rating highlight */}
          {data.avgRating > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #F59E0B20, #EAB30820)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 14, padding: '16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 32 }}>⭐</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B' }}>{data.avgRating.toFixed(1)}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>Avaliação média dos passageiros</div>
              </div>
            </div>
          )}

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {statItems.map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2, color }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

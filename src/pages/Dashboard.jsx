import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  DollarSign, Navigation, Star, TrendingUp,
  Clock, Zap, ChevronRight, MapPin,
} from 'lucide-react'

export default function Dashboard({ onTab }) {
  const [stats, setStats] = useState(null)
  const [recentTrips, setRecentTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [tripsRes, todayRes] = await Promise.all([
        supabase.from('corridas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('corridas')
          .select('valor_total, distancia_km, avaliacao_cliente')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString()),
      ])

      const todayTrips = todayRes.data || []
      const ganhos = todayTrips.reduce((s, t) => s + (t.valor_total || 0), 0)
      const distancia = todayTrips.reduce((s, t) => s + (t.distancia_km || 0), 0)
      const avgs = todayTrips.filter(t => t.avaliacao_cliente).map(t => t.avaliacao_cliente)
      const avgRating = avgs.length ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1) : '—'

      setStats({ ganhos, corridas: todayTrips.length, distancia, avgRating })
      setRecentTrips(tripsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: DollarSign, label: 'Ganhos Hoje', value: stats ? `R$ ${stats.ganhos.toFixed(2)}` : '—', color: '#10B981' },
    { icon: Navigation, label: 'Corridas Hoje', value: stats?.corridas ?? '—', color: '#3B82F6' },
    { icon: MapPin, label: 'Km Rodados', value: stats ? `${stats.distancia.toFixed(0)} km` : '—', color: '#6366F1' },
    { icon: Star, label: 'Avaliação', value: stats?.avgRating ?? '—', color: '#F59E0B' },
  ]

  return (
    <div style={{ padding: '20px 16px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Painel do Motorista</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Icon size={18} color={color} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{loading ? '...' : value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Start Ride CTA */}
      <button
        onClick={() => onTab('trip')}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
          color: 'white', border: 'none', borderRadius: 14,
          padding: '18px', fontSize: 16, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          cursor: 'pointer', marginBottom: 24,
        }}
      >
        <Zap size={20} fill="white" /> Iniciar Corrida
      </button>

      {/* Recent Trips */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Últimas corridas</h2>
          <button
            onClick={() => onTab('history')}
            style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text4)', padding: 24 }}>Carregando...</div>
        ) : recentTrips.length === 0 ? (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: 24, textAlign: 'center',
          }}>
            <Navigation size={32} color="var(--text4)" style={{ marginBottom: 8 }} />
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>Nenhuma corrida ainda hoje</p>
            <p style={{ color: 'var(--text4)', fontSize: 12 }}>Inicie sua primeira corrida!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTrips.map(trip => (
              <div key={trip.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    {trip.origem || 'Origem'} → {trip.destino || 'Destino'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text4)', display: 'flex', gap: 12 }}>
                    <span>{trip.distancia_km ? `${trip.distancia_km} km` : ''}</span>
                    {trip.avaliacao_cliente && <span>{'⭐'.repeat(Math.round(trip.avaliacao_cliente))}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>
                  R$ {(trip.valor_total || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

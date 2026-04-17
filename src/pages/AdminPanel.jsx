import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LogOut, Users, Zap, Activity, TrendingUp, MapPin } from 'lucide-react'
import { useNPSStats } from '../hooks/useNPSStats'

export default function AdminPanel({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const npsStats = useNPSStats()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Total drivers
      const { count: drivers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Active subscriptions
      const { count: subs } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Drivers active now (had recent trips)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString()
      const { data: activeData } = await supabase
        .from('corridas')
        .select('user_id')
        .gt('started_at', fiveMinutesAgo)

      const activeSet = new Set(activeData?.map(t => t.user_id) || [])
      const driversActive = activeSet.size

      // Drivers hitting daily goal - aggregate by driver in single query
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: earningsData } = await supabase
        .from('corridas')
        .select('user_id, valor_total')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${todayStr}T23:59:59`)

      const driverEarnings = {}
      if (earningsData) {
        for (const trip of earningsData) {
          if (!driverEarnings[trip.user_id]) {
            driverEarnings[trip.user_id] = 0
          }
          driverEarnings[trip.user_id] += trip.valor_total || 0
        }
      }

      // Get drivers with daily goals and count those hitting them
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, meta_daily')
        .gt('meta_daily', 0)

      let drivingGoal = 0
      if (profilesData) {
        for (const profile of profilesData) {
          if ((driverEarnings[profile.id] || 0) >= profile.meta_daily) {
            drivingGoal++
          }
        }
      }

      // Rides today
      const { data: corridas } = await supabase
        .from('corridas')
        .select('id')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${todayStr}T23:59:59`)

      const ridesToday = corridas?.length || 0

      setStats({
        drivers: drivers || 0,
        subs: subs || 0,
        driversActive: driversActive,
        drivingGoal: drivingGoal,
        ridesToday: ridesToday,
        time: new Date().toLocaleTimeString('pt-BR'),
      })
    } catch (err) {
      console.error('Stats error:', err)
      setStats({
        drivers: 0,
        subs: 0,
        driversActive: 0,
        drivingGoal: 0,
        ridesToday: 0,
        time: new Date().toLocaleTimeString('pt-BR'),
      })
    }
  }

  return (
    <div style={{
      background: '#0f172a',
      minHeight: '100dvh',
      color: '#f1f5f9',
      padding: '20px 16px 30px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>🛡️ Admin</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0 0' }}>{user?.email}</p>
          </div>
          <button onClick={onLogout} style={{
            background: '#ef444420',
            border: '1px solid #ef444440',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#ef4444',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <LogOut size={16} />
            Sair
          </button>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div style={{
              background: '#1e293b',
              borderRadius: 14,
              padding: 16,
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Users size={18} color='#3b82f6' />
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Motoristas</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6', margin: 0 }}>
                {stats.drivers}
              </p>
            </div>

            <div style={{
              background: '#1e293b',
              borderRadius: 14,
              padding: 16,
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Activity size={18} color='#ec4899' />
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Ativos agora</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#ec4899', margin: 0 }}>
                {stats.driversActive}
              </p>
            </div>

            <div style={{
              background: '#1e293b',
              borderRadius: 14,
              padding: 16,
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp size={18} color='#22c55e' />
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Batendo meta</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#22c55e', margin: 0 }}>
                {stats.drivingGoal}
              </p>
            </div>

            <div style={{
              background: '#1e293b',
              borderRadius: 14,
              padding: 16,
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MapPin size={18} color='#f59e0b' />
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Corridas hoje</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', margin: 0 }}>
                {stats.ridesToday}
              </p>
            </div>

            <div style={{
              background: '#1e293b',
              borderRadius: 14,
              padding: 16,
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Zap size={18} color='#06b6d4' />
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Assinaturas</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#06b6d4', margin: 0 }}>
                {stats.subs}
              </p>
            </div>

            <div style={{
              background: '#1e293b',
              borderRadius: 14,
              padding: 16,
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Pesquisas</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa', margin: 0 }}>
                {npsStats.npsCount}
              </p>
            </div>

            <div style={{
              background: '#1e293b',
              borderRadius: 14,
              padding: 16,
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Pesquisas hoje</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa', margin: 0 }}>
                {npsStats.npsToday}
              </p>
            </div>
          </div>
        )}

        <button onClick={loadStats} style={{
          width: '100%',
          padding: 12,
          background: '#3b82f6',
          border: 'none',
          borderRadius: 10,
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 20,
        }}>
          🔄 Atualizar
        </button>

        <div style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 12,
          border: '1px solid #334155',
          fontSize: 11,
          color: '#64748b',
        }}>
          <p style={{ margin: 0 }}>✅ Painel operacional</p>
          <p style={{ margin: '6px 0 0 0' }}>{stats?.time}</p>
        </div>
      </div>
    </div>
  )
}

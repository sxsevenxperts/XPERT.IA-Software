import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LogOut, Users, Zap } from 'lucide-react'

export default function AdminPanel({ user, onLogout }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { count: drivers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver')

      const { count: subs } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      setStats({
        drivers: drivers || 0,
        subs: subs || 0,
        time: new Date().toLocaleTimeString('pt-BR'),
      })
    } catch (err) {
      console.error('Stats error:', err)
      setStats({ drivers: 0, subs: 0, time: new Date().toLocaleTimeString('pt-BR') })
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
                <Zap size={18} color='#22c55e' />
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Assinaturas</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#22c55e', margin: 0 }}>
                {stats.subs}
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

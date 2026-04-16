import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Navigation, Star, Filter } from 'lucide-react'

const STATUS_COLORS = { concluida: '#10B981', cancelada: '#EF4444', em_andamento: '#3B82F6' }
const STATUS_LABELS = { concluida: 'Concluída', cancelada: 'Cancelada', em_andamento: 'Em andamento' }

export default function History() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todas')
  const [total, setTotal] = useState(0)

  useEffect(() => { loadTrips() }, [filter])

  async function loadTrips() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let q = supabase.from('corridas').select('*').eq('driver_id', user.id).order('created_at', { ascending: false }).limit(50)
      if (filter !== 'todas') q = q.eq('status', filter)
      const { data } = await q
      setTrips(data || [])
      const sum = (data || []).filter(t => t.status === 'concluida').reduce((s, t) => s + (t.valor_total || 0), 0)
      setTotal(sum)
    } catch {}
    setLoading(false)
  }

  const filters = [
    { id: 'todas', label: 'Todas' },
    { id: 'concluida', label: 'Concluídas' },
    { id: 'cancelada', label: 'Canceladas' },
  ]

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Histórico</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            {trips.length} corridas · R$ {total.toFixed(2)} ganhos
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '7px 16px', borderRadius: 20, border: '1px solid',
            borderColor: filter === f.id ? '#3B82F6' : 'var(--border)',
            background: filter === f.id ? 'rgba(59,130,246,0.1)' : 'var(--bg2)',
            color: filter === f.id ? '#3B82F6' : 'var(--text3)',
            fontSize: 13, fontWeight: filter === f.id ? 600 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text4)' }}>Carregando...</div>
      ) : trips.length === 0 ? (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 32, textAlign: 'center',
        }}>
          <Navigation size={32} color="var(--text4)" style={{ marginBottom: 8 }} />
          <p style={{ color: 'var(--text3)' }}>Nenhuma corrida encontrada</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trips.map(trip => (
            <div key={trip.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                    {trip.origem || '—'} → {trip.destino || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text4)' }}>
                    {new Date(trip.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {trip.plataforma && ` · ${trip.plataforma}`}
                    {trip.distancia_km && ` · ${trip.distancia_km} km`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: trip.status === 'concluida' ? '#10B981' : 'var(--text3)' }}>
                    {trip.valor_total ? `R$ ${trip.valor_total.toFixed(2)}` : '—'}
                  </div>
                  {trip.avaliacao_cliente && (
                    <div style={{ fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                      <Star size={10} fill="#F59E0B" /> {trip.avaliacao_cliente}
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                background: `${STATUS_COLORS[trip.status] || '#6B7280'}20`,
                color: STATUS_COLORS[trip.status] || '#6B7280',
                fontSize: 11, fontWeight: 600,
              }}>
                {STATUS_LABELS[trip.status] || trip.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

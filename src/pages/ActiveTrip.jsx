import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { geocodeAddress } from '../lib/geocoding'
import MapaRotaInteligente from '../components/MapaRotaInteligente'
import { Navigation, MapPin, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function ActiveTrip() {
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [destinoCoords, setDestinoCoords] = useState(null)
  const [gpsPos, setGpsPos] = useState(null)
  const [form, setForm] = useState({
    origem: '', destino: '', distancia_km: '', valor_total: '', plataforma: 'Uber',
  })
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    loadActiveTrip()
    return () => { mountedRef.current = false }
  }, [])

  // Capturar GPS para contextualizar geocoding
  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!mountedRef.current) return
        setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => { console.warn('GPS indisponível:', err.message) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Geocodificar destino quando trip ativa (reexecuta quando GPS fica disponível)
  useEffect(() => {
    if (!trip?.destino) return
    geocodeDestinationForTrip()
  }, [trip?.id, gpsPos?.lat, gpsPos?.lng])

  async function geocodeDestinationForTrip() {
    if (!trip?.destino) return
    try {
      const opts = gpsPos
        ? { lat: gpsPos.lat, lng: gpsPos.lng }
        : {}
      const coords = await geocodeAddress(trip.destino, opts)
      if (coords && mountedRef.current) {
        setDestinoCoords({ lat: coords.lat, lng: coords.lng })
      }
    } catch (err) {
      console.error('Erro ao geocodificar destino:', err)
    }
  }

  async function loadActiveTrip() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase.from('corridas')
        .select('*').eq('user_id', user.id).eq('status', 'em_andamento').maybeSingle()
      if (error) throw error
      setTrip(data)
    } catch (err) {
      console.error('Erro ao carregar corrida ativa:', err)
    }
    setLoading(false)
  }

  async function startTrip() {
    if (!form.origem || !form.destino) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        user_id: user.id,
        origem: form.origem,
        destino: form.destino,
        plataforma: form.plataforma,
        status: 'em_andamento',
        started_at: new Date().toISOString(),
      }
      if (gpsPos) {
        payload.latitude_origem = gpsPos.lat
        payload.longitude_origem = gpsPos.lng
      }
      const { data, error } = await supabase.from('corridas').insert(payload).select().single()
      if (error) throw error
      setTrip(data)
    } catch (err) {
      console.error('Erro ao iniciar corrida:', err)
      alert('Erro ao iniciar corrida')
    }
    setSaving(false)
  }

  async function finishTrip() {
    if (!trip) return
    setSaving(true)
    try {
      const { error } = await supabase.from('corridas').update({
        status: 'concluida',
        distancia_km: parseFloat(form.distancia_km) || null,
        valor_total: parseFloat(form.valor_total) || null,
        finished_at: new Date().toISOString(),
      }).eq('id', trip.id)
      if (error) throw error
      setTrip(null)
      setDestinoCoords(null)
      setForm({ origem: '', destino: '', distancia_km: '', valor_total: '', plataforma: 'Uber' })
    } catch (err) {
      console.error('Erro ao finalizar corrida:', err)
      alert('Erro ao finalizar corrida')
    }
    setSaving(false)
  }

  async function cancelTrip() {
    if (!trip) return
    setSaving(true)
    try {
      const { error } = await supabase.from('corridas')
        .update({ status: 'cancelada', finished_at: new Date().toISOString() })
        .eq('id', trip.id)
      if (error) throw error
      setTrip(null)
      setDestinoCoords(null)
    } catch (err) {
      console.error('Erro ao cancelar corrida:', err)
    }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 10, fontSize: 15, color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box',
  }

  const platforms = ['Uber', '99', 'InDriver', 'Lyft', 'Cabify', 'Outro']

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Carregando...</div>

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>
        {trip ? 'Corrida em Andamento' : 'Nova Corrida'}
      </h1>

      {trip ? (
        <div>
          {/* Active trip card */}
          <div style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            borderRadius: 16, padding: 20, marginBottom: 20, color: 'white',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>EM ANDAMENTO • {trip.plataforma}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <MapPin size={16} />
              <span style={{ fontSize: 15 }}>{trip.origem}</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginLeft: 24, marginBottom: 6 }}>↓</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={16} />
              <span style={{ fontSize: 15 }}>{trip.destino}</span>
            </div>
          </div>

          {/* Mapa da rota */}
          {destinoCoords && (
            <div style={{ marginBottom: 20 }}>
              <MapaRotaInteligente
                destino={trip.destino}
                latDest={destinoCoords.lat}
                lngDest={destinoCoords.lng}
                tipoMotorista={trip.plataforma || 'uber'}
                rotas={null}
              />
            </div>
          )}

          {/* Finalize fields */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Finalizar corrida</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Distância (km)</label>
                <input type="number" placeholder="0.0" value={form.distancia_km}
                  onChange={e => setForm(f => ({ ...f, distancia_km: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Valor (R$)</label>
                <input type="number" placeholder="0.00" value={form.valor_total}
                  onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))} style={inputStyle} />
              </div>
            </div>
          </div>

          <button onClick={finishTrip} disabled={saving} style={{
            width: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white', border: 'none', borderRadius: 12, padding: '16px',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <CheckCircle size={18} /> Finalizar Corrida
          </button>

          <button onClick={cancelTrip} disabled={saving} style={{
            width: '100%', background: 'none', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600,
            color: '#EF4444', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <XCircle size={16} /> Cancelar Corrida
          </button>
        </div>
      ) : (
        <div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Plataforma</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {platforms.map(p => (
                  <button key={p} onClick={() => setForm(f => ({ ...f, plataforma: p }))} style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid',
                    borderColor: form.plataforma === p ? '#3B82F6' : 'var(--border)',
                    background: form.plataforma === p ? 'rgba(59,130,246,0.1)' : 'none',
                    color: form.plataforma === p ? '#3B82F6' : 'var(--text3)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}>{p}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Origem</label>
              <input placeholder="Bairro / Endereço de partida" value={form.origem}
                onChange={e => setForm(f => ({ ...f, origem: e.target.value }))} style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Destino</label>
              <input placeholder="Bairro / Endereço de destino" value={form.destino}
                onChange={e => setForm(f => ({ ...f, destino: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <button onClick={startTrip} disabled={saving || !form.origem || !form.destino} style={{
            width: '100%',
            background: (!form.origem || !form.destino)
              ? 'var(--bg4)'
              : 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            color: 'white', border: 'none', borderRadius: 12, padding: '16px',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          }}>
            <Navigation size={18} /> Iniciar Corrida
          </button>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

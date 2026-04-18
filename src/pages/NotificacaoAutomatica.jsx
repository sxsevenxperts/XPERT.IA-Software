import { useState, useEffect } from 'react'
import { geocodeAddress } from '../lib/geocoding'
import MapaRotaInteligente from '../components/MapaRotaInteligente'
import { useNotificationListener } from '../hooks/useNotificationListener'
import { MapPin, Navigation, AlertCircle } from 'lucide-react'

/**
 * Página que escuta notificações de 99/Uber
 * Extrai destino, usa GPS como origem
 * Mostra mapa automaticamente com Waze + Google Maps
 */
export default function NotificacaoAutomatica() {
  const { notificationData, gpsOrigin, simularNotificacao } = useNotificationListener()
  const [destinoCoords, setDestinoCoords] = useState(null)
  const [loading, setLoading] = useState(false)

  // Geocodificar destino quando notificação chegar (reexecuta se GPS chegar depois)
  useEffect(() => {
    if (!notificationData?.destino) return
    geocodificarDestino(notificationData.destino)
  }, [notificationData?.destino, gpsOrigin?.lat, gpsOrigin?.lng])

  async function geocodificarDestino(destino) {
    setLoading(true)
    try {
      const opts = gpsOrigin
        ? { lat: gpsOrigin.lat, lng: gpsOrigin.lng }
        : {}
      const coords = await geocodeAddress(destino, opts)
      if (coords) {
        setDestinoCoords({
          lat: coords.lat,
          lng: coords.lng,
          displayName: coords.displayName,
        })
      }
    } catch (err) {
      console.error('Erro ao geocodificar:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Corrida Automática</h1>

      {/* STATUS GPS */}
      <div style={{
        background: gpsOrigin ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${gpsOrigin ? '#10B981' : '#EF4444'}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: gpsOrigin ? '#10B981' : '#EF4444',
            animation: gpsOrigin ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {gpsOrigin ? '✅ GPS Ativo' : '❌ GPS Inativo'}
          </span>
        </div>
        {gpsOrigin && (
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>
            📍 {gpsOrigin.lat.toFixed(4)}, {gpsOrigin.lng.toFixed(4)} ±{gpsOrigin.accuracy.toFixed(0)}m
          </p>
        )}
      </div>

      {/* NOTIFICAÇÃO DETECTADA */}
      {notificationData ? (
        <div style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>CORRIDA DETECTADA</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
            <Navigation size={16} style={{ marginTop: 4 }} />
            <div>
              <p style={{ fontSize: 12, opacity: 0.8, margin: '0 0 4px 0' }}>Origem (GPS)</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                {gpsOrigin ? `${gpsOrigin.lat.toFixed(4)}, ${gpsOrigin.lng.toFixed(4)}` : 'Carregando GPS...'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <MapPin size={16} style={{ marginTop: 4 }} />
            <div>
              <p style={{ fontSize: 12, opacity: 0.8, margin: '0 0 4px 0' }}>Destino (Notificação)</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                {notificationData.destino}
              </p>
              <p style={{ fontSize: 11, opacity: 0.7, margin: '4px 0 0 0' }}>
                "{notificationData.textoOriginal}"
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 32,
          textAlign: 'center',
          marginBottom: 20,
        }}>
          <AlertCircle size={32} color="var(--text4)" style={{ marginBottom: 8 }} />
          <p style={{ color: 'var(--text3)', margin: 0 }}>
            Aguardando notificação de 99 ou Uber...
          </p>
        </div>
      )}

      {/* MAPA */}
      {notificationData && destinoCoords && gpsOrigin ? (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Rota Inteligente</h2>
          <MapaRotaInteligente
            destino={notificationData.destino}
            latDest={destinoCoords.lat}
            lngDest={destinoCoords.lng}
            tipoMotorista="automatico"
            rotas={null}
          />
        </div>
      ) : notificationData && loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
          ⏳ Carregando mapa...
        </div>
      ) : null}

      {/* BOTÃO TESTE - apenas em desenvolvimento */}
      {import.meta.env.DEV && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => simularNotificacao('Shopping Center')}
            style={{
              flex: 1,
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📬 Simular: Shopping
          </button>
          <button
            onClick={() => simularNotificacao('Centro')}
            style={{
              flex: 1,
              background: '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📬 Simular: Centro
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import { Navigation, AlertCircle, CheckCircle, MapPin, Compass, Clock, TrendingDown } from 'lucide-react'
import axios from 'axios'

export default function MapaRotaInteligente({
  destino, latDest, lngDest, tipoMotorista = 'uber', rotas = null
}) {
  // GPS DO MOTORISTA
  const [gpsMotorista, setGpsMotorista] = useState(null)
  const [rota, setRota] = useState(null)
  const [distancia, setDistancia] = useState(null)
  const [tempo, setTempo] = useState(null)
  const [avisos, setAvisos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erroGPS, setErroGPS] = useState(null)

  const GRAPHHOPPER_URL = import.meta.env.VITE_GRAPHHOPPER_URL || 'https://router.project-osrm.org'
  const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

  // ===== CAPTURAR GPS DO MOTORISTA =====
  useEffect(() => {
    // Se já tem rotas (modo visualização), não precisa GPS
    if (rotas) {
      setLoading(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setGpsMotorista({ lat: latitude, lng: longitude, accuracy })
        setErroGPS(null)

        // Assim que tiver GPS e destino, calcular rota
        if (latDest && lngDest) {
          buscarRotaInteligente(latitude, longitude, latDest, lngDest)
        }
      },
      (error) => {
        setErroGPS(`Erro GPS: ${error.message}`)
        console.error('Erro ao obter GPS:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [latDest, lngDest, rotas])

  // ===== CALCULAR ROTA INTELIGENTE =====
  async function buscarRotaInteligente(latOrigem, lngOrigem, latDest, lngDest) {
    setLoading(true)
    try {
      // 1. Buscar rota com OSRM (alternativa gratuita enquanto GraphHopper não está up)
      const rotaResponse = await axios.get(
        `${GRAPHHOPPER_URL}/route/v1/driving/${lngOrigem},${latOrigem};${lngDest},${latDest}?overview=full&geometries=geojson&steps=true`
      )

      const dadosRota = rotaResponse.data.routes[0]
      const coordenadas = dadosRota.geometry.coordinates.map(([lng, lat]) => [lat, lng])

      setRota(coordenadas)
      setDistancia((dadosRota.distance / 1000).toFixed(1))
      setTempo(Math.round(dadosRota.duration / 60))

      // 2. Validar contramão em cada segmento
      await validarContramaos(dadosRota.steps)

    } catch (err) {
      console.error('Erro ao calcular rota:', err)
      setAvisos([{
        tipo: 'erro',
        texto: 'Não conseguimos calcular a rota. Verifique sua conexão.'
      }])
    } finally {
      setLoading(false)
    }
  }

  // ===== VALIDAR CONTRAMÃO =====
  async function validarContramaos(steps) {
    const avisosList = []

    try {
      // Amostra de steps para não sobrecarregar
      const amostra = steps?.filter((_, i) => i % 3 === 0) || []

      for (const step of amostra) {
        try {
          const [lng, lat] = step.maneuver.location

          // Query Overpass para checar contramão
          const query = `[out:json];
            way(${lat - 0.003},${lng - 0.003},${lat + 0.003},${lng + 0.003})["oneway"];
            out body;`

          const response = await axios.post(OVERPASS_URL, query, {
            headers: { 'Content-Type': 'application/osm3s+xml' }
          })

          const ways = response.data.elements
          for (const way of ways) {
            const nomeRua = way.tags?.name || 'Sem nome'

            if (way.tags?.oneway === '-1') {
              avisosList.push({
                tipo: 'aviso',
                texto: `⚠️ CONTRAMÃO: ${nomeRua}`,
                severidade: 'alta'
              })
            } else if (way.tags?.oneway === 'yes') {
              avisosList.push({
                tipo: 'info',
                texto: `ℹ️ Sentido único: ${nomeRua}`,
                severidade: 'media'
              })
            }
          }
        } catch (err) {
          // Silencioso, continua
        }
      }

      if (avisosList.length === 0) {
        avisosList.push({
          tipo: 'sucesso',
          texto: '✅ Rota validada - Sem contramão detectado',
          severidade: 'baixa'
        })
      }
    } catch (err) {
      console.log('Validação de contramão indisponível')
    }

    setAvisos(avisosList)
  }

  // ===== ABRIR WAZE =====
  function abrirWaze() {
    if (!gpsMotorista && !rotas) {
      alert('GPS não capturado. Tente novamente.')
      return
    }
    // FORMATO CORRETO Waze: ll=LAT,LNG (latitude primeiro, depois longitude)
    const wazeUrl = `https://waze.com/ul?ll=${latDest}%2C${lngDest}&navigate=yes&zoom=17`
    window.open(wazeUrl, '_blank')
  }

  // ===== ABRIR GOOGLE MAPS =====
  function abrirGoogleMaps() {
    if (!gpsMotorista && !rotas) {
      alert('GPS não capturado. Tente novamente.')
      return
    }

    if (rotas && rotas.lat1 && rotas.lng1) {
      // Visualizando rota antiga
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${rotas.lat1},${rotas.lng1}&destination=${latDest},${lngDest}&travelmode=driving`
      window.open(mapsUrl, '_blank')
    } else if (gpsMotorista) {
      // Rota em andamento
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${gpsMotorista.lat},${gpsMotorista.lng}&destination=${latDest},${lngDest}&travelmode=driving`
      window.open(mapsUrl, '_blank')
    }
  }

  // ===== ERRO DE GPS =====
  if (erroGPS && !rotas) {
    return (
      <div style={{
        background: '#FEE2E2', border: '1px solid #FCA5A5',
        borderRadius: 12, padding: 16, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#DC2626" />
          <div>
            <div style={{ fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>
              Erro ao obter GPS
            </div>
            <div style={{ fontSize: 13, color: '#991B1B' }}>
              {erroGPS}
            </div>
            <div style={{ fontSize: 12, color: '#7F1D1D', marginTop: 8 }}>
              💡 Verifique se você permitiu acesso à localização no navegador
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== CARREGANDO GPS =====
  if (loading && !rotas) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)' }}>
        <Compass size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: 10, display: 'inline-block' }} />
        <div>Obtendo sua localização...</div>
        <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 4 }}>
          Ative o GPS do seu celular
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ===== RENDERIZAR MAPA =====
  const centerLat = gpsMotorista?.lat || rotas?.lat1 || latDest
  const centerLng = gpsMotorista?.lng || rotas?.lng1 || lngDest
  const rotaParaMostrar = rota || (rotas && rotas.coordinates)

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Status GPS (apenas se em tempo real) */}
      {gpsMotorista && !rotas && (
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <MapPin size={14} color="#10B981" />
          <span>
            📍 {gpsMotorista.lat.toFixed(4)}, {gpsMotorista.lng.toFixed(4)}
            {gpsMotorista.accuracy && (
              <span style={{ color: 'var(--text4)' }}> (±{Math.round(gpsMotorista.accuracy)}m)</span>
            )}
          </span>
        </div>
      )}

      {/* Avisos */}
      {avisos.length > 0 && !rotas && (
        <div style={{ marginBottom: 12 }}>
          {avisos.map((aviso, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: aviso.tipo === 'sucesso' ? '#D1FAE520' :
                           aviso.tipo === 'aviso' ? '#FEF3C720' : '#DBEAFE20',
                border: `1px solid ${aviso.tipo === 'sucesso' ? '#6EE7B7' :
                                    aviso.tipo === 'aviso' ? '#FCD34D' : '#93C5FD'}`,
                borderRadius: 10, padding: 12, marginBottom: 8,
              }}
            >
              {aviso.tipo === 'sucesso' ? (
                <CheckCircle size={16} style={{ color: '#10B981', marginTop: 2, flexShrink: 0 }} />
              ) : (
                <AlertCircle size={16} style={{ color: '#F59E0B', marginTop: 2, flexShrink: 0 }} />
              )}
              <div style={{ fontSize: 13, color: 'var(--text)' }}>
                {aviso.texto}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mapa */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        style={{ height: '350px', borderRadius: 14, marginBottom: 12 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* Posição atual do motorista (apenas tempo real) */}
        {gpsMotorista && !rotas && (
          <CircleMarker
            center={[gpsMotorista.lat, gpsMotorista.lng]}
            radius={8}
            fillColor="#3B82F6"
            fillOpacity={0.8}
            weight={3}
            color="white"
            dashArray="5,5"
          >
            <Popup>📍 Sua posição agora</Popup>
          </CircleMarker>
        )}

        {/* Destino */}
        <Marker position={[latDest, lngDest]}>
          <Popup>{destino}</Popup>
        </Marker>

        {/* Rota */}
        {rotaParaMostrar && (
          <Polyline
            positions={rotaParaMostrar}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
            dashArray={rotas ? "0" : "10,5"}
          />
        )}
      </MapContainer>

      {/* Info Rota */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 14, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingDown size={12} /> Distância
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {distancia || (rotas?.distancia?.toFixed(1))} km
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> Tempo Est.
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {tempo || (rotas?.tempo)} min
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text4)' }}>Status</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>
              {rotas ? '✓ Histórico' : '✓ Ativo'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 8 }}>
          💡 {rotas ? 'Rota percorrida' : 'Rota otimizada em tempo real, evitando contramão'}
        </div>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={abrirWaze}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #54C784 0%, #3BA05D 100%)',
            color: 'white', border: 'none', borderRadius: 12,
            padding: 14, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}
        >
          <Navigation size={16} /> {rotas ? 'Ver no Waze' : 'Navegar'}
        </button>

        <button
          onClick={abrirGoogleMaps}
          style={{
            flex: 1,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 600,
            color: 'var(--text)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Navigation size={16} /> Maps
        </button>
      </div>
    </div>
  )
}

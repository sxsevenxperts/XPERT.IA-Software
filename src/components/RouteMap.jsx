import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Leaflet + Waze: Mapa visual real + navegação profissional ─────────────

// Fix Leaflet default icons (Vite bundler)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Ícones customizados
const ICON_YOU = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#3b82f6;border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(59,130,246,0.35);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const ICON_DEST = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#f97316;border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(249,115,22,0.35);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const ICON_PICKUP = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#10b981;border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(16,185,129,0.35);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export default function RouteMap({
  route          = [],
  currentLocation,
  pickupLocation,
  destination,
  plannedRoutes  = [],
  height         = 280,
  navigating     = false,
}) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const youMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const pickupMarkerRef = useRef(null)
  const routeLineRef = useRef(null)
  const fittedRef    = useRef(false)

  // ── Inicializar mapa Leaflet ─────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      touchZoom: true,
      dragging: true,
      scrollWheelZoom: false,
    }).setView([-15.8, -47.9], 5) // Centro do Brasil

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    // Invalidate size após render (fix para containers dinâmicos)
    setTimeout(() => map.invalidateSize(), 200)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Atualizar marcador "Você" (GPS em tempo real) ────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !currentLocation?.lat) return

    const latlng = [currentLocation.lat, currentLocation.lon]

    if (youMarkerRef.current) {
      youMarkerRef.current.setLatLng(latlng)
    } else {
      youMarkerRef.current = L.marker(latlng, { icon: ICON_YOU, zIndexOffset: 1000 })
        .bindTooltip('Você', { permanent: true, direction: 'top', offset: [0, -12], className: 'leaflet-tooltip-you' })
        .addTo(map)
    }

    // Primeiro GPS: centralizar no motorista
    if (!fittedRef.current && !destination?.lat) {
      map.setView(latlng, 15)
      fittedRef.current = true
    }
  }, [currentLocation?.lat, currentLocation?.lon])

  // ── Atualizar marcador Destino ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !destination?.lat) return

    const latlng = [destination.lat, destination.lon]

    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng(latlng)
    } else {
      destMarkerRef.current = L.marker(latlng, { icon: ICON_DEST })
        .bindTooltip('Destino', { permanent: true, direction: 'top', offset: [0, -10], className: 'leaflet-tooltip-dest' })
        .addTo(map)
    }

    // Fit bounds para mostrar Você + Destino
    if (currentLocation?.lat) {
      const bounds = L.latLngBounds([
        [currentLocation.lat, currentLocation.lon],
        latlng,
      ])
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
      fittedRef.current = true
    } else {
      map.setView(latlng, 14)
    }
  }, [destination?.lat, destination?.lon])

  // ── Atualizar marcador Origem ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !pickupLocation?.lat) return

    const latlng = [pickupLocation.lat, pickupLocation.lon]

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng(latlng)
    } else {
      pickupMarkerRef.current = L.marker(latlng, { icon: ICON_PICKUP })
        .bindTooltip('Origem', { permanent: false, direction: 'top', offset: [0, -10] })
        .addTo(map)
    }
  }, [pickupLocation?.lat, pickupLocation?.lon])

  // ── Desenhar rota no mapa ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Limpar rota anterior
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current)
      routeLineRef.current = null
    }

    // Usar rota planejada (OSRM) se disponível
    if (plannedRoutes?.[0]?.geometry) {
      const coords = plannedRoutes[0].geometry.map(([lon, lat]) => [lat, lon])
      routeLineRef.current = L.polyline(coords, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
      }).addTo(map)

      map.fitBounds(routeLineRef.current.getBounds(), { padding: [30, 30], maxZoom: 16 })
      return
    }

    // Fallback: rota do histórico GPS
    if (route.length > 1) {
      const coords = route.map(p => [p.lat, p.lon])
      routeLineRef.current = L.polyline(coords, {
        color: '#10b981',
        weight: 3,
        opacity: 0.7,
        dashArray: '8 4',
      }).addTo(map)
    }

    // Fallback: linha reta Origem → Destino
    if (!routeLineRef.current && currentLocation?.lat && destination?.lat) {
      routeLineRef.current = L.polyline([
        [currentLocation.lat, currentLocation.lon],
        [destination.lat, destination.lon],
      ], {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.5,
        dashArray: '10 6',
      }).addTo(map)
    }
  }, [route.length, plannedRoutes?.[0]?.geometry, currentLocation?.lat, destination?.lat])

  // ── Invalidar tamanho ao resize ──────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => mapRef.current?.invalidateSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ── Abrir Waze ───────────────────────────────────────────────────────────
  const openWaze = () => {
    if (!destination?.lat) return
    const wazeDeep = `waze://navigate?to=${destination.lat},${destination.lon}`
    const wazeWeb  = `https://waze.com/ul?ll=${destination.lat},${destination.lon}&navigate=yes`
    window.location.href = wazeDeep
    setTimeout(() => window.open(wazeWeb, '_blank'), 1500)
  }

  // ── Abrir Google Maps ────────────────────────────────────────────────────
  const openGoogleMaps = () => {
    if (!destination?.lat) return
    const url = currentLocation?.lat
      ? `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lon}/${destination.lat},${destination.lon}`
      : `https://www.google.com/maps?q=${destination.lat},${destination.lon}`
    window.open(url, '_blank')
  }

  // ── Centralizar em mim ──────────────────────────────────────────────────
  const centerOnMe = () => {
    if (currentLocation?.lat && mapRef.current) {
      mapRef.current.setView([currentLocation.lat, currentLocation.lon], 16, { animate: true })
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
      {/* Container do Mapa */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height,
          borderRadius: 12,
          overflow: 'hidden',
          background: '#1a1a2e',
        }}
      />

      {/* Overlay: info da rota */}
      {plannedRoutes?.[0] && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 80,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            padding: '6px 10px',
            borderRadius: 8,
            fontSize: 11,
            color: '#fff',
            zIndex: 1000,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, color: '#3b82f6' }}>
            {plannedRoutes[0].label}
          </span>
          <span>{plannedRoutes[0].distanceKm} km</span>
          <span style={{ color: '#10b981' }}>{plannedRoutes[0].durationMin} min</span>
        </div>
      )}

      {/* Botão centralizar */}
      <button
        onClick={centerOnMe}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid #475569',
          color: '#fff',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
        title="Centralizar em mim"
      >
        ◎
      </button>

      {/* Botões de navegação Waze / Google Maps */}
      {destination?.lat && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            right: 8,
            display: 'flex',
            gap: 8,
            zIndex: 1000,
          }}
        >
          <button
            onClick={openWaze}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: '#00bcd4',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            🗺️ Waze
          </button>
          <button
            onClick={openGoogleMaps}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: '#4285f4',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            📍 Google Maps
          </button>
        </div>
      )}

      {/* Legenda */}
      <div style={{
        position: 'absolute', bottom: destination?.lat ? 48 : 8,
        left: 8, display: 'flex', gap: 10, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '4px 8px', fontSize: 10,
      }}>
        <span style={{ color: '#10b981' }}>● Origem</span>
        <span style={{ color: '#3b82f6' }}>● Você</span>
        {destination?.lat && <span style={{ color: '#f97316' }}>● Destino</span>}
      </div>

      {/* CSS para tooltips do Leaflet */}
      <style>{`
        .leaflet-tooltip-you {
          background: #3b82f6 !important;
          color: #fff !important;
          border: none !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
        }
        .leaflet-tooltip-you::before {
          border-top-color: #3b82f6 !important;
        }
        .leaflet-tooltip-dest {
          background: #f97316 !important;
          color: #fff !important;
          border: none !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
        }
        .leaflet-tooltip-dest::before {
          border-top-color: #f97316 !important;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  )
}

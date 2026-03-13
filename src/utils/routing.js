// ─── Roteamento via OSRM (gratuito, sem API key) ───────────────────────────
// OSRM usa coordenadas como lon,lat (longitude primeiro!)

/**
 * Analisa o nível de tráfego pelo horário atual (heurística Brasil)
 */
export function getTrafficInfo() {
  const h = new Date().getHours()
  const day = new Date().getDay() // 0=Dom, 6=Sáb
  const weekday = day >= 1 && day <= 5

  if (!weekday)
    return { factor: 1.0, level: 'leve',     label: 'Fim de semana',      color: '#22c55e', icon: '🟢' }
  if (h >= 6  && h < 9)
    return { factor: 1.65, level: 'pesado',   label: 'Pico manhã (6h–9h)', color: '#ef4444', icon: '🔴' }
  if (h >= 9  && h < 11)
    return { factor: 1.25, level: 'moderado', label: 'Moderado (9h–11h)',  color: '#f59e0b', icon: '🟡' }
  if (h >= 12 && h < 14)
    return { factor: 1.20, level: 'moderado', label: 'Pico almoço',        color: '#f59e0b', icon: '🟡' }
  if (h >= 14 && h < 17)
    return { factor: 1.00, level: 'leve',     label: 'Trânsito normal',    color: '#22c55e', icon: '🟢' }
  if (h >= 17 && h < 20)
    return { factor: 1.70, level: 'pesado',   label: 'Pico tarde (17h–20h)', color: '#ef4444', icon: '🔴' }
  if (h >= 20 && h < 22)
    return { factor: 1.20, level: 'moderado', label: 'Moderado (20h–22h)', color: '#f59e0b', icon: '🟡' }
  return   { factor: 0.85, level: 'leve',     label: 'Trânsito leve',      color: '#22c55e', icon: '🟢' }
}

/**
 * Busca até 3 rotas alternativas via OSRM
 * @returns {Array|null} Array de rotas ou null se falhar
 */
export async function fetchRoutes(originLat, originLon, destLat, destLon) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${originLon},${originLat};${destLon},${destLat}` +
    `?overview=full&geometries=geojson&alternatives=true`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) return null

    // OSRM retorna [lon, lat] → converter para [lat, lon] (Leaflet)
    return data.routes.map((r) => ({
      points:      r.geometry.coordinates.map(([lng, lt]) => [lt, lng]),
      distanceKm:  parseFloat((r.distance / 1000).toFixed(2)),
      durationMin: Math.round(r.duration / 60),
    }))
  } catch {
    clearTimeout(timer)
    return null
  }
}

/**
 * Classifica rotas por pontuação combinada:
 * tempo (40%) + custo combustível (35%) + segurança (25%)
 * Retorna rotas ordenadas da melhor para a pior.
 */
export function rankRoutes(routes, fuelPrice, fuelConsumption, safetyScore = 60) {
  if (!routes?.length) return []

  const traffic = getTrafficInfo()
  const maxDist = Math.max(...routes.map((r) => r.distanceKm))
  const maxTime = Math.max(...routes.map((r) => r.durationMin))

  const scored = routes.map((r) => {
    const litros   = fuelConsumption > 0 ? r.distanceKm / fuelConsumption : r.distanceKm * 0.04
    const fuelCost = parseFloat((litros * (fuelPrice || 6.0)).toFixed(2))
    const adjMin   = Math.round(r.durationMin * traffic.factor)

    // Scores normalizados (0–100, maior = melhor)
    const timeScore = maxTime > 0 ? 100 - (r.durationMin / maxTime) * 100 : 100
    const costScore = maxDist > 0 ? 100 - (r.distanceKm  / maxDist) * 100 : 100
    const safeScore = Math.max(0, Math.min(100, safetyScore))

    return {
      ...r,
      fuelCost,
      adjMin,
      traffic,
      score: Math.round(timeScore * 0.40 + costScore * 0.35 + safeScore * 0.25),
      isRecommended: false,
    }
  })

  scored.sort((a, b) => b.score - a.score)

  const labels = ['✨ Recomendada', 'Alternativa A', 'Alternativa B']
  scored.forEach((r, i) => {
    r.label        = labels[i] ?? `Rota ${i + 1}`
    r.isRecommended = i === 0
  })

  return scored
}

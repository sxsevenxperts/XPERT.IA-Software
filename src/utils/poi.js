// ──── POI (Points of Interest) — Nominatim API ────────────────────────────

/**
 * Busca postos de gasolina próximos (Nominatim overpass query)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radiusKm - Raio de busca em km (default: 50)
 * @param {number} limit - Máximo de resultados (default: 10)
 * @returns {Promise<Array>} Lista de postos com nome, endereço, distância, tel
 */
export async function findGasStations(lat, lon, radiusKm = 50, limit = 10) {
  const radiusDeg = radiusKm / 111 // aprox: 1 grau ≈ 111km
  const bbox = [
    lon - radiusDeg,
    lat - radiusDeg,
    lon + radiusDeg,
    lat + radiusDeg,
  ]

  const overpassUrl =
    `https://overpass-api.de/api/interpreter?data=[bbox:${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}];` +
    `(node["amenity"="fuel"];way["amenity"="fuel"];relation["amenity"="fuel"];);` +
    `out center;`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(overpassUrl, { signal: controller.signal })
    clearTimeout(timer)

    if (!res.ok) return []
    const data = await res.json()
    if (!data.elements?.length) return []

    // Calcula distância e formata resultados
    const results = data.elements
      .map((el) => {
        const elLat = el.center?.lat || el.lat
        const elLon = el.center?.lon || el.lon
        if (!elLat || !elLon) return null

        const dist = calcDistanceKm(lat, lon, elLat, elLon)
        if (dist > radiusKm) return null

        return {
          name: el.tags?.name || 'Posto de gasolina',
          address: formatAddress(el),
          lat: elLat,
          lon: elLon,
          phone: el.tags?.phone || null,
          brand: el.tags?.brand || null,
          distance: dist,
          fuel_types: el.tags?.fuel?.split(';') || [],
        }
      })
      .filter((x) => x)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return results
  } catch (err) {
    console.warn('GasStations search failed:', err.message)
    return []
  }
}

/**
 * Calcula distância em km usando Haversine
 */
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Terra raio em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Formata endereço do POI
 */
function formatAddress(element) {
  const tags = element.tags || {}
  const parts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:city'],
  ].filter(Boolean)
  return parts.join(', ') || tags.name || 'Endereço não disponível'
}

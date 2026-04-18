/**
 * geocoding.js — Utilitário para converter endereços em coordenadas
 * Usa Nominatim (OSM) - API gratuita, sem autenticação necessária
 *
 * Suporta contexto geográfico automático baseado em coordenadas GPS,
 * garantindo que o destino seja geocodificado próximo ao motorista
 * (ex: motorista em Sobral → geocoding usa contexto de Sobral).
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'

// Cache em memória para reduzir requisições repetidas
const geocodeCache = new Map()
const reverseCache = new Map()
const MAX_CACHE_SIZE = 100

function cacheKey(obj) {
  return JSON.stringify(obj)
}

function addToCache(cache, key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove o mais antigo
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  cache.set(key, value)
}

/**
 * Geocodifica um endereço em coordenadas.
 *
 * @param {string} address - Endereço a ser geocodificado
 * @param {object} options - Opções adicionais
 * @param {number} options.lat - Latitude atual do motorista (contexto GPS)
 * @param {number} options.lng - Longitude atual do motorista (contexto GPS)
 * @param {string} options.city - Cidade (fallback se não tiver GPS)
 * @param {string} options.country - País (padrão: Brazil)
 * @returns {Promise<{lat, lng, displayName, boundingBox} | null>}
 */
export async function geocodeAddress(address, options = {}) {
  try {
    if (!address || typeof address !== 'string') return null

    const { lat, lng, city, country = 'Brazil' } = options

    const key = cacheKey({ address, lat, lng, city, country })
    if (geocodeCache.has(key)) return geocodeCache.get(key)

    // Se temos GPS, usamos viewbox para priorizar resultados próximos
    let url
    if (typeof lat === 'number' && typeof lng === 'number') {
      // Viewbox ~50km ao redor do motorista (0.45° ≈ 50km)
      const delta = 0.45
      const viewbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
      url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(address)}&viewbox=${viewbox}&bounded=0&limit=1&countrycodes=br`
    } else if (city) {
      const fullAddress = `${address}, ${city}, ${country}`
      url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&countrycodes=br`
    } else {
      url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(address + ', ' + country)}&limit=1&countrycodes=br`
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EasyDrive-App/1.0',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) return null

    const results = await response.json()
    if (!Array.isArray(results) || results.length === 0) return null

    const first = results[0]
    const latNum = parseFloat(first.lat)
    const lngNum = parseFloat(first.lon)

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null

    const result = {
      lat: latNum,
      lng: lngNum,
      displayName: first.display_name,
      boundingBox: first.boundingbox,
    }

    addToCache(geocodeCache, key, result)
    return result
  } catch (err) {
    console.error('Erro ao geocodificar endereço:', err)
    return null
  }
}

/**
 * Reverse geocode: converte coordenadas em endereço.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{address, displayName, city, state} | null>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    const key = cacheKey({ lat: lat.toFixed(4), lng: lng.toFixed(4) })
    if (reverseCache.has(key)) return reverseCache.get(key)

    const response = await fetch(
      `${REVERSE_URL}?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=pt-BR`,
      {
        headers: {
          'User-Agent': 'EasyDrive-App/1.0',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) return null

    const result = await response.json()
    if (!result || !result.address) return null

    const addr = result.address
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county

    const mapped = {
      address: addr.road || addr.neighbourhood || addr.suburb || 'Localização desconhecida',
      displayName: result.display_name || '',
      city: city || '',
      state: addr.state || '',
      country: addr.country || 'Brasil',
      postcode: addr.postcode || '',
      suburb: addr.suburb || addr.neighbourhood || '',
    }

    addToCache(reverseCache, key, mapped)
    return mapped
  } catch (err) {
    console.error('Erro ao fazer reverse geocode:', err)
    return null
  }
}

/**
 * Geocodifica origem e destino em paralelo
 * @param {string} origem - Endereço de origem
 * @param {string} destino - Endereço de destino
 * @param {object} options - Mesmas opções de geocodeAddress
 * @returns {Promise<{origem, destino}>}
 */
export async function geocodeDestinations(origem, destino, options = {}) {
  const [origemCoords, destinoCoords] = await Promise.all([
    geocodeAddress(origem, options),
    geocodeAddress(destino, options),
  ])

  return {
    origem: origemCoords,
    destino: destinoCoords,
  }
}

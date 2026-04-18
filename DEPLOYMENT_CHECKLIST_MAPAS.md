# ✅ Deployment Checklist - Mapas Inteligentes

## 📋 Pré-Deployment

- [ ] Código testado localmente
- [ ] Sem erros de console
- [ ] Imports corretos em todos os arquivos
- [ ] Variáveis de ambiente configuradas

### Arquivos Modificados/Criados
- [x] `/src/components/MapaRotaInteligente.jsx` - Component principal
- [x] `/src/lib/geocoding.js` - Utilitário de geocoding
- [x] `/src/pages/ActiveTrip.jsx` - Integração com corridas ativas
- [x] `/src/pages/History.jsx` - Integração com histórico de rotas

---

## 🔧 Verificação de Código

### 1. MapaRotaInteligente.jsx
```javascript
// ✅ Importações
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import axios from 'axios'

// ✅ Props corretos
export default function MapaRotaInteligente({
  destino, latDest, lngDest, tipoMotorista = 'uber', rotas = null
})

// ✅ Estado necessário
const [gpsMotorista, setGpsMotorista] = useState(null)
const [rota, setRota] = useState(null)
const [distancia, setDistancia] = useState(null)
const [tempo, setTempo] = useState(null)
const [avisos, setAvisos] = useState([])
const [loading, setLoading] = useState(true)
const [erroGPS, setErroGPS] = useState(null)

// ✅ URLs de API
const GRAPHHOPPER_URL = import.meta.env.VITE_GRAPHHOPPER_URL || 'https://router.project-osrm.org'
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
```

### 2. geocoding.js
```javascript
// ✅ Função principal
export async function geocodeAddress(address, city = 'São Paulo', country = 'Brazil')

// ✅ Retorno esperado
// { lat: number, lng: number, displayName: string, boundingBox: [...] }
```

### 3. ActiveTrip.jsx
```javascript
// ✅ Imports
import { geocodeAddress } from '../lib/geocoding'
import MapaRotaInteligente from '../components/MapaRotaInteligente'

// ✅ State
const [destinoCoords, setDestinoCoords] = useState(null)

// ✅ Geocoding quando trip muda
useEffect(() => {
  if (trip?.destino) geocodeDestinationForTrip()
}, [trip?.id])

// ✅ Renderização do mapa
{destinoCoords && (
  <MapaRotaInteligente
    destino={trip.destino}
    latDest={destinoCoords.lat}
    lngDest={destinoCoords.lng}
    tipoMotorista={trip.plataforma || 'uber'}
    rotas={null}
  />
)}
```

### 4. History.jsx
```javascript
// ✅ Imports
import { geocodeAddress } from '../lib/geocoding'
import MapaRotaInteligente from '../components/MapaRotaInteligente'
import { ChevronDown } from 'lucide-react'

// ✅ State
const [expandedMaps, setExpandedMaps] = useState({})
const [tripCoords, setTripCoords] = useState({})

// ✅ Função de toggle + geocoding
async function toggleMapAndGeocode(tripId, destino) { ... }

// ✅ Botão de visualização
<button onClick={() => toggleMapAndGeocode(trip.id, trip.destino)}>
  🗺️ {expandedMaps[trip.id] ? 'Ocultar' : 'Ver'} rota
</button>

// ✅ Renderização condicional
{expandedMaps[trip.id] && tripCoords[trip.id] && (
  <MapaRotaInteligente {...props} />
)}
```

---

## 🧪 Testes Locais

### Teste 1: Verificar Imports
```bash
npm run dev

# Esperado: Sem erros de módulo não encontrado
```

### Teste 2: GPS Functionality
Abrir DevTools → Console e verificar:
```javascript
console.log("GPS Latitude:", gpsMotorista?.lat)
console.log("GPS Longitude:", gpsMotorista?.lng)
console.log("GPS Accuracy:", gpsMotorista?.accuracy)

// Esperado: Valores numéricos com acurácia em metros
```

### Teste 3: Geocoding
```javascript
const { geocodeAddress } = await import('./src/lib/geocoding.js')
const coords = await geocodeAddress("Avenida Paulista, São Paulo")
console.log(coords)

// Esperado: { lat: -23.5..., lng: -46.6..., displayName: "...", ... }
```

### Teste 4: Mapa Renderização
Verificar no DevTools:
- [ ] Elemento MapContainer existe
- [ ] Tiles do OpenStreetMap carregam
- [ ] Marker aparece
- [ ] Polyline (rota) aparece
- [ ] Sem erros de WebGL/Canvas

---

## 🚀 Deployment em Produção

### 1. Build
```bash
npm run build

# Esperado: Sem warnings significativos, assets completos
```

### 2. Deploy
```bash
# Vercel (recomendado)
npm install -g vercel
vercel
```

### 3. Testar em Produção
- [ ] Acessar app
- [ ] Testar corrida com mapa
- [ ] Testar histórico com mapa
- [ ] Testar em mobile

---

## 📱 Testes em Mobile

### iOS Safari
- [ ] GPS solicita permissão
- [ ] Mapa é responsivo
- [ ] Sem freeze

### Android Chrome
- [ ] GPS solicita permissão
- [ ] Mapa é responsivo
- [ ] Sem freeze

---

## 🐛 Troubleshooting

### GPS não inicializa
- Testar em HTTPS ou localhost (geolocation requer secure context)
- Verificar permissões do navegador
- Verificar se dispositivo tem GPS habilitado

### Nominatim rate limited
- Implementar cache local
- Usar User-Agent header

### OSRM timeout
- Aumentar timeout
- Usar GraphHopper como fallback

---

## ✅ Final Checklist

- [ ] Todos os testes passam
- [ ] Sem console.log() de debug
- [ ] Código formatado
- [ ] Responsivo em mobile
- [ ] GPS funciona
- [ ] Geocoding funciona
- [ ] Mapas carregam
- [ ] Deep links funcionam
- [ ] Performance OK (Lighthouse > 80)

---

**Status:** ✅ Pronto para Deployment  
**Data:** 2026-04-18

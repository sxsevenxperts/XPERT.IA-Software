import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Hook que escuta notificações push (Uber/99) e GPS do motorista.
 * - Extrai origem (GPS real) e destino (texto da notificação)
 * - Retorna dados para que a UI renderize o mapa automaticamente
 *
 * Funciona em web (Service Worker), mobile (Capacitor) e modo teste (CustomEvent).
 */
export function useNotificationListener() {
  const [notificationData, setNotificationData] = useState(null)
  const [gpsOrigin, setGpsOrigin] = useState(null)
  const mountedRef = useRef(true)

  // Handler estável para o CustomEvent de teste (permite removeEventListener)
  const handleTesteRef = useRef(null)

  const processarNotificacao = useCallback((notification) => {
    if (!notification) return
    const texto = notification.body || notification.message || notification.textoOriginal || ''
    if (!texto || typeof texto !== 'string') return

    // Padrões de extração para 99, Uber e genérico
    const padroes = [
      // 99: "📍 Buscar em X - Levar em Y"
      /levar em ([^-\n\r]+?)(?:\s*[-\n\r]|$)/i,
      // Uber: "Você tem um passageiro em X"
      /passageiro em ([^.\n\r]+)/i,
      // Genérico: "Destino: X"
      /destino:\s*([^-\n\r]+)/i,
      // Fallback: última entidade com iniciais maiúsculas
      /([A-ZÀ-Ý][a-zA-ZÀ-ý\s]+[A-ZÀ-Ý][a-zA-ZÀ-ý\s]*)$/,
    ]

    let destino = null
    for (const padrao of padroes) {
      const match = texto.match(padrao)
      if (match && match[1]) {
        destino = match[1].trim()
        break
      }
    }

    if (destino && mountedRef.current) {
      setNotificationData({
        destino,
        textoOriginal: texto,
        timestamp: new Date(),
      })
    }
  }, [])

  // 1. ESCUTAR NOTIFICAÇÕES PUSH (Service Worker + Capacitor + teste)
  useEffect(() => {
    mountedRef.current = true
    let swMessageHandler = null
    let capacitorHandle = null

    // Service Worker (web PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      swMessageHandler = (event) => {
        const data = event?.data
        if (data && data.tipo === 'corrida_99_uber') {
          processarNotificacao(data)
        }
      }
      navigator.serviceWorker.addEventListener('message', swMessageHandler)
    }

    // Capacitor (mobile nativo) - carrega dinamicamente apenas se disponível em runtime
    try {
      if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.PushNotifications) {
        const { PushNotifications } = window.Capacitor.Plugins
        // addListener retorna uma promise com .remove() em versões mais recentes
        const ret = PushNotifications.addListener('pushNotificationReceived', (notification) => {
          processarNotificacao(notification)
        })
        if (ret && typeof ret.then === 'function') {
          ret.then((h) => { capacitorHandle = h }).catch(() => {})
        } else {
          capacitorHandle = ret
        }
      }
    } catch (err) {
      console.warn('Capacitor PushNotifications indisponível:', err?.message || err)
    }

    // Listener de teste (CustomEvent)
    handleTesteRef.current = (e) => processarNotificacao(e.detail)
    window.addEventListener('notificacao-teste', handleTesteRef.current)

    return () => {
      mountedRef.current = false
      if (swMessageHandler && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', swMessageHandler)
      }
      try {
        if (capacitorHandle && typeof capacitorHandle.remove === 'function') {
          capacitorHandle.remove()
        }
      } catch { /* silent */ }
      if (handleTesteRef.current) {
        window.removeEventListener('notificacao-teste', handleTesteRef.current)
        handleTesteRef.current = null
      }
    }
  }, [processarNotificacao])

  // 2. CAPTURAR GPS DO MOTORISTA (tempo real)
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocalização não suportada neste navegador.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!mountedRef.current) return
        setGpsOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        console.warn('GPS indisponível:', error.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    return () => {
      try { navigator.geolocation.clearWatch(watchId) } catch { /* silent */ }
    }
  }, [])

  // Função de teste exposta ao caller
  const simularNotificacao = useCallback((destino) => {
    if (!destino) return
    setNotificationData({
      destino,
      textoOriginal: `[TESTE] Levar em ${destino}`,
      timestamp: new Date(),
    })
  }, [])

  return {
    notificationData,
    gpsOrigin,
    simularNotificacao,
  }
}

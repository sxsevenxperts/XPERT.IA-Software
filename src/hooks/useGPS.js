import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useGPS() {
  const watchId = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          await supabase.from('profiles').update({
            lat: latitude,
            lng: longitude,
            last_seen: new Date().toISOString(),
          }).eq('id', user.id)
        } catch { /* silent GPS update failure */ }
      },
      () => { /* geolocation error ignored */ },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [])
}

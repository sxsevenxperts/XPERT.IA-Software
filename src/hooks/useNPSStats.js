import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useNPSStats() {
  const [stats, setStats] = useState({ npsCount: 0, npsToday: 0, npsAvg: 0 })

  useEffect(() => {
    async function load() {
      try {
        const { count: total } = await supabase
          .from('daily_stats')
          .select('*', { count: 'exact', head: true })

        const todayStr = new Date().toISOString().split('T')[0]
        const { count: today } = await supabase
          .from('daily_stats')
          .select('*', { count: 'exact', head: true })
          .gte('date', todayStr)

        setStats({ npsCount: total || 0, npsToday: today || 0, npsAvg: 0 })
      } catch { /* silent */ }
    }
    load()
  }, [])

  return stats
}

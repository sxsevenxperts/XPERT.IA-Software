import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useNPSStats() {
  const [npsStats, setNpsStats] = useState({
    npsCount: 0,
    npsToday: 0,
    loading: true,
    error: null,
  })

  const fetchNPSStats = async () => {
    try {
      setNpsStats(prev => ({ ...prev, loading: true, error: null }))

      if (!supabase) {
        setNpsStats({
          npsCount: 0,
          npsToday: 0,
          loading: false,
          error: 'Supabase not available',
        })
        return
      }

      // Get total NPS responses
      const { count: totalCount, error: totalError } = await supabase
        .from('nps_responses')
        .select('*', { count: 'exact', head: true })

      if (totalError) throw totalError

      // Get today's NPS responses
      const today = new Date().toISOString().split('T')[0]
      const { count: todayCount, error: todayError } = await supabase
        .from('nps_responses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)

      if (todayError) throw todayError

      setNpsStats({
        npsCount: totalCount || 0,
        npsToday: todayCount || 0,
        loading: false,
        error: null,
      })
    } catch (err) {
      console.error('NPS Stats error:', err)
      setNpsStats(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load NPS stats',
      }))
    }
  }

  useEffect(() => {
    fetchNPSStats()
  }, [])

  return {
    ...npsStats,
    refetch: fetchNPSStats,
  }
}

import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('easydrive-theme') || 'dark'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function setTheme(t) {
    localStorage.setItem('easydrive-theme', t)
    setThemeState(t)
    applyTheme(t)
  }

  return { theme, setTheme }
}

function applyTheme(theme) {
  const root = document.documentElement
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

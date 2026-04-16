import { useState, useEffect } from 'react'

let _addToast = null
export function showToast(msg, type = 'info') {
  if (_addToast) _addToast({ msg, type, id: Date.now() })
}

export default function AlertToast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _addToast = (t) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500)
    }
    return () => { _addToast = null }
  }, [])

  if (!toasts.length) return null

  const colors = { info: '#3B82F6', success: '#10B981', error: '#EF4444', warning: '#F59E0B' }

  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: '90%', maxWidth: 400 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--bg2)', border: `1px solid ${colors[t.type] || colors.info}`,
          borderLeft: `4px solid ${colors[t.type] || colors.info}`,
          borderRadius: 10, padding: '12px 16px',
          fontSize: 14, color: 'var(--text)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.2s ease',
        }}>
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

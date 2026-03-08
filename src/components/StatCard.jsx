export default function StatCard({ icon, label, value, sub, color = '#3b82f6', small }) {
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 12,
      padding: small ? 12 : 14,
      border: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: small ? 18 : 22, fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#64748b' }}>{sub}</div>}
    </div>
  )
}

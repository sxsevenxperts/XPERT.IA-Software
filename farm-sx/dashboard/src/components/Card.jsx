export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  )
}

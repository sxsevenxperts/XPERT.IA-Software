import { useEffect, useState } from 'react'
import { Activity, Briefcase, LogOut, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminPanel({ user, onLogout }) {
  const [stats, setStats] = useState({ users: 0, cases: 0, activeCases: 0 })
  useEffect(() => { Promise.all([supabase.from('profiles').select('*', { count: 'exact', head: true }), supabase.from('casos').select('*', { count: 'exact', head: true }), supabase.from('casos').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento')]).then(([users, cases, activeCases]) => setStats({ users: users.count || 0, cases: cases.count || 0, activeCases: activeCases.count || 0 })) }, [])
  return <div style={{ minHeight: '100vh', padding: 24, background: 'var(--bg)', color: 'var(--text)' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}><div><h1>Administração</h1><p style={{ color: 'var(--text3)' }}>{user?.email}</p></div><button onClick={onLogout} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: 9, background: 'var(--red-dim)', color: 'var(--red)', border: 0, borderRadius: 8 }}><LogOut size={15} /> Sair</button></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>{[[Users, 'Usuários', stats.users], [Briefcase, 'Casos', stats.cases], [Activity, 'Casos ativos', stats.activeCases]].map(([Icon, label, value]) => <div key={label} style={{ padding: 18, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }}><Icon size={18} color="var(--blue)" /><div style={{ fontSize: 28, fontWeight: 800, marginTop: 9 }}>{value}</div><span style={{ color: 'var(--text3)', fontSize: 12 }}>{label}</span></div>)}</div></div>
}

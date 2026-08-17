import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { getCurrentUser, supabase } from '../lib/supabase'

const types = { audiencia: ['Audiência', 'var(--red)'], prazo: ['Prazo', 'var(--amber)'], reuniao: ['Reunião', 'var(--blue)'], pericia: ['Perícia', 'var(--purple)'], protocolo: ['Protocolo', 'var(--green)'], outro: ['Outro', 'var(--text3)'] }

export default function Agenda() {
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', tipo: 'reuniao', data_inicio: '', local: '', descricao: '' })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('agenda_eventos').select('*').order('data_inicio', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const upcoming = useMemo(() => events.filter((event) => event.status !== 'cancelado'), [events])

  async function addEvent(event) {
    event.preventDefault()
    if (!form.titulo || !form.data_inicio) return
    const user = await getCurrentUser()
    if (!user) return alert('Sua sessão expirou. Entre novamente.')
    const { data, error } = await supabase.from('agenda_eventos').insert({ ...form, user_id: user.id, data_inicio: new Date(form.data_inicio).toISOString() }).select().single()
    if (error) return alert(error.message)
    setEvents((current) => [...current, data].sort((a, b) => a.data_inicio.localeCompare(b.data_inicio)))
    setForm({ titulo: '', tipo: 'reuniao', data_inicio: '', local: '', descricao: '' })
    setShowForm(false)
  }

  async function removeEvent(id) {
    if (!window.confirm('Cancelar este compromisso?')) return
    await supabase.from('agenda_eventos').update({ status: 'cancelado' }).eq('id', id)
    setEvents((current) => current.map((event) => event.id === id ? { ...event, status: 'cancelado' } : event))
  }

  return <div className="fade-in" style={{ padding: 24, maxWidth: 1100 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><div><h1 style={{ fontSize: 24 }}>Agenda</h1><p style={{ color: 'var(--text3)', fontSize: 13 }}>Compromissos e prazos do escritório</p></div><button onClick={() => setShowForm((value) => !value)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg,var(--blue),var(--purple))', color: 'white', fontWeight: 700, cursor: 'pointer' }}><Plus size={15} /> Novo compromisso</button></div>
    {showForm && <form onSubmit={addEvent} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 18 }}><input required placeholder="Título" value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /><select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}>{Object.keys(types).map((type) => <option key={type} value={type}>{types[type][0]}</option>)}</select><input required type="datetime-local" value={form.data_inicio} onChange={(event) => setForm({ ...form, data_inicio: event.target.value })} /><input placeholder="Local ou link" value={form.local} onChange={(event) => setForm({ ...form, local: event.target.value })} /><input placeholder="Descrição" value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} /><button type="submit" style={{ background: 'var(--blue)', color: 'white', border: 0, borderRadius: 8, fontWeight: 700 }}>Salvar</button></form>}
    {loading ? <div style={{ padding: 40, color: 'var(--text3)' }}>Carregando agenda...</div> : upcoming.length === 0 ? <div style={{ padding: 50, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center', color: 'var(--text3)' }}><Calendar size={34} style={{ marginBottom: 10 }} /><div>Nenhum compromisso cadastrado.</div></div> : <div style={{ display: 'grid', gap: 9 }}>{upcoming.map((event) => { const [label, color] = types[event.tipo] || types.outro; return <div key={event.id} style={{ display: 'flex', gap: 15, alignItems: 'center', padding: 15, background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, borderRadius: '0 10px 10px 0' }}><div style={{ minWidth: 88, color, fontWeight: 700, fontSize: 12 }}>{new Date(event.data_inicio).toLocaleDateString('pt-BR')}<br />{new Date(event.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{event.titulo}</div><div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{label} · {event.local || 'Local não informado'}{event.descricao ? ` · ${event.descricao}` : ''}</div></div><button onClick={() => removeEvent(event.id)} title="Cancelar" style={{ background: 'none', border: 0, color: 'var(--text4)', cursor: 'pointer' }}><Trash2 size={15} /></button></div> })}</div>}
  </div>
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bell, CheckCircle, Clock, RefreshCw, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

const urgency = {
  critica: { label: 'CRÍTICA', color: 'var(--red)', bg: 'var(--red-dim)' },
  alta: { label: 'ALTA', color: 'var(--amber)', bg: 'var(--amber-dim)' },
  media: { label: 'MÉDIA', color: 'var(--blue)', bg: 'var(--blue-dim)' },
  baixa: { label: 'BAIXA', color: 'var(--green)', bg: 'var(--green-dim)' },
}

function daysUntil(value) {
  if (!value) return null
  return Math.ceil((new Date(`${value}T23:59:59`) - new Date()) / 86400000)
}

export default function Intimacoes() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: queryError } = await supabase
      .from('intimacoes')
      .select('*, clientes(nome), casos(titulo)')
      .order('prazo', { ascending: true, nullsFirst: false })
    if (queryError) setError(queryError.message)
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => items.filter((item) => {
    const label = `${item.tipo} ${item.tribunal || ''} ${item.numero_processo || ''} ${item.clientes?.nome || ''}`.toLowerCase()
    const matchesSearch = !search || label.includes(search.toLowerCase())
    const matchesStatus = status === 'todas' || (status === 'nao_lidas' ? !item.lida : item.status === status)
    return matchesSearch && matchesStatus
  }), [items, search, status])

  async function markRead(item) {
    if (item.lida) return
    await supabase.from('intimacoes').update({ lida: true }).eq('id', item.id)
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, lida: true } : row))
    setSelected((current) => current?.id === item.id ? { ...current, lida: true } : current)
  }

  const unread = items.filter((item) => !item.lida).length
  const critical = items.filter((item) => ['critica', 'alta'].includes(item.urgencia)).length
  const week = items.filter((item) => (daysUntil(item.prazo) ?? 99) <= 7).length

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[[Bell, 'Não lidas', unread, 'var(--blue)'], [AlertTriangle, 'Urgentes', critical, 'var(--red)'], [Clock, 'Até 7 dias', week, 'var(--amber)'], [CheckCircle, 'Total', items.length, 'var(--green)']].map(([Icon, label, value, color]) => (
          <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <Icon size={17} color={color} /><div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{value}</div><div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}><Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text4)' }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar intimações..." style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} /></div>
            <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)' }}><option value="todas">Todos</option><option value="nao_lidas">Não lidas</option><option value="pendente">Pendentes</option><option value="urgente">Urgentes</option></select>
            <button onClick={load} style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--blue)', cursor: 'pointer' }}><RefreshCw size={14} /></button>
          </div>
          {error && <div style={{ padding: 12, marginBottom: 12, background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 8 }}>{error}</div>}
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Carregando intimações...</div> : filtered.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', background: 'var(--bg2)', borderRadius: 12 }}>Nenhuma intimação cadastrada.</div> : filtered.map((item) => {
            const config = urgency[item.urgencia] || urgency.media
            const remaining = daysUntil(item.prazo)
            return <button key={item.id} onClick={() => { setSelected(item); markRead(item) }} style={{ width: '100%', textAlign: 'left', padding: 15, marginBottom: 8, background: selected?.id === item.id ? 'var(--bg3)' : 'var(--bg2)', border: '1px solid var(--border)', borderLeft: `3px solid ${config.color}`, borderRadius: '0 10px 10px 0', color: 'var(--text)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{!item.lida && '• '}{item.tipo}</strong><span style={{ padding: '2px 7px', borderRadius: 5, background: config.bg, color: config.color, fontSize: 10, fontWeight: 700 }}>{config.label}</span></div>
              <div style={{ display: 'flex', gap: 14, marginTop: 7, color: 'var(--text3)', fontSize: 12 }}><span>{item.clientes?.nome || item.casos?.titulo || 'Caso não vinculado'}</span><span>{item.tribunal || 'Tribunal não informado'}</span><span>{remaining === null ? 'Sem prazo' : remaining < 0 ? 'Vencida' : `${remaining}d`}</span></div>
            </button>
          })}
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, minHeight: 280 }}>
          {selected ? <><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: 'var(--text4)' }}>{selected.id}</span><span style={{ fontSize: 11, color: 'var(--text3)' }}>{selected.prazo ? new Date(`${selected.prazo}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'}</span></div><h3 style={{ margin: '14px 0 10px' }}>{selected.tipo}</h3><p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>{selected.descricao || 'Sem descrição registrada.'}</p><dl style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text3)' }}><dt>Processo</dt><dd>{selected.numero_processo || '—'}</dd><dt>Tribunal / Vara</dt><dd>{selected.tribunal || '—'} · {selected.vara || '—'}</dd></dl></> : <p style={{ color: 'var(--text3)', textAlign: 'center', marginTop: 80 }}>Selecione uma intimação para ver os detalhes.</p>}
        </div>
      </div>
    </div>
  )
}

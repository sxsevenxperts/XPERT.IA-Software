import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Clock, AlertCircle, CheckCircle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const statusConfig = {
  pendente:     { label: 'Pendente',     bg: 'var(--amber-dim)', color: 'var(--amber)',      icon: Clock },
  em_andamento: { label: 'Em andamento', bg: 'var(--blue-dim)',  color: 'var(--blue-light)', icon: AlertCircle },
  concluido:    { label: '✓ Concluído',  bg: 'var(--green-dim)', color: 'var(--green)',      icon: CheckCircle },
}

const prioridadeConfig = {
  alta:  { label: 'Alta',   color: 'var(--red)',   bg: 'rgba(239,68,68,0.1)' },
  normal:{ label: 'Normal', color: 'var(--amber)', bg: 'rgba(217,119,6,0.1)' },
  baixa: { label: 'Baixa',  color: 'var(--text4)', bg: 'rgba(107,114,128,0.1)' },
}

function NovaTarefaModal({ onClose, onSave }) {
  const [form, setForm] = useState({ titulo: '', descricao: '', prioridade: 'normal', data_vencimento: '' })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.titulo.trim()) return alert('Título obrigatório')
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:20 }}>
      <div className="fade-in" style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:18,padding:'28px',width:'100%',maxWidth:500,boxShadow:'var(--shadow)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:22 }}>
          <h3 style={{ fontSize:16,fontWeight:700 }}>Nova Tarefa</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Título *</label>
            <input type="text" placeholder="Ex: Preparar documentação" value={form.titulo} onChange={e=>f('titulo',e.target.value)}
              style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--blue)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Descrição</label>
            <textarea placeholder="Detalhes da tarefa..." value={form.descricao} onChange={e=>f('descricao',e.target.value)}
              style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none',minHeight:80,fontFamily:'inherit',resize:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--blue)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Prioridade</label>
              <select value={form.prioridade} onChange={e=>f('prioridade',e.target.value)}
                style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}>
                <option value="alta">Alta</option>
                <option value="normal">Normal</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Data de vencimento</label>
              <input type="date" value={form.data_vencimento} onChange={e=>f('data_vencimento',e.target.value)}
                style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--blue)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>
          </div>
        </div>
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:22 }}>
          <button onClick={onClose} style={{ padding:'10px 18px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,color:'var(--text2)',fontSize:13,cursor:'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'10px 22px',background:'linear-gradient(135deg,var(--blue),var(--purple))',border:'none',borderRadius:9,color:'white',fontSize:13,fontWeight:700,boxShadow:'0 4px 14px rgba(59,130,246,0.3)',opacity:saving?0.7:1,cursor:saving?'wait':'pointer' }}>
            {saving ? 'Salvando...' : 'Salvar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Tarefas() {
  const [tarefas, setTarefas]       = useState([])
  const [showModal, setShowModal]   = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilter]   = useState('todos')
  const [loading, setLoading]       = useState(true)

  const loadTarefas = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setTarefas(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadTarefas() }, [loadTarefas])

  async function addTarefa(form) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Não autenticado')
    const { error } = await supabase.from('tarefas').insert({
      user_id: user.id,
      titulo: form.titulo,
      descricao: form.descricao,
      prioridade: form.prioridade,
      status: 'pendente',
      data_vencimento: form.data_vencimento || null,
    })
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    await loadTarefas()
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('tarefas')
      .update({ status: newStatus, data_conclusao: newStatus === 'concluido' ? new Date().toISOString().split('T')[0] : null })
      .eq('id', id)
    if (!error) setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  async function deleteTarefa(id) {
    const { error } = await supabase.from('tarefas').delete().eq('id', id)
    if (!error) setTarefas(prev => prev.filter(t => t.id !== id))
  }

  const filtered = tarefas.filter(t => {
    const matchSearch = (t.titulo||'').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div style={{ padding:'0 24px 24px' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:28,fontWeight:700,marginBottom:8 }}>Tarefas & Checklist</h1>
        <p style={{ color:'var(--text3)',fontSize:14 }}>Gerencie suas tarefas e prazos críticos</p>
      </div>

      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
        <div style={{ flex:1,minWidth:200,display:'flex',alignItems:'center',gap:10,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'0 12px' }}>
          <Search size={18} style={{ color:'var(--text3)' }}/>
          <input type="text" placeholder="Buscar tarefas..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            style={{ flex:1,background:'transparent',border:'none',outline:'none',fontSize:14,color:'var(--text)',padding:'12px 0' }}/>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 18px',background:'linear-gradient(135deg,var(--blue),var(--purple))',border:'none',borderRadius:10,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 14px rgba(59,130,246,0.3)' }}>
          <Plus size={16}/> Nova Tarefa
        </button>
      </div>

      <div style={{ display:'flex',gap:12,marginBottom:20,overflowX:'auto',paddingBottom:4 }}>
        {['todos','pendente','em_andamento','concluido'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{
            padding:'8px 14px',borderRadius:8,border:'1px solid '+(filterStatus===s?'var(--blue)':'var(--border)'),
            background:filterStatus===s?'var(--blue-dim)':'transparent',color:filterStatus===s?'var(--blue-light)':'var(--text2)',
            fontSize:13,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'
          }}>
            {s==='todos'?'Todas':statusConfig[s]?.label||s}
          </button>
        ))}
      </div>

      <div style={{ display:'grid',gap:12 }}>
        {loading ? (
          <div style={{ textAlign:'center',padding:'40px',color:'var(--text3)' }}>Carregando tarefas...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center',padding:'40px 20px',color:'var(--text3)' }}>
            <Clock size={40} style={{ margin:'0 auto 12px',opacity:0.5 }}/>
            <p>{tarefas.length===0?'Nenhuma tarefa cadastrada. Clique em "Nova Tarefa" para começar.':'Nenhuma tarefa encontrada'}</p>
          </div>
        ) : (
          filtered.map(tarefa => {
            const statusInfo = statusConfig[tarefa.status] || statusConfig.pendente
            const prioridadeInfo = prioridadeConfig[tarefa.prioridade] || prioridadeConfig.normal
            return (
              <div key={tarefa.id} className="fade-in" style={{
                background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'16px',
                display:'flex',gap:16,alignItems:'flex-start',transition:'all 0.2s'
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--blue)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              >
                <button onClick={()=>updateStatus(tarefa.id, tarefa.status==='concluido'?'pendente':'concluido')}
                  style={{
                    width:24,height:24,borderRadius:'50%',border:'2px solid '+(tarefa.status==='concluido'?'var(--green)':'var(--border)'),
                    background:tarefa.status==='concluido'?'var(--green)':'transparent',cursor:'pointer',marginTop:2,
                    display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:12
                  }}>
                  {tarefa.status==='concluido' && '✓'}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8 }}>
                    <h3 style={{ fontSize:14,fontWeight:600,margin:0 }}>{tarefa.titulo}</h3>
                    <span style={{ padding:'3px 8px',borderRadius:5,fontSize:11,fontWeight:600,background:prioridadeInfo.bg,color:prioridadeInfo.color }}>
                      {prioridadeInfo.label}
                    </span>
                  </div>
                  {tarefa.descricao && <p style={{ fontSize:13,color:'var(--text3)',margin:'0 0 8px 0' }}>{tarefa.descricao}</p>}
                  <div style={{ display:'flex',alignItems:'center',gap:16,fontSize:12,color:'var(--text3)' }}>
                    {tarefa.data_vencimento && <span>📅 {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}</span>}
                    <span style={{ padding:'4px 10px',borderRadius:6,background:statusInfo.bg,color:statusInfo.color,fontWeight:500 }}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <button onClick={()=>deleteTarefa(tarefa.id)}
                  style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4 }}>
                  <X size={16}/>
                </button>
              </div>
            )
          })
        )}
      </div>

      {showModal && <NovaTarefaModal onClose={()=>setShowModal(false)} onSave={addTarefa}/>}
    </div>
  )
}

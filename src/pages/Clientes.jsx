import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, MoreHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const statusConfig = {
  ativo:   { label: 'Ativo',   bg: 'var(--blue-dim)',         color: 'var(--blue-light)' },
  urgente: { label: 'Urgente', bg: 'var(--red-dim)',          color: 'var(--red)' },
  ganho:   { label: 'Ganho',   bg: 'var(--green-dim)',        color: 'var(--green)' },
  inativo: { label: 'Inativo', bg: 'rgba(255,255,255,0.05)', color: 'var(--text4)' },
}

function NewClientModal({ onClose, onSave }) {
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '', email: '', benefit: '', advogado: '' })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const benefits = ['Aposentadoria por Idade','Aposentadoria Programada','Aposentadoria Especial','BPC/Loas','BPC/Loas Idoso','Auxílio-Doença','Revisão do Teto','Pensão por Morte','Aposentadoria por Invalidez']

  const handleSave = async () => {
    if (!form.nome.trim()) return alert('Nome obrigatório')
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:20 }}>
      <div className="fade-in" style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:18,padding:'28px',width:'100%',maxWidth:520,boxShadow:'var(--shadow)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <h3 style={{ fontSize:16,fontWeight:700 }}>Novo Cliente</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
          {[
            { label:'Nome completo', key:'nome', placeholder:'Ex: João Carlos Silva', span:2 },
            { label:'CPF', key:'cpf', placeholder:'000.000.000-00' },
            { label:'Telefone / WhatsApp', key:'telefone', placeholder:'(11) 99999-9999' },
            { label:'E-mail', key:'email', placeholder:'cliente@email.com', span:2 },
            { label:'Advogado responsável', key:'advogado', placeholder:'Dr. Nome' },
          ].map(({ label, key, placeholder, span }) => (
            <div key={key} style={{ gridColumn: span===2 ? 'span 2' : 'span 1' }}>
              <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:6 }}>{label}</label>
              <input value={form[key]} onChange={e=>f(key,e.target.value)} placeholder={placeholder}
                style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--blue)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>
          ))}
          <div style={{ gridColumn:'span 2' }}>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:6 }}>Tipo de benefício pretendido</label>
            <select value={form.benefit} onChange={e=>f('benefit',e.target.value)}
              style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:form.benefit?'var(--text)':'var(--text4)',outline:'none' }}>
              <option value="">Selecione o tipo...</option>
              {benefits.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex',gap:10,marginTop:22,justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 18px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,color:'var(--text2)',fontSize:13,cursor:'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'10px 22px',background:'linear-gradient(135deg,var(--blue),var(--purple))',border:'none',borderRadius:9,color:'white',fontSize:13,fontWeight:700,boxShadow:'0 4px 14px rgba(59,130,246,0.3)',opacity:saving?0.7:1,cursor:saving?'wait':'pointer' }}>
            {saving ? 'Salvando...' : 'Cadastrar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Clientes() {
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [clients, setClients]     = useState([])
  const [loading, setLoading]     = useState(true)

  const loadClients = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setClients(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  async function addClient(form) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Não autenticado')
    const { error } = await supabase.from('clientes').insert({
      user_id: user.id,
      nome: form.nome,
      cpf: form.cpf,
      telefone: form.telefone,
      email: form.email,
      benefit: form.benefit,
      advogado: form.advogado,
      status: 'ativo',
    })
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    await loadClients()
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const match = (c.nome||'').toLowerCase().includes(q) ||
                  (c.cpf||'').includes(q) ||
                  (c.benefit||'').toLowerCase().includes(q)
    const s = statusFilter === 'todos' || c.status === statusFilter
    return match && s
  })

  return (
    <div className="fade-in" style={{ padding:'24px',maxWidth:1400 }}>
      {showModal && <NewClientModal onClose={()=>setShowModal(false)} onSave={addClient}/>}

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
        <div style={{ display:'flex',gap:10,alignItems:'center',flex:1 }}>
          <div style={{ position:'relative',maxWidth:280 }}>
            <Search size={14} style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--text4)',pointerEvents:'none' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, CPF, benefício..."
              style={{ padding:'9px 12px 9px 32px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',width:'100%',outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--blue)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
          <div style={{ display:'flex',gap:5 }}>
            {['todos','ativo','urgente','ganho','inativo'].map(s=>(
              <button key={s} onClick={()=>setStatus(s)} style={{ padding:'7px 14px',borderRadius:8,border:'1px solid',fontSize:12.5,fontWeight:statusFilter===s?600:400,background:statusFilter===s?'var(--blue-dim)':'transparent',borderColor:statusFilter===s?'var(--blue)':'var(--border)',color:statusFilter===s?'var(--blue-light)':'var(--text3)',cursor:'pointer',textTransform:'capitalize' }}>
                {s==='todos'?'Todos':statusConfig[s]?.label||s}
              </button>
            ))}
          </div>
        </div>
        <button onClick={()=>setShowModal(true)}
          style={{ display:'flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,var(--blue),var(--purple))',color:'white',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:700,boxShadow:'0 4px 14px rgba(59,130,246,0.3)',cursor:'pointer' }}>
          <Plus size={15}/> Novo Cliente
        </button>
      </div>

      <div style={{ display:'flex',gap:12,marginBottom:18 }}>
        {[
          { label:'Total',       value:clients.length,                              color:'var(--text2)' },
          { label:'Ativos',      value:clients.filter(c=>c.status==='ativo').length,  color:'var(--blue-light)' },
          { label:'Urgentes',    value:clients.filter(c=>c.status==='urgente').length,color:'var(--red)' },
          { label:'Casos ganhos',value:clients.filter(c=>c.status==='ganho').length,  color:'var(--green)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:9,padding:'10px 16px' }}>
            <div style={{ fontSize:18,fontWeight:800,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5,color:'var(--text4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden' }}>
        {loading ? (
          <div style={{ textAlign:'center',padding:'40px',color:'var(--text3)' }}>Carregando clientes...</div>
        ) : (
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg3)' }}>
                {['Cliente','CPF','Telefone','Tipo de Benefício','Advogado','Status','Cadastro',''].map((h,i)=>(
                  <th key={i} style={{ padding:'11px 16px',fontSize:11.5,fontWeight:700,color:'var(--text3)',textAlign:'left',letterSpacing:'0.3px',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>{
                const s = statusConfig[c.status] || statusConfig.ativo
                return (
                  <tr key={c.id} style={{ borderBottom:'1px solid var(--border)',transition:'background 0.12s',cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                        <div style={{ width:30,height:30,borderRadius:'50%',background:`hsl(${(c.nome||'?').charCodeAt(0)*5%360},60%,35%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',flexShrink:0 }}>
                          {(c.nome||'?').split(' ').slice(0,2).map(w=>w[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontSize:13.5,fontWeight:600 }}>{c.nome}</div>
                          <div style={{ fontSize:11,color:'var(--text4)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:13,color:'var(--text3)',fontFamily:'monospace' }}>{c.cpf||'—'}</td>
                    <td style={{ padding:'12px 16px',fontSize:13,color:'var(--text3)' }}>{c.telefone||'—'}</td>
                    <td style={{ padding:'12px 16px',fontSize:13 }}>{c.benefit||c.area||'—'}</td>
                    <td style={{ padding:'12px 16px',fontSize:12.5,color:'var(--text3)' }}>{c.advogado||'—'}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11.5,fontWeight:600,padding:'3px 10px',borderRadius:6,background:s.bg,color:s.color }}>{s.label}</span>
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:12.5,color:'var(--text4)' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <button style={{ background:'none',border:'none',color:'var(--text4)',cursor:'pointer' }}><MoreHorizontal size={16}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length===0 && (
          <div style={{ textAlign:'center',padding:'40px',color:'var(--text3)' }}>
            {clients.length===0 ? 'Nenhum cliente cadastrado ainda. Clique em "Novo Cliente" para começar.' : `Nenhum cliente encontrado para "${search}"`}
          </div>
        )}
        <div style={{ padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <span style={{ fontSize:12.5,color:'var(--text3)' }}>Mostrando {filtered.length} de {clients.length} clientes</span>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, FileText, ExternalLink, X, Zap } from 'lucide-react'
import { supabase, invokeFunction } from '../lib/supabase'

const statusConfig = {
  em_andamento: { label: 'Em andamento',  bg: 'var(--blue-dim)',         color: 'var(--blue-light)' },
  documentacao: { label: 'Documentação',  bg: 'var(--amber-dim)',        color: 'var(--amber)' },
  aguardando:   { label: 'Aguardando',    bg: 'rgba(255,255,255,0.06)', color: 'var(--text3)' },
  recurso:      { label: 'Em recurso',    bg: 'var(--purple-dim)',       color: 'var(--purple)' },
  ganho:        { label: '✓ Ganho',       bg: 'var(--green-dim)',        color: 'var(--green)' },
  arquivado:    { label: 'Arquivado',     bg: 'rgba(0,0,0,0.2)',         color: 'var(--text4)' },
}
const prioridadeDot = { alta:'var(--red)', normal:'var(--amber)', baixa:'var(--text4)' }

function NovoCasoModal({ onClose, onSave }) {
  const [form, setForm] = useState({ titulo:'', area:'', advogado:'', tribunal:'', data_prazo:'', numero_processo:'' })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const tipos = ['Aposentadoria por Idade','Aposentadoria Programada','Aposentadoria Especial','BPC/Loas','BPC/Loas Idoso','Auxílio-Doença','Revisão do Teto','Revisão Buraco Negro','Pensão por Morte','Aposentadoria por Invalidez']

  const handleSave = async () => {
    if (!form.titulo.trim()) return alert('Título/cliente obrigatório')
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:20 }}>
      <div className="fade-in" style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:18,padding:'28px',width:'100%',maxWidth:500,boxShadow:'var(--shadow)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:22 }}>
          <h3 style={{ fontSize:16,fontWeight:700 }}>Novo Caso</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          {[
            { label:'Cliente / Título', key:'titulo', placeholder:'Ex: João Silva — Aposentadoria' },
            { label:'Advogado responsável', key:'advogado', placeholder:'Dr. Nome' },
            { label:'Tribunal / Instância', key:'tribunal', placeholder:'Ex: INSS (Adm), TRF-3' },
            { label:'Número do processo', key:'numero_processo', placeholder:'0000000-00.0000.0.00.0000' },
            { label:'Prazo crítico', key:'data_prazo', type:'date' },
          ].map(({ label, key, placeholder, type })=>(
            <div key={key}>
              <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>{label}</label>
              <input type={type||'text'} placeholder={placeholder} value={form[key]} onChange={e=>f(key,e.target.value)}
                style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--blue)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Tipo de benefício</label>
            <select value={form.area} onChange={e=>f('area',e.target.value)}
              style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:form.area?'var(--text)':'var(--text4)',outline:'none' }}>
              <option value="">Selecione...</option>
              {tipos.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex',gap:10,marginTop:22,justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 18px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,color:'var(--text2)',fontSize:13,cursor:'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'10px 22px',background:'linear-gradient(135deg,var(--blue),var(--purple))',border:'none',borderRadius:9,color:'white',fontSize:13,fontWeight:700,boxShadow:'0 4px 14px rgba(59,130,246,0.3)',opacity:saving?0.7:1,cursor:saving?'wait':'pointer' }}>
            {saving?'Salvando...':'Abrir Caso'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Casos() {
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('todos')
  const [showModal, setShowModal]   = useState(false)
  const [casos, setCasos]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [syncLoading, setSyncLoading] = useState(false)

  const loadCasos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('casos')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setCasos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCasos()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('id,oab').eq('id', user.id).single()
          .then(({ data }) => setUserProfile(data))
      }
    })
  }, [loadCasos])

  async function addCaso(form) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Não autenticado')
    const { error } = await supabase.from('casos').insert({
      user_id: user.id,
      titulo: form.titulo,
      area: form.area,
      advogado: form.advogado,
      tribunal: form.tribunal,
      numero_processo: form.numero_processo,
      data_prazo: form.data_prazo || null,
      status: 'em_andamento',
      prioridade: 'normal',
    })
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    await loadCasos()
  }

  async function handleSyncByOab() {
    if (!userProfile?.oab) return alert('OAB não configurada no seu perfil')
    setSyncLoading(true)
    try {
      const { data: result, error } = await invokeFunction('fetch-cases-by-oab', { oab: userProfile.oab })
      if (error || result?.error) throw new Error(result?.error || error?.message || 'Falha na sincronização.')
      alert(`✓ ${result.cases_synced || 0} caso(s) sincronizado(s).`)
      await loadCasos()
    } catch (err) {
      alert(`Erro ao sincronizar: ${err.message}`)
    } finally {
      setSyncLoading(false)
    }
  }

  const filtered = casos.filter(c => {
    const q = search.toLowerCase()
    const match = (c.titulo||'').toLowerCase().includes(q) ||
                  (c.area||'').toLowerCase().includes(q) ||
                  (c.numero_processo||'').toLowerCase().includes(q)
    const s = statusFilter === 'todos' || c.status === statusFilter
    return match && s
  })

  const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
  const fmtVal = (v) => v ? `R$ ${Number(v).toLocaleString('pt-BR')}` : 'A calcular'

  return (
    <div className="fade-in" style={{ padding:'24px',maxWidth:1400 }}>
      {showModal && <NovoCasoModal onClose={()=>setShowModal(false)} onSave={addCaso}/>}

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:10 }}>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap',alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--text4)',pointerEvents:'none' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar casos, clientes..."
              style={{ padding:'9px 12px 9px 32px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',width:240,outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--blue)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
          <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
            {['todos',...Object.keys(statusConfig)].map(s=>(
              <button key={s} onClick={()=>setStatus(s)} style={{ padding:'7px 12px',borderRadius:8,border:'1px solid',fontSize:12,fontWeight:statusFilter===s?600:400,background:statusFilter===s?'var(--blue-dim)':'transparent',borderColor:statusFilter===s?'var(--blue)':'var(--border)',color:statusFilter===s?'var(--blue-light)':'var(--text3)',cursor:'pointer' }}>
                {s==='todos'?'Todos':statusConfig[s]?.label||s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          {userProfile?.oab && (
            <button onClick={handleSyncByOab} disabled={syncLoading}
              style={{ display:'flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,#10b981,#059669)',color:'white',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:700,boxShadow:'0 4px 14px rgba(16,185,129,0.3)',opacity:syncLoading?0.7:1,cursor:syncLoading?'wait':'pointer' }}>
              <Zap size={15}/> {syncLoading?'Sincronizando...':'Sincronizar OAB'}
            </button>
          )}
          <button onClick={()=>setShowModal(true)}
            style={{ display:'flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,var(--blue),var(--purple))',color:'white',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:700,boxShadow:'0 4px 14px rgba(59,130,246,0.3)',cursor:'pointer' }}>
            <Plus size={15}/> Novo Caso
          </button>
        </div>
      </div>

      <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
        {[
          { label:'Total',          v:casos.length,                                    c:'var(--text2)' },
          { label:'Em andamento',   v:casos.filter(c=>c.status==='em_andamento').length,c:'var(--blue-light)' },
          { label:'Documentação',   v:casos.filter(c=>c.status==='documentacao').length,c:'var(--amber)' },
          { label:'Ganhos',         v:casos.filter(c=>c.status==='ganho').length,       c:'var(--green)' },
          { label:'Alta prioridade',v:casos.filter(c=>c.prioridade==='alta').length,    c:'var(--red)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:9,padding:'10px 16px' }}>
            <div style={{ fontSize:18,fontWeight:800,color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11.5,color:'var(--text4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'auto' }}>
        {loading ? (
          <div style={{ textAlign:'center',padding:'40px',color:'var(--text3)' }}>Carregando casos...</div>
        ) : (
          <table style={{ width:'100%',borderCollapse:'collapse',minWidth:900 }}>
            <thead>
              <tr style={{ background:'var(--bg3)' }}>
                {['Caso','Tipo de Benefício','Advogado','Tribunal','Status','Prazo','Valor','Ações'].map((h,i)=>(
                  <th key={i} style={{ padding:'11px 14px',fontSize:11.5,fontWeight:700,color:'var(--text3)',textAlign:'left',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>{
                const s = statusConfig[c.status] || statusConfig.em_andamento
                return (
                  <tr key={c.id} style={{ borderBottom:'1px solid var(--border)',cursor:'pointer',transition:'background 0.12s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                        <div style={{ width:6,height:6,borderRadius:'50%',background:prioridadeDot[c.prioridade||'normal'],flexShrink:0 }}/>
                        <div>
                          <div style={{ fontSize:13.5,fontWeight:600 }}>{c.titulo}</div>
                          {c.numero_processo && <div style={{ fontSize:11,color:'var(--text4)',fontFamily:'monospace' }}>{c.numero_processo}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px',fontSize:13 }}>{c.area||'—'}</td>
                    <td style={{ padding:'12px 14px',fontSize:12.5,color:'var(--text3)' }}>{c.advogado||'—'}</td>
                    <td style={{ padding:'12px 14px',fontSize:12.5,color:'var(--text3)' }}>{c.tribunal||'—'}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontSize:11.5,fontWeight:600,padding:'3px 9px',borderRadius:6,background:s.bg,color:s.color,whiteSpace:'nowrap' }}>{s.label}</span>
                    </td>
                    <td style={{ padding:'12px 14px',fontSize:12.5,color:c.data_prazo?'var(--amber)':'var(--text4)',fontWeight:c.data_prazo?600:400 }}>{fmt(c.data_prazo)}</td>
                    <td style={{ padding:'12px 14px',fontSize:13,fontWeight:700,color:'var(--green)' }}>{fmtVal(c.valor_honorario)}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex',gap:6 }}>
                        <button title="Ver detalhes" style={{ background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--text3)',cursor:'pointer' }}><FileText size={13}/></button>
                        {c.numero_processo && <button title="Buscar no tribunal" style={{ background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--blue)',cursor:'pointer' }}><ExternalLink size={13}/></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length===0 && (
          <div style={{ textAlign:'center',padding:'40px',color:'var(--text3)' }}>
            {casos.length===0 ? 'Nenhum caso aberto ainda. Clique em "Novo Caso" para começar.' : 'Nenhum caso encontrado'}
          </div>
        )}
        <div style={{ padding:'12px 16px',borderTop:'1px solid var(--border)' }}>
          <span style={{ fontSize:12.5,color:'var(--text3)' }}>Mostrando {filtered.length} de {casos.length} casos</span>
        </div>
      </div>
    </div>
  )
}

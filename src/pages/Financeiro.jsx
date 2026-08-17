import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Clock, CheckCircle, AlertTriangle, Download, Plus, Send, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../lib/supabase'

const statusConfig = {
  recebido:   { label: 'Recebido',          bg: 'var(--green-dim)',  color: 'var(--green)',      icon: CheckCircle },
  pendente:   { label: 'Pendente',          bg: 'var(--blue-dim)',   color: 'var(--blue-light)', icon: Clock },
  vencido:    { label: 'Vencido',           bg: 'var(--red-dim)',    color: 'var(--red)',         icon: AlertTriangle },
  aguardando: { label: 'Aguardando alvará', bg: 'var(--amber-dim)',  color: 'var(--amber)',       icon: Clock },
}

const TIPOS = ['Êxito', 'Consultoria', 'Inicial', 'Mensal', 'Recurso', 'Acordo']

const MES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function NovoHonorarioModal({ onClose, onSave }) {
  const [form, setForm] = useState({ cliente:'', caso:'', tipo:'Êxito', valor:'', vencimento:'', status:'pendente' })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.cliente.trim()) return alert('Nome do cliente obrigatório')
    if (!form.valor || isNaN(parseFloat(form.valor))) return alert('Valor inválido')
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:20 }}>
      <div className="fade-in" style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:18,padding:'28px',width:'100%',maxWidth:520,boxShadow:'var(--shadow)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:22 }}>
          <h3 style={{ fontSize:16,fontWeight:700 }}>Novo Honorário</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          {[
            { label:'Cliente', key:'cliente', placeholder:'Nome completo', span:2 },
            { label:'Caso / Referência', key:'caso', placeholder:'Ex: PRV-0342' },
            { label:'Valor (R$)', key:'valor', placeholder:'0,00', type:'number' },
          ].map(({ label, key, placeholder, span, type }) => (
            <div key={key} style={{ gridColumn: span===2 ? 'span 2' : 'span 1' }}>
              <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>{label}</label>
              <input type={type||'text'} value={form[key]} onChange={e=>f(key,e.target.value)} placeholder={placeholder}
                style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--blue)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Tipo</label>
            <select value={form.tipo} onChange={e=>f('tipo',e.target.value)}
              style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}>
              {TIPOS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Status</label>
            <select value={form.status} onChange={e=>f('status',e.target.value)}
              style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}>
              {Object.entries(statusConfig).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'span 2' }}>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Data de vencimento</label>
            <input type="date" value={form.vencimento} onChange={e=>f('vencimento',e.target.value)}
              style={{ width:'100%',padding:'10px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,fontSize:13.5,color:'var(--text)',outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--blue)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
        </div>
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:22 }}>
          <button onClick={onClose} style={{ padding:'10px 18px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,color:'var(--text2)',fontSize:13,cursor:'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'10px 22px',background:'linear-gradient(135deg,var(--blue),var(--purple))',border:'none',borderRadius:9,color:'white',fontSize:13,fontWeight:700,opacity:saving?0.7:1,cursor:saving?'wait':'pointer' }}>
            {saving ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,padding:'10px 14px',fontSize:12 }}>
      <p style={{ fontWeight:600,marginBottom:4 }}>{label}</p>
      <p style={{ color:'var(--green)' }}>R$ {(payload[0].value||0).toLocaleString('pt-BR')}</p>
    </div>
  )
}

export default function Financeiro() {
  const [honorarios, setHonorarios] = useState([])
  const [filtro, setFiltro]         = useState('todos')
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [chartData, setChartData]   = useState([])

  const loadHonorarios = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('honorarios')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      setHonorarios(data)
      buildChart(data)
    }
    setLoading(false)
  }, [])

  function buildChart(data) {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, mes: MES_LABEL[d.getMonth()], valor: 0 }
    })
    data.filter(h => h.status === 'recebido').forEach(h => {
      const key = (h.created_at || '').substring(0,7)
      const m = months.find(m => m.key === key)
      if (m) m.valor += parseFloat(h.valor) || 0
    })
    setChartData(months)
  }

  useEffect(() => { loadHonorarios() }, [loadHonorarios])

  async function addHonorario(form) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Não autenticado')
    const { error } = await supabase.from('honorarios').insert({
      user_id: user.id,
      cliente: form.cliente,
      caso: form.caso,
      tipo: form.tipo,
      valor: parseFloat(form.valor),
      vencimento: form.vencimento || null,
      status: form.status,
    })
    if (error) { alert('Erro: ' + error.message); return }
    await loadHonorarios()
  }

  const recebido   = honorarios.filter(h=>h.status==='recebido').reduce((s,h)=>s+(parseFloat(h.valor)||0),0)
  const pendente   = honorarios.filter(h=>h.status==='pendente').reduce((s,h)=>s+(parseFloat(h.valor)||0),0)
  const vencido    = honorarios.filter(h=>h.status==='vencido').reduce((s,h)=>s+(parseFloat(h.valor)||0),0)
  const aguardando = honorarios.filter(h=>h.status==='aguardando').reduce((s,h)=>s+(parseFloat(h.valor)||0),0)

  const filtered = filtro === 'todos' ? honorarios : honorarios.filter(h=>h.status===filtro)

  return (
    <div className="fade-in" style={{ padding:'24px',maxWidth:1300 }}>
      {showModal && <NovoHonorarioModal onClose={()=>setShowModal(false)} onSave={addHonorario}/>}

      {/* KPIs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 }}>
        {[
          { label:'Recebido',          value:`R$ ${recebido.toLocaleString('pt-BR',{minimumFractionDigits:0})}`,   color:'var(--green)',      icon:'✅' },
          { label:'Pendente',          value:`R$ ${pendente.toLocaleString('pt-BR',{minimumFractionDigits:0})}`,   color:'var(--blue-light)', icon:'⏳' },
          { label:'Vencido',           value:`R$ ${vencido.toLocaleString('pt-BR',{minimumFractionDigits:0})}`,    color:'var(--red)',         icon:'⚠️' },
          { label:'Aguardando Alvará', value:`R$ ${aguardando.toLocaleString('pt-BR',{minimumFractionDigits:0})}`, color:'var(--amber)',       icon:'🏛️' },
        ].map(k=>(
          <div key={k.label} style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px' }}>
            <div style={{ fontSize:20,marginBottom:8 }}>{k.icon}</div>
            <div style={{ fontSize:22,fontWeight:800,color:k.color,letterSpacing:'-0.5px' }}>{k.value}</div>
            <div style={{ fontSize:12,color:'var(--text3)',marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Ações */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 300px',gap:14,marginBottom:20 }}>
        <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'20px' }}>
          <h3 style={{ fontSize:14,fontWeight:700,marginBottom:4 }}>Receita Mensal</h3>
          <p style={{ fontSize:12,color:'var(--text3)',marginBottom:16 }}>Honorários recebidos nos últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ left:-10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="mes" tick={{ fontSize:11,fill:'var(--text4)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10,fill:'var(--text4)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="valor" radius={[5,5,0,0]}>
                {chartData.map((_,i)=>(
                  <Cell key={i} fill={i===chartData.length-1?'#10B981':'#10B98160'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'20px',display:'flex',flexDirection:'column',gap:10 }}>
          <h3 style={{ fontSize:14,fontWeight:700,marginBottom:6 }}>Ações Rápidas</h3>
          {[
            { icon:'💬', label:'Enviar cobrança WhatsApp', color:'var(--green)' },
            { icon:'📄', label:'Gerar recibo / fatura',    color:'var(--blue)' },
            { icon:'💳', label:'Link PIX de pagamento',    color:'var(--purple)' },
            { icon:'📊', label:'Relatório do mês (PDF)',   color:'var(--amber)' },
            { icon:'🔔', label:'Lembrete automático',      color:'var(--cyan)' },
          ].map(a=>(
            <button key={a.label} style={{ display:'flex',alignItems:'center',gap:9,padding:'10px 13px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,color:'var(--text2)',fontSize:13,cursor:'pointer',textAlign:'left',transition:'border-color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=a.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <span style={{ fontSize:16 }}>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
        <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div style={{ display:'flex',gap:6 }}>
            {['todos','pendente','vencido','aguardando','recebido'].map(s=>(
              <button key={s} onClick={()=>setFiltro(s)} style={{
                padding:'6px 12px',borderRadius:7,border:'1px solid',fontSize:12,fontWeight:filtro===s?600:400,
                background:filtro===s?'var(--blue-dim)':'transparent',
                borderColor:filtro===s?'var(--blue)':'var(--border)',
                color:filtro===s?'var(--blue-light)':'var(--text3)',cursor:'pointer',textTransform:'capitalize',
              }}>
                {statusConfig[s]?.label||'Todos'}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowModal(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:'linear-gradient(135deg,var(--blue),var(--purple))',border:'none',borderRadius:8,color:'white',fontSize:12.5,fontWeight:600,cursor:'pointer' }}>
            <Plus size={13}/> Novo Honorário
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign:'center',padding:'40px',color:'var(--text3)' }}>Carregando honorários...</div>
        ) : (
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg3)' }}>
                {['Cliente','Caso','Tipo','Vencimento','Valor','Status','Ações'].map((h,i)=>(
                  <th key={i} style={{ padding:'10px 16px',fontSize:11.5,fontWeight:700,color:'var(--text3)',textAlign:'left',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(h=>{
                const s = statusConfig[h.status]
                return (
                  <tr key={h.id} style={{ borderBottom:'1px solid var(--border)',transition:'background 0.12s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 16px',fontSize:13.5,fontWeight:600 }}>{h.cliente}</td>
                    <td style={{ padding:'12px 16px',fontSize:12.5,color:'var(--text3)' }}>{h.caso||'—'}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:12,padding:'3px 8px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,color:'var(--text3)' }}>{h.tipo}</span>
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:13,color:h.status==='vencido'?'var(--red)':'var(--text3)',fontWeight:h.status==='vencido'?600:400 }}>
                      {h.vencimento ? new Date(h.vencimento).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:14,fontWeight:800,color:'var(--green)' }}>
                      R$ {parseFloat(h.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11.5,fontWeight:600,padding:'3px 9px',borderRadius:6,background:s?.bg,color:s?.color,whiteSpace:'nowrap' }}>{s?.label}</span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex',gap:5 }}>
                        {(h.status==='pendente'||h.status==='vencido') && (
                          <button title="Enviar cobrança" style={{ background:'var(--green-dim)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:6,padding:'4px 8px',color:'var(--green)',fontSize:11.5,cursor:'pointer' }}>
                            <Send size={12}/>
                          </button>
                        )}
                        <button title="Baixar recibo" style={{ background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--text3)',cursor:'pointer' }}>
                          <Download size={12}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center',padding:'40px',color:'var(--text3)' }}>
            {honorarios.length===0 ? 'Nenhum honorário cadastrado. Clique em "Novo Honorário" para começar.' : 'Nenhum registro encontrado.'}
          </div>
        )}
        <div style={{ padding:'12px 16px',borderTop:'1px solid var(--border)' }}>
          <span style={{ fontSize:12.5,color:'var(--text3)' }}>
            Total: R$ {filtered.reduce((s,h)=>s+(parseFloat(h.valor)||0),0).toLocaleString('pt-BR',{minimumFractionDigits:2})} · {filtered.length} registros
          </span>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Bell, Clock, AlertTriangle, CheckCircle, Search, Archive } from 'lucide-react'
import { supabase } from '../lib/supabase'

const tipoConfig = {
  prazo:      { label: 'Prazo',       icon: Clock,          color: 'var(--red)',        bg: 'var(--red-dim)' },
  vencimento: { label: 'Vencimento',  icon: AlertTriangle,  color: 'var(--amber)',      bg: 'var(--amber-dim)' },
  consultoria:{ label: 'Consultoria', icon: CheckCircle,    color: 'var(--blue-light)', bg: 'var(--blue-dim)' },
  customizado:{ label: 'Customizado', icon: Bell,           color: 'var(--purple)',     bg: 'var(--purple-dim)' },
}

function AlertaCard({ alerta, onMarkAsRead, onArchive }) {
  const tipoInfo = tipoConfig[alerta.tipo] || tipoConfig.customizado
  const Icon = tipoInfo.icon
  const dataAlerta = new Date(alerta.data_alerta)
  const diasRestantes = Math.ceil((dataAlerta - new Date()) / (1000 * 60 * 60 * 24))
  const urgencia = diasRestantes <= 3 ? 'alta' : diasRestantes <= 7 ? 'media' : 'baixa'

  return (
    <div className="fade-in" style={{
      background: alerta.notificacao_lida ? 'var(--bg3)' : 'var(--bg2)',
      border: `1px solid ${urgencia==='alta'?'var(--red)':alerta.notificacao_lida?'var(--border)':tipoInfo.color}`,
      borderRadius:12,padding:'16px',display:'flex',gap:14,alignItems:'flex-start',
      opacity: alerta.notificacao_lida ? 0.7 : 1, transition:'all 0.2s'
    }}>
      <div style={{ padding:'8px',background:tipoInfo.bg,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',minWidth:40,height:40 }}>
        <Icon size={18} style={{ color:tipoInfo.color }}/>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex',alignItems:'flex-start',gap:10,marginBottom:6 }}>
          <h3 style={{ fontSize:14,fontWeight:600,margin:0 }}>{alerta.titulo}</h3>
          {urgencia==='alta' && <span style={{ padding:'2px 8px',background:'var(--red-dim)',color:'var(--red)',fontSize:10,fontWeight:700,borderRadius:4 }}>URGENTE</span>}
        </div>
        <div style={{ display:'flex',gap:16,fontSize:12,color:'var(--text3)',marginBottom:10 }}>
          <span>📅 {dataAlerta.toLocaleDateString('pt-BR')}</span>
          <span style={{ color:urgencia==='alta'?'var(--red)':'var(--text3)',fontWeight:500 }}>
            {diasRestantes<=0 ? '⚠️ Vencido' : `${diasRestantes} dia${diasRestantes!==1?'s':''} restantes`}
          </span>
        </div>
        <span style={{ display:'inline-block',padding:'4px 10px',background:tipoInfo.bg,color:tipoInfo.color,fontSize:11,fontWeight:600,borderRadius:6 }}>
          {tipoInfo.label}
        </span>
      </div>
      <div style={{ display:'flex',gap:8 }}>
        {!alerta.notificacao_lida && (
          <button onClick={()=>onMarkAsRead(alerta.id)} title="Marcar como lido"
            style={{ background:'none',border:'none',color:'var(--green)',cursor:'pointer',padding:4,fontSize:16 }}>
            ✓
          </button>
        )}
        <button onClick={()=>onArchive(alerta.id)} title="Arquivar"
          style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4 }}>
          <Archive size={16}/>
        </button>
      </div>
    </div>
  )
}

export default function Alertas() {
  const [alertas, setAlertas]       = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showNaoLidos, setShowNaoLidos] = useState(true)
  const [loading, setLoading]       = useState(true)

  const loadAlertas = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .order('data_alerta', { ascending: true })
    if (!error) setAlertas(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAlertas() }, [loadAlertas])

  async function markAsRead(id) {
    const { error } = await supabase.from('alertas').update({ notificacao_lida: true }).eq('id', id)
    if (!error) setAlertas(prev => prev.map(a => a.id === id ? { ...a, notificacao_lida: true } : a))
  }

  async function archiveAlerta(id) {
    const { error } = await supabase.from('alertas').delete().eq('id', id)
    if (!error) setAlertas(prev => prev.filter(a => a.id !== id))
  }

  const naoLidos = alertas.filter(a => !a.notificacao_lida)
  const filtered = (showNaoLidos ? naoLidos : alertas)
    .filter(a => (a.titulo||'').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(a.data_alerta) - new Date(b.data_alerta))

  return (
    <div style={{ padding:'0 24px 24px' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:28,fontWeight:700,marginBottom:8 }}>Alertas & Notificações</h1>
        <p style={{ color:'var(--text3)',fontSize:14 }}>Acompanhe seus prazos críticos e vencimentos</p>
      </div>

      {naoLidos.length > 0 && (
        <div style={{ background:'var(--red-dim)',border:'1px solid var(--red)',borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12 }}>
          <Bell size={20} style={{ color:'var(--red)',flexShrink:0 }}/>
          <span style={{ fontSize:13,color:'var(--red)',fontWeight:500 }}>
            Você tem <strong>{naoLidos.length}</strong> alerta{naoLidos.length!==1?'s':''} não lido{naoLidos.length!==1?'s':''}
          </span>
        </div>
      )}

      <div style={{ display:'flex',gap:12,marginBottom:20,alignItems:'center',flexWrap:'wrap' }}>
        <div style={{ flex:1,minWidth:200,display:'flex',alignItems:'center',gap:10,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'0 12px' }}>
          <Search size={18} style={{ color:'var(--text3)' }}/>
          <input type="text" placeholder="Buscar alertas..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            style={{ flex:1,background:'transparent',border:'none',outline:'none',fontSize:14,color:'var(--text)',padding:'12px 0' }}/>
        </div>
        <button onClick={()=>setShowNaoLidos(!showNaoLidos)} style={{
          padding:'10px 16px',borderRadius:10,border:'1px solid '+(showNaoLidos?'var(--blue)':'var(--border)'),
          background:showNaoLidos?'var(--blue-dim)':'transparent',color:showNaoLidos?'var(--blue-light)':'var(--text2)',
          fontSize:13,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'
        }}>
          {showNaoLidos ? 'Mostrando não lidos' : 'Mostrar todos'}
        </button>
      </div>

      <div style={{ display:'grid',gap:12 }}>
        {loading ? (
          <div style={{ textAlign:'center',padding:'40px',color:'var(--text3)' }}>Carregando alertas...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center',padding:'40px 20px',color:'var(--text3)' }}>
            <Bell size={40} style={{ margin:'0 auto 12px',opacity:0.5 }}/>
            <p>{showNaoLidos && naoLidos.length===0 ? 'Parabéns! Nenhum alerta pendente.' : 'Nenhum alerta encontrado'}</p>
          </div>
        ) : (
          filtered.map(alerta => (
            <AlertaCard key={alerta.id} alerta={alerta} onMarkAsRead={markAsRead} onArchive={archiveAlerta}/>
          ))
        )}
      </div>
    </div>
  )
}

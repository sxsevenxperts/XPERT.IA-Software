import { useState, useEffect } from 'react'
import { Search, Plus, Filter, Calendar, Clock, CheckCircle, AlertCircle, FileText, ExternalLink, X, ChevronDown, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MOCK_CASOS = [
  { id: 'PRV-0342', cliente: 'João Carlos Silva',     tipo: 'Aposentadoria por Idade',   status: 'em_andamento', advogado: 'Dr. Ana Lima',    tribunal: 'INSS (Adm)',  protocolo: '1234567-89',  abertura: '12/01/2025', prazo: '25/03/2026', valor: 'R$ 4.200',   prioridade: 'alta' },
  { id: 'PRV-0389', cliente: 'Maria Aparecida Costa', tipo: 'BPC/Loas Idoso',            status: 'documentacao', advogado: 'Dr. Carlos Melo', tribunal: 'INSS (Adm)',  protocolo: '',            abertura: '05/02/2025', prazo: '30/03/2026', valor: 'R$ 1.412',   prioridade: 'alta' },
  { id: 'PRV-0401', cliente: 'Pedro Alves Rocha',     tipo: 'Auxílio por Incapacidade',  status: 'aguardando',   advogado: 'Dr. Ana Lima',    tribunal: 'TRF-3',       protocolo: '5005432-11',  abertura: '18/01/2025', prazo: '10/04/2026', valor: 'R$ 2.800',   prioridade: 'normal' },
  { id: 'PRV-0378', cliente: 'Ana Beatriz Lima',      tipo: 'Revisão do Teto',           status: 'recurso',      advogado: 'Dr. Marcos Silva',tribunal: 'TRF-1',       protocolo: '3001122-33',  abertura: '22/11/2024', prazo: '15/04/2026', valor: 'R$ 6.500',   prioridade: 'normal' },
  { id: 'PRV-0355', cliente: 'Carlos Eduardo Melo',   tipo: 'Aposentadoria Especial',    status: 'ganho',        advogado: 'Dr. Carlos Melo', tribunal: 'INSS (Adm)',  protocolo: '9876543-21',  abertura: '03/12/2024', prazo: '—',          valor: 'R$ 3.700',   prioridade: 'baixa' },
  { id: 'PRV-0410', cliente: 'Francisca Oliveira',    tipo: 'Pensão por Morte',          status: 'em_andamento', advogado: 'Dr. Ana Lima',    tribunal: 'INSS (Adm)',  protocolo: '1122334-55',  abertura: '08/03/2025', prazo: '05/05/2026', valor: 'R$ 1.412',   prioridade: 'normal' },
  { id: 'PRV-0321', cliente: 'Roberto Nascimento',    tipo: 'Aposentadoria Programada',  status: 'arquivado',    advogado: 'Dr. Marcos Silva',tribunal: 'TRF-2',       protocolo: '7788996-44',  abertura: '15/08/2024', prazo: '—',          valor: 'R$ 3.100',   prioridade: 'baixa' },
  { id: 'PRV-0415', cliente: 'Luiza Fernandes',       tipo: 'Revisão Buraco Negro',      status: 'em_andamento', advogado: 'Dr. Carlos Melo', tribunal: 'TRF-4',       protocolo: '9900112-77',  abertura: '20/03/2025', prazo: '12/05/2026', valor: 'R$ 5.800',   prioridade: 'normal' },
]

const statusConfig = {
  em_andamento: { label: 'Em andamento',   bg: 'var(--blue-dim)',   color: 'var(--blue-light)' },
  documentacao: { label: 'Documentação',   bg: 'var(--amber-dim)',  color: 'var(--amber)' },
  aguardando:   { label: 'Aguardando',     bg: 'rgba(255,255,255,0.06)', color: 'var(--text3)' },
  recurso:      { label: 'Em recurso',     bg: 'var(--purple-dim)', color: 'var(--purple)' },
  ganho:        { label: '✓ Ganho',        bg: 'var(--green-dim)',  color: 'var(--green)' },
  arquivado:    { label: 'Arquivado',      bg: 'rgba(0,0,0,0.2)',   color: 'var(--text4)' },
}

const prioridadeDot = {
  alta:   'var(--red)',
  normal: 'var(--amber)',
  baixa:  'var(--text4)',
}

function SincronizarOabModal({ onClose, onSync, userOab, loading }) {
  const [confirma, setConfirma] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}>
      <div className="fade-in" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <Zap size={20} style={{ color: 'var(--blue)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Sincronizar Casos pela OAB</h3>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text3)' }}><X size={18} /></button>
        </div>

        <div style={{ background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
          <p style={{ fontSize: 13, color: 'var(--blue-light)', lineHeight: 1.5, margin: 0 }}>
            Vamos sincronizar todos os casos registrados com sua OAB <strong>{userOab}</strong>. Isso pode levar alguns segundos.
          </p>
        </div>

        {!confirma ? (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text2)', fontSize: 13 }}>Cancelar</button>
            <button onClick={() => setConfirma(true)} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
              Sincronizar Agora
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={loading} style={{ padding: '10px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text2)', fontSize: 13, opacity: loading ? 0.5 : 1 }}>Cancelar</button>
            <button onClick={() => onSync()} disabled={loading} style={{ padding: '10px 22px', background: loading ? 'var(--bg4)' : 'linear-gradient(135deg, var(--green), #10b981)', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(16,185,129,0.3)', opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
              {loading ? 'Sincronizando...' : 'Confirmar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NovoCasoModal({ onClose, onSave }) {
  const [form, setForm] = useState({ cliente: '', tipo: '', advogado: '', tribunal: '', prazo: '' })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const tipos = ['Aposentadoria por Idade','Aposentadoria Programada','Aposentadoria Especial','BPC/Loas','BPC/Loas Idoso','Auxílio-Doença','Revisão do Teto','Revisão Buraco Negro','Pensão por Morte','Aposentadoria por Invalidez']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}>
      <div className="fade-in" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 500, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Novo Caso</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Cliente', key: 'cliente', placeholder: 'Nome do cliente' },
            { label: 'Advogado responsável', key: 'advogado', placeholder: 'Dr. Nome' },
            { label: 'Tribunal / Instância', key: 'tribunal', placeholder: 'Ex: INSS (Adm), TRF-3' },
            { label: 'Prazo crítico', key: 'prazo', type: 'date' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{label}</label>
              <input type={type || 'text'} placeholder={placeholder} value={form[key]} onChange={e => f(key, e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13.5, color: 'var(--text)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Tipo de benefício</label>
            <select value={form.tipo} onChange={e => f('tipo', e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13.5, color: form.tipo ? 'var(--text)' : 'var(--text4)', outline: 'none' }}>
              <option value="">Selecione...</option>
              {tipos.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text2)', fontSize: 13 }}>Cancelar</button>
          <button onClick={() => { onSave(form); onClose() }} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
            Abrir Caso
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Casos() {
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [casos, setCasos]         = useState(MOCK_CASOS)
  const [userProfile, setUserProfile] = useState(null)
  const [syncLoading, setSyncLoading] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [])

  async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
    }
  }

  async function handleSyncByOab() {
    if (!userProfile?.oab) {
      alert('OAB não configurada no seu perfil')
      return
    }

    setSyncLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const response = await fetch(
        'https://kyefzktzhviahsodyayd.supabase.co/functions/v1/fetch-cases-by-oab',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oab: userProfile.oab,
            userId: user?.id,
            jusbrasil_key: userProfile?.jusbrasil_key || null,
          }),
        }
      )

      const result = await response.json()
      if (result.success) {
        alert(`✓ ${result.message}`)
        setShowSyncModal(false)
        // Recarregar casos do banco
        location.reload()
      } else {
        alert(`Erro: ${result.message}`)
      }
    } catch (err) {
      alert(`Erro ao sincronizar: ${err.message}`)
    } finally {
      setSyncLoading(false)
    }
  }

  const filtered = casos.filter(c => {
    const m = c.cliente.toLowerCase().includes(search.toLowerCase()) ||
              c.tipo.toLowerCase().includes(search.toLowerCase()) ||
              c.id.toLowerCase().includes(search.toLowerCase())
    const s = statusFilter === 'todos' || c.status === statusFilter
    return m && s
  })

  function addCaso(form) {
    const id = `PRV-${String(casos.length + 416).padStart(4, '0')}`
    setCasos(p => [{ id, ...form, status: 'em_andamento', abertura: new Date().toLocaleDateString('pt-BR'), valor: 'A calcular', prioridade: 'normal', protocolo: '' }, ...p])
  }

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1400 }}>
      {showModal && <NovoCasoModal onClose={() => setShowModal(false)} onSave={addCaso} />}
      {showSyncModal && <SincronizarOabModal onClose={() => setShowSyncModal(false)} onSync={handleSyncByOab} userOab={userProfile?.oab} loading={syncLoading} />}

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar casos, clientes..."
              style={{ padding: '9px 12px 9px 32px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13.5, color: 'var(--text)', width: 240, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['todos',...Object.keys(statusConfig)].map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding: '7px 12px', borderRadius: 8, border: '1px solid',
                fontSize: 12, fontWeight: statusFilter === s ? 600 : 400,
                background: statusFilter === s ? 'var(--blue-dim)' : 'transparent',
                borderColor: statusFilter === s ? 'var(--blue)' : 'var(--border)',
                color: statusFilter === s ? 'var(--blue-light)' : 'var(--text3)',
                cursor: 'pointer',
              }}>
                {s === 'todos' ? 'Todos' : statusConfig[s]?.label || s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {userProfile?.oab && (
            <button onClick={() => setShowSyncModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
              <Zap size={15} /> Sincronizar OAB
            </button>
          )}
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: 'white', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
            <Plus size={15} /> Novo Caso
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', v: casos.length, c: 'var(--text2)' },
          { label: 'Em andamento', v: casos.filter(c=>c.status==='em_andamento').length, c: 'var(--blue-light)' },
          { label: 'Documentação', v: casos.filter(c=>c.status==='documentacao').length, c: 'var(--amber)' },
          { label: 'Ganhos', v: casos.filter(c=>c.status==='ganho').length, c: 'var(--green)' },
          { label: 'Alta prioridade', v: casos.filter(c=>c.prioridade==='alta').length, c: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 16px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: 'var(--bg3)' }}>
              {['#','Cliente','Tipo de Benefício','Advogado','Tribunal','Status','Prazo','Valor Estimado','Ações'].map((h,i) => (
                <th key={i} style={{ padding: '11px 14px', fontSize: 11.5, fontWeight: 700, color: 'var(--text3)', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const s = statusConfig[c.status] || statusConfig.em_andamento
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: prioridadeDot[c.prioridade], flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text4)' }}>{c.id}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13.5, fontWeight: 600 }}>{c.cliente}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>{c.tipo}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text3)' }}>{c.advogado}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text3)' }}>{c.tribunal}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12.5, color: c.prazo === '—' ? 'var(--text4)' : 'var(--amber)', fontWeight: c.prazo === '—' ? 400 : 600 }}>{c.prazo}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{c.valor}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="Ver detalhes" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text3)' }}>
                        <FileText size={13} />
                      </button>
                      {c.protocolo && (
                        <button title="Buscar no tribunal" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--blue)' }}>
                          <ExternalLink size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>Nenhum caso encontrado</div>
        )}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text3)' }}>Mostrando {filtered.length} de {casos.length} casos</span>
        </div>
      </div>
    </div>
  )
}

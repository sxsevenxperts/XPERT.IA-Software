import { useState } from 'react'
import { Bell, AlertTriangle, CheckCircle, Clock, Search, Filter, RefreshCw, ExternalLink, Download } from 'lucide-react'

const intimacoes = [
  {
    id: 'INT-001', proc: '5009321-45.2025.4.05.8300', tribunal: 'TRF-5', vara: '3ª Vara Previdenciária',
    tipo: 'Prazo para Contestação', cliente: 'João Carlos Silva', area: 'Previdenciário',
    data: '27/03/2026', prazo: '05/04/2026', diasRestantes: 7, status: 'pendente', urgencia: 'alta',
    descricao: 'O réu deverá apresentar contestação no prazo de 15 dias úteis.',
    lida: false,
  },
  {
    id: 'INT-002', proc: '0001234-56.2024.5.01.0001', tribunal: 'TRT-1', vara: '1ª Vara do Trabalho',
    tipo: 'Audiência Designada', cliente: 'Fernanda Oliveira', area: 'Trabalhista',
    data: '26/03/2026', prazo: '29/03/2026', diasRestantes: 0, status: 'urgente', urgencia: 'critica',
    descricao: 'Audiência de instrução e julgamento designada para 29/03/2026 às 09:00h.',
    lida: false,
  },
  {
    id: 'INT-003', proc: '1023456-78.2025.8.26.0100', tribunal: 'TJSP', vara: '5ª Vara Cível',
    tipo: 'Manifestação sobre Laudo', cliente: 'Pedro Alves Rocha', area: 'Cível',
    data: '25/03/2026', prazo: '08/04/2026', diasRestantes: 10, status: 'pendente', urgencia: 'media',
    descricao: 'As partes deverão se manifestar sobre o laudo pericial no prazo de 15 dias.',
    lida: true,
  },
  {
    id: 'INT-004', proc: '4005678-90.2024.4.03.6100', tribunal: 'TRF-3', vara: '2ª Vara Tributária',
    tipo: 'Sentença Publicada', cliente: 'Carlos Eduardo Melo', area: 'Tributário',
    data: '24/03/2026', prazo: '07/04/2026', diasRestantes: 9, status: 'pendente', urgencia: 'media',
    descricao: 'Sentença julgou procedente o pedido. Prazo para recurso voluntário: 15 dias.',
    lida: true,
  },
  {
    id: 'INT-005', proc: '0009876-54.2025.8.19.0001', tribunal: 'TJRJ', vara: '1ª Vara de Família',
    tipo: 'Cumpra-se', cliente: 'Ana Beatriz Lima', area: 'Família',
    data: '20/03/2026', prazo: '20/04/2026', diasRestantes: 22, status: 'em_prazo', urgencia: 'baixa',
    descricao: 'Decisão determina a expedição de alvará para levantamento de valores bloqueados.',
    lida: true,
  },
  {
    id: 'INT-006', proc: '2034567-12.2025.4.05.8100', tribunal: 'TRF-5', vara: '2ª Vara Federal',
    tipo: 'Despacho – Documentos', cliente: 'Maria Aparecida Costa', area: 'Previdenciário',
    data: '19/03/2026', prazo: '02/04/2026', diasRestantes: 4, status: 'pendente', urgencia: 'alta',
    descricao: 'O autor deverá juntar aos autos os documentos requisitados pelo perito médico.',
    lida: false,
  },
]

const urgConf = {
  critica: { label: 'CRÍTICA',   bg: 'var(--red-dim)',    color: 'var(--red)',    dot: '#EF4444' },
  alta:    { label: 'ALTA',      bg: 'var(--amber-dim)',  color: 'var(--amber)',  dot: '#F59E0B' },
  media:   { label: 'MÉDIA',     bg: 'var(--blue-dim)',   color: 'var(--blue)',   dot: '#3B82F6' },
  baixa:   { label: 'BAIXA',     bg: 'var(--green-dim)',  color: 'var(--green)',  dot: '#10B981' },
}

export default function Intimacoes() {
  const [busca, setBusca] = useState('')
  const [filtroArea, setFiltroArea] = useState('todas')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [selected, setSelected] = useState(null)

  const filtered = intimacoes.filter(i => {
    const matchBusca = !busca || i.cliente.toLowerCase().includes(busca.toLowerCase()) || i.proc.includes(busca) || i.tribunal.toLowerCase().includes(busca.toLowerCase())
    const matchArea   = filtroArea === 'todas' || i.area === filtroArea
    const matchStatus = filtroStatus === 'todas' || (filtroStatus === 'nao_lidas' ? !i.lida : i.status === filtroStatus)
    return matchBusca && matchArea && matchStatus
  })

  const naoLidas  = intimacoes.filter(i => !i.lida).length
  const urgentes  = intimacoes.filter(i => i.urgencia === 'critica' || i.diasRestantes <= 2).length
  const estaSemana = intimacoes.filter(i => i.diasRestantes <= 7).length

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1400 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Não Lidas',    value: naoLidas,              icon: Bell,         color: 'var(--blue)' },
          { label: 'Críticas',     value: urgentes,              icon: AlertTriangle, color: 'var(--red)' },
          { label: 'Esta Semana',  value: estaSemana,            icon: Clock,        color: 'var(--amber)' },
          { label: 'Total Abertas',value: intimacoes.length,     icon: CheckCircle,  color: 'var(--green)' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: k.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={k.color} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{k.value}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{k.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18 }}>

        {/* Lista */}
        <div>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por cliente, processo, tribunal..."
                style={{ width: '100%', padding: '7px 12px 7px 30px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, color: 'var(--text)', outline: 'none' }} />
            </div>
            <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)} style={{ padding: '7px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, color: 'var(--text2)' }}>
              <option value="todas">Todas as áreas</option>
              <option value="Previdenciário">Previdenciário</option>
              <option value="Trabalhista">Trabalhista</option>
              <option value="Cível">Cível</option>
              <option value="Família">Família</option>
              <option value="Tributário">Tributário</option>
            </select>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ padding: '7px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, color: 'var(--text2)' }}>
              <option value="todas">Todos os status</option>
              <option value="nao_lidas">Não lidas</option>
              <option value="pendente">Pendentes</option>
              <option value="urgente">Urgentes</option>
            </select>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, color: 'var(--blue)', cursor: 'pointer', fontWeight: 600 }}>
              <RefreshCw size={13} /> Sincronizar
            </button>
          </div>

          {filtered.map(int => {
            const uc = urgConf[int.urgencia]
            return (
              <div key={int.id} onClick={() => setSelected(int)} style={{
                padding: '14px 16px', background: selected?.id === int.id ? 'var(--bg3)' : 'var(--bg2)',
                border: `1px solid ${selected?.id === int.id ? 'var(--blue)' : 'var(--border)'}`,
                borderLeft: `3px solid ${uc.dot}`,
                borderRadius: '0 12px 12px 0',
                marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!int.lida && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />}
                    <span style={{ fontSize: 13.5, fontWeight: int.lida ? 600 : 700 }}>{int.tipo}</span>
                    <span style={{ fontSize: 9.5, padding: '1.5px 6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text4)' }}>{int.area}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', background: uc.bg, color: uc.color, borderRadius: 5 }}>{uc.label}</span>
                    <span style={{ fontSize: 11, color: int.diasRestantes <= 2 ? 'var(--red)' : 'var(--text3)', fontWeight: int.diasRestantes <= 2 ? 700 : 400 }}>
                      {int.diasRestantes === 0 ? '🔴 Hoje!' : `${int.diasRestantes}d`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>👤 {int.cliente}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>🏛️ {int.tribunal}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text4)', fontFamily: 'monospace' }}>{int.proc}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detalhe */}
        <div>
          {selected ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, position: 'sticky', top: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)' }}>{selected.id}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: urgConf[selected.urgencia].bg, color: urgConf[selected.urgencia].color, borderRadius: 5 }}>
                  {urgConf[selected.urgencia].label}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{selected.tipo}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  ['Cliente',   selected.cliente],
                  ['Tribunal',  selected.tribunal],
                  ['Vara',      selected.vara],
                  ['Área',      selected.area],
                  ['Processo',  selected.proc],
                  ['Publicado', selected.data],
                  ['Prazo',     selected.prazo],
                ].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text4)', fontWeight: 500 }}>{k}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600, textAlign: 'right', maxWidth: '60%', fontFamily: k === 'Processo' ? 'monospace' : 'inherit', fontSize: k === 'Processo' ? 10.5 : 12 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.5 }}>{selected.descricao}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button style={{ padding: '10px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  📄 Gerar Petição Resposta
                </button>
                <button style={{ padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text2)', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  📅 Adicionar à Agenda
                </button>
                <button style={{ padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text2)', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <ExternalLink size={13} /> Abrir no PJe / e-SAJ
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
              <Bell size={36} color="var(--text4)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Clique em uma intimação para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

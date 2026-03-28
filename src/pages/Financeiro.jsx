import { useState } from 'react'
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle, Download, Plus, Send, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const HONORARIOS = [
  { id: 'HON-001', cliente: 'Carlos Eduardo Melo',   caso: 'PRV-0355', tipo: 'Êxito',         valor: 3700,  vencimento: '—',          status: 'recebido',  data: '10/03/2026' },
  { id: 'HON-002', cliente: 'Luiza Fernandes',       caso: 'PRV-0321', tipo: 'Êxito',         valor: 1412,  vencimento: '—',          status: 'recebido',  data: '02/03/2026' },
  { id: 'HON-003', cliente: 'João Carlos Silva',     caso: 'PRV-0342', tipo: 'Consultoria',   valor: 800,   vencimento: '01/04/2026', status: 'pendente',  data: '15/01/2026' },
  { id: 'HON-004', cliente: 'Maria Aparecida Costa', caso: 'PRV-0389', tipo: 'Inicial',       valor: 500,   vencimento: '25/03/2026', status: 'vencido',   data: '05/02/2026' },
  { id: 'HON-005', cliente: 'Pedro Alves Rocha',     caso: 'PRV-0401', tipo: 'Mensal',        valor: 400,   vencimento: '30/03/2026', status: 'pendente',  data: '18/01/2026' },
  { id: 'HON-006', cliente: 'Ana Beatriz Lima',      caso: 'PRV-0378', tipo: 'Êxito',         valor: 6500,  vencimento: '—',          status: 'aguardando',data: '22/11/2024' },
  { id: 'HON-007', cliente: 'Francisca Oliveira',    caso: 'PRV-0410', tipo: 'Mensal',        valor: 350,   vencimento: '05/04/2026', status: 'pendente',  data: '08/03/2026' },
  { id: 'HON-008', cliente: 'Roberto Nascimento',    caso: 'PRV-0415', tipo: 'Êxito',         valor: 5800,  vencimento: '—',          status: 'aguardando',data: '20/03/2026' },
]

const receitaMensal = [
  { mes: 'Out', valor: 8200 },
  { mes: 'Nov', valor: 12400 },
  { mes: 'Dez', valor: 7600 },
  { mes: 'Jan', valor: 15800 },
  { mes: 'Fev', valor: 11200 },
  { mes: 'Mar', valor: 18900 },
]

const statusConfig = {
  recebido:   { label: 'Recebido',    bg: 'var(--green-dim)',  color: 'var(--green)',  icon: CheckCircle },
  pendente:   { label: 'Pendente',    bg: 'var(--blue-dim)',   color: 'var(--blue-light)', icon: Clock },
  vencido:    { label: 'Vencido',     bg: 'var(--red-dim)',    color: 'var(--red)',    icon: AlertTriangle },
  aguardando: { label: 'Aguardando alvará', bg: 'var(--amber-dim)', color: 'var(--amber)', icon: Clock },
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--green)' }}>R$ {payload[0].value.toLocaleString('pt-BR')}</p>
    </div>
  )
}

export default function Financeiro() {
  const [filtro, setFiltro] = useState('todos')

  const recebido   = HONORARIOS.filter(h => h.status === 'recebido').reduce((s, h) => s + h.valor, 0)
  const pendente   = HONORARIOS.filter(h => h.status === 'pendente').reduce((s, h) => s + h.valor, 0)
  const vencido    = HONORARIOS.filter(h => h.status === 'vencido').reduce((s, h) => s + h.valor, 0)
  const aguardando = HONORARIOS.filter(h => h.status === 'aguardando').reduce((s, h) => s + h.valor, 0)

  const filtered = filtro === 'todos' ? HONORARIOS : HONORARIOS.filter(h => h.status === filtro)

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1300 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Recebido este mês', value: `R$ ${recebido.toLocaleString('pt-BR')}`, color: 'var(--green)', icon: '✅' },
          { label: 'Pendente',          value: `R$ ${pendente.toLocaleString('pt-BR')}`, color: 'var(--blue-light)', icon: '⏳' },
          { label: 'Vencido',           value: `R$ ${vencido.toLocaleString('pt-BR')}`,  color: 'var(--red)', icon: '⚠️' },
          { label: 'Aguardando Alvará', value: `R$ ${aguardando.toLocaleString('pt-BR')}`, color: 'var(--amber)', icon: '🏛️' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: '-0.5px' }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Receita Mensal</h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Honorários recebidos nos últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={receitaMensal} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text4)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" radius={[5,5,0,0]} fill="var(--green)">
                {receitaMensal.map((_, i) => (
                  <Cell key={i} fill={i === receitaMensal.length - 1 ? '#10B981' : '#10B98160'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Ações Rápidas</h3>
          {[
            { icon: '💬', label: 'Enviar cobrança WhatsApp', color: 'var(--green)', action: true },
            { icon: '📄', label: 'Gerar recibo / fatura',    color: 'var(--blue)' },
            { icon: '💳', label: 'Link PIX de pagamento',    color: 'var(--purple)' },
            { icon: '📊', label: 'Relatório do mês (PDF)',   color: 'var(--amber)' },
            { icon: '🔔', label: 'Lembrete automático',      color: 'var(--cyan)' },
          ].map(a => (
            <button key={a.label} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '10px 13px', background: 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: 9,
              color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
              textAlign: 'left', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Filter bar */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['todos','pendente','vencido','aguardando','recebido'].map(s => (
              <button key={s} onClick={() => setFiltro(s)} style={{
                padding: '6px 12px', borderRadius: 7, border: '1px solid',
                fontSize: 12, fontWeight: filtro === s ? 600 : 400,
                background: filtro === s ? 'var(--blue-dim)' : 'transparent',
                borderColor: filtro === s ? 'var(--blue)' : 'var(--border)',
                color: filtro === s ? 'var(--blue-light)' : 'var(--text3)',
                cursor: 'pointer', textTransform: 'capitalize',
              }}>
                {statusConfig[s]?.label || 'Todos'}
              </button>
            ))}
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 8, color: 'white', fontSize: 12.5, fontWeight: 600 }}>
            <Plus size={13} /> Novo Honorário
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)' }}>
              {['ID','Cliente','Caso','Tipo','Vencimento','Valor','Status','Ações'].map((h,i) => (
                <th key={i} style={{ padding: '10px 16px', fontSize: 11.5, fontWeight: 700, color: 'var(--text3)', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(h => {
              const s = statusConfig[h.status]
              return (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 11.5, color: 'var(--text4)', fontWeight: 600 }}>{h.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600 }}>{h.cliente}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--text3)' }}>{h.caso}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text3)' }}>{h.tipo}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: h.status === 'vencido' ? 'var(--red)' : 'var(--text3)', fontWeight: h.status === 'vencido' ? 600 : 400 }}>{h.vencimento}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: 'var(--green)' }}>
                    R$ {h.valor.toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: s?.bg, color: s?.color, whiteSpace: 'nowrap' }}>{s?.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {(h.status === 'pendente' || h.status === 'vencido') && (
                        <button title="Enviar cobrança" style={{ background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '4px 8px', color: 'var(--green)', fontSize: 11.5' }}>
                          <Send size={12} />
                        </button>
                      )}
                      <button title="Baixar recibo" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text3)' }}>
                        <Download size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text3)' }}>Total: R$ {filtered.reduce((s,h) => s+h.valor, 0).toLocaleString('pt-BR')} · {filtered.length} registros</span>
        </div>
      </div>
    </div>
  )
}

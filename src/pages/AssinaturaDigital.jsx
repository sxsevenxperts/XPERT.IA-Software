import { useState } from 'react'
import { PenTool, Upload, CheckCircle, Clock, AlertCircle, Download, Eye, Send, Plus, Shield } from 'lucide-react'

const docs = [
  { id: 1, nome: 'Procuração – João Carlos Silva',   tipo: 'Procuração',   area: 'Previdenciário', criado: '27/03/2026', status: 'pendente',    assinantes: ['João Carlos Silva'], assinados: 0, total: 1 },
  { id: 2, nome: 'Contrato de Honorários – Fernanda',tipo: 'Contrato',     area: 'Trabalhista',    criado: '26/03/2026', status: 'assinado',    assinantes: ['Fernanda Oliveira'], assinados: 1, total: 1 },
  { id: 3, nome: 'Autorização Médica – Pedro Rocha', tipo: 'Autorização',  area: 'Cível',          criado: '25/03/2026', status: 'parcial',     assinantes: ['Pedro Alves Rocha', 'Dr. Lima (Perito)'], assinados: 1, total: 2 },
  { id: 4, nome: 'Acordo de Divórcio – Ana Lima',    tipo: 'Acordo',       area: 'Família',        criado: '24/03/2026', status: 'expirado',    assinantes: ['Ana Beatriz Lima', 'Carlos Ramos'], assinados: 0, total: 2 },
  { id: 5, nome: 'Proposta Honorários – Carlos Melo',tipo: 'Proposta',     area: 'Previdenciário', criado: '23/03/2026', status: 'pendente',    assinantes: ['Carlos Eduardo Melo'], assinados: 0, total: 1 },
]

const statusCfg = {
  pendente:  { label: 'Aguardando',     bg: 'var(--amber-dim)',  color: 'var(--amber)',  icon: Clock },
  parcial:   { label: 'Parcial',        bg: 'var(--blue-dim)',   color: 'var(--blue)',   icon: Clock },
  assinado:  { label: 'Assinado',       bg: 'var(--green-dim)',  color: 'var(--green)',  icon: CheckCircle },
  expirado:  { label: 'Expirado',       bg: 'var(--red-dim)',    color: 'var(--red)',    icon: AlertCircle },
}

const templates = [
  { id: 1, nome: 'Procuração Previdenciária', desc: 'Poderes para representação no INSS e tribunais', icon: '📜' },
  { id: 2, nome: 'Contrato de Honorários',    desc: 'Honorários fixos + êxito com cláusulas padrão',  icon: '💼' },
  { id: 3, nome: 'Acordo Trabalhista',         desc: 'Termo de acordo com quitação trabalhista',        icon: '🤝' },
  { id: 4, nome: 'Autorização de Perícia',     desc: 'Autorização para realização de perícia médica',   icon: '🏥' },
  { id: 5, nome: 'Declaração de Pobreza',      desc: 'Declaração de hipossuficiência econômica',        icon: '📋' },
  { id: 6, nome: 'Distrato de Mandato',        desc: 'Revogação de procuração judicial',                icon: '❌' },
]

export default function AssinaturaDigital() {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const total    = docs.length
  const assinados = docs.filter(d => d.status === 'assinado').length
  const pendentes = docs.filter(d => d.status === 'pendente' || d.status === 'parcial').length

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1300 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total de Docs',  value: total,    icon: '📄', color: 'var(--blue)' },
          { label: 'Assinados',      value: assinados, icon: '✅', color: 'var(--green)' },
          { label: 'Aguardando',     value: pendentes, icon: '⏳', color: 'var(--amber)' },
          { label: 'Taxa Assinatura',value: `${Math.round(assinados/total*100)}%`, icon: '📊', color: 'var(--purple)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

        <div>
          {/* Ações */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setShowUpload(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
              background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none',
              borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Upload size={14} /> Enviar para Assinar
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 9, color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
            }}>
              <Plus size={14} /> Novo com Template
            </button>
          </div>

          {/* Upload area */}
          {showUpload && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setShowUpload(false) }}
              style={{
                border: `2px dashed ${dragOver ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 14, padding: '28px', textAlign: 'center', marginBottom: 16,
                background: dragOver ? 'var(--blue-dim)' : 'var(--bg2)', transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Arraste o PDF aqui ou</p>
              <button style={{ padding: '8px 20px', background: 'var(--blue)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Escolher arquivo
              </button>
              <p style={{ fontSize: 11, color: 'var(--text4)', marginTop: 8 }}>Suporta PDF, DOC, DOCX até 20MB</p>
            </div>
          )}

          {/* Docs list */}
          {docs.map(doc => {
            const sc   = statusCfg[doc.status]
            const Icon = sc.icon
            return (
              <div key={doc.id} onClick={() => setSelectedDoc(doc)} style={{
                padding: '14px 16px', background: selectedDoc?.id === doc.id ? 'var(--bg3)' : 'var(--bg2)',
                border: `1px solid ${selectedDoc?.id === doc.id ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 12, marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{doc.nome}</span>
                      <span style={{ fontSize: 9.5, padding: '1.5px 6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text4)' }}>{doc.tipo}</span>
                      <span style={{ fontSize: 9.5, padding: '1.5px 6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text4)' }}>{doc.area}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text3)' }}>
                      <span>📅 {doc.criado}</span>
                      <span>👤 {doc.assinantes.join(', ')}</span>
                      <span style={{ fontWeight: 600, color: doc.assinados === doc.total ? 'var(--green)' : 'var(--amber)' }}>
                        {doc.assinados}/{doc.total} assinatura{doc.total > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', background: sc.bg, color: sc.color, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon size={11} /> {sc.label}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ width: 28, height: 28, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                        <Eye size={12} />
                      </button>
                      <button style={{ width: 28, height: 28, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                        <Download size={12} />
                      </button>
                      {(doc.status === 'pendente' || doc.status === 'parcial') && (
                        <button style={{ width: 28, height: 28, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                          <Send size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 10, height: 4, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(doc.assinados/doc.total)*100}%`, background: doc.assinados === doc.total ? 'var(--green)' : 'var(--blue)', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Side: Templates + Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Shield size={16} color="var(--green)" />
              <h4 style={{ fontSize: 13, fontWeight: 700 }}>Segurança</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🔐', text: 'ICP-Brasil Compliant' },
                { icon: '⚡', text: 'Assinatura em 1 clique' },
                { icon: '📧', text: 'Notificação por e-mail' },
                { icon: '💾', text: 'Armazenamento seguro' },
                { icon: '✅', text: 'Validade jurídica Lei 14.063/2020' },
              ].map(s => (
                <div key={s.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                  <span>{s.icon}</span> {s.text}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Templates Prontos</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {templates.map(t => (
                <button key={t.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t.nome}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 1 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

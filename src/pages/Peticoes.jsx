import { useState } from 'react'
import { Scroll, Brain, Search, Plus, Download, Zap, CheckCircle, Copy, Edit3, RefreshCw, Star, ExternalLink, X, ChevronRight } from 'lucide-react'

/* ──────────────── ÁREAS DO DIREITO ──────────────── */
const AREAS = [
  {
    id: 'previdenciario', icon: '⚖️', label: 'Previdenciário', cor: '#3B82F6',
    tipos: [
      'Petição Inicial — Aposentadoria por Idade',
      'Petição Inicial — Aposentadoria Programada',
      'Petição Inicial — Aposentadoria Especial',
      'Petição Inicial — BPC/Loas (Deficiência)',
      'Petição Inicial — BPC/Loas (Idoso)',
      'Petição Inicial — Auxílio por Incapacidade',
      'Petição Inicial — Pensão por Morte',
      'Recurso Administrativo ao INSS',
      'Recurso Ordinário ao CRPS',
      'Contestação de Indeferimento',
      'Mandado de Segurança (INSS)',
      'Petição Inicial — Revisão do Teto',
      'Petição Inicial — Revisão Buraco Negro',
      'Pedido de Prorrogação de Benefício',
    ],
  },
  {
    id: 'trabalhista', icon: '👷', label: 'Trabalhista', cor: '#F59E0B',
    tipos: [
      'Reclamação Trabalhista',
      'Recurso Ordinário Trabalhista',
      'Ação de Rescisão Indireta',
      'Ação de Horas Extras',
      'Ação de FGTS + Multa',
      'Ação de Assédio Moral',
      'Embargos à Execução Trabalhista',
    ],
  },
  {
    id: 'civil', icon: '🏛️', label: 'Civil', cor: '#8B5CF6',
    tipos: [
      'Petição Inicial — Ação de Cobrança',
      'Petição Inicial — Responsabilidade Civil',
      'Ação de Dano Moral',
      'Pedido de Liminar (Tutela Antecipada)',
      'Contestação Cível',
      'Recurso de Apelação',
      'Impugnação à Penhora',
    ],
  },
  {
    id: 'familia', icon: '👨‍👩‍👧', label: 'Família', cor: '#EC4899',
    tipos: [
      'Petição de Divórcio Consensual',
      'Ação de Divórcio Litigioso',
      'Ação de Alimentos',
      'Ação de Guarda e Visitação',
      'Reconhecimento de União Estável',
      'Ação de Adoção',
      'Investigação de Paternidade',
    ],
  },
  {
    id: 'penal', icon: '⚔️', label: 'Penal', cor: '#EF4444',
    tipos: [
      'Defesa Criminal — Resposta à Acusação',
      'Pedido de Liberdade Provisória',
      'Recurso em Sentido Estrito',
      'Apelação Criminal',
      'Habeas Corpus',
      'Revisão Criminal',
      'Pedido de Sursis',
    ],
  },
  {
    id: 'consumidor', icon: '🛒', label: 'Consumidor', cor: '#10B981',
    tipos: [
      'Ação de Defeito de Produto',
      'Ação por Serviço Inadequado',
      'Ação de Indenização — Plano de Saúde',
      'Ação de Restituição de Valores',
      'Ação de Cancelamento de Contrato',
      'Negativa de Cobertura — Plano de Saúde',
    ],
  },
  {
    id: 'imobiliario', icon: '🏠', label: 'Imobiliário', cor: '#06B6D4',
    tipos: [
      'Ação de Usucapião',
      'Ação de Despejo por Falta de Pagamento',
      'Ação Revisional de Aluguel',
      'Ação de Reintegração de Posse',
      'Ação de Regularização de Imóvel',
      'Ação de Rescisão de Compra e Venda',
    ],
  },
  {
    id: 'tributario', icon: '💰', label: 'Tributário', cor: '#F59E0B',
    tipos: [
      'Mandado de Segurança Tributário',
      'Ação de Repetição de Indébito',
      'Impugnação de Auto de Infração',
      'Recurso Administrativo Fiscal',
      'Ação Anulatória de Débito Fiscal',
      'Pedido de Parcelamento — REFIS',
    ],
  },
  {
    id: 'transito', icon: '🚗', label: 'Trânsito', cor: '#F97316',
    tipos: [
      'Recurso de Infração de Trânsito',
      'Recurso de Suspensão de CNH',
      'Ação de Indenização — Acidente de Trânsito',
      'Recurso ao CETRAN',
      'Defesa de Auto de Infração',
    ],
  },
  {
    id: 'administrativo', icon: '🏢', label: 'Administrativo', cor: '#64748B',
    tipos: ['Mandado de Segurança', 'Ação Popular', 'Recurso Administrativo', 'Impugnação de Edital'],
  },
]

const MELHORIAS = [
  { id: 'revisar',    icon: '✅', label: 'Revisar e Corrigir',   desc: 'Gramática, coesão e clareza jurídica' },
  { id: 'fortalecer', icon: '💪', label: 'Fortalecer Argumentos', desc: 'Aprofundar fundamentos e teses' },
  { id: 'jurisprudencia', icon: '⚖️', label: 'Adicionar Jurisprudência', desc: 'Inserir precedentes relevantes do STJ/TRF' },
  { id: 'simplificar', icon: '✂️', label: 'Simplificar Linguagem', desc: 'Tornar mais acessível sem perder tecnicidade' },
  { id: 'formatacao', icon: '📐', label: 'Ajustar Formatação',   desc: 'Estrutura ABNT e normas processuais' },
]

/* Mock gerado para o demo */
const MOCK_PETICAO = `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) FEDERAL DA VARA PREVIDENCIÁRIA

JOÃO CARLOS SILVA, brasileiro, aposentado, portador do CPF nº 123.456.789-00, residente e domiciliado na Rua das Flores, nº 123, Bairro Centro, São Paulo/SP, CEP 01310-100, por intermédio de seu advogado que esta subscreve (procuração em anexo), vem respeitosamente à presença de V. Exª., com fundamento no art. 5º, LXIX, da Constituição Federal, na Lei n.º 8.213/1991 e no Decreto n.º 10.410/2020, propor a presente

AÇÃO DE CONCESSÃO DE APOSENTADORIA POR IDADE
em face do INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS, autarquia federal, pelos fatos e fundamentos a seguir expostos:

I — DOS FATOS

O(A) requerente nasceu em 15/04/1960, contando atualmente com 65 (sessenta e cinco) anos de idade, e possui 22 (vinte e dois) anos de contribuição comprovados perante o INSS, conforme Cadastro Nacional de Informações Sociais — CNIS em anexo.

Ocorre que, em [DATA], o(a) requerente formulou pedido administrativo junto ao INSS para concessão de Aposentadoria por Idade, o qual foi indeferido sob o fundamento de [MOTIVAÇÃO DO INDEFERIMENTO], o que não se sustenta diante dos documentos colacionados.

II — DO DIREITO

II.1 — DOS REQUISITOS PARA CONCESSÃO

Nos termos do art. 48 da Lei n.º 8.213/1991, com a redação conferida pela Emenda Constitucional n.º 103/2019, a Aposentadoria por Idade possui como requisitos:
• Para o segurado do sexo masculino: 65 (sessenta e cinco) anos de idade e 20 (vinte) anos de contribuição;
• Carência mínima de 180 contribuições mensais.

O(A) requerente atende a TODOS os requisitos legais, conforme documentação acostada.

II.2 — DO CÁLCULO DA RENDA MENSAL INICIAL

O salário de benefício corresponde à média aritmética simples de 100% dos salários de contribuição, sendo a RMI calculada na forma do § 5º do art. 26 da EC 103/2019: 60% do salário de benefício acrescido de 2% para cada ano de contribuição acima de 20 anos.

III — DOS PEDIDOS

Ante o exposto, requer seja julgado procedente o pedido, para que:
a) Seja concedida a Aposentadoria por Idade, com DIB fixada na data do requerimento administrativo;
b) Sejam pagas as parcelas vencidas desde a DIB até a data da implantação do benefício, devidamente atualizadas pelo INPC + juros de 1% a.m. (Súmula 204/STJ);
c) Sejam deferidos os benefícios da Justiça Gratuita (declaração em anexo);
d) Seja determinada a inversão do ônus probatório, nos termos do art. 373, § 1º, do CPC.

Dá-se à causa o valor de R$ [VALOR].

Termos em que pede deferimento.

[Cidade], [Data].

[ADVOGADO]
OAB/[ESTADO] nº [NÚMERO]`

export default function Peticoes() {
  const [areaAtiva, setAreaAtiva]     = useState('previdenciario')
  const [tipoSelecionado, setTipo]    = useState('')
  const [loading, setLoading]         = useState(false)
  const [peticaoGerada, setPeticao]   = useState('')
  const [abaMelhoria, setAbaMelhoria] = useState(null)
  const [tab, setTab]                 = useState('gerar') // gerar | melhorar | documentos

  const area = AREAS.find(a => a.id === areaAtiva)

  function gerarPeticao() {
    if (!tipoSelecionado) return
    setLoading(true)
    setTimeout(() => {
      setPeticao(MOCK_PETICAO)
      setLoading(false)
    }, 2000)
  }

  function copiarTexto() {
    navigator.clipboard.writeText(peticaoGerada)
  }

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1400 }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg3)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
        {[
          { id: 'gerar',      label: '✍️ Gerar Peça' },
          { id: 'melhorar',   label: '✨ Melhorar Peça' },
          { id: 'documentos', label: '📋 Documentos Extras' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: tab === t.id ? 'var(--bg2)' : 'transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--text3)',
            fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            cursor: 'pointer',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GERAR PEÇA ── */}
      {tab === 'gerar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

          {/* Sidebar áreas */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700 }}>Áreas do Direito</h4>
            </div>
            <div style={{ padding: '8px 8px' }}>
              {AREAS.map(a => (
                <button key={a.id} onClick={() => { setAreaAtiva(a.id); setTipo(''); setPeticao('') }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 10px', borderRadius: 8, border: 'none',
                  background: areaAtiva === a.id ? a.cor + '18' : 'transparent',
                  color: areaAtiva === a.id ? 'white' : 'var(--text3)',
                  fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  marginBottom: 2,
                  borderLeft: areaAtiva === a.id ? `3px solid ${a.cor}` : '3px solid transparent',
                }}>
                  <span style={{ fontSize: 15 }}>{a.icon}</span>
                  <span style={{ fontWeight: areaAtiva === a.id ? 600 : 400 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div>
            {!peticaoGerada ? (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: 22 }}>{area?.icon}</span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>{area?.label}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>Selecione o tipo de documento</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                  {area?.tipos.map(t => (
                    <button key={t} onClick={() => setTipo(t)} style={{
                      padding: '11px 14px', borderRadius: 9, border: '1px solid',
                      background: tipoSelecionado === t ? area.cor + '15' : 'var(--bg3)',
                      borderColor: tipoSelecionado === t ? area.cor : 'var(--border)',
                      color: tipoSelecionado === t ? 'white' : 'var(--text2)',
                      fontSize: 12.5, cursor: 'pointer', textAlign: 'left',
                      fontWeight: tipoSelecionado === t ? 600 : 400,
                      transition: 'all 0.15s',
                    }}>
                      {t}
                    </button>
                  ))}
                </div>

                {tipoSelecionado && (
                  <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Nome do cliente', placeholder: 'Ex: João Carlos Silva' },
                      { label: 'CPF', placeholder: '000.000.000-00' },
                      { label: 'Número do processo (se houver)', placeholder: 'Ex: 1234567-89.2024.4.03.6183' },
                      { label: 'Comarca / Vara', placeholder: 'Ex: 1ª Vara Previdenciária SP' },
                    ].map((f, i) => (
                      <div key={i}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                        <input placeholder={f.placeholder} style={{ width: '100%', padding: '9px 11px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}
                          onFocus={e => e.target.style.borderColor = area.cor}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={gerarPeticao}
                  disabled={!tipoSelecionado || loading}
                  style={{
                    padding: '12px 24px',
                    background: !tipoSelecionado ? 'var(--bg4)' : `linear-gradient(135deg, ${area?.cor}, ${area?.cor}99)`,
                    border: 'none', borderRadius: 9, color: 'white',
                    fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: !tipoSelecionado ? 0.5 : 1,
                    boxShadow: tipoSelecionado ? `0 4px 14px ${area?.cor}40` : 'none',
                  }}
                >
                  {loading
                    ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Gerando com IA...</>
                    : <><Zap size={15} /> Gerar Peça com IA</>
                  }
                </button>
              </div>
            ) : (
              <div className="fade-in">
                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>✅ Peça Gerada</h3>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>{tipoSelecionado}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setTipo(''); setPeticao('') }} style={{ padding: '8px 13px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <RefreshCw size={12} /> Nova peça
                    </button>
                    <button onClick={copiarTexto} style={{ padding: '8px 13px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Copy size={12} /> Copiar
                    </button>
                    <button style={{ padding: '8px 13px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--green)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Download size={12} /> Baixar DOCX
                    </button>
                  </div>
                </div>

                {/* Melhoria rápida */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {MELHORIAS.slice(0,4).map(m => (
                    <button key={m.id} style={{
                      padding: '6px 12px', fontSize: 12, borderRadius: 7,
                      background: abaMelhoria === m.id ? 'var(--purple-dim)' : 'var(--bg3)',
                      border: `1px solid ${abaMelhoria === m.id ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                      color: abaMelhoria === m.id ? 'var(--purple)' : 'var(--text3)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    }} onClick={() => setAbaMelhoria(abaMelhoria === m.id ? null : m.id)}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>

                {/* Text area */}
                <textarea
                  value={peticaoGerada}
                  onChange={e => setPeticao(e.target.value)}
                  style={{
                    width: '100%', minHeight: 520,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '18px', fontSize: 13,
                    color: 'var(--text)', lineHeight: 1.7, resize: 'vertical',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = area.cor}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MELHORAR PEÇA ── */}
      {tab === 'melhorar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Cole sua peça aqui</label>
              <textarea placeholder="Insira o texto da peça que deseja melhorar com IA..."
                style={{ width: '100%', height: 400, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, resize: 'vertical', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <button style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--purple), var(--blue))', border: 'none', borderRadius: 9, color: 'white', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}>
              <Zap size={15} /> Melhorar com IA
            </button>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Tipos de melhoria</h4>
            {MELHORIAS.map(m => (
              <button key={m.id} style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg3)', marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.label}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text4)', marginTop: 2 }}>{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── DOCUMENTOS EXTRAS ── */}
      {tab === 'documentos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { icon: '📋', label: 'Contrato de Honorários', desc: 'Modelo profissional com cláusulas de êxito' },
            { icon: '🤝', label: 'Procuração', desc: 'Ad judicia et extra — todos os atos processuais' },
            { icon: '📊', label: 'Planilha de Cálculos', desc: 'Planilha de atualização monetária e juros' },
            { icon: '📝', label: 'Declaração de Hipossuficiência', desc: 'Para gratuidade judiciária' },
            { icon: '📬', label: 'Carta ao Cliente', desc: 'Comunicação de resultado ou prazo' },
            { icon: '📑', label: 'Minuta de Acordo', desc: 'Proposta de acordo extrajudicial' },
            { icon: '🔔', label: 'Notificação Extrajudicial', desc: 'Para constituição em mora' },
            { icon: '📋', label: 'Resumo para o Cliente', desc: 'Explicação em linguagem simples' },
            { icon: '⚠️', label: 'Parecer Jurídico', desc: 'Opinião técnica fundamentada' },
            { icon: '📄', label: 'Memorial Descritivo', desc: 'Síntese dos fatos e do direito' },
          ].map((d, i) => (
            <button key={i} style={{
              padding: '18px 16px', background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: 26, display: 'block', marginBottom: 10 }}>{d.icon}</span>
              <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>{d.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text4)' }}>{d.desc}</p>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--blue)', fontWeight: 600 }}>
                <Zap size={11} /> Gerar com IA
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

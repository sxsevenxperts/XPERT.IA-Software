import { useState } from 'react'
import { Search, BookOpen, ChevronDown, ChevronRight, ExternalLink, AlertTriangle, Brain, Sparkles, Star, TrendingUp } from 'lucide-react'
import { callClaude } from '../lib/claude'

/* ── Dados mock ── */
const sumulas = [
  { id: 'STJ-211', tribunal: 'STJ', tipo: 'Súmula', area: 'Previdenciário', titulo: 'Inadmissível recurso especial quanto à questão que, a despeito da oposição de embargos declaratórios, não foi apreciada pelo Tribunal a quo.', relevancia: 'alta' },
  { id: 'TNU-10',  tribunal: 'TNU', tipo: 'Súmula', area: 'Previdenciário', titulo: 'O tempo de serviço rural anterior à vigência da Lei 8.213/91, sem o recolhimento de contribuições previdenciárias, pode ser reconhecido para fins de contagem recíproca.', relevancia: 'alta' },
  { id: 'TST-262', tribunal: 'TST', tipo: 'Súmula', area: 'Trabalhista', titulo: 'As cláusulas regulamentares, que revoguem ou alterem vantagens deferidas anteriormente, só atingirão os trabalhadores admitidos após a revogação ou alteração do regulamento.', relevancia: 'media' },
  { id: 'STJ-385', tribunal: 'STJ', tipo: 'Súmula', area: 'Cível', titulo: 'Da anotação irregular em cadastro de proteção ao crédito, não cabe indenização por dano moral, quando preexistente legítima inscrição, ressalvado o direito ao cancelamento.', relevancia: 'media' },
  { id: 'STF-674', tribunal: 'STF', tipo: 'Súmula', area: 'Trabalhista', titulo: 'É inconstitucional a vinculação do reajuste de vencimentos de servidores estaduais ou municipais a índices federais de correção monetária.', relevancia: 'baixa' },
  { id: 'TNU-47',  tribunal: 'TNU', tipo: 'Súmula', area: 'Previdenciário', titulo: 'Uma vez reconhecida a incapacidade parcial para o trabalho, o juiz deve analisar as condições pessoais e sociais do segurado para a concessão de aposentadoria por invalidez.', relevancia: 'alta' },
]

const jurisprudencias = [
  { id: 'REsp 1.938.289', tribunal: 'STJ', area: 'Previdenciário', relator: 'Min. Regina Helena Costa', data: '15/02/2025', tema: 'BPC/LOAS – Renda familiar per capita', ementa: 'A renda do idoso cujo benefício se postula, bem como a de sua esposa ou companheira, não deve ser levada em consideração para o cálculo da renda familiar per capita para concessão do BPC/LOAS, nos termos do art. 20, §3º, da Lei 8.742/93, com a redação dada pela Lei 13.981/2020.', favoravel: true, citacoes: 142 },
  { id: 'IRDR TRF5 – Tema 4', tribunal: 'TRF-5', area: 'Previdenciário', relator: 'Des. Federal Cid Marconi', data: '03/03/2025', tema: 'Aposentadoria Especial – Ruído acima de 85 dB', ementa: 'Comprovada a exposição a agentes nocivos (ruído acima de 85 dB) de forma habitual e permanente, faz jus o segurado à aposentadoria especial, independentemente do uso de EPI, por força do decidido no RE 664.335/SC (STF – Repercussão Geral).', favoravel: true, citacoes: 87 },
  { id: 'RR-1000234-45.2024', tribunal: 'TST', area: 'Trabalhista', relator: 'Min. Alexandre Agra Belmonte', data: '10/01/2025', tema: 'Horas Extras – Banco de Horas – Invalidade', ementa: 'A invalidade do banco de horas não enseja pagamento em dobro das horas extras, mas com o adicional de 50% sobre as horas efetivamente prestadas acima da jornada contratual, nos termos do art. 59 da CLT.', favoravel: false, citacoes: 53 },
  { id: 'AC 2024.000123-7', tribunal: 'TJSP', area: 'Cível', relator: 'Des. Roberto Maia', data: '22/02/2025', tema: 'Responsabilidade Civil – Dano Moral Digital – LGPD', ementa: 'A exposição indevida de dados pessoais em plataforma digital, sem consentimento do titular, configura dano moral in re ipsa, dispensando prova do efetivo abalo sofrido, nos termos dos arts. 42 e 44 da LGPD (Lei 13.709/2018).', favoravel: true, citacoes: 31 },
]

const tesesDB = {
  'Previdenciário': [
    { tese: 'BPC/LOAS – Renda per capita abaixo de ¼ salário mínimo', fundamento: 'Art. 20, §3º, Lei 8.742/93 c/c STF RE 567.985 (Repercussão Geral)', pontuacao: 9.2, risco: 'baixo', favoraveis: 'STJ, TNU, TRFs (unanimidade)', contrarias: 'Atos normativos INSS (superados judicialmente)' },
    { tese: 'Tempo rural não contribuído – contagem recíproca', fundamento: 'Art. 55, §3º, Lei 8.213/91 c/c TNU Súm. 10 c/c STJ pacificado', pontuacao: 8.7, risco: 'baixo', favoraveis: 'TNU, TRFs, STJ', contrarias: 'INSS administrativamente' },
    { tese: 'Aposentadoria especial – ruído sem EPI eficaz', fundamento: 'RE 664.335 STF (Repercussão Geral) c/c TNU Súm. 9', pontuacao: 9.5, risco: 'muito baixo', favoraveis: 'STF, TNU, TRFs', contrarias: 'Nenhuma posição relevante contrária' },
    { tese: 'Revisão teto previdenciário – EC 20/1998', fundamento: 'RE 564.354 STF c/c jurisprudência consolidada', pontuacao: 7.4, risco: 'médio', favoraveis: 'STF, alguns TRFs', contrarias: 'Divergência interna TRF-3' },
  ],
  'Trabalhista': [
    { tese: 'Vínculo empregatício – subordinação jurídica presumida', fundamento: 'Art. 3º CLT c/c OJ 301 SDI-1 TST', pontuacao: 8.1, risco: 'médio', favoraveis: 'TST, TRTs', contrarias: 'Discussão sobre plataformas digitais em curso' },
    { tese: 'Horas extras – ônus da prova do empregador (ponto)', fundamento: 'Súm. 338 TST c/c Art. 74 CLT', pontuacao: 8.9, risco: 'baixo', favoraveis: 'TST, TRTs (consolidado)', contrarias: 'Controles alternativos aceitos em casos específicos' },
    { tese: 'Intervalo intrajornada – supressão gera pagamento', fundamento: 'Art. 71, §4º CLT c/c Súm. 437 TST', pontuacao: 8.5, risco: 'baixo', favoraveis: 'TST', contrarias: 'Acordos coletivos podem flexibilizar' },
  ],
  'Cível': [
    { tese: 'Dano moral in re ipsa – vazamento de dados LGPD', fundamento: 'Arts. 42-44 LGPD (Lei 13.709/18) c/c STJ (resp. objetiva)', pontuacao: 7.8, risco: 'médio', favoraveis: 'STJ, TJSP, TJRJ', contrarias: 'Posições que exigem prova do dano' },
    { tese: 'Juros – Tabela SELIC (art. 406 CC)', fundamento: 'Art. 406 CC c/c STJ Súm. vinculante', pontuacao: 9.1, risco: 'baixo', favoraveis: 'STJ (pacificado)', contrarias: 'Nenhuma relevante' },
  ],
  'Família': [
    { tese: 'Alimentos – binômio necessidade/possibilidade', fundamento: 'Art. 1.694, §1º CC c/c jurisprudência STJ', pontuacao: 8.8, risco: 'baixo', favoraveis: 'STJ, TJs', contrarias: 'Variação casuística' },
  ],
  'Consumidor': [
    { tese: 'Responsabilidade objetiva do fornecedor por fato do produto', fundamento: 'Art. 12 CDC c/c STJ (cláusula geral resp. objetiva)', pontuacao: 9.3, risco: 'muito baixo', favoraveis: 'STJ, TJs (unânime)', contrarias: 'Excludentes: caso fortuito externo' },
  ],
}

const AREAS    = ['Todas', 'Previdenciário', 'Trabalhista', 'Cível', 'Família', 'Consumidor', 'Tributário']
const TRIBUNAIS_LIST = ['Todos', 'STF', 'STJ', 'TST', 'TNU', 'TRF-1', 'TRF-2', 'TRF-3', 'TRF-4', 'TRF-5', 'TJSP', 'TJRJ', 'TJMG']

const riscoCfg = {
  'muito baixo': { bg: 'var(--green-dim)',  color: 'var(--green)' },
  'baixo':       { bg: 'var(--green-dim)',  color: 'var(--green)' },
  'médio':       { bg: 'var(--amber-dim)',  color: 'var(--amber)' },
  'alto':        { bg: 'var(--red-dim)',    color: 'var(--red)' },
}

export default function Jurisprudencia() {
  const [tab, setTab]           = useState('jurisprudencia')
  const [busca, setBusca]       = useState('')
  const [area, setArea]         = useState('Todas')
  const [tribunal, setTribunal] = useState('Todos')
  const [expanded, setExpanded] = useState(null)
  const [areaAnalise, setAreaAnalise] = useState('Previdenciário')
  const [tesesOpen, setTesesOpen]     = useState({})

  // IA States
  const [iaQuery, setIaQuery]   = useState('')
  const [iaResult, setIaResult] = useState('')
  const [iaLoading, setIaLoading] = useState(false)
  const [iaError, setIaError]   = useState('')

  const filteredJuris = jurisprudencias.filter(j => {
    const mA = area === 'Todas' || j.area === area
    const mT = tribunal === 'Todos' || j.tribunal === tribunal
    const mB = !busca || j.tema.toLowerCase().includes(busca.toLowerCase()) || j.id.toLowerCase().includes(busca.toLowerCase())
    return mA && mT && mB
  })

  const filteredSumulas = sumulas.filter(s => {
    const mA = area === 'Todas' || s.area === area
    const mT = tribunal === 'Todos' || s.tribunal === tribunal
    const mB = !busca || s.titulo.toLowerCase().includes(busca.toLowerCase()) || s.id.toLowerCase().includes(busca.toLowerCase())
    return mA && mT && mB
  })

  const teses = tesesDB[areaAnalise] || []

  const handleIaAnalysis = async () => {
    if (!iaQuery.trim()) return
    setIaLoading(true)
    setIaError('')
    setIaResult('')
    try {
      const prompt = `Você é um assistente jurídico especializado em Direito Brasileiro. Analise a seguinte questão jurídica e forneça: 1) Teses relevantes com fundamento legal, 2) Jurisprudência aplicável (STF, STJ, tribunais superiores), 3) Súmulas pertinentes, 4) Avaliação da viabilidade da tese com justificativa. Seja preciso, cite diplomas legais e precedentes reais. NÃO prometa resultados — informe apenas o estado da jurisprudência. Questão: "${iaQuery}"`
      const result = await callClaude(prompt)
      setIaResult(result)
    } catch (err) {
      setIaError(err.message || 'Configure a chave da API Claude em Configurações para usar este recurso.')
    } finally {
      setIaLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1300 }}>

      {/* Aviso OAB */}
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
        <AlertTriangle size={14} color="var(--amber)" style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ color: 'var(--text2)', lineHeight: 1.5 }}>
          <strong>Ferramenta de pesquisa e suporte à advocacia.</strong> As análises são baseadas em jurisprudência pública e não substituem o juízo do advogado responsável (art. 2º §2º EOAB, Res. 2/2018 OAB). Resultados dependem dos fatos concretos de cada caso.
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' }}>
        {[
          { id: 'jurisprudencia', label: '⚖️ Jurisprudência' },
          { id: 'sumulas',        label: '📚 Súmulas' },
          { id: 'analise',        label: '📊 Análise de Teses' },
          { id: 'ia',             label: '🧠 Pesquisa com IA' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: tab === t.id ? 'var(--blue)' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--text3)', transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtros (exceto aba IA) */}
      {tab !== 'ia' && tab !== 'analise' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por tema, ementa, número, CID..."
              style={{ width: '100%', padding: '8px 12px 8px 30px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <select value={area} onChange={e => setArea(e.target.value)} style={{ padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text2)' }}>
            {AREAS.map(a => <option key={a}>{a}</option>)}
          </select>
          <select value={tribunal} onChange={e => setTribunal(e.target.value)} style={{ padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text2)' }}>
            {TRIBUNAIS_LIST.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* ── JURISPRUDÊNCIA ── */}
      {tab === 'jurisprudencia' && filteredJuris.map(j => (
        <div key={j.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => setExpanded(expanded === j.id ? null : j.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', fontFamily: 'monospace' }}>{j.id}</span>
                <span style={{ fontSize: 10, padding: '1.5px 7px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 4, color: 'var(--blue)', fontWeight: 700 }}>{j.tribunal}</span>
                <span style={{ fontSize: 10, padding: '1.5px 6px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text4)' }}>{j.area}</span>
                <span style={{ fontSize: 10, padding: '1.5px 7px', background: j.favoravel ? 'var(--green-dim)' : 'var(--red-dim)', color: j.favoravel ? 'var(--green)' : 'var(--red)', borderRadius: 4, fontWeight: 700 }}>
                  {j.favoravel ? '✓ Favorável' : '✗ Desfavorável'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>📌 {j.citacoes}</span>
                {expanded === j.id ? <ChevronDown size={14} color="var(--text4)" /> : <ChevronRight size={14} color="var(--text4)" />}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{j.tema}</div>
            <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.5 }}>{j.ementa.slice(0, 180)}...</p>
          </div>
          {expanded === j.id && (
            <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px', margin: '14px 0' }}>
                <p style={{ fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text)' }}>"{j.ementa}"</p>
                <p style={{ fontSize: 11, color: 'var(--text4)', marginTop: 8 }}>Rel. {j.relator} · {j.tribunal} · {j.data}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '7px 14px', background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ExternalLink size={12} /> JusBrasil
                </button>
                <button style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                  📄 Usar na Petição
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ── SÚMULAS ── */}
      {tab === 'sumulas' && filteredSumulas.map(s => {
        const rc = { alta: { bg:'var(--red-dim)', color:'var(--red)' }, media: { bg:'var(--amber-dim)', color:'var(--amber)' }, baixa: { bg:'var(--green-dim)', color:'var(--green)' } }[s.relevancia]
        return (
          <div key={s.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--blue)', fontFamily: 'monospace' }}>Súm. {s.id}</span>
                <span style={{ fontSize: 10, padding: '1.5px 7px', background: 'rgba(59,130,246,0.1)', borderRadius: 4, color: 'var(--blue)', fontWeight: 600 }}>{s.tribunal}</span>
                <span style={{ fontSize: 10, padding: '1.5px 6px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text4)' }}>{s.area}</span>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', background: rc.bg, color: rc.color, borderRadius: 5, fontWeight: 700 }}>RELEVÂNCIA {s.relevancia.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55 }}>{s.titulo}</p>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button style={{ padding: '5px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--blue)', fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}>
                📄 Usar na Petição
              </button>
              <button style={{ padding: '5px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text3)', fontSize: 11.5, cursor: 'pointer' }}>
                🔗 Inteiro teor
              </button>
            </div>
          </div>
        )
      })}

      {/* ── ANÁLISE DE TESES ── */}
      {tab === 'analise' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Área:</span>
            {Object.keys(tesesDB).map(a => (
              <button key={a} onClick={() => setAreaAnalise(a)} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: areaAnalise === a ? 'var(--blue)' : 'var(--bg2)',
                color: areaAnalise === a ? 'white' : 'var(--text3)',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              }}>{a}</button>
            ))}
          </div>

          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, display: 'flex', gap: 10 }}>
            <Brain size={15} color="var(--blue)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
              Pontuação reflete consolidação da tese na jurisprudência atual — <strong>não garante resultado em casos concretos</strong>. Use como ferramenta de pesquisa e planejamento estratégico. Cada caso tem suas especificidades fáticas e probatórias.
            </p>
          </div>

          {teses.map((t, i) => {
            const rc = riscoCfg[t.risco] || riscoCfg['médio']
            const open = tesesOpen[i]
            const scoreColor = t.pontuacao >= 9 ? 'var(--green)' : t.pontuacao >= 7.5 ? 'var(--amber)' : 'var(--red)'
            return (
              <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start' }} onClick={() => setTesesOpen(p => ({ ...p, [i]: !p[i] }))}>
                  <div style={{ flexShrink: 0, textAlign: 'center', width: 58 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor }}>{t.pontuacao.toFixed(1)}</div>
                    <div style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 600 }}>/ 10</div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, marginTop: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${t.pontuacao * 10}%`, background: scoreColor, borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{t.tese}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: rc.bg, color: rc.color, borderRadius: 5 }}>
                        Risco: {t.risco.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}><strong>Fundamento:</strong> {t.fundamento}</p>
                  </div>
                  {open ? <ChevronDown size={15} color="var(--text4)" /> : <ChevronRight size={15} color="var(--text4)" />}
                </div>
                {open && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                      <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>✓ Posições Favoráveis</p>
                        <p style={{ fontSize: 12, lineHeight: 1.4 }}>{t.favoraveis}</p>
                      </div>
                      <div style={{ background: t.contrarias.includes('Nenhuma') ? 'var(--bg3)' : 'var(--red-dim)', border: `1px solid ${t.contrarias.includes('Nenhuma') ? 'var(--border)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, padding: '12px 14px' }}>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: t.contrarias.includes('Nenhuma') ? 'var(--text4)' : 'var(--red)', marginBottom: 6 }}>✗ Atenção / Posições Contrárias</p>
                        <p style={{ fontSize: 12, lineHeight: 1.4 }}>{t.contrarias}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button style={{ padding: '7px 14px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        📄 Usar tese na Petição
                      </button>
                      <button style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                        🔍 Ver jurisprudência
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── IA — PESQUISA AVANÇADA ── */}
      {tab === 'ia' && (
        <div style={{ maxWidth: 900 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Pesquisa Jurídica com IA <span style={{ fontSize: 10, background: 'var(--blue)', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700, marginLeft: 4 }}>Claude</span></div>
                <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>Análise de teses, jurisprudência e viabilidade para qualquer área do Direito</div>
              </div>
            </div>

            <textarea
              value={iaQuery}
              onChange={e => setIaQuery(e.target.value)}
              placeholder="Descreva a situação jurídica que deseja analisar...&#10;&#10;Ex: 'Segurado com 63 anos, 28 anos de contribuição, exposto a ruído de 90dB por 25 anos. Qual a viabilidade de aposentadoria especial? Quais são as teses mais sólidas?'"
              style={{
                width: '100%', minHeight: 120, padding: '12px 14px',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 10, fontSize: 13, color: 'var(--text)', outline: 'none',
                resize: 'vertical', lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['BPC/LOAS – Critério renda', 'Aposentadoria especial', 'Horas extras', 'Indenização LGPD'].map(ex => (
                  <button key={ex} onClick={() => setIaQuery(ex)} style={{ padding: '5px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text3)', cursor: 'pointer' }}>
                    {ex}
                  </button>
                ))}
              </div>
              <button
                onClick={handleIaAnalysis}
                disabled={iaLoading || !iaQuery.trim()}
                style={{
                  padding: '10px 24px', background: iaLoading || !iaQuery.trim() ? 'var(--bg4)' : 'linear-gradient(135deg, var(--blue), var(--purple))',
                  border: 'none', borderRadius: 9, color: iaLoading || !iaQuery.trim() ? 'var(--text4)' : 'white',
                  fontSize: 13.5, fontWeight: 700, cursor: iaLoading || !iaQuery.trim() ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {iaLoading ? (
                  <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Analisando...</>
                ) : (
                  <><Sparkles size={15} /> Analisar com IA</>
                )}
              </button>
            </div>
          </div>

          {iaError && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <AlertTriangle size={15} color="var(--red)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Não foi possível usar a IA</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>{iaError}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text4)', marginTop: 6 }}>Configure sua chave Claude API em <strong>Configurações → Integrações</strong></p>
                </div>
              </div>
            </div>
          )}

          {iaResult && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <Sparkles size={16} color="var(--purple)" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Análise Jurídica Gerada pela IA</span>
                <span style={{ fontSize: 10.5, color: 'var(--text4)', marginLeft: 'auto' }}>Revise antes de utilizar · Sujeito ao julgamento do advogado responsável</span>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {iaResult}
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 16px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 8, color: 'white', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  📄 Usar na Petição
                </button>
                <button style={{ padding: '8px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 12.5, cursor: 'pointer' }}>
                  💾 Salvar análise
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

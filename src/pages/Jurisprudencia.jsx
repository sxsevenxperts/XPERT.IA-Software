import { useState } from 'react'
import { Search, BookOpen, ExternalLink, Copy, Star, Filter, ChevronDown, TrendingUp, Zap, AlertCircle } from 'lucide-react'

const TRIBUNAIS = ['Todos', 'STJ', 'STF', 'TRF-1', 'TRF-2', 'TRF-3', 'TRF-4', 'TRF-5', 'TNU', 'TST', 'TJSP', 'TJRJ', 'TJMG']

const TEMAS_RAPIDOS = [
  'Aposentadoria por Idade — tempo mínimo 15F/20M',
  'BPC/Loas — comprovação de renda familiar',
  'Revisão do Teto EC 20/1998',
  'Auxílio-doença — carência acidente de trabalho',
  'Conversão de tempo especial em comum',
  'Salário de benefício — exclusão dos 20% menores',
  'Horas extras — banco de horas — CLT',
  'Dano moral — quantum indenizatório',
]

const MOCK_RESULTS = [
  {
    tribunal: 'STJ', numero: 'REsp 1.814.768/MG', relator: 'Min. Benedito Gonçalves',
    data: '11/02/2024', tema: 'Aposentadoria por Idade — Comprovação de Tempo Rural',
    ementa: 'PREVIDENCIÁRIO. RURÍCOLA. APOSENTADORIA POR IDADE. INÍCIO DE PROVA MATERIAL. DOCUMENTOS EM NOME DE TERCEIROS. POSSIBILIDADE. A jurisprudência desta Corte admite início de prova material de atividade rurícola quando os documentos estão em nome de terceiros (cônjuge, pais), desde que confirmados por prova testemunhal idônea.',
    decisao: 'PROVIDO. Determinada a concessão do benefício com DIB na data do requerimento administrativo.',
    relevancia: 95, favoravel: true,
    link: 'https://stj.jusbrasil.com.br',
    tags: ['rural', 'aposentadoria', 'prova material'],
  },
  {
    tribunal: 'TNU', numero: 'PEDILEF 0000422-80.2014.4.03.6301', relator: 'Juíza Simone Lazaretti',
    data: '24/05/2023', tema: 'BPC/Loas — Renda Familiar Per Capita',
    ementa: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA. CRITÉRIO DE MISERABILIDADE. POSSIBILIDADE DE ANÁLISE AMPLA. A renda per capita de ¼ do salário mínimo não é o único critério aferidor da condição de miserabilidade, devendo o julgador verificar concretamente a situação socioeconômica do requerente. Súmula 79 TNU.',
    decisao: 'INCIDENTE CONHECIDO E PROVIDO. Retorno dos autos para análise da situação socioeconômica.',
    relevancia: 88, favoravel: true,
    link: 'https://tnu.jus.br',
    tags: ['BPC', 'miserabilidade', 'renda'],
  },
  {
    tribunal: 'TRF-3', numero: 'AC 5002341-12.2023.4.03.9999', relator: 'Des. Fed. André Nekatschalow',
    data: '08/01/2024', tema: 'Auxílio-doença — Nexo Causal com Atividade Laborativa',
    ementa: 'PREVIDENCIÁRIO. AUXÍLIO POR INCAPACIDADE TEMPORÁRIA. PERÍCIA JUDICIAL DIVERGENTE DA ADMINISTRATIVA. Havendo divergência entre o laudo pericial judicial e a conclusão da perícia médica do INSS, deve prevalecer o laudo do perito oficial nomeado pelo juízo, que dispõe de maior imparcialidade.',
    decisao: 'APELAÇÃO PROVIDA. Benefício concedido com retroatividade à data do requerimento.',
    relevancia: 82, favoravel: true,
    link: 'https://trf3.jus.br',
    tags: ['auxílio-doença', 'perícia', 'incapacidade'],
  },
  {
    tribunal: 'STJ', numero: 'Súmula 729', relator: 'Corte Especial',
    data: '07/12/2023', tema: 'Atualização Monetária — Benefícios Previdenciários',
    ementa: 'Nas ações previdenciárias, a correção monetária das prestações em atraso deve observar o INPC, conforme determinado pelo art. 41-A da Lei 8.213/91. Os juros de mora são de 1% ao mês, nos termos da Súmula 204/STJ.',
    decisao: 'SÚMULA VINCULANTE — aplicação obrigatória a todos os casos análogos.',
    relevancia: 99, favoravel: true,
    link: 'https://stj.jusbrasil.com.br',
    tags: ['correção monetária', 'juros', 'INPC'],
  },
  {
    tribunal: 'TST', numero: 'RR 100200-55.2022.5.01.0065', relator: 'Min. Mauricio Godinho',
    data: '15/03/2024', tema: 'Horas Extras — Banco de Horas — Validade',
    ementa: 'HORAS EXTRAS. BANCO DE HORAS. Para que o banco de horas seja válido, é imprescindível que seja celebrado por acordo coletivo, com descrição clara das condições de compensação e limite máximo de acúmulo de horas.',
    decisao: 'NÃO PROVIDO. Banco de horas individual declarado nulo. Pagamento de horas como extraordinárias.',
    relevancia: 78, favoravel: false,
    link: 'https://tst.jus.br',
    tags: ['horas extras', 'banco de horas', 'trabalhista'],
  },
]

const ANALISE_PREDITIVA = {
  tema: 'Aposentadoria por Idade — Mulher 62 anos, 16 anos contribuição',
  acuracia: 91,
  favoravel: 82,
  desfavoravel: 18,
  fundamentos: [
    { texto: 'Requisito de idade cumprido (62 anos)', peso: 'positivo' },
    { texto: 'Tempo de contribuição atende mínimo de 15 anos para mulher', peso: 'positivo' },
    { texto: 'Carência de 180 meses pode ser deficiente — verificar CNIS', peso: 'atencao' },
    { texto: 'TRF-3 tem posição consolidada em favor do segurado em casos similares', peso: 'positivo' },
  ],
  precedentes: ['STJ REsp 1.814.768', 'TNU PEDILEF 0001234-56', 'TRF-3 AC 5001122-33'],
}

export default function Jurisprudencia() {
  const [busca, setBusca]           = useState('')
  const [tribunal, setTribunal]     = useState('Todos')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading]       = useState(false)
  const [tab, setTab]               = useState('busca') // busca | preditiva

  function buscar() {
    if (!busca.trim()) return
    setLoading(true)
    setTimeout(() => { setResultados(MOCK_RESULTS); setLoading(false) }, 1200)
  }

  function copiarEmenta(ementa) {
    navigator.clipboard.writeText(ementa)
  }

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1300 }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg3)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
        {[
          { id: 'busca',    label: '🔍 Busca Jurídica' },
          { id: 'preditiva',label: '🎯 Análise Preditiva' },
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

      {/* ── BUSCA JURÍDICA ── */}
      {tab === 'busca' && (
        <>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', pointerEvents: 'none' }} />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Pesquise jurisprudência, súmulas, temas... (ex: BPC/Loas renda familiar)"
                style={{
                  width: '100%', padding: '12px 14px 12px 42px',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <select value={tribunal} onChange={e => setTribunal(e.target.value)} style={{
              padding: '0 14px', background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 13.5, color: 'var(--text)', outline: 'none', minWidth: 100,
            }}>
              {TRIBUNAIS.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={buscar} style={{
              padding: '0 24px', background: 'linear-gradient(135deg, var(--blue), var(--purple))',
              border: 'none', borderRadius: 10, color: 'white',
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
            }}>
              <Search size={15} /> Buscar
            </button>
          </div>

          {/* Quick topics */}
          {resultados.length === 0 && !loading && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 8 }}>Temas populares:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {TEMAS_RAPIDOS.map(t => (
                  <button key={t} onClick={() => { setBusca(t); setTimeout(buscar, 50) }} style={{
                    fontSize: 12, padding: '5px 11px', borderRadius: 7,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    color: 'var(--text3)', cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ width: 36, height: 36, border: '3px solid var(--border2)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Buscando jurisprudências...</p>
            </div>
          )}

          {/* Results */}
          {resultados.length > 0 && !loading && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>{resultados.length} resultados para "{busca}"</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {resultados.map((r, i) => (
                  <div key={i} style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 12, overflow: 'hidden',
                    borderLeft: `3px solid ${r.favoravel ? 'var(--green)' : 'var(--red)'}`,
                  }}>
                    {/* Header */}
                    <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', background: 'var(--blue-dim)', color: 'var(--blue-light)', borderRadius: 5 }}>{r.tribunal}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{r.numero}</span>
                          <span style={{ fontSize: 11.5, color: 'var(--text4)' }}>{r.data}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                            background: r.favoravel ? 'var(--green-dim)' : 'var(--red-dim)',
                            color: r.favoravel ? 'var(--green)' : 'var(--red)',
                          }}>
                            {r.favoravel ? '✓ Favorável' : '✗ Desfavorável'}
                          </span>
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.tema}</h4>
                        <p style={{ fontSize: 12.5, color: 'var(--text3)', lineHeight: 1.5 }}>{r.ementa}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--text4)' }}>Relevância</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: r.relevancia >= 90 ? 'var(--green)' : 'var(--amber)' }}>{r.relevancia}%</div>
                      </div>
                    </div>
                    {/* Decision */}
                    <div style={{ padding: '10px 18px', background: 'var(--bg3)', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 12.5, color: 'var(--text2)' }}>
                        <strong style={{ color: 'var(--text)' }}>Decisão: </strong>{r.decisao}
                      </p>
                    </div>
                    {/* Actions */}
                    <div style={{ padding: '10px 18px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                        {r.tags.map(t => <span key={t} style={{ fontSize: 11, padding: '2px 7px', background: 'var(--bg4)', color: 'var(--text4)', borderRadius: 5 }}>{t}</span>)}
                      </div>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={() => copiarEmenta(r.ementa)} style={{ fontSize: 12, padding: '5px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Copy size={11} /> Copiar
                        </button>
                        <button style={{ fontSize: 12, padding: '5px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ExternalLink size={11} /> Ver fonte
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── ANÁLISE PREDITIVA ── */}
      {tab === 'preditiva' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>🎯 Análise Preditiva de Sentenças</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 18 }}>
                Descreva o caso ou faça upload da petição. A IA analisa com base em milhares de precedentes e retorna a probabilidade de êxito com <strong style={{ color: 'var(--green)' }}>90-95% de acurácia</strong>.
              </p>
              <textarea
                placeholder="Descreva o caso: tipo de benefício, dados do cliente, argumentos, tribunal..."
                defaultValue="Cliente: Mulher, 62 anos, 16 anos de contribuição. Pedido de Aposentadoria por Idade negado pelo INSS por suposta falta de carência. Tribunal: TRF-3."
                style={{
                  width: '100%', height: 140, background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '14px', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.6,
                  resize: 'none', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button style={{
                marginTop: 12, padding: '11px 22px',
                background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                border: 'none', borderRadius: 9, color: 'white',
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
              }}>
                <Zap size={15} /> Analisar Chances de Êxito
              </button>
            </div>

            {/* Result card (shown as demo) */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.08))', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700 }}>Resultado da Análise Preditiva</h4>
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{ANALISE_PREDITIVA.tema}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text4)' }}>Acurácia do modelo</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue-light)' }}>{ANALISE_PREDITIVA.acuracia}%</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '18px 20px' }}>
                {/* Win/Lose bar */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>✓ Favorável: {ANALISE_PREDITIVA.favoravel}%</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>✗ Desfavorável: {ANALISE_PREDITIVA.desfavoravel}%</span>
                  </div>
                  <div style={{ height: 12, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${ANALISE_PREDITIVA.favoravel}%`, height: '100%', background: 'linear-gradient(90deg, var(--green), #34D399)', borderRadius: 6 }} />
                  </div>
                </div>

                <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Fatores Analisados</h5>
                {ANALISE_PREDITIVA.fundamentos.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, marginTop: 1 }}>
                      {f.peso === 'positivo' ? '✅' : f.peso === 'negativo' ? '❌' : '⚠️'}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{f.texto}</span>
                  </div>
                ))}

                <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 9 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 5 }}>Precedentes usados na análise</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ANALISE_PREDITIVA.precedentes.map(p => (
                      <span key={p} style={{ fontSize: 11, padding: '3px 9px', background: 'var(--blue-dim)', color: 'var(--blue-light)', borderRadius: 5, fontWeight: 600 }}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Como funciona</h4>
            {[
              { n: '1', t: 'Descreva o caso', d: 'Informe os dados essenciais ou envie a petição em PDF' },
              { n: '2', t: 'IA analisa precedentes', d: 'Modelos treinados em +500k decisões reais do STJ, TRF e TNU' },
              { n: '3', t: 'Receba o score', d: 'Probabilidade de êxito com 90-95% de acurácia histórica' },
              { n: '4', t: 'Jurisprudência de apoio', d: 'Lista dos precedentes mais relevantes com link da fonte' },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--blue)', flexShrink: 0 }}>{item.n}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{item.t}</p>
                  <p style={{ fontSize: 12, color: 'var(--text4)', marginTop: 2 }}>{item.d}</p>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 6, padding: '12px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 9 }}>
              <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>⚡ Base de dados atualizada semanalmente com decisões recentes de todos os tribunais.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

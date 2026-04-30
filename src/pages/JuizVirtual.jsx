import { useState } from 'react'
import { Gavel, Upload, Zap, Download, Copy, RotateCcw, ChevronDown, BookOpen } from 'lucide-react'

const TIPOS_DECISAO = [
  { id: 'sentenca',   label: 'Sentença',                 desc: 'Decisão final de mérito' },
  { id: 'despacho',   label: 'Despacho',                 desc: 'Atos de impulso processual' },
  { id: 'interlocut', label: 'Decisão Interlocutória',   desc: 'Liminares, tutelas e demais' },
  { id: 'acordao',    label: 'Acórdão',                  desc: 'Decisão colegiada de 2ª instância' },
  { id: 'parecer',    label: 'Parecer do MP',            desc: 'Opinião do Ministério Público' },
  { id: 'voto',       label: 'Voto Divergente',          desc: 'Posição contrária fundamentada' },
]

const MOCK_SENTENCA = `PODER JUDICIÁRIO
JUSTIÇA FEDERAL — 1ª VARA PREVIDENCIÁRIA DE SÃO PAULO

Processo nº [NÚMERO]
Autor: [NOME DO AUTOR]
Réu: INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS

SENTENÇA

I — RELATÓRIO

[NOME DO AUTOR], qualificado nos autos, ajuizou ação em face do INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS, objetivando a concessão de APOSENTADORIA POR IDADE, sob alegação de que preenche os requisitos legais — 62 anos de idade e 16 anos de contribuição — e que teve seu requerimento administrativo indevidamente indeferido.

O INSS apresentou contestação sustentando que a autora não teria cumprido a carência mínima de 180 contribuições mensais, conforme art. 48, § 1º, da Lei n.º 8.213/1991.

Vieram os autos à conclusão.

É o relatório. Decido.

II — FUNDAMENTAÇÃO

II.1 — DA QUESTÃO PRELIMINAR

Rejeito a preliminar de prescrição suscitada na contestação, vez que o direito ao benefício é imprescritível, operando-se tão somente a prescrição das parcelas anteriores a cinco anos do ajuizamento da ação (Súmula 85/STJ).

II.2 — DO MÉRITO

Nos termos do art. 48, caput, da Lei n.º 8.213/1991, com a redação conferida pela EC 103/2019, a aposentadoria por idade é devida à segurada que tenha completado 62 (sessenta e dois) anos de idade e cumprido o período de carência estabelecido no art. 25 da mesma lei.

Compulsando os autos, verifico que:

a) A autora nasceu em [DATA], contando com 62 anos de idade à data do requerimento — requisito etário CUMPRIDO;

b) O CNIS acostado às fls. [X] demonstra 192 (cento e noventa e duas) contribuições mensais, superior ao mínimo de 180 exigido — requisito de carência CUMPRIDO;

c) O tempo de contribuição de aproximadamente 16 anos supera o mínimo legal de 15 anos para o sexo feminino — requisito de tempo CUMPRIDO.

Nesse diapasão, a autora preenche todos os requisitos para concessão do benefício. O indeferimento administrativo baseou-se em análise equivocada do CNIS, desconsiderando contribuições regularmente recolhidas e constantes no sistema.

O entendimento jurisprudencial dominante do Superior Tribunal de Justiça e dos Tribunais Regionais Federais é de que o ônus da prova da inexistência do vínculo ou da contribuição compete ao INSS (STJ, REsp 1.352.437/AL — Tema 554).

II.3 — DO SALÁRIO DE BENEFÍCIO E DA RMI

O salário de benefício corresponde à média aritmética simples de 100% dos salários de contribuição (art. 29, II, da Lei 8.213/91). A Renda Mensal Inicial (RMI) corresponde a 60% (sessenta por cento) do salário de benefício acrescido de 2% (dois por cento) para cada ano de contribuição que exceder 15 (quinze) anos, nos termos do § 5º do art. 26 da EC 103/2019.

Resultando em: 60% + (16 - 15) × 2% = 62% do salário de benefício.

II.4 — DAS PARCELAS VENCIDAS

As prestações em atraso devem ser corrigidas pelo INPC e acrescidas de juros moratórios de 1% ao mês, nos termos das Súmulas 204 e 148 do STJ, observada a prescrição quinquenal (Súmula 85/STJ).

III — DISPOSITIVO

Ante o exposto, JULGO PROCEDENTE O PEDIDO, com fundamento no art. 487, I, do CPC, para:

a) CONDENAR o INSS a IMPLANTAR o benefício de Aposentadoria por Idade em favor da autora, com DIB (data de início do benefício) fixada na data do requerimento administrativo;

b) CONDENAR o INSS ao pagamento das parcelas vencidas desde a DIB até a efetiva implantação, devidamente corrigidas pelo INPC e acrescidas de juros de 1% ao mês (Súmulas 204 e 148/STJ), respeitada a prescrição quinquenal (Súmula 85/STJ);

c) CONDENAR o INSS ao pagamento de honorários advocatícios fixados em 10% sobre o valor da condenação, nos termos do art. 85, §§ 3º e 4º, do CPC.

Concedo os benefícios da Justiça Gratuita (art. 98 do CPC).

Sem custas na forma da lei (art. 4º, I, da Lei 9.289/96).

Transitada em julgado, arquivem-se.

[Cidade], [Data].

[NOME DO JUIZ(A)]
Juiz(a) Federal Titular da [Vara]`

export default function JuizVirtual() {
  const [tipo, setTipo]           = useState('sentenca')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading]     = useState(false)
  const [resultado, setResultado] = useState('')

  function simular() {
    if (!descricao.trim()) return
    setLoading(true)
    setTimeout(() => { setResultado(MOCK_SENTENCA); setLoading(false) }, 2500)
  }

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1300 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Config Panel ── */}
        <div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gavel size={18} color="var(--red)" />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Juiz Virtual IA</h3>
                <p style={{ fontSize: 11.5, color: 'var(--text3)' }}>Decisões com embasamento jurídico real</p>
              </div>
            </div>

            {/* Tipo */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Tipo de decisão</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {TIPOS_DECISAO.map(t => (
                  <button key={t.id} onClick={() => setTipo(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 9, border: '1px solid',
                    background: tipo === t.id ? 'rgba(239,68,68,0.1)' : 'var(--bg3)',
                    borderColor: tipo === t.id ? 'rgba(239,68,68,0.5)' : 'var(--border)',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: tipo === t.id ? 'var(--red)' : 'var(--text4)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: tipo === t.id ? 700 : 400, color: tipo === t.id ? 'var(--text)' : 'var(--text2)' }}>{t.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--text4)' }}>{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Descrição do caso</label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva os fatos, o tipo de benefício, os argumentos das partes e o que foi pedido..."
                style={{
                  width: '100%', height: 130, background: 'var(--bg3)',
                  border: '1px solid var(--border)', borderRadius: 9,
                  padding: '11px', fontSize: 13.5, color: 'var(--text)',
                  lineHeight: 1.6, resize: 'none', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <button onClick={simular} disabled={!descricao.trim() || loading} style={{
              width: '100%', padding: '12px',
              background: (!descricao || loading) ? 'var(--bg4)' : 'linear-gradient(135deg, var(--red), #F97316)',
              border: 'none', borderRadius: 9, color: 'white',
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (!descricao || loading) ? 0.6 : 1,
              boxShadow: descricao ? '0 4px 14px rgba(239,68,68,0.3)' : 'none',
            }}>
              {loading
                ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Simulando decisão...</>
                : <><Gavel size={15} /> Simular Decisão Judicial</>
              }
            </button>
          </div>

          {/* Features */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10, color: 'var(--text2)' }}>100% embasado em:</p>
            {['Constituição Federal e EC 103/2019','Lei 8.213/91 e Decreto 10.410/2020','Jurisprudência STJ, TRF e TNU','Instrução Normativa INSS nº 128/2022','Temas repetitivos STJ e STF','Súmulas vinculantes e da AGU'].map((t,i) => (
              <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6 }}>
                <BookOpen size={11} style={{ color: 'var(--text4)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Result ── */}
        <div>
          {!resultado && !loading && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>⚖️</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Juiz Virtual</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text3)', maxWidth: 400, margin: '0 auto' }}>
                Simule sentenças, despachos e acórdãos com linguagem magistral, fundamentos legais reais e citações de jurisprudência verificável — ideal para preparar casos e testar argumentos.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, border: '3px solid var(--border2)', borderTopColor: 'var(--red)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 20px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>O Juiz Virtual está deliberando...</p>
              <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>Analisando precedentes, fundamentos e elaborando a decisão</p>
            </div>
          )}

          {resultado && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>✅ Decisão Gerada</h3>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>{TIPOS_DECISAO.find(t => t.id === tipo)?.label} · 100% embasada em leis e jurisprudência</p>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => setResultado('')} style={{ padding: '7px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RotateCcw size={12} /> Nova
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(resultado)} style={{ padding: '7px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Copy size={12} /> Copiar
                  </button>
                  <button style={{ padding: '7px 12px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--green)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Download size={12} /> DOCX
                  </button>
                </div>
              </div>
              <textarea
                value={resultado}
                onChange={e => setResultado(e.target.value)}
                style={{
                  width: '100%', minHeight: 620,
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '20px',
                  fontSize: 13, color: 'var(--text)', lineHeight: 1.8,
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

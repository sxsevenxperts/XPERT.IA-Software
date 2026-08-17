import { useState } from 'react'
import { Gavel, Download, Copy, RotateCcw, BookOpen } from 'lucide-react'
import { callClaude } from '../lib/claude'

const TIPOS_DECISAO = [
  { id: 'sentenca',   label: 'Sentença',               desc: 'Decisão final de mérito' },
  { id: 'despacho',   label: 'Despacho',               desc: 'Atos de impulso processual' },
  { id: 'interlocut', label: 'Decisão Interlocutória', desc: 'Liminares, tutelas e demais' },
  { id: 'acordao',    label: 'Acórdão',                desc: 'Decisão colegiada de 2ª instância' },
  { id: 'parecer',    label: 'Parecer do MP',          desc: 'Opinião do Ministério Público' },
  { id: 'voto',       label: 'Voto Divergente',        desc: 'Posição contrária fundamentada' },
]

const SYSTEM_JUIZ = `Você é um Juiz Federal com 30 anos de experiência em Direito Previdenciário Brasileiro.
Redija decisões judiciais com linguagem magistral, formal e tecnicamente precisa.
Use SEMPRE:
- Constituição Federal e EC 103/2019
- Lei 8.213/91 e Decreto 10.410/2020
- Jurisprudência do STJ, TRF e TNU com números reais de processos
- Instrução Normativa INSS nº 128/2022
- Temas repetitivos e súmulas pertinentes
Estruture com: I — RELATÓRIO, II — FUNDAMENTAÇÃO (com subseções), III — DISPOSITIVO.
Utilize linguagem imparcial. NÃO prometa resultados.`

export default function JuizVirtual() {
  const [tipo, setTipo]           = useState('sentenca')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading]     = useState(false)
  const [resultado, setResultado] = useState('')
  const [error, setError]         = useState('')

  function baixarResultado() {
    const blob = new Blob([resultado], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `decisao-${tipo}-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function simular() {
    if (!descricao.trim()) return
    setLoading(true)
    setError('')
    setResultado('')
    try {
      const tipoLabel = TIPOS_DECISAO.find(t => t.id === tipo)?.label || tipo
      const prompt = `Redija uma ${tipoLabel} judicial detalhada para o seguinte caso:\n\n${descricao}\n\nA decisão deve ser completa, com fundamentação jurídica robusta, citação de leis, súmulas e jurisprudência.`
      const text = await callClaude(prompt, SYSTEM_JUIZ, 'claude-sonnet-4-6')
      setResultado(text)
    } catch (err) {
      setError(err.message || 'Erro ao gerar. Verifique sua chave da API em Configurações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ padding:'24px',maxWidth:1300 }}>
      <div style={{ display:'grid',gridTemplateColumns:'360px 1fr',gap:20,alignItems:'start' }}>

        {/* ── Config Panel ── */}
        <div>
          <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'22px',marginBottom:14 }}>
            <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:20 }}>
              <div style={{ width:36,height:36,borderRadius:10,background:'rgba(239,68,68,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Gavel size={18} color="var(--red)"/>
              </div>
              <div>
                <h3 style={{ fontSize:14,fontWeight:700 }}>Juiz Virtual IA</h3>
                <p style={{ fontSize:11.5,color:'var(--text3)' }}>Decisões com embasamento jurídico real</p>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:8 }}>Tipo de decisão</label>
              <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                {TIPOS_DECISAO.map(t=>(
                  <button key={t.id} onClick={()=>setTipo(t.id)} style={{
                    display:'flex',alignItems:'center',gap:10,
                    padding:'9px 12px',borderRadius:9,border:'1px solid',
                    background:tipo===t.id?'rgba(239,68,68,0.1)':'var(--bg3)',
                    borderColor:tipo===t.id?'rgba(239,68,68,0.5)':'var(--border)',
                    cursor:'pointer',textAlign:'left',
                  }}>
                    <div style={{ width:7,height:7,borderRadius:'50%',background:tipo===t.id?'var(--red)':'var(--text4)',flexShrink:0 }}/>
                    <div>
                      <p style={{ fontSize:13,fontWeight:tipo===t.id?700:400,color:tipo===t.id?'var(--text)':'var(--text2)' }}>{t.label}</p>
                      <p style={{ fontSize:11,color:'var(--text4)' }}>{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:6 }}>Descrição do caso</label>
              <textarea
                value={descricao}
                onChange={e=>setDescricao(e.target.value)}
                placeholder="Descreva os fatos, o tipo de benefício, os argumentos das partes e o que foi pedido..."
                style={{ width:'100%',height:130,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,padding:'11px',fontSize:13.5,color:'var(--text)',lineHeight:1.6,resize:'none',outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--red)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>

            {error && (
              <div style={{ background:'var(--red-dim)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:9,padding:'10px 14px',fontSize:12.5,color:'var(--red)',marginBottom:12 }}>
                {error}
              </div>
            )}

            <button onClick={simular} disabled={!descricao.trim()||loading} style={{
              width:'100%',padding:'12px',
              background:(!descricao||loading)?'var(--bg4)':'linear-gradient(135deg,var(--red),#F97316)',
              border:'none',borderRadius:9,color:'white',fontSize:14,fontWeight:700,
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              opacity:(!descricao||loading)?0.6:1,
              boxShadow:descricao?'0 4px 14px rgba(239,68,68,0.3)':'none',
              cursor:(!descricao||loading)?'default':'pointer',
            }}>
              {loading
                ? <><div style={{ width:15,height:15,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/> Simulando decisão...</>
                : <><Gavel size={15}/> Simular Decisão Judicial</>
              }
            </button>
          </div>

          <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'16px' }}>
            <p style={{ fontSize:12.5,fontWeight:700,marginBottom:10,color:'var(--text2)' }}>100% embasado em:</p>
            {['Constituição Federal e EC 103/2019','Lei 8.213/91 e Decreto 10.410/2020','Jurisprudência STJ, TRF e TNU','Instrução Normativa INSS nº 128/2022','Temas repetitivos STJ e STF','Súmulas vinculantes e da AGU'].map((t,i)=>(
              <div key={i} style={{ display:'flex',gap:7,alignItems:'center',marginBottom:6 }}>
                <BookOpen size={11} style={{ color:'var(--text4)',flexShrink:0 }}/>
                <span style={{ fontSize:12,color:'var(--text3)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Result ── */}
        <div>
          {!resultado && !loading && (
            <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'60px 40px',textAlign:'center' }}>
              <div style={{ fontSize:52,marginBottom:16 }}>⚖️</div>
              <h3 style={{ fontSize:16,fontWeight:700,marginBottom:8 }}>Juiz Virtual</h3>
              <p style={{ fontSize:13.5,color:'var(--text3)',maxWidth:400,margin:'0 auto' }}>
                Simule sentenças, despachos e acórdãos com linguagem magistral, fundamentos legais reais e citações de jurisprudência verificável — ideal para preparar casos e testar argumentos.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'60px 40px',textAlign:'center' }}>
              <div style={{ width:44,height:44,border:'3px solid var(--border2)',borderTopColor:'var(--red)',borderRadius:'50%',animation:'spin 0.9s linear infinite',margin:'0 auto 20px' }}/>
              <p style={{ fontSize:14,fontWeight:600,marginBottom:6 }}>O Juiz Virtual está deliberando...</p>
              <p style={{ fontSize:12.5,color:'var(--text3)' }}>Analisando precedentes, fundamentos e elaborando a decisão</p>
            </div>
          )}

          {resultado && (
            <div className="fade-in">
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
                <div>
                  <h3 style={{ fontSize:14,fontWeight:700 }}>✅ Decisão Gerada</h3>
                  <p style={{ fontSize:12,color:'var(--text3)' }}>{TIPOS_DECISAO.find(t=>t.id===tipo)?.label} · 100% embasada em leis e jurisprudência</p>
                </div>
                <div style={{ display:'flex',gap:7 }}>
                  <button onClick={()=>setResultado('')} style={{ padding:'7px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text3)',fontSize:12,display:'flex',alignItems:'center',gap:4,cursor:'pointer' }}>
                    <RotateCcw size={12}/> Nova
                  </button>
                  <button onClick={()=>navigator.clipboard.writeText(resultado)} style={{ padding:'7px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text3)',fontSize:12,display:'flex',alignItems:'center',gap:4,cursor:'pointer' }}>
                    <Copy size={12}/> Copiar
                  </button>
                  <button onClick={baixarResultado} style={{ padding:'7px 12px',background:'var(--green-dim)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:8,color:'var(--green)',fontSize:12,display:'flex',alignItems:'center',gap:4,cursor:'pointer' }}>
                    <Download size={12}/> TXT
                  </button>
                </div>
              </div>
              <textarea
                value={resultado}
                onChange={e=>setResultado(e.target.value)}
                style={{ width:'100%',minHeight:620,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'20px',fontSize:13,color:'var(--text)',lineHeight:1.8,resize:'vertical',outline:'none',fontFamily:'inherit' }}
                onFocus={e=>e.target.style.borderColor='var(--red)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

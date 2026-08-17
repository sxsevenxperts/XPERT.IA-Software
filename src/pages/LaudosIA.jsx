import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Brain, FileText, CheckCircle, Download, X } from 'lucide-react'
import { callClaudeWithFile } from '../lib/claude'
import { supabase } from '../lib/supabase'

const SYSTEM_LAUDO = `Você é um especialista em Direito Previdenciário Brasileiro e análise de laudos médicos.
Analise o documento médico fornecido e responda EXCLUSIVAMENTE com um objeto JSON válido, sem nenhum texto antes ou depois.

Retorne este JSON:
{
  "cids": [
    { "codigo": "X00.0", "descricao": "Nome da doença", "relevancia": "principal" }
  ],
  "enquadramentos": [
    {
      "beneficio": "Nome do benefício previdenciário",
      "viabilidade": 85,
      "fundamento": "Base legal (art., lei, decreto, súmula)",
      "cor": "#10B981"
    }
  ],
  "limitacoes": ["limitação 1", "limitação 2"],
  "recomendacoes": ["recomendação 1", "recomendação 2"],
  "resumo": "Parecer completo em 3-4 frases."
}

Cores: verde (#10B981) para viabilidade >70%, amarelo (#F59E0B) para 40-70%, vermelho (#EF4444) para <40%.
NÃO prometa resultados — informe o estado da lei e jurisprudência.`

function ConfiancaBar({ valor, cor }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
      <div style={{ flex:1,height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden' }}>
        <div style={{ width:`${valor}%`,height:'100%',background:cor,borderRadius:3,transition:'width 1s ease' }}/>
      </div>
      <span style={{ fontSize:13,fontWeight:700,color:cor,minWidth:38,textAlign:'right' }}>{valor}%</span>
    </div>
  )
}

export default function LaudosIA() {
  const [file, setFile]           = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [clienteName, setCliente] = useState('')
  const [historico, setHistorico] = useState([])
  const fileRef                   = useRef()

  const loadHistorico = useCallback(async () => {
    const { data } = await supabase
      .from('laudos')
      .select('id,nome_arquivo,created_at,status')
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setHistorico(data)
  }, [])

  useEffect(() => { loadHistorico() }, [loadHistorico])

  function handleFile(f) {
    if (!f) return
    const allowed = ['application/pdf','image/jpeg','image/png','image/webp']
    if (!allowed.includes(f.type)) { alert('Formato não suportado. Use PDF, JPG ou PNG.'); return }
    if (f.size > 20 * 1024 * 1024) { alert('Arquivo muito grande. Máximo 20MB.'); return }
    setFile(f)
    setResult(null)
    setError('')
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function analisar() {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const prompt = `Analise este laudo médico${clienteName ? ` do paciente ${clienteName}` : ''} e retorne o JSON conforme instruído.`
      const text = await callClaudeWithFile(file, prompt, SYSTEM_LAUDO)
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      if (jsonStart === -1) throw new Error('A IA não retornou um JSON válido. Tente novamente.')
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1))
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Entre novamente.')
      const { error: saveError } = await supabase.from('laudos').insert({
        user_id: user.id,
        nome_arquivo: file.name,
        mime_type: file.type,
        analise: JSON.stringify(parsed),
        status: 'concluido',
      })
      if (saveError) throw saveError
      setResult(parsed)
      await loadHistorico()
    } catch (err) {
      setError(err.message || 'Erro ao analisar. Verifique sua chave da API em Configurações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ padding:'24px',maxWidth:1300 }}>
      <div style={{ display:'grid',gridTemplateColumns:'400px 1fr',gap:20,alignItems:'start' }}>

        {/* ── Upload Panel ── */}
        <div>
          <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'22px' }}>
            <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:20 }}>
              <div style={{ width:34,height:34,borderRadius:9,background:'var(--purple-dim)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Brain size={17} color="var(--purple)"/>
              </div>
              <div>
                <h3 style={{ fontSize:14,fontWeight:700 }}>Análise de Laudo com IA</h3>
                <p style={{ fontSize:11.5,color:'var(--text3)' }}>Claude AI · OCR + Enquadramento jurídico</p>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:5 }}>Cliente (opcional)</label>
              <input value={clienteName} onChange={e=>setCliente(e.target.value)} placeholder="Nome do cliente..."
                style={{ width:'100%',padding:'9px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,fontSize:13.5,color:'var(--text)',outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--blue)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>

            <div
              onClick={()=>fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border:`2px dashed ${dragOver?'var(--blue)':file?'var(--green)':'var(--border2)'}`,
                borderRadius:12,padding:'28px 20px',textAlign:'center',cursor:'pointer',
                background:dragOver?'var(--blue-dim)':file?'var(--green-dim)':'var(--bg3)',
                transition:'all 0.2s',marginBottom:14,
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
              {file ? (
                <>
                  <div style={{ fontSize:28,marginBottom:8 }}>📄</div>
                  <p style={{ fontSize:13,fontWeight:600,color:'var(--green)' }}>{file.name}</p>
                  <p style={{ fontSize:11.5,color:'var(--text4)',marginTop:3 }}>{(file.size/1024).toFixed(1)} KB</p>
                  <button onClick={e=>{e.stopPropagation();setFile(null);setResult(null)}}
                    style={{ marginTop:10,fontSize:11,color:'var(--text4)',background:'none',border:'none',display:'flex',alignItems:'center',gap:4,margin:'8px auto 0',cursor:'pointer' }}>
                    <X size={12}/> Remover
                  </button>
                </>
              ) : (
                <>
                  <Upload size={28} style={{ color:'var(--text4)',margin:'0 auto 10px',display:'block' }}/>
                  <p style={{ fontSize:13,fontWeight:600,color:'var(--text2)' }}>Arraste o laudo aqui</p>
                  <p style={{ fontSize:12,color:'var(--text4)',marginTop:4 }}>ou clique para selecionar</p>
                  <p style={{ fontSize:11,color:'var(--text4)',marginTop:6 }}>PDF · JPG · PNG — até 20MB</p>
                </>
              )}
            </div>

            {error && (
              <div style={{ background:'var(--red-dim)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:9,padding:'10px 14px',fontSize:12.5,color:'var(--red)',marginBottom:14 }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:16 }}>
              {[
                { icon:'🔍', text:'Extração automática de CIDs' },
                { icon:'⚖️', text:'Enquadramento jurídico previdenciário' },
                { icon:'📊', text:'Score de viabilidade com % de confiança' },
                { icon:'📝', text:'Recomendações estratégicas' },
              ].map((c,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:8,fontSize:12.5,color:'var(--text3)' }}>
                  <span>{c.icon}</span><span>{c.text}</span>
                </div>
              ))}
            </div>

            <button onClick={analisar} disabled={!file||loading} style={{
              width:'100%',padding:'12px',
              background:(!file||loading)?'var(--bg4)':'linear-gradient(135deg,var(--purple),var(--blue))',
              border:'none',borderRadius:9,color:'white',fontSize:14,fontWeight:700,
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              opacity:(!file||loading)?0.6:1,
              boxShadow:(!file||loading)?'none':'0 4px 14px rgba(139,92,246,0.35)',
              cursor:(!file||loading)?'default':'pointer',
            }}>
              {loading ? (
                <>
                  <div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>
                  Analisando com IA...
                </>
              ) : (
                <><Brain size={16}/> Analisar Laudo</>
              )}
            </button>
          </div>

          {historico.length > 0 && (
            <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'18px',marginTop:14 }}>
              <h4 style={{ fontSize:13,fontWeight:700,marginBottom:12 }}>Análises Recentes</h4>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {historico.map(h=>(
                  <div key={h.id} style={{ display:'flex',gap:10,alignItems:'center',padding:'10px',background:'var(--bg3)',borderRadius:8 }}>
                    <div style={{ width:28,height:28,borderRadius:7,background:'var(--purple-dim)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <FileText size={13} color="var(--purple)"/>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{h.nome_arquivo}</p>
                      <p style={{ fontSize:11,color:'var(--text4)',marginTop:1 }}>{new Date(h.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Results ── */}
        <div>
          {!result && !loading && (
            <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'60px 40px',textAlign:'center' }}>
              <div style={{ fontSize:52,marginBottom:16 }}>🧠</div>
              <h3 style={{ fontSize:16,fontWeight:700,marginBottom:8 }}>Análise Inteligente de Laudos</h3>
              <p style={{ fontSize:13.5,color:'var(--text3)',maxWidth:380,margin:'0 auto' }}>
                Faça upload de um laudo médico e a IA extrai automaticamente os CIDs, enquadra juridicamente e entrega um parecer de viabilidade em segundos.
              </p>
              <p style={{ fontSize:12,color:'var(--text4)',marginTop:16 }}>
                Powered by <strong style={{ color:'var(--purple)' }}>Claude AI</strong> · Treinado em previdenciário brasileiro
              </p>
            </div>
          )}

          {loading && (
            <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'60px 40px',textAlign:'center' }}>
              <div style={{ width:48,height:48,border:'3px solid var(--border2)',borderTopColor:'var(--purple)',borderRadius:'50%',animation:'spin 0.9s linear infinite',margin:'0 auto 20px' }}/>
              <h3 style={{ fontSize:15,fontWeight:700,marginBottom:8 }}>Analisando laudo com IA...</h3>
              <p style={{ fontSize:13,color:'var(--text3)' }}>Extraindo CIDs, verificando enquadramentos jurídicos e gerando parecer</p>
            </div>
          )}

          {result && (
            <div className="fade-in" style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <h3 style={{ fontSize:14,fontWeight:700 }}>Análise Concluída</h3>
                  <p style={{ fontSize:12,color:'var(--text3)' }}>{result.cids?.length||0} CIDs · {result.enquadramentos?.length||0} cenários analisados</p>
                </div>
                <button style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'var(--green-dim)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:8,color:'var(--green)',fontSize:12.5,fontWeight:600,cursor:'pointer' }}>
                  <Download size={13}/> Baixar Parecer PDF
                </button>
              </div>

              <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px' }}>
                <h4 style={{ fontSize:13,fontWeight:700,marginBottom:12 }}>CIDs Identificados</h4>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {(result.cids||[]).map((c,i)=>(
                    <div key={i} style={{ display:'flex',gap:12,alignItems:'center',padding:'10px 14px',background:'var(--bg3)',borderRadius:9 }}>
                      <span style={{ fontSize:13,fontWeight:800,color:'var(--blue-light)',fontFamily:'monospace',minWidth:60 }}>{c.codigo}</span>
                      <span style={{ fontSize:13,flex:1 }}>{c.descricao}</span>
                      <span style={{ fontSize:11,padding:'2px 8px',background:c.relevancia==='principal'?'var(--blue-dim)':'var(--bg4)',color:c.relevancia==='principal'?'var(--blue-light)':'var(--text4)',borderRadius:5,fontWeight:600 }}>
                        {c.relevancia}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px' }}>
                <h4 style={{ fontSize:13,fontWeight:700,marginBottom:12 }}>Enquadramentos Possíveis</h4>
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {(result.enquadramentos||[]).map((e,i)=>(
                    <div key={i}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                        <span style={{ fontSize:13.5,fontWeight:700 }}>{e.beneficio}</span>
                        <span style={{ fontSize:11.5,color:'var(--text4)' }}>Viabilidade</span>
                      </div>
                      <ConfiancaBar valor={e.viabilidade} cor={e.cor||'var(--blue)'}/>
                      <p style={{ fontSize:11.5,color:'var(--text3)',marginTop:5 }}>{e.fundamento}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px' }}>
                  <h4 style={{ fontSize:13,fontWeight:700,marginBottom:10 }}>Limitações Documentadas</h4>
                  {(result.limitacoes||[]).map((l,i)=>(
                    <div key={i} style={{ display:'flex',gap:8,marginBottom:7 }}>
                      <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--amber)',marginTop:6,flexShrink:0 }}/>
                      <span style={{ fontSize:12.5,color:'var(--text2)' }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px' }}>
                  <h4 style={{ fontSize:13,fontWeight:700,marginBottom:10 }}>Recomendações Estratégicas</h4>
                  {(result.recomendacoes||[]).map((r,i)=>(
                    <div key={i} style={{ display:'flex',gap:8,marginBottom:7 }}>
                      <CheckCircle size={13} style={{ color:'var(--green)',marginTop:3,flexShrink:0 }}/>
                      <span style={{ fontSize:12.5,color:'var(--text2)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(59,130,246,0.08))',border:'1px solid rgba(139,92,246,0.25)',borderRadius:12,padding:'16px 20px' }}>
                <div style={{ display:'flex',gap:8,alignItems:'flex-start' }}>
                  <Brain size={15} style={{ color:'var(--purple)',marginTop:2,flexShrink:0 }}/>
                  <div>
                    <p style={{ fontSize:12,fontWeight:700,color:'var(--purple)',marginBottom:5 }}>Parecer da IA</p>
                    <p style={{ fontSize:13,color:'var(--text2)',lineHeight:1.6 }}>{result.resumo}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

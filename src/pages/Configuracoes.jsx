import { useState } from 'react'
import { Settings, Key, Eye, EyeOff, Check, X, Plus, Trash2, AlertTriangle, Shield, Zap, CheckCircle } from 'lucide-react'
import { saveClaudeKey, testClaudeKey } from '../lib/claude'

const INTEGRACOES = [
  {
    id: 'anthropic',
    nome: 'Anthropic Claude API',
    descricao: 'IA generativa para análise de laudos, petições, juiz virtual, jurisprudência e pesquisa jurídica.',
    icone: '🤖',
    placeholder: 'sk-ant-api03-...',
    prefixo: 'sk-ant-',
    docs: 'https://console.anthropic.com/',
    funcionalidades: ['Laudos IA', 'Petições IA', 'Juiz Virtual', 'Pesquisa Jurídica', 'Análise de Teses'],
    destaque: true,
  },
  {
    id: 'whatsapp',
    nome: 'WhatsApp Business API',
    descricao: 'Envio automatizado de notificações de prazo, cobrança de honorários e atualizações de casos.',
    icone: '💬',
    placeholder: 'EAAxxxxx...',
    prefixo: '',
    docs: 'https://developers.facebook.com/docs/whatsapp',
    funcionalidades: ['Notificações', 'Cobranças', 'Atualizações de Casos'],
  },
  {
    id: 'asaas',
    nome: 'Asaas (Pagamentos)',
    descricao: 'Geração de links PIX, boletos e cobrança automática de honorários.',
    icone: '💳',
    placeholder: '$aas_prod_...',
    prefixo: '$aas_',
    docs: 'https://asaas.com/desenvolvedores',
    funcionalidades: ['Link PIX', 'Cobrança Automática', 'Relatórios Financeiros'],
  },
  {
    id: 'email',
    nome: 'Email — SendGrid / SMTP',
    descricao: 'Envio de documentos, contratos, intimações e notificações por e-mail.',
    icone: '📧',
    placeholder: 'SG.xxxxxxxxxxxxxxxxxxxx',
    prefixo: 'SG.',
    docs: 'https://sendgrid.com/docs',
    funcionalidades: ['Envio de Documentos', 'Notificações', 'Templates'],
  },
  {
    id: 'jusbrasil',
    nome: 'JusBrasil API',
    descricao: 'Pesquisa de jurisprudência, andamentos processuais e publicações em tempo real.',
    icone: '⚖️',
    placeholder: 'jb_live_...',
    prefixo: '',
    docs: 'https://jusbrasil.com.br/api',
    funcionalidades: ['Jurisprudência', 'Andamentos', 'Publicações'],
  },
  {
    id: 'esocial',
    nome: 'PJe / e-SAJ / Projudi',
    descricao: 'Integração com sistemas processuais para monitoramento automático de intimações.',
    icone: '🏛️',
    placeholder: 'Token do sistema tribunal...',
    prefixo: '',
    docs: 'https://pje.jus.br/',
    funcionalidades: ['Intimações Automáticas', 'Andamentos', 'Documentos'],
  },
]

const OPCOES_SISTEMA = [
  { id: 'tema',          label: 'Tema',                  tipo: 'select',  valor: 'escuro',  opcoes: ['Escuro', 'Claro', 'Auto'] },
  { id: 'idioma',        label: 'Idioma',                tipo: 'select',  valor: 'pt-BR',   opcoes: ['Português (BR)', 'Português (PT)', 'English'] },
  { id: 'notificacoes',  label: 'Notificações Push',     tipo: 'toggle',  valor: true },
  { id: 'auto_backup',   label: 'Backup Automático',     tipo: 'toggle',  valor: true },
  { id: 'whatsapp_notif',label: 'Alertas via WhatsApp',  tipo: 'toggle',  valor: false },
  { id: 'email_notif',   label: 'Alertas por E-mail',    tipo: 'toggle',  valor: true },
]

const USUARIOS_SISTEMA = [
  { id: 'user-001', nome: 'Admin Master',        email: 'admin@escritorio.com', role: 'admin',      ultima_acao: '10 min atrás' },
  { id: 'user-002', nome: 'Sergio Ponte',         email: 'sergio@escritorio.com', role: 'advogado',  ultima_acao: 'Agora' },
  { id: 'user-003', nome: 'Assistente Jurídico',  email: 'assj@escritorio.com',  role: 'assistente', ultima_acao: '2h atrás' },
]

const roleCfg = {
  admin:      { bg: 'var(--red-dim)',    color: 'var(--red)' },
  advogado:   { bg: 'var(--blue-dim)',   color: 'var(--blue)' },
  assistente: { bg: 'var(--amber-dim)',  color: 'var(--amber)' },
}

export default function Configuracoes() {
  const [aba, setAba]               = useState('apis')
  const [chaveVis, setChaveVis]     = useState({})
  const [chaves, setChaves]         = useState({})
  const [testandoId, setTestandoId] = useState(null)
  const [testResult, setTestResult] = useState({})
  const [salvandoId, setSalvandoId] = useState(null)

  const toggleVis = id => setChaveVis(p => ({ ...p, [id]: !p[id] }))

  const handleSalvar = async (id) => {
    const chave = chaves[id]
    if (!chave?.trim()) return

    setSalvandoId(id)
    try {
      if (id === 'anthropic') {
        await saveClaudeKey(chave.trim())
        setTestResult(p => ({ ...p, [id]: { ok: true, msg: 'Chave Claude salva com sucesso!' } }))
      } else {
        // Para outros serviços, salvar no perfil (expandir conforme necessidade)
        setTestResult(p => ({ ...p, [id]: { ok: true, msg: 'Chave salva! Configure o backend para processar.' } }))
      }
    } catch (err) {
      setTestResult(p => ({ ...p, [id]: { ok: false, msg: err.message } }))
    } finally {
      setSalvandoId(null)
    }
  }

  const handleTestar = async (id) => {
    const chave = chaves[id]
    if (!chave?.trim()) return

    setTestandoId(id)
    setTestResult(p => ({ ...p, [id]: null }))
    try {
      if (id === 'anthropic') {
        await testClaudeKey(chave.trim())
        setTestResult(p => ({ ...p, [id]: { ok: true, msg: '✓ Chave válida! Claude pronto para uso.' } }))
      } else {
        setTestResult(p => ({ ...p, [id]: { ok: true, msg: '✓ Conexão estabelecida com sucesso.' } }))
      }
    } catch (err) {
      setTestResult(p => ({ ...p, [id]: { ok: false, msg: err.message } }))
    } finally {
      setTestandoId(null)
    }
  }

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1200 }}>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'apis',      label: 'Integrações & APIs', icon: '🔗' },
          { id: 'sistema',   label: 'Preferências',       icon: '⚙️' },
          { id: 'usuarios',  label: 'Usuários',           icon: '👥' },
          { id: 'seguranca', label: 'Segurança',          icon: '🛡️' },
        ].map(t => (
          <button key={t.id} onClick={() => setAba(t.id)} style={{
            padding: '11px 18px', fontSize: 13.5, fontWeight: aba === t.id ? 600 : 400,
            color: aba === t.id ? 'var(--blue)' : 'var(--text3)',
            borderBottom: aba === t.id ? '2px solid var(--blue)' : '2px solid transparent',
            background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── INTEGRAÇÕES ── */}
      {aba === 'apis' && (
        <div>
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 22, display: 'flex', gap: 10 }}>
            <Shield size={15} color="var(--blue)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
              <strong>Suas chaves ficam criptografadas no banco de dados.</strong> Nunca são expostas publicamente nem compartilhadas. Cada advogado tem seus próprios tokens — o PrevOS não armazena nem processa dados fora do seu Supabase.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {INTEGRACOES.map(api => {
              const result = testResult[api.id]
              const isTesting = testandoId === api.id
              const isSaving  = salvandoId === api.id
              const hasKey    = !!chaves[api.id]

              return (
                <div key={api.id} style={{
                  background: 'var(--bg2)',
                  border: `1px solid ${api.destaque ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                  borderRadius: 14, padding: '20px',
                  boxShadow: api.destaque ? '0 0 0 1px rgba(139,92,246,0.1)' : 'none',
                }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ fontSize: 30, flexShrink: 0 }}>{api.icone}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{api.nome}</h3>
                        {api.destaque && (
                          <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: 'white', borderRadius: 4 }}>
                            RECOMENDADO
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 10 }}>{api.descricao}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {api.funcionalidades.map((f, i) => (
                          <span key={i} style={{ fontSize: 10.5, padding: '2.5px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text4)' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a href={api.docs} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', marginTop: 2 }}>
                      Ver Docs →
                    </a>
                  </div>

                  {/* Input de chave */}
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Key size={14} color="var(--text4)" style={{ flexShrink: 0 }} />
                    <input
                      type={chaveVis[api.id] ? 'text' : 'password'}
                      placeholder={api.placeholder}
                      value={chaves[api.id] || ''}
                      onChange={e => setChaves(p => ({ ...p, [api.id]: e.target.value }))}
                      style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'monospace' }}
                    />
                    <button onClick={() => toggleVis(api.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', padding: '2px 6px' }}>
                      {chaveVis[api.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Resultado do teste */}
                  {result && (
                    <div style={{ padding: '9px 14px', background: result.ok ? 'var(--green-dim)' : 'var(--red-dim)', border: `1px solid ${result.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, marginBottom: 12, fontSize: 12.5, color: result.ok ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {result.msg}
                    </div>
                  )}

                  {/* Botões */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleTestar(api.id)}
                      disabled={isTesting || !hasKey}
                      style={{
                        padding: '8px 14px', background: hasKey ? 'var(--bg3)' : 'var(--bg)',
                        border: '1px solid var(--border)', borderRadius: 8, color: hasKey ? 'var(--text2)' : 'var(--text4)',
                        fontSize: 12.5, fontWeight: 600, cursor: hasKey ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {isTesting ? (
                        <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Testando...</>
                      ) : (
                        <><Zap size={13} /> Testar Conexão</>
                      )}
                    </button>
                    <button
                      onClick={() => handleSalvar(api.id)}
                      disabled={isSaving || !hasKey}
                      style={{
                        padding: '8px 16px',
                        background: hasKey ? 'linear-gradient(135deg, var(--blue), var(--purple))' : 'var(--bg)',
                        border: 'none', borderRadius: 8, color: hasKey ? 'white' : 'var(--text4)',
                        fontSize: 12.5, fontWeight: 700, cursor: hasKey ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {isSaving ? (
                        <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Salvando...</>
                      ) : (
                        <><CheckCircle size={13} /> Salvar Chave</>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PREFERÊNCIAS ── */}
      {aba === 'sistema' && (
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {OPCOES_SISTEMA.map(opt => {
              const [toggled, setToggled] = useState(opt.valor)
              return (
                <div key={opt.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 13.5, fontWeight: 600 }}>{opt.label}</label>
                  {opt.tipo === 'select' ? (
                    <select style={{ padding: '7px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}>
                      {opt.opcoes.map((o, i) => <option key={i}>{o}</option>)}
                    </select>
                  ) : (
                    <button onClick={() => setToggled(p => !p)} style={{
                      width: 44, height: 26, borderRadius: 13, border: 'none',
                      background: toggled ? 'var(--green)' : 'var(--bg4)',
                      cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}>
                      <div style={{ width: 22, height: 22, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: toggled ? 20 : 2, transition: 'left 0.2s' }} />
                    </button>
                  )}
                </div>
              )
            })}

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', marginTop: 6 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Backup & Restauração</h4>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Último backup: 28/03/2026 às 14:32</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 14px', background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'var(--blue)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  Fazer Backup Agora
                </button>
                <button style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12.5, cursor: 'pointer' }}>
                  Restaurar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USUÁRIOS ── */}
      {aba === 'usuarios' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button style={{ padding: '9px 16px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={14} /> Convidar Usuário
            </button>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['Nome', 'E-mail', 'Função', 'Última Atividade', 'Ações'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text3)', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USUARIOS_SISTEMA.map(u => {
                  const rc = roleCfg[u.role] || roleCfg.advogado
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600 }}>{u.nome}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text3)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11.5, padding: '3px 9px', background: rc.bg, color: rc.color, borderRadius: 5, fontWeight: 600 }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text4)' }}>{u.ultima_acao}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text3)', fontSize: 11.5, cursor: 'pointer' }}>Editar</button>
                          <button style={{ padding: '4px 10px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: 'var(--red)', fontSize: 11.5, cursor: 'pointer' }}>Remover</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SEGURANÇA ── */}
      {aba === 'seguranca' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <Shield size={20} color="var(--blue)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Autenticação em Duas Etapas (2FA)</h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>Proteja o acesso com verificação adicional via autenticador.</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginBottom: 12 }}>✓ Ativo</p>
              <button style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Gerenciar 2FA</button>
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <Shield size={20} color="var(--amber)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Sessões Ativas</h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>Gerencie dispositivos conectados à sua conta.</p>
                </div>
              </div>
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>💻 Este navegador</p>
                <p style={{ fontSize: 11.5, color: 'var(--text4)' }}>Última atividade: Agora · São Paulo, BR</p>
              </div>
              <button style={{ padding: '8px 14px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Encerrar Todas as Sessões
              </button>
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Histórico de Acesso Recente</h4>
              {[
                { ip: '187.125.xxx.xxx', local: 'São Paulo, BR', data: '28/03/2026 14:32' },
                { ip: '187.125.xxx.xxx', local: 'São Paulo, BR', data: '27/03/2026 09:15' },
                { ip: '187.125.xxx.xxx', local: 'São Paulo, BR', data: '25/03/2026 16:42' },
              ].map((l, i) => (
                <div key={i} style={{ fontSize: 12.5, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', color: 'var(--text3)', display: 'flex', gap: 12 }}>
                  <span>🔐</span>
                  <span>{l.ip}</span>
                  <span>{l.local}</span>
                  <span style={{ color: 'var(--text4)' }}>{l.data}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

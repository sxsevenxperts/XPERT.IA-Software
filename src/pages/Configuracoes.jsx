import { useState } from 'react'
import { Settings, Key, Eye, EyeOff, Check, X, Plus, Trash2, AlertTriangle, Shield } from 'lucide-react'

const API_INTEGRACOES = [
  {
    id: 'anthropic',
    nome: 'Anthropic Claude API',
    descricao: 'IA para análise de laudos, geração de petições e Juiz Virtual',
    icone: '🤖',
    status: 'conectado',
    chave_prefixo: 'sk-ant-',
    funcionalidades: ['Laudos IA', 'Petições IA', 'Juiz Virtual', 'Análise Preditiva'],
  },
  {
    id: 'whatsapp',
    nome: 'WhatsApp Business API',
    descricao: 'Envio de notificações de cobrança e atualizações de casos',
    icone: '💬',
    status: 'desconectado',
    chave_prefixo: 'wh_',
    funcionalidades: ['Notificações', 'Cobrança', 'Atualizações'],
  },
  {
    id: 'asaas',
    nome: 'Asaas (Pagamentos)',
    descricao: 'Integração para geração de links PIX e cobrança automática',
    icone: '💳',
    status: 'conectado',
    chave_prefixo: '$aas_',
    funcionalidades: ['Link PIX', 'Cobrança Automática', 'Relatórios Financeiros'],
  },
  {
    id: 'supabase',
    nome: 'Supabase',
    descricao: 'Banco de dados e autenticação em tempo real',
    icone: '🔐',
    status: 'conectado',
    chave_prefixo: 'eyJhbG_',
    funcionalidades: ['Autenticação', 'Banco de Dados', 'Real-time'],
  },
  {
    id: 'mail',
    nome: 'Email Service (SMTP)',
    descricao: 'Envio de documentos por email e notificações',
    icone: '📧',
    status: 'conectado',
    chave_prefixo: 'smtp_',
    funcionalidades: ['Envio de Documentos', 'Notificações', 'Agendamentos'],
  },
]

const OPCOES_SISTEMA = [
  { id: 'tema', label: 'Tema', tipo: 'select', valor: 'escuro', opcoes: ['Escuro', 'Claro', 'Auto'] },
  { id: 'idioma', label: 'Idioma', tipo: 'select', valor: 'pt-BR', opcoes: ['Português (BR)', 'Português (PT)', 'English'] },
  { id: 'notificacoes', label: 'Notificações', tipo: 'toggle', valor: true },
  { id: 'auto_backup', label: 'Backup Automático', tipo: 'toggle', valor: true },
]

const USUARIOS_SISTEMA = [
  { id: 'user-001', nome: 'Admin Master', email: 'admin@prevos.io', role: 'admin', ultima_acao: '10 min atrás' },
  { id: 'user-002', nome: 'Sergio Ponte', email: 'sergio@prevos.io', role: 'advogado', ultima_acao: '5 min atrás' },
  { id: 'user-003', nome: 'Assistente Jurídico', email: 'assj@prevos.io', role: 'assistente', ultima_acao: '2h atrás' },
]

const statusBadge = {
  conectado: { bg: 'var(--green-dim)', color: 'var(--green)', label: '✓ Conectado' },
  desconectado: { bg: 'var(--red-dim)', color: 'var(--red)', label: '✗ Desconectado' },
  erro: { bg: 'var(--amber-dim)', color: 'var(--amber)', label: '⚠ Erro' },
}

export default function Configuracoes() {
  const [aba, setAba] = useState('apis')
  const [chaveVisivel, setChaveVisivel] = useState({})
  const [editando, setEditando] = useState(null)
  const [novaChave, setNovaChave] = useState('')

  const toggleChaveVisivel = (id) => {
    setChaveVisivel(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1300 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Configurações</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text3)' }}>Gerencie integrações de API, preferências de sistema e controle de acesso</p>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'apis', label: 'Integrações de API', icon: '🔗' },
          { id: 'sistema', label: 'Preferências do Sistema', icon: '⚙️' },
          { id: 'usuarios', label: 'Usuários e Acesso', icon: '👥' },
          { id: 'seguranca', label: 'Segurança', icon: '🛡️' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setAba(tab.id)} style={{
            padding: '12px 18px', fontSize: 13.5, fontWeight: aba === tab.id ? 600 : 400,
            color: aba === tab.id ? 'var(--blue)' : 'var(--text3)',
            borderBottom: aba === tab.id ? '2px solid var(--blue)' : 'none',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ────── Integrações de API ────── */}
      {aba === 'apis' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {API_INTEGRACOES.map(api => {
              const badge = statusBadge[api.status]
              return (
                <div key={api.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                      <div style={{ fontSize: 32 }}>{api.icone}</div>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{api.nome}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10 }}>{api.descricao}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {api.funcionalidades.map((f, i) => (
                            <span key={i} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text4)' }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', background: badge.bg, color: badge.color, borderRadius: 6, whiteSpace: 'nowrap' }}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Chave API */}
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type={chaveVisivel[api.id] ? 'text' : 'password'}
                      value={chaveVisivel[api.id] ? '••••••••••••••••••••' : api.chave_prefixo + '••••••••'}
                      readOnly
                      style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 13, color: 'var(--text2)', outline: 'none', fontFamily: 'monospace' }}
                    />
                    <button onClick={() => toggleChaveVisivel(api.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '4px 8px' }}>
                      {chaveVisivel[api.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(api.chave_prefixo)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Copiar
                    </button>
                  </div>

                  {/* Botões de ação */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ padding: '8px 14px', background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Key size={12} /> Renovar Chave
                    </button>
                    <button style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Testar Conexão
                    </button>
                    {api.status === 'desconectado' && (
                      <button style={{ padding: '8px 14px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Conectar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ────── Preferências do Sistema ────── */}
      {aba === 'sistema' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {OPCOES_SISTEMA.map(opt => (
              <div key={opt.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{opt.label}</label>
                {opt.tipo === 'select' ? (
                  <select style={{ padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                    {opt.opcoes.map((o, i) => <option key={i}>{o}</option>)}
                  </select>
                ) : (
                  <button onClick={() => {}} style={{
                    width: 44, height: 26, borderRadius: 13, border: 'none',
                    background: opt.valor ? 'var(--green)' : 'var(--bg3)',
                    cursor: 'pointer', position: 'relative',
                  }}>
                    <div style={{
                      width: 22, height: 22, background: 'white', borderRadius: '50%',
                      position: 'absolute', top: 2, left: opt.valor ? 20 : 2,
                      transition: 'left 0.2s',
                    }} />
                  </button>
                )}
              </div>
            ))}

            {/* Backup */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginTop: 8 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Backup & Restauração</h4>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Último backup: 28/03/2026 às 14:32</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 14px', background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Fazer Backup Agora
                </button>
                <button style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Restaurar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────── Usuários e Acesso ────── */}
      {aba === 'usuarios' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button style={{ padding: '10px 16px', background: 'linear-gradient(135deg, var(--blue), var(--cyan))', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={14} /> Novo Usuário
            </button>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['Nome', 'Email', 'Função', 'Última Ação', 'Ações'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text3)', textAlign: 'left', borderRight: i < 4 ? '1px solid var(--border)' : 'none' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USUARIOS_SISTEMA.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{user.nome}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text3)' }}>{user.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      <span style={{ padding: '3px 8px', background: user.role === 'admin' ? 'var(--red-dim)' : 'var(--blue-dim)', color: user.role === 'admin' ? 'var(--red)' : 'var(--blue)', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text4)' }}>{user.ultima_acao}</td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                      <button style={{ padding: '4px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>
                        ✎ Editar
                      </button>
                      <button style={{ padding: '4px 8px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: 'var(--red)', fontSize: 11, cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────── Segurança ────── */}
      {aba === 'seguranca' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Autenticação 2FA */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 14 }}>
                <Shield size={20} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Autenticação em Duas Etapas (2FA)</h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>Adicione uma camada extra de segurança à sua conta</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginBottom: 12 }}>✓ Ativo</p>
              <button style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Gerenciar 2FA
              </button>
            </div>

            {/* Sessões Ativas */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 14 }}>
                <Shield size={20} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Sessões Ativas</h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>Gerencie dispositivos conectados à sua conta</p>
                </div>
              </div>
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>💻 This Browser</p>
                <p style={{ fontSize: 11, color: 'var(--text4)' }}>Última atividade: Agora</p>
              </div>
              <button style={{ padding: '8px 14px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Encerrar Todas as Sessões
              </button>
            </div>

            {/* Histórico de Login */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Histórico de Login Recente</h4>
              {[
                { ip: '187.125.xxx.xxx', local: 'São Paulo, BR', data: '28/03/2026 14:32' },
                { ip: '187.125.xxx.xxx', local: 'São Paulo, BR', data: '27/03/2026 09:15' },
                { ip: '187.125.xxx.xxx', local: 'São Paulo, BR', data: '25/03/2026 16:42' },
              ].map((l, i) => (
                <div key={i} style={{ fontSize: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', color: 'var(--text3)' }}>
                  {l.ip} • {l.local} • {l.data}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ArrowLeft, MapPin, Phone, Mail, Check, X, Lock, Unlock, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

const PLANOS = {
  'starter': { nome: 'Starter', preco: 'R$ 99,90/mês', cor: '#3b82f6' },
  'professional': { nome: 'Professional', preco: 'R$ 199,90/mês', cor: '#10b981' },
  'enterprise': { nome: 'Enterprise', preco: 'R$ 499,90/mês', cor: '#f59e0b' },
}

export default function Lojas({ user, onBack }) {
  const [lojas, setLojas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedLojaForPlan, setSelectedLojaForPlan] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [subscriptions, setSubscriptions] = useState({})
  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    responsavel: '',
  })

  useEffect(() => {
    loadLojas()
  }, [user?.id])

  async function loadLojas() {
    try {
      const { data: lojasData, error: lojasError } = await supabase
        .from('lojas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (lojasError) throw lojasError
      setLojas(lojasData || [])

      // Carregar subscrições para cada loja
      if (lojasData?.length > 0) {
        const { data: subsData } = await supabase
          .from('subscriptions')
          .select('id, loja_id, plano, status, expires_at')
          .in('loja_id', lojasData.map(l => l.id))
        
        const subsByLoja = {}
        subsData?.forEach(sub => {
          subsByLoja[sub.loja_id] = sub
        })
        setSubscriptions(subsByLoja)
      }
    } catch (err) {
      console.error('Erro ao carregar lojas:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      alert('Nome da loja é obrigatório')
      return
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('lojas')
          .update(form)
          .eq('id', editingId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('lojas')
          .insert([{ ...form, user_id: user.id }])
        
        if (error) throw error
      }

      resetForm()
      loadLojas()
    } catch (err) {
      console.error('Erro ao salvar loja:', err)
      alert('Erro ao salvar loja')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja deletar esta loja? Todas as suas assinaturas serão canceladas.')) return

    try {
      const { error } = await supabase
        .from('lojas')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      loadLojas()
    } catch (err) {
      console.error('Erro ao deletar loja:', err)
      alert('Erro ao deletar loja')
    }
  }

  function handleEdit(loja) {
    setForm(loja)
    setEditingId(loja.id)
    setShowForm(true)
  }

  function resetForm() {
    setForm({
      nome: '',
      cnpj: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      email: '',
      responsavel: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  function handleSelectPlan(loja, planId) {
    setSelectedLojaForPlan(loja)
    setShowPlanModal(true)
  }

  return (
    <div style={{ padding: '16px 16px 90px', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>🏪 Minhas Lojas</h1>
      </div>

      {/* Info */}
      <div style={{
        background: '#0f172a', borderRadius: 14, padding: 16,
        border: '1px solid #334155', marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
          Adicione suas lojas e escolha um plano para cada uma. 
          <strong style={{ color: '#f1f5f9' }}> 1 LOJA = 1 LICENÇA</strong> — cada estabelecimento funciona independentemente.
        </p>
      </div>

      {/* Botão adicionar */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%',
            padding: 16,
            marginBottom: 20,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            border: 'none',
            borderRadius: 14,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Plus size={16} />
          Adicionar Loja
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <div style={{ background: '#1e293b', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid #334155' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>
            {editingId ? 'Editar Loja' : 'Nova Loja'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Nome da loja"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              style={{
                gridColumn: '1 / -1',
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />

            <input
              type="text"
              placeholder="CNPJ"
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              style={{
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />

            <input
              type="text"
              placeholder="Responsável"
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              style={{
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />

            <input
              type="text"
              placeholder="Endereço"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              style={{
                gridColumn: '1 / -1',
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />

            <input
              type="text"
              placeholder="Cidade"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              style={{
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />

            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              style={{
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            >
              <option value="">Estado</option>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <input
              type="text"
              placeholder="CEP"
              value={form.cep}
              onChange={(e) => setForm({ ...form, cep: e.target.value })}
              style={{
                gridColumn: '1 / -1',
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />

            <input
              type="tel"
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              style={{
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: 12,
                background: '#22c55e',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Check size={14} style={{ marginRight: 6, display: 'inline' }} />
              Salvar
            </button>
            <button
              onClick={resetForm}
              style={{
                flex: 1,
                padding: 12,
                background: '#334155',
                border: 'none',
                borderRadius: 10,
                color: '#f1f5f9',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X size={14} style={{ marginRight: 6, display: 'inline' }} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de lojas */}
      <div style={{ display: 'grid', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Carregando...</div>
        ) : lojas.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
            Nenhuma loja cadastrada. Adicione sua primeira loja!
          </div>
        ) : (
          lojas.map(loja => {
            const sub = subscriptions[loja.id]
            const planInfo = sub ? PLANOS[sub.plano] : null
            const isActive = sub?.status === 'active'
            const isExpired = sub?.expires_at ? new Date(sub.expires_at) < new Date() : false

            return (
              <div
                key={loja.id}
                style={{
                  background: '#1e293b',
                  borderRadius: 12,
                  padding: 16,
                  border: isActive && !isExpired ? '1px solid #10b98140' : '1px solid #ef444440',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                      {loja.nome}
                    </h4>
                    {loja.cnpj && <p style={{ fontSize: 12, color: '#64748b' }}>CNPJ: {loja.cnpj}</p>}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEdit(loja)}
                      style={{
                        background: '#334155',
                        border: 'none',
                        borderRadius: 8,
                        padding: 8,
                        cursor: 'pointer',
                        color: '#94a3b8',
                      }}
                      title="Editar loja"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(loja.id)}
                      style={{
                        background: '#ef444420',
                        border: 'none',
                        borderRadius: 8,
                        padding: 8,
                        cursor: 'pointer',
                        color: '#ef4444',
                      }}
                      title="Deletar loja"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Endereço */}
                {loja.endereco && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>
                    <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{loja.endereco}, {loja.cidade} - {loja.estado} {loja.cep}</span>
                  </div>
                )}

                {/* Telefone */}
                {loja.telefone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, color: '#94a3b8' }}>
                    <Phone size={14} />
                    {loja.telefone}
                  </div>
                )}

                {/* Email */}
                {loja.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
                    <Mail size={14} />
                    {loja.email}
                  </div>
                )}

                {/* Status da Licença */}
                <div style={{
                  background: isActive && !isExpired ? '#10b98110' : '#ef444410',
                  border: isActive && !isExpired ? '1px solid #10b98140' : '1px solid #ef444440',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isActive && !isExpired ? (
                        <>
                          <Unlock size={14} color="#10b981" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Licença Ativa</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} color="#ef4444" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
                            {isExpired ? 'Licença Expirada' : 'Sem Licença'}
                          </span>
                        </>
                      )}
                    </div>
                    {planInfo && <span style={{ fontSize: 12, fontWeight: 700, color: planInfo.cor }}>{planInfo.nome}</span>}
                  </div>

                  {planInfo && (
                    <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
                      {planInfo.preco}
                    </p>
                  )}

                  {sub?.expires_at && (
                    <p style={{ fontSize: 11, color: '#64748b' }}>
                      {isActive ? 'Próxima cobrança:' : 'Venceu em:'} {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}

                  <button
                    onClick={() => handleSelectPlan(loja, sub?.plano)}
                    style={{
                      width: '100%',
                      marginTop: 10,
                      padding: '10px 12px',
                      background: isActive && !isExpired ? '#334155' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      border: 'none',
                      borderRadius: 8,
                      color: '#f1f5f9',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <CreditCard size={14} />
                    {isActive && !isExpired ? 'Gerenciar Plano' : 'Ativar Licença'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Planos */}
      {showPlanModal && selectedLojaForPlan && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 1000,
        }}>
          <div style={{
            width: '100%',
            background: '#1e293b',
            borderRadius: '16px 16px 0 0',
            padding: 20,
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>
              Planos para {selectedLojaForPlan.nome}
            </h3>

            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              {Object.entries(PLANOS).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => {
                    alert(`Ativar plano ${plan.nome} para ${selectedLojaForPlan.nome}\n\nEssa funcionalidade será implementada com integração de pagamento.`)
                    setShowPlanModal(false)
                  }}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{plan.nome}</p>
                      <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{plan.preco}</p>
                    </div>
                    <Check size={20} color={plan.cor} />
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPlanModal(false)}
              style={{
                width: '100%',
                padding: 14,
                background: '#334155',
                border: 'none',
                borderRadius: 10,
                color: '#f1f5f9',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

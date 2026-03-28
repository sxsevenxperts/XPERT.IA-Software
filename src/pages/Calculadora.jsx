import { useState } from 'react'
import { Calculator, ChevronRight, AlertCircle, CheckCircle, Clock, Download, RotateCcw, Info } from 'lucide-react'
import { calcularBeneficios, formatCurrency, TETO_INSS, SALARIO_MINIMO } from '../lib/calculator.js'

function InputField({ label, hint, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
        {label}
        {hint && <span style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputSx = {
  width: '100%', padding: '10px 12px',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 9, fontSize: 14, color: 'var(--text)', outline: 'none',
}

const urgColors = {
  imediato: { bg: 'var(--green-dim)',  border: 'rgba(16,185,129,0.35)', badge: 'var(--green)',  icon: CheckCircle },
  breve:    { bg: 'var(--amber-dim)',  border: 'rgba(245,158,11,0.35)', badge: 'var(--amber)',  icon: Clock },
  futuro:   { bg: 'var(--blue-dim)',   border: 'rgba(59,130,246,0.25)', badge: 'var(--blue)',   icon: ChevronRight },
}

function CenarioCard({ c }) {
  const [open, setOpen] = useState(false)
  const uc = urgColors[c.urgencia] || urgColors.futuro
  const Icon = uc.icon

  return (
    <div style={{
      background: uc.bg,
      border: `1px solid ${uc.border}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontSize: 20, marginTop: 2 }}>{c.icone}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{c.tipo}</span>
            {c.elegivel && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 9px',
                background: uc.badge, color: 'white', borderRadius: 5, whiteSpace: 'nowrap',
              }}>
                {c.urgencia === 'imediato' ? '✓ ELEGÍVEL' : '⏳ EM BREVE'}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 3 }}>{c.status}</p>
          {c.rmiStr && (
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)', marginTop: 6, letterSpacing: '-0.3px' }}>
              {c.rmiStr}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text3)' }}>/mês</span>
            </p>
          )}
        </div>
        <ChevronRight size={15} style={{ color: 'var(--text4)', marginTop: 3, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>

      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid ' + uc.border }}>
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Row label="Idade mínima" value={c.reqAge} />
            <Row label="Contribuição" value={c.reqContrib} />
            {c.nota && <Row label="Observação" value={c.nota} highlight />}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
      <span style={{ color: 'var(--text4)', minWidth: 120, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: highlight ? 'var(--amber)' : 'var(--text2)', flex: 1 }}>{value}</span>
    </div>
  )
}

const INIT = {
  birthDate: '', genero: 'M', mesesContrib: '', mediaSalarial: '',
  mesesEspeciais: '', tipoEspecial: '', rendaFamiliar: '',
}

export default function Calculadora() {
  const [form, setForm]       = useState(INIT)
  const [cenarios, setCenarios] = useState(null)
  const [loading, setLoading] = useState(false)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function calcular(e) {
    e.preventDefault()
    if (!form.birthDate || !form.mesesContrib || !form.mediaSalarial) return
    setLoading(true)
    setTimeout(() => {
      const result = calcularBeneficios({
        birthDate:    form.birthDate,
        genero:       form.genero,
        mesesContrib: parseInt(form.mesesContrib) || 0,
        mediaSalarial: parseFloat(form.mediaSalarial) || SALARIO_MINIMO,
        mesesEspeciais: parseInt(form.mesesEspeciais) || 0,
        tipoEspecial: parseInt(form.tipoEspecial) || null,
        rendaFamiliar: parseFloat(form.rendaFamiliar) || 0,
      })
      setCenarios(result)
      setLoading(false)
    }, 600)
  }

  function resetar() { setForm(INIT); setCenarios(null) }

  const elegiveisCount = cenarios?.filter(c => c.elegivel).length ?? 0

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1300 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Form ── */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={17} color="var(--purple)" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Dados do Beneficiário</h3>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>Preencha para simular os cenários</p>
            </div>
          </div>

          <form onSubmit={calcular} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Sexo + Nascimento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Sexo">
                <select value={form.genero} onChange={e => f('genero', e.target.value)} style={{ ...inputSx }}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </InputField>
              <InputField label="Data de nascimento">
                <input type="date" value={form.birthDate} onChange={e => f('birthDate', e.target.value)} style={{ ...inputSx }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </InputField>
            </div>

            {/* Contribuição */}
            <InputField label="Total de contribuições" hint="(meses pagos ao INSS — consulte CNIS)">
              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="0" max="600"
                  placeholder="Ex: 240 = 20 anos"
                  value={form.mesesContrib}
                  onChange={e => f('mesesContrib', e.target.value)}
                  style={{ ...inputSx, paddingRight: 60 }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                {form.mesesContrib && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text4)' }}>
                    {(parseInt(form.mesesContrib)/12).toFixed(1)} anos
                  </span>
                )}
              </div>
            </InputField>

            {/* Média salarial */}
            <InputField label="Média salarial (R$)" hint={`Teto: ${formatCurrency(TETO_INSS)}`}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text4)' }}>R$</span>
                <input
                  type="number" min="0"
                  placeholder={SALARIO_MINIMO.toString()}
                  value={form.mediaSalarial}
                  onChange={e => f('mediaSalarial', e.target.value)}
                  style={{ ...inputSx, paddingLeft: 32 }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </InputField>

            {/* Atividade especial */}
            <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: 9, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text2)' }}>Atividade Especial (opcional)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <InputField label="Meses em atividade especial">
                  <input type="number" min="0" placeholder="0" value={form.mesesEspeciais} onChange={e => f('mesesEspeciais', e.target.value)}
                    style={{ ...inputSx }}
                    onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </InputField>
                <InputField label="Grau (anos exigidos)">
                  <select value={form.tipoEspecial} onChange={e => f('tipoEspecial', e.target.value)} style={{ ...inputSx }}>
                    <option value="">Sem especial</option>
                    <option value="15">15 anos (grau alto)</option>
                    <option value="20">20 anos (grau médio)</option>
                    <option value="25">25 anos (grau baixo)</option>
                  </select>
                </InputField>
              </div>
            </div>

            {/* BPC */}
            <InputField label="Renda familiar per capita (R$)" hint="Para verificar BPC/Loas">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text4)' }}>R$</span>
                <input type="number" min="0" placeholder="0,00" value={form.rendaFamiliar} onChange={e => f('rendaFamiliar', e.target.value)}
                  style={{ ...inputSx, paddingLeft: 32 }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            </InputField>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={resetar} style={{
                flex: '0 0 auto', padding: '11px 14px',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 9, color: 'var(--text3)',
              }}>
                <RotateCcw size={14} />
              </button>
              <button type="submit" disabled={loading || !form.birthDate || !form.mesesContrib} style={{
                flex: 1, padding: '11px',
                background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                border: 'none', borderRadius: 9,
                color: 'white', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (!form.birthDate || !form.mesesContrib) ? 0.5 : 1,
              }}>
                {loading
                  ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Calculando...</>
                  : <><Calculator size={15} /> Simular Benefícios</>
                }
              </button>
            </div>
          </form>
        </div>

        {/* ── Results ── */}
        <div>
          {!cenarios && !loading && (
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              padding: '60px 40px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🧮</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Simulação Previdenciária</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text3)', maxWidth: 360, margin: '0 auto' }}>
                Preencha os dados do beneficiário e clique em <strong style={{ color: 'var(--text2)' }}>Simular Benefícios</strong> para ver todos os cenários possíveis com base nas regras da Reforma da Previdência (EC 103/2019).
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Aposentadoria por Idade','Regra dos Pontos','Aposent. Especial','Auxílio-Doença','BPC/Loas'].map(t => (
                  <span key={t} style={{ fontSize: 11.5, padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text4)' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cenarios && (
            <div className="fade-in">
              {/* Summary bar */}
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 14,
              }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>
                    {elegiveisCount > 0
                      ? `✅ ${elegiveisCount} cenário${elegiveisCount > 1 ? 's' : ''} elegível${elegiveisCount > 1 ? 'is' : ''} encontrado${elegiveisCount > 1 ? 's' : ''}!`
                      : '⏳ Nenhum benefício imediato — veja os cenários futuros'}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    Baseado na EC 103/2019 · {cenarios.length} modalidades analisadas
                  </p>
                </div>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px',
                  background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 8, color: 'var(--green)', fontSize: 12.5, fontWeight: 600,
                }}>
                  <Download size={13} /> Gerar Relatório PDF
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cenarios.map((c, i) => <CenarioCard key={i} c={c} />)}
              </div>

              {/* Disclaimer */}
              <div style={{
                marginTop: 14, padding: '12px 16px',
                background: 'var(--bg3)', borderRadius: 10,
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <Info size={14} style={{ color: 'var(--text4)', marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 11.5, color: 'var(--text4)', lineHeight: 1.5 }}>
                  Esta simulação é baseada nos dados informados e nas regras vigentes (EC 103/2019). Para análise jurídica completa, consulte o CNIS atualizado e verifique vínculos empregatícios, conversão de tempo especial e recolhimentos em atraso.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

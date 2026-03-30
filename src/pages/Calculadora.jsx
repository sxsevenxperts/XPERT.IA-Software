import { useState } from 'react'
import {
  Calculator, ChevronRight, AlertCircle, CheckCircle, Clock,
  Download, RotateCcw, Info, Briefcase, Scale, Users, DollarSign,
  TrendingUp, Home,
} from 'lucide-react'
import { calcularBeneficios, formatCurrency, TETO_INSS, SALARIO_MINIMO } from '../lib/calculator.js'

// ─── Shared Atoms ─────────────────────────────────────────────────────────────

const inputSx = {
  width: '100%', padding: '10px 12px',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 9, fontSize: 14, color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box',
}

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

function MoneyInput({ value, onChange, placeholder = '0,00' }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text4)' }}>R$</span>
      <input
        type="number" min="0" step="0.01" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputSx, paddingLeft: 32 }}
        onFocus={e => e.target.style.borderColor = 'var(--blue)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

function ResultRow({ label, value, highlight, bold, separator }) {
  return (
    <>
      {separator && <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 13 }}>
        <span style={{ color: bold ? 'var(--text)' : 'var(--text3)' }}>{label}</span>
        <span style={{
          fontWeight: bold ? 800 : 500,
          color: highlight === 'green' ? 'var(--green)' : highlight === 'red' ? '#FCA5A5' : highlight === 'amber' ? 'var(--amber)' : 'var(--text)',
          fontSize: bold ? 16 : 13,
        }}>
          {value}
        </span>
      </div>
    </>
  )
}

function ResultCard({ title, icon: Icon, color, rows, disclaimer }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
      </div>
      <div>
        {rows.map((r, i) => <ResultRow key={i} {...r} />)}
      </div>
      {disclaimer && (
        <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={13} style={{ color: 'var(--text4)', marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--text4)', lineHeight: 1.5, margin: 0 }}>{disclaimer}</p>
        </div>
      )}
    </div>
  )
}

// ─── Area Tab Config ──────────────────────────────────────────────────────────

const AREAS = [
  { id: 'previdenciario', label: 'Previdenciário', icon: Home,       color: '#3B82F6' },
  { id: 'trabalhista',    label: 'Trabalhista',    icon: Briefcase,  color: '#10B981' },
  { id: 'civel',          label: 'Cível',          icon: Scale,      color: '#8B5CF6' },
  { id: 'familia',        label: 'Família',        icon: Users,      color: '#F59E0B' },
  { id: 'tributario',     label: 'Tributário',     icon: DollarSign, color: '#EF4444' },
]

// ─── Previdenciário ───────────────────────────────────────────────────────────

const urgColors = {
  imediato: { bg: 'var(--green-dim)',  border: 'rgba(16,185,129,0.35)', badge: 'var(--green)',  icon: CheckCircle },
  breve:    { bg: 'var(--amber-dim)',  border: 'rgba(245,158,11,0.35)', badge: 'var(--amber)',  icon: Clock },
  futuro:   { bg: 'var(--blue-dim)',   border: 'rgba(59,130,246,0.25)', badge: 'var(--blue)',   icon: ChevronRight },
}

function CenarioCard({ c }) {
  const [open, setOpen] = useState(false)
  const uc = urgColors[c.urgencia] || urgColors.futuro

  return (
    <div style={{ background: uc.bg, border: `1px solid ${uc.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }} onClick={() => setOpen(!open)}>
        <span style={{ fontSize: 20, marginTop: 2 }}>{c.icone}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{c.tipo}</span>
            {c.elegivel && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', background: uc.badge, color: 'white', borderRadius: 5, whiteSpace: 'nowrap' }}>
                {c.urgencia === 'imediato' ? '✓ ELEGÍVEL' : '⏳ EM BREVE'}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 3 }}>{c.status}</p>
          {c.rmiStr && (
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)', marginTop: 6 }}>
              {c.rmiStr}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text3)' }}>/mês</span>
            </p>
          )}
        </div>
        <ChevronRight size={15} style={{ color: 'var(--text4)', marginTop: 3, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid ' + uc.border }}>
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['Idade mínima', c.reqAge], ['Contribuição', c.reqContrib], c.nota && ['Observação', c.nota]].filter(Boolean).map(([l, v], i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
                <span style={{ color: 'var(--text4)', minWidth: 120, flexShrink: 0 }}>{l}:</span>
                <span style={{ color: l === 'Observação' ? 'var(--amber)' : 'var(--text2)', flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CalcPrevidenciario() {
  const INIT = { birthDate: '', genero: 'M', mesesContrib: '', mediaSalarial: '', mesesEspeciais: '', tipoEspecial: '', rendaFamiliar: '' }
  const [form, setForm]     = useState(INIT)
  const [cenarios, setCenarios] = useState(null)
  const [loading, setLoading]   = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function calcular(e) {
    e.preventDefault()
    if (!form.birthDate || !form.mesesContrib || !form.mediaSalarial) return
    setLoading(true)
    setTimeout(() => {
      const result = calcularBeneficios({
        birthDate: form.birthDate, genero: form.genero,
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

  const elegiveisCount = cenarios?.filter(c => c.elegivel).length ?? 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px' }}>
        <form onSubmit={calcular} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Sexo">
              <select value={form.genero} onChange={e => f('genero', e.target.value)} style={inputSx}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </InputField>
            <InputField label="Nascimento">
              <input type="date" value={form.birthDate} onChange={e => f('birthDate', e.target.value)} style={inputSx}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </InputField>
          </div>
          <InputField label="Total de contribuições" hint="meses pagos ao INSS (consulte CNIS)">
            <div style={{ position: 'relative' }}>
              <input type="number" min="0" max="600" placeholder="Ex: 240 = 20 anos"
                value={form.mesesContrib} onChange={e => f('mesesContrib', e.target.value)}
                style={{ ...inputSx, paddingRight: 60 }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              {form.mesesContrib && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text4)' }}>
                  {(parseInt(form.mesesContrib)/12).toFixed(1)} anos
                </span>
              )}
            </div>
          </InputField>
          <InputField label="Média salarial (R$)" hint={`Teto: ${formatCurrency(TETO_INSS)}`}>
            <MoneyInput value={form.mediaSalarial} onChange={v => f('mediaSalarial', v)} placeholder={SALARIO_MINIMO.toString()} />
          </InputField>
          <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: 9, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text2)' }}>Atividade Especial (opcional)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InputField label="Meses especiais">
                <input type="number" min="0" placeholder="0" value={form.mesesEspeciais} onChange={e => f('mesesEspeciais', e.target.value)}
                  style={inputSx}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </InputField>
              <InputField label="Grau (anos exigidos)">
                <select value={form.tipoEspecial} onChange={e => f('tipoEspecial', e.target.value)} style={inputSx}>
                  <option value="">Sem especial</option>
                  <option value="15">15 anos (grau alto)</option>
                  <option value="20">20 anos (grau médio)</option>
                  <option value="25">25 anos (grau baixo)</option>
                </select>
              </InputField>
            </div>
          </div>
          <InputField label="Renda familiar per capita (R$)" hint="Para verificar BPC/Loas">
            <MoneyInput value={form.rendaFamiliar} onChange={v => f('rendaFamiliar', v)} />
          </InputField>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => { setForm(INIT); setCenarios(null) }}
              style={{ flex: '0 0 auto', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text3)', cursor: 'pointer' }}>
              <RotateCcw size={14} />
            </button>
            <button type="submit" disabled={loading || !form.birthDate || !form.mesesContrib} style={{
              flex: 1, padding: '11px',
              background: 'linear-gradient(135deg, var(--blue), var(--purple))',
              border: 'none', borderRadius: 9, color: 'white', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (!form.birthDate || !form.mesesContrib) ? 0.5 : 1, cursor: 'pointer',
            }}>
              {loading ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Calculando...</>
                : <><Calculator size={15} /> Simular Benefícios</>}
            </button>
          </div>
        </form>
      </div>
      <div>
        {!cenarios && !loading && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏛️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Simulação Previdenciária (EC 103/2019)</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text3)', maxWidth: 360, margin: '0 auto 20px' }}>
              Preencha os dados e simule todos os cenários de benefício previdenciário.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Aposentadoria por Idade','Regra dos Pontos','Aposent. Especial','Auxílio-Doença','BPC/Loas'].map(t => (
                <span key={t} style={{ fontSize: 11.5, padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text4)' }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {cenarios && (
          <div className="fade-in">
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>
                  {elegiveisCount > 0 ? `✅ ${elegiveisCount} cenário${elegiveisCount > 1 ? 's' : ''} elegível${elegiveisCount > 1 ? 'is' : ''} encontrado${elegiveisCount > 1 ? 's' : ''}!` : '⏳ Nenhum benefício imediato — veja os cenários futuros'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Baseado na EC 103/2019 · {cenarios.length} modalidades analisadas</p>
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--green)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                <Download size={13} /> Gerar Relatório PDF
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cenarios.map((c, i) => <CenarioCard key={i} c={c} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Trabalhista ──────────────────────────────────────────────────────────────

function calcVerbasTrabalhistas({ salario, mesesTrab, diasMesParcial, tipoRescisao, saldoFGTS }) {
  const sm = SALARIO_MINIMO
  const s  = parseFloat(salario) || sm
  const m  = parseInt(mesesTrab) || 0
  const dp = parseInt(diasMesParcial) || 0
  const fg = parseFloat(saldoFGTS) || 0
  const tipo = tipoRescisao

  // Aviso prévio (art. 487 CLT + Lei 12.506/2011): 30 + 3 dias/ano, máx 90
  const anosCompletos = Math.floor(m / 12)
  const diasAvisoPrevio = Math.min(90, 30 + anosCompletos * 3)
  const avisoPrevioVal = (s / 30) * diasAvisoPrevio

  // Saldo de salários
  const saldoSalario = dp > 0 ? (s / 30) * dp : 0

  // Férias proporcionais (meses no ano atual)
  const mesesAno = m % 12
  const feriasProporcionais = (s / 12) * mesesAno * (4 / 3) // inclui 1/3

  // Férias vencidas (se mais de 12 meses, considera 1 período vencido — simplificado)
  const feriasVencidas = m >= 24 ? s * (4 / 3) : 0

  // 13º proporcional
  const decimoTerceiroProp = (s / 12) * mesesAno

  // FGTS do período (8% × salário × meses)
  const fgtsDepositado = fg > 0 ? fg : s * 0.08 * m
  const multaFGTS40    = tipo === 'sem_justa_causa' ? fgtsDepositado * 0.40 : 0
  const multaFGTS10    = tipo === 'sem_justa_causa' ? fgtsDepositado * 0.10 : 0

  // Totais por tipo
  const itens = []

  if (dp > 0) itens.push({ label: `Saldo de salários (${dp} dias)`, value: saldoSalario })
  if (tipo !== 'pedido_demissao' && tipo !== 'sem_justa_causa_dp') {
    itens.push({ label: `Aviso prévio indenizado (${diasAvisoPrevio} dias)`, value: avisoPrevioVal })
  }
  if (feriasVencidas > 0) itens.push({ label: 'Férias vencidas + 1/3', value: feriasVencidas })
  if (mesesAno > 0) itens.push({ label: `Férias proporcionais + 1/3 (${mesesAno} meses)`, value: feriasProporcionais })
  if (mesesAno > 0) itens.push({ label: `13º salário proporcional (${mesesAno} meses)`, value: decimoTerceiroProp })
  if (multaFGTS40 > 0) itens.push({ label: 'Multa FGTS (40%)', value: multaFGTS40 })
  if (multaFGTS10 > 0) itens.push({ label: 'Multa FGTS adicional (10%)', value: multaFGTS10 })

  const totalBruto = itens.reduce((acc, i) => acc + i.value, 0)

  return { itens, totalBruto, fgtsDepositado, diasAvisoPrevio }
}

function CalcTrabalhista() {
  const INIT = { salario: '', mesesTrab: '', diasMesParcial: '', tipoRescisao: 'sem_justa_causa', saldoFGTS: '' }
  const [form, setForm] = useState(INIT)
  const [result, setResult] = useState(null)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function calcular(e) {
    e.preventDefault()
    setResult(calcVerbasTrabalhistas(form))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={16} color="#10B981" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Verbas Rescisórias</h3>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>CLT · art. 477 e seguintes</p>
          </div>
        </div>
        <form onSubmit={calcular} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Último salário bruto (R$)">
            <MoneyInput value={form.salario} onChange={v => f('salario', v)} />
          </InputField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Tempo de serviço" hint="meses totais">
              <div style={{ position: 'relative' }}>
                <input type="number" min="0" placeholder="Ex: 36" value={form.mesesTrab} onChange={e => f('mesesTrab', e.target.value)}
                  style={{ ...inputSx, paddingRight: 50 }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                {form.mesesTrab && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--text4)' }}>
                    {(parseInt(form.mesesTrab)/12).toFixed(1)}a
                  </span>
                )}
              </div>
            </InputField>
            <InputField label="Dias do mês atual">
              <input type="number" min="0" max="31" placeholder="Ex: 15" value={form.diasMesParcial} onChange={e => f('diasMesParcial', e.target.value)}
                style={inputSx}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </InputField>
          </div>
          <InputField label="Tipo de rescisão">
            <select value={form.tipoRescisao} onChange={e => f('tipoRescisao', e.target.value)} style={inputSx}>
              <option value="sem_justa_causa">Demissão sem justa causa</option>
              <option value="justa_causa">Demissão por justa causa</option>
              <option value="pedido_demissao">Pedido de demissão</option>
              <option value="acordo_mutuo">Acordo mútuo (art. 484-A)</option>
              <option value="rescisao_indireta">Rescisão indireta</option>
            </select>
          </InputField>
          <InputField label="Saldo FGTS acumulado (R$)" hint="opcional — se souber">
            <MoneyInput value={form.saldoFGTS} onChange={v => f('saldoFGTS', v)} placeholder="Calculado automaticamente" />
          </InputField>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => { setForm(INIT); setResult(null) }}
              style={{ flex: '0 0 auto', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text3)', cursor: 'pointer' }}>
              <RotateCcw size={14} />
            </button>
            <button type="submit" disabled={!form.salario || !form.mesesTrab} style={{
              flex: 1, padding: '11px',
              background: !form.salario ? 'var(--bg4)' : 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none', borderRadius: 9, color: 'white', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (!form.salario || !form.mesesTrab) ? 0.5 : 1, cursor: 'pointer',
            }}>
              <Calculator size={15} /> Calcular Verbas
            </button>
          </div>
        </form>
      </div>
      <div>
        {!result ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Calculadora Trabalhista</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text3)', maxWidth: 360, margin: '0 auto 20px' }}>
              Calcule verbas rescisórias, aviso prévio, férias, 13º e multa do FGTS conforme a CLT.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Saldo Salário','Aviso Prévio','Férias + 1/3','13º Proporcional','Multa FGTS 40%'].map(t => (
                <span key={t} style={{ fontSize: 11.5, padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text4)' }}>{t}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ResultCard
              title="Detalhamento das Verbas Rescisórias"
              icon={Briefcase}
              color="#10B981"
              rows={[
                ...result.itens.map(item => ({ label: item.label, value: formatCurrency(item.value) })),
                { separator: true, label: 'TOTAL BRUTO', value: formatCurrency(result.totalBruto), bold: true, highlight: 'green' },
                { label: 'FGTS depositado (estimado)', value: formatCurrency(result.fgtsDepositado), bold: false, highlight: 'amber' },
              ]}
              disclaimer="Valores brutos antes de descontos de INSS e IRRF. Verifique a tabela progressiva vigente. Esta simulação é indicativa — consulte o advogado para análise completa do TRCT."
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
                <p style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aviso Prévio</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{result.diasAvisoPrevio} dias</p>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>30 dias base + 3 dias/ano (Lei 12.506/2011)</p>
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
                <p style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prazo TRCT</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber)' }}>10 dias</p>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>após término do aviso prévio (art. 477 CLT)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Cível ────────────────────────────────────────────────────────────────────

function calcCorrecao({ valorOriginal, dataBase, taxaIndice, incluirJuros }) {
  const v   = parseFloat(valorOriginal) || 0
  const db  = new Date(dataBase)
  const hoje = new Date()
  if (!db || isNaN(db)) return null

  const meses = Math.max(0, (hoje.getFullYear() - db.getFullYear()) * 12 + (hoje.getMonth() - db.getMonth()))

  // Correção monetária estimada por índice
  let fatorCorrecao = 1
  const taxaMensal = {
    ipca:  0.0040, // ~4.8%/ano aproximado
    inpc:  0.0042,
    igpm:  0.0050,
    selic: 0.0087, // ~10.5%/ano
    tr:    0.0002,
  }[taxaIndice] || 0.0040

  fatorCorrecao = Math.pow(1 + taxaMensal, meses)
  const valorCorrigido = v * fatorCorrecao
  const correcao = valorCorrigido - v

  // Juros legais (1% a.m.)
  const taxaJurosMensal = incluirJuros ? 0.01 : 0
  const juros = v * taxaJurosMensal * meses

  const totalAtualizado = valorCorrigido + juros

  return { v, meses, valorCorrigido, correcao, juros, totalAtualizado, taxaIndice }
}

function CalcCivel() {
  const INIT = { valorOriginal: '', dataBase: '', taxaIndice: 'ipca', incluirJuros: true }
  const [form, setForm] = useState(INIT)
  const [result, setResult] = useState(null)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function calcular(e) {
    e.preventDefault()
    setResult(calcCorrecao(form))
  }

  const indicesLabels = { ipca: 'IPCA', inpc: 'INPC', igpm: 'IGP-M', selic: 'Taxa Selic', tr: 'TR' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={16} color="#8B5CF6" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Atualização Monetária</h3>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>Correção + Juros Legais</p>
          </div>
        </div>
        <form onSubmit={calcular} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Valor original da dívida / condenação (R$)">
            <MoneyInput value={form.valorOriginal} onChange={v => f('valorOriginal', v)} />
          </InputField>
          <InputField label="Data base da dívida">
            <input type="date" value={form.dataBase} onChange={e => f('dataBase', e.target.value)}
              style={inputSx}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </InputField>
          <InputField label="Índice de correção monetária">
            <select value={form.taxaIndice} onChange={e => f('taxaIndice', e.target.value)} style={inputSx}>
              <option value="ipca">IPCA (índice geral)</option>
              <option value="inpc">INPC (previdenciário)</option>
              <option value="igpm">IGP-M (contratos)</option>
              <option value="selic">Taxa Selic (tributário)</option>
              <option value="tr">TR (FGTS / poupança)</option>
            </select>
          </InputField>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
            <input type="checkbox" checked={form.incluirJuros} onChange={e => f('incluirJuros', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--blue)' }} />
            Incluir juros legais (1% a.m. — art. 406 CC)
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => { setForm(INIT); setResult(null) }}
              style={{ flex: '0 0 auto', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text3)', cursor: 'pointer' }}>
              <RotateCcw size={14} />
            </button>
            <button type="submit" disabled={!form.valorOriginal || !form.dataBase} style={{
              flex: 1, padding: '11px',
              background: !form.valorOriginal ? 'var(--bg4)' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              border: 'none', borderRadius: 9, color: 'white', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (!form.valorOriginal || !form.dataBase) ? 0.5 : 1, cursor: 'pointer',
            }}>
              <Calculator size={15} /> Atualizar Valor
            </button>
          </div>
        </form>
      </div>
      <div>
        {!result ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Calculadora Cível</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text3)', maxWidth: 360, margin: '0 auto 20px' }}>
              Atualize valores de condenações, dívidas e indenizações com correção monetária e juros legais.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['IPCA','INPC','IGP-M','Taxa Selic','Juros 1% a.m.'].map(t => (
                <span key={t} style={{ fontSize: 11.5, padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text4)' }}>{t}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ResultCard
              title={`Atualização Monetária — ${indicesLabels[result.taxaIndice] || result.taxaIndice}`}
              icon={Scale}
              color="#8B5CF6"
              rows={[
                { label: 'Valor original', value: formatCurrency(result.v) },
                { label: `Período corrigido`, value: `${result.meses} meses` },
                { label: `Correção ${indicesLabels[result.taxaIndice]}`, value: formatCurrency(result.correcao), highlight: 'amber' },
                { separator: true, label: 'Valor corrigido', value: formatCurrency(result.valorCorrigido) },
                result.juros > 0 && { label: 'Juros legais (1% a.m.)', value: formatCurrency(result.juros), highlight: 'amber' },
                { separator: true, label: 'TOTAL ATUALIZADO', value: formatCurrency(result.totalAtualizado), bold: true, highlight: 'green' },
                { label: 'Acréscimo total', value: `${(((result.totalAtualizado / result.v) - 1) * 100).toFixed(1)}%` },
              ].filter(Boolean)}
              disclaimer="Valores estimados com base em taxas médias históricas. Para cálculos judiciais, utilize as tabelas oficiais do CNJ/TJ e o aplicativo do tribunal competente."
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Família ──────────────────────────────────────────────────────────────────

function calcPensao({ rendaDevedor, numFilhos, tipoCustodia, rendaCredor }) {
  const rd = parseFloat(rendaDevedor) || 0
  const rc = parseFloat(rendaCredor) || 0
  const nf = parseInt(numFilhos) || 1

  // Parâmetros usuais por jurisprudência: 1 filho ~25-33%, 2 ~35%, 3 ~40%
  const basePerc = { 1: 0.30, 2: 0.35, 3: 0.40 }
  const perc = basePerc[Math.min(nf, 3)] || 0.40
  const percCustodia = tipoCustodia === 'compartilhada' ? perc * 0.60 : perc

  const valorBase = rd * percCustodia
  const smRef     = Math.max(SALARIO_MINIMO, valorBase)
  const percentualSM = smRef / SALARIO_MINIMO

  return {
    rendaDevedor: rd, rendaCredor: rc, numFilhos: nf,
    percentual: percCustodia * 100,
    valorBase,
    emSM: percentualSM.toFixed(2),
    smAtual: SALARIO_MINIMO,
    custodiaLabel: tipoCustodia === 'compartilhada' ? 'Compartilhada' : 'Unilateral',
  }
}

function CalcFamilia() {
  const INIT = { rendaDevedor: '', numFilhos: '1', tipoCustodia: 'unilateral', rendaCredor: '' }
  const [form, setForm] = useState(INIT)
  const [result, setResult] = useState(null)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function calcular(e) {
    e.preventDefault()
    setResult(calcPensao(form))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={16} color="#F59E0B" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Pensão Alimentícia</h3>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>art. 1.694 CC · Lei 5.478/1968</p>
          </div>
        </div>
        <form onSubmit={calcular} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Renda bruta do devedor (R$)" hint="quem paga">
            <MoneyInput value={form.rendaDevedor} onChange={v => f('rendaDevedor', v)} />
          </InputField>
          <InputField label="Renda do credor (R$)" hint="quem recebe — opcional">
            <MoneyInput value={form.rendaCredor} onChange={v => f('rendaCredor', v)} />
          </InputField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Nº de filhos">
              <select value={form.numFilhos} onChange={e => f('numFilhos', e.target.value)} style={inputSx}>
                <option value="1">1 filho</option>
                <option value="2">2 filhos</option>
                <option value="3">3 filhos</option>
                <option value="4">4+ filhos</option>
              </select>
            </InputField>
            <InputField label="Tipo de guarda">
              <select value={form.tipoCustodia} onChange={e => f('tipoCustodia', e.target.value)} style={inputSx}>
                <option value="unilateral">Unilateral</option>
                <option value="compartilhada">Compartilhada</option>
              </select>
            </InputField>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => { setForm(INIT); setResult(null) }}
              style={{ flex: '0 0 auto', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text3)', cursor: 'pointer' }}>
              <RotateCcw size={14} />
            </button>
            <button type="submit" disabled={!form.rendaDevedor} style={{
              flex: 1, padding: '11px',
              background: !form.rendaDevedor ? 'var(--bg4)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: 'none', borderRadius: 9, color: 'white', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: !form.rendaDevedor ? 0.5 : 1, cursor: 'pointer',
            }}>
              <Calculator size={15} /> Calcular Pensão
            </button>
          </div>
        </form>
      </div>
      <div>
        {!result ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍👩‍👧</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Calculadora de Família</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text3)', maxWidth: 360, margin: '0 auto 20px' }}>
              Estime valores de pensão alimentícia com base nos percentuais reconhecidos pela jurisprudência.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Guarda Unilateral','Guarda Compartilhada','30% - 1 filho','35% - 2 filhos','40% - 3 filhos'].map(t => (
                <span key={t} style={{ fontSize: 11.5, padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text4)' }}>{t}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ResultCard
              title={`Estimativa de Pensão Alimentícia — ${result.numFilhos} filho${result.numFilhos > 1 ? 's' : ''} (${result.custodiaLabel})`}
              icon={Users}
              color="#F59E0B"
              rows={[
                { label: 'Renda bruta do devedor', value: formatCurrency(result.rendaDevedor) },
                { label: 'Percentual aplicado', value: `${result.percentual.toFixed(1)}%` },
                { separator: true, label: 'VALOR ESTIMADO (por filho)', value: formatCurrency(result.valorBase / result.numFilhos), bold: true, highlight: 'green' },
                { label: 'TOTAL MENSAL', value: formatCurrency(result.valorBase), bold: true, highlight: 'green' },
                { separator: true, label: 'Equivalência em salários mínimos', value: `${result.emSM} SM` },
                { label: 'Salário mínimo vigente', value: formatCurrency(result.smAtual) },
              ]}
              disclaimer="Estimativa baseada nos percentuais mais praticados pela jurisprudência. O juiz considera as necessidades do alimentado e as possibilidades do alimentante (art. 1.694 §1º CC). Este cálculo não substitui análise jurídica."
            />
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>📌 Referências jurisprudenciais usuais</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { n: '1 filho', perc: '25–33%', obs: 'Guarda unilateral' },
                  { n: '2 filhos', perc: '35–40%', obs: 'Cada filho ~17%' },
                  { n: '3+ filhos', perc: '40–50%', obs: 'Limite capacidade' },
                ].map(r => (
                  <div key={r.n} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, fontWeight: 700 }}>{r.n}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--amber)', margin: '4px 0' }}>{r.perc}</p>
                    <p style={{ fontSize: 11, color: 'var(--text4)' }}>{r.obs}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tributário ───────────────────────────────────────────────────────────────

function calcIR({ tipoCalculo, rendaBruta, deducoes, ganhoCapital, custoAquisicao }) {
  if (tipoCalculo === 'irpf') {
    const rb = parseFloat(rendaBruta) || 0
    const ded = parseFloat(deducoes) || 0
    const base = Math.max(0, rb - ded)

    // Tabela IRPF 2024 mensal
    const faixas = [
      { ate: 2259.20,  aliq: 0,     deducao: 0 },
      { ate: 2826.65,  aliq: 0.075, deducao: 169.44 },
      { ate: 3751.05,  aliq: 0.15,  deducao: 381.44 },
      { ate: 4664.68,  aliq: 0.225, deducao: 662.77 },
      { ate: Infinity, aliq: 0.275, deducao: 896.00 },
    ]
    const faixa = faixas.find(f => base <= f.ate) || faixas[faixas.length - 1]
    const ir = Math.max(0, base * faixa.aliq - faixa.deducao)
    const aliqEfetiva = base > 0 ? (ir / rb) * 100 : 0

    return { tipo: 'irpf', rb, base, ir, aliqEfetiva, faixaAliq: faixa.aliq * 100 }
  }

  if (tipoCalculo === 'ganho_capital') {
    const valor = parseFloat(ganhoCapital) || 0
    const custo = parseFloat(custoAquisicao) || 0
    const ganho = Math.max(0, valor - custo)

    // Tabela ganho de capital (Lei 13.259/2016)
    const faixas = [
      { ate: 5000000,   aliq: 0.15 },
      { ate: 10000000,  aliq: 0.175 },
      { ate: 30000000,  aliq: 0.20 },
      { ate: Infinity,  aliq: 0.225 },
    ]
    const faixa = faixas.find(f => ganho <= f.ate) || faixas[faixas.length - 1]
    const ir = ganho * faixa.aliq
    const lucro = ganho - ir

    return { tipo: 'ganho_capital', valor, custo, ganho, ir, lucro, aliq: faixa.aliq * 100 }
  }

  return null
}

function CalcTributario() {
  const INIT = { tipoCalculo: 'irpf', rendaBruta: '', deducoes: '', ganhoCapital: '', custoAquisicao: '' }
  const [form, setForm] = useState(INIT)
  const [result, setResult] = useState(null)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function calcular(e) {
    e.preventDefault()
    setResult(calcIR(form))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={16} color="#EF4444" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Calculadora Tributária</h3>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>IRPF · Ganho de Capital</p>
          </div>
        </div>
        <form onSubmit={calcular} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Tipo de cálculo">
            <select value={form.tipoCalculo} onChange={e => f('tipoCalculo', e.target.value)} style={inputSx}>
              <option value="irpf">IRPF — Imposto de Renda Pessoa Física</option>
              <option value="ganho_capital">Ganho de Capital (imóvel / ações)</option>
            </select>
          </InputField>

          {form.tipoCalculo === 'irpf' && (
            <>
              <InputField label="Rendimento bruto mensal (R$)">
                <MoneyInput value={form.rendaBruta} onChange={v => f('rendaBruta', v)} />
              </InputField>
              <InputField label="Deduções legais (R$)" hint="dependentes, saúde, previdência">
                <MoneyInput value={form.deducoes} onChange={v => f('deducoes', v)} />
              </InputField>
            </>
          )}

          {form.tipoCalculo === 'ganho_capital' && (
            <>
              <InputField label="Valor de venda / alienação (R$)">
                <MoneyInput value={form.ganhoCapital} onChange={v => f('ganhoCapital', v)} />
              </InputField>
              <InputField label="Custo de aquisição / base de cálculo (R$)">
                <MoneyInput value={form.custoAquisicao} onChange={v => f('custoAquisicao', v)} />
              </InputField>
            </>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => { setForm(INIT); setResult(null) }}
              style={{ flex: '0 0 auto', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text3)', cursor: 'pointer' }}>
              <RotateCcw size={14} />
            </button>
            <button type="submit" style={{
              flex: 1, padding: '11px',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              border: 'none', borderRadius: 9, color: 'white', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}>
              <Calculator size={15} /> Calcular IR
            </button>
          </div>
        </form>
      </div>
      <div>
        {!result ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Calculadora Tributária</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text3)', maxWidth: 360, margin: '0 auto 20px' }}>
              Calcule IRPF mensal ou imposto sobre ganho de capital conforme a legislação vigente.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['IRPF 2024','Ganho de Capital','Tabela Progressiva','Lei 13.259/2016'].map(t => (
                <span key={t} style={{ fontSize: 11.5, padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text4)' }}>{t}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {result.tipo === 'irpf' && (
              <ResultCard
                title="IRPF — Imposto de Renda Pessoa Física (Mensal)"
                icon={DollarSign}
                color="#EF4444"
                rows={[
                  { label: 'Rendimento bruto', value: formatCurrency(result.rb) },
                  { label: 'Base de cálculo', value: formatCurrency(result.base) },
                  { label: 'Alíquota da faixa', value: `${result.faixaAliq}%` },
                  { separator: true, label: 'IR DEVIDO (mensal)', value: formatCurrency(result.ir), bold: true, highlight: result.ir > 0 ? 'red' : 'green' },
                  { label: 'Alíquota efetiva', value: `${result.aliqEfetiva.toFixed(2)}%` },
                  { label: 'Valor líquido estimado', value: formatCurrency(result.rb - result.ir), highlight: 'green' },
                ]}
                disclaimer="Cálculo baseado na tabela IRPF 2024. Não inclui desconto de INSS, pensão alimentícia ou outras deduções específicas. Consulte contador para declaração completa."
              />
            )}
            {result.tipo === 'ganho_capital' && (
              <ResultCard
                title="Ganho de Capital — Lei 13.259/2016"
                icon={TrendingUp}
                color="#EF4444"
                rows={[
                  { label: 'Valor de alienação', value: formatCurrency(result.valor) },
                  { label: 'Custo de aquisição', value: formatCurrency(result.custo) },
                  { separator: true, label: 'Ganho de capital tributável', value: formatCurrency(result.ganho) },
                  { label: 'Alíquota aplicável', value: `${result.aliq}%` },
                  { label: 'IR sobre ganho de capital', value: formatCurrency(result.ir), highlight: 'red', bold: true },
                  { separator: true, label: 'Lucro líquido', value: formatCurrency(result.lucro), highlight: 'green', bold: true },
                ]}
                disclaimer="Alíquotas: 15% até R$5M · 17,5% até R$10M · 20% até R$30M · 22,5% acima. Isenção para venda de único imóvel ≤ R$440k (art. 22 Lei 9.250/95). Prazo de recolhimento: último dia útil do mês seguinte."
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Calculadora ─────────────────────────────────────────────────────────

export default function Calculadora() {
  const [area, setArea] = useState('previdenciario')
  const current = AREAS.find(a => a.id === area)

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1400 }}>

      {/* Area Tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 6,
        width: 'fit-content',
      }}>
        {AREAS.map(a => {
          const Icon = a.icon
          const active = area === a.id
          return (
            <button
              key={a.id}
              onClick={() => setArea(a.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 8, border: 'none',
                background: active ? `${a.color}22` : 'transparent',
                color: active ? a.color : 'var(--text3)',
                fontWeight: active ? 700 : 400,
                fontSize: 13, cursor: 'pointer',
                outline: active ? `1px solid ${a.color}44` : 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={14} />
              {a.label}
            </button>
          )
        })}
      </div>

      {/* Area title */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${current.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <current.icon size={18} color={current.color} />
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>Calculadora — Direito {current.label}</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>Cálculos e simulações para {current.label.toLowerCase()}</p>
        </div>
      </div>

      {/* Calculator content */}
      {area === 'previdenciario' && <CalcPrevidenciario />}
      {area === 'trabalhista'    && <CalcTrabalhista />}
      {area === 'civel'          && <CalcCivel />}
      {area === 'familia'        && <CalcFamilia />}
      {area === 'tributario'     && <CalcTributario />}
    </div>
  )
}

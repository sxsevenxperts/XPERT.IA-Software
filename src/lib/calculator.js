/**
 * PrevOS — Engine de Cálculos Previdenciários
 * Regras baseadas na EC 103/2019 (Reforma da Previdência)
 * Atualizado: 2026
 */

export const TETO_INSS       = 7786.02   // Teto INSS 2024 (atualizar anualmente)
export const SALARIO_MINIMO  = 1412.00   // Salário mínimo 2024
export const FATOR_REDUCAO   = 0.917     // Fator de redução aposentadoria por idade
export const REFORMA_DATE    = new Date('2019-11-13')

// ─── Tabela progressiva de pontos (Regra dos Pontos) ───────────────────────
const PONTOS_PROGRESSAO = {
  M: [
    { ano: 2020, pontos: 97 }, { ano: 2021, pontos: 98 }, { ano: 2022, pontos: 99 },
    { ano: 2023, pontos: 100 }, { ano: 2024, pontos: 101 }, { ano: 2025, pontos: 102 },
    { ano: 2026, pontos: 103 }, { ano: 2027, pontos: 104 }, { ano: 2028, pontos: 105 },
  ],
  F: [
    { ano: 2020, pontos: 87 }, { ano: 2021, pontos: 88 }, { ano: 2022, pontos: 89 },
    { ano: 2023, pontos: 90 }, { ano: 2024, pontos: 91 }, { ano: 2025, pontos: 92 },
    { ano: 2026, pontos: 93 }, { ano: 2027, pontos: 94 }, { ano: 2028, pontos: 95 },
    { ano: 2029, pontos: 96 }, { ano: 2030, pontos: 97 }, { ano: 2031, pontos: 98 },
    { ano: 2032, pontos: 99 }, { ano: 2033, pontos: 100 },
  ],
}

// ─── Utilitários ───────────────────────────────────────────────────────────

export function getIdade(birthDate) {
  const today = new Date()
  const birth = new Date(birthDate)
  let years  = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) years--
  const totalMonths = Math.floor((today - birth) / (1000 * 60 * 60 * 24 * 30.44))
  return { years, months: totalMonths }
}

export function getPontosAtuais(ano, genero) {
  const tabela = PONTOS_PROGRESSAO[genero] || PONTOS_PROGRESSAO.M
  const row = tabela.find(r => r.ano >= ano) || tabela[tabela.length - 1]
  return row.pontos
}

export function formatCurrency(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── RMI — Renda Mensal Inicial ────────────────────────────────────────────

/** Aposentadoria por idade: 60% do SB + 2% por ano acima de 20 anos de contribuição */
export function calcRMI_Idade(mediaSalarial, mesesContrib, genero) {
  const anosContrib = mesesContrib / 12
  const anosMinimos = genero === 'M' ? 20 : 15
  const percentual  = 0.6 + Math.max(0, anosContrib - anosMinimos) * 0.02
  const sb          = Math.min(mediaSalarial, TETO_INSS)
  return Math.max(SALARIO_MINIMO, sb * Math.min(percentual, 1.0))
}

/** Aposentadoria Programada / por Tempo: 60% + 2% a.a. acima de 20M/15F anos */
export function calcRMI_Programada(mediaSalarial, mesesContrib, genero) {
  const anosContrib = mesesContrib / 12
  const base        = genero === 'M' ? 20 : 15
  const percentual  = 0.6 + Math.max(0, anosContrib - base) * 0.02
  const sb          = Math.min(mediaSalarial, TETO_INSS)
  return Math.max(SALARIO_MINIMO, sb * Math.min(percentual, 1.0))
}

/** Aposentadoria Especial: 100% do SB */
export function calcRMI_Especial(mediaSalarial) {
  return Math.max(SALARIO_MINIMO, Math.min(mediaSalarial, TETO_INSS))
}

/** Auxílio-doença: 91% do SB */
export function calcRMI_AuxilioDoenca(mediaSalarial) {
  return Math.max(SALARIO_MINIMO, Math.min(mediaSalarial, TETO_INSS) * 0.91)
}

/** BPC/Loas: 1 salário mínimo */
export function calcRMI_BPC() {
  return SALARIO_MINIMO
}

// ─── CALCULADORA PRINCIPAL ─────────────────────────────────────────────────

/**
 * @param {Object} dados
 *   birthDate       - string ISO '1965-04-20'
 *   genero          - 'M' | 'F'
 *   mesesContrib    - number (total de meses contribuídos)
 *   mediaSalarial   - number (média salarial, R$)
 *   mesesEspeciais  - number (meses em atividade especial)
 *   tipoEspecial    - 15 | 20 | 25 (grau de insalubridade)
 *   rendaFamiliar   - number (renda per capita familiar para BPC)
 *   mesesContrib1994- boolean (se tinha contribuições antes de jul/1994 — revisão buraco negro)
 * @returns Array de cenários
 */
export function calcularBeneficios(dados) {
  const {
    birthDate,
    genero = 'M',
    mesesContrib = 0,
    mediaSalarial = SALARIO_MINIMO,
    mesesEspeciais = 0,
    tipoEspecial = null,
    rendaFamiliar = 0,
  } = dados

  if (!birthDate) return []

  const hoje      = new Date()
  const anoAtual  = hoje.getFullYear()
  const { years: idade, months: totalMeses } = getIdade(birthDate)
  const anosContrib = mesesContrib / 12
  const cenarios = []

  // ────────────────────────────────────────────────────────────────
  // 1. APOSENTADORIA POR IDADE (regra permanente pós-reforma)
  // ────────────────────────────────────────────────────────────────
  const idadeMinPorIdade  = genero === 'M' ? 65 : 62
  const contribMinPorIdade = genero === 'M' ? 240 : 180  // meses

  const faltaIdade  = Math.max(0, idadeMinPorIdade - idade)
  const faltaContrib= Math.max(0, contribMinPorIdade - mesesContrib)
  const faltaMax    = Math.max(faltaIdade, Math.ceil(faltaContrib / 12))

  cenarios.push({
    tipo:    'Aposentadoria por Idade',
    icone:   '🏠',
    elegivel: faltaMax === 0,
    status:   faltaMax === 0
      ? 'ELEGÍVEL AGORA'
      : `Falta: ${faltaIdade > 0 ? faltaIdade + ' anos de idade' : ''}${faltaIdade > 0 && faltaContrib > 0 ? ' · ' : ''}${faltaContrib > 0 ? faltaContrib + ' meses de contribuição' : ''}`,
    urgencia: faltaMax === 0 ? 'imediato' : faltaMax <= 2 ? 'breve' : 'futuro',
    rmi:      faltaMax === 0 ? calcRMI_Idade(mediaSalarial, mesesContrib, genero) : null,
    rmiStr:   faltaMax === 0 ? formatCurrency(calcRMI_Idade(mediaSalarial, mesesContrib, genero)) : null,
    reqAge:   `${idadeMinPorIdade} anos`,
    reqContrib: `${contribMinPorIdade / 12} anos de contribuição`,
    nota:     `Percentual: ${Math.min(100, Math.round((0.6 + Math.max(0, anosContrib - (genero==='M'?20:15)) * 0.02) * 100))}% do salário de benefício`,
  })

  // ────────────────────────────────────────────────────────────────
  // 2. APOSENTADORIA PROGRAMADA (Regra dos Pontos)
  // ────────────────────────────────────────────────────────────────
  const pontosNecessarios = getPontosAtuais(anoAtual, genero)
  const pontosAtuais      = idade + anosContrib
  const contribMinimaP    = genero === 'M' ? 420 : 360  // 35M / 30F anos em meses

  const faltaPontosAnos   = Math.max(0, pontosNecessarios - pontosAtuais)
  const faltaContribProg  = Math.max(0, contribMinimaP - mesesContrib)

  cenarios.push({
    tipo:    'Aposentadoria Programada',
    icone:   '⭐',
    elegivel: pontosAtuais >= pontosNecessarios && mesesContrib >= contribMinimaP,
    status:   (pontosAtuais >= pontosNecessarios && mesesContrib >= contribMinimaP)
      ? 'ELEGÍVEL AGORA'
      : `Pontos: ${pontosAtuais.toFixed(1)} / ${pontosNecessarios} · ${faltaContribProg > 0 ? `Contrib: faltam ${Math.ceil(faltaContribProg/12)} anos` : 'Contribuição ok'}`,
    urgencia: pontosAtuais >= pontosNecessarios ? 'imediato' : faltaPontosAnos <= 1 ? 'breve' : 'futuro',
    rmi:      (pontosAtuais >= pontosNecessarios) ? calcRMI_Programada(mediaSalarial, mesesContrib, genero) : null,
    rmiStr:   (pontosAtuais >= pontosNecessarios) ? formatCurrency(calcRMI_Programada(mediaSalarial, mesesContrib, genero)) : null,
    reqAge:   `${pontosNecessarios} pontos (idade + contrib)`,
    reqContrib: genero === 'M' ? '35 anos de contribuição' : '30 anos de contribuição',
    nota:     `Pontos em ${anoAtual}: ${pontosNecessarios} (progressivo até 105H/100M)`,
  })

  // ────────────────────────────────────────────────────────────────
  // 3. APOSENTADORIA ESPECIAL
  // ────────────────────────────────────────────────────────────────
  if (tipoEspecial && mesesEspeciais > 0) {
    const anosEspeciaisNec = tipoEspecial  // 15, 20 ou 25
    const faltaEsp = Math.max(0, anosEspeciaisNec * 12 - mesesEspeciais)

    cenarios.push({
      tipo:    `Aposentadoria Especial (${anosEspeciaisNec} anos)`,
      icone:   '⚠️',
      elegivel: faltaEsp === 0,
      status:   faltaEsp === 0
        ? 'ELEGÍVEL AGORA'
        : `Falta ${Math.ceil(faltaEsp/12)} anos de atividade especial`,
      urgencia: faltaEsp === 0 ? 'imediato' : Math.ceil(faltaEsp/12) <= 2 ? 'breve' : 'futuro',
      rmi:      faltaEsp === 0 ? calcRMI_Especial(mediaSalarial) : null,
      rmiStr:   faltaEsp === 0 ? formatCurrency(calcRMI_Especial(mediaSalarial)) : null,
      reqAge:   'Sem idade mínima',
      reqContrib: `${anosEspeciaisNec} anos em atividade especial (PPP)`,
      nota:     '100% do salário de benefício — exige PPP e laudo técnico',
    })
  }

  // ────────────────────────────────────────────────────────────────
  // 4. AUXÍLIO POR INCAPACIDADE (Auxílio-doença / Aposent. Invalidez)
  // ────────────────────────────────────────────────────────────────
  const carenciaAuxilio = 12  // 12 meses de contribuição
  cenarios.push({
    tipo:    'Auxílio por Incapacidade',
    icone:   '🏥',
    elegivel: mesesContrib >= carenciaAuxilio,
    status:   mesesContrib >= carenciaAuxilio
      ? 'CARÊNCIA CUMPRIDA (12 meses)'
      : `Falta ${carenciaAuxilio - mesesContrib} contribuições`,
    urgencia: mesesContrib >= carenciaAuxilio ? 'imediato' : 'futuro',
    rmi:      mesesContrib >= carenciaAuxilio ? calcRMI_AuxilioDoenca(mediaSalarial) : null,
    rmiStr:   mesesContrib >= carenciaAuxilio ? formatCurrency(calcRMI_AuxilioDoenca(mediaSalarial)) : null,
    reqAge:   'Qualquer idade',
    reqContrib: '12 meses de contribuição (carência)',
    nota:     '91% do SB. Acidente: sem carência. Exige laudo médico pericial.',
  })

  // ────────────────────────────────────────────────────────────────
  // 5. BPC/LOAS
  // ────────────────────────────────────────────────────────────────
  const rendaLimite = SALARIO_MINIMO / 4  // R$ 353
  const elegBPC_Idoso = idade >= 65
  const elegBPC_Def   = true  // deficiência a ser comprovada por laudo

  if (elegBPC_Idoso || rendaFamiliar <= rendaLimite) {
    cenarios.push({
      tipo:    'BPC/Loas' + (elegBPC_Idoso ? ' (Idoso)' : ' (Deficiência)'),
      icone:   '🤝',
      elegivel: elegBPC_Idoso && rendaFamiliar <= rendaLimite,
      status:   elegBPC_Idoso
        ? (rendaFamiliar <= rendaLimite ? 'VERIFICAR — POSSÍVEL' : `Renda per capita R$ ${rendaFamiliar} > limite R$ ${rendaLimite.toFixed(0)}`)
        : `Falta ${65 - idade} anos para BPC idoso`,
      urgencia: elegBPC_Idoso ? 'breve' : 'futuro',
      rmi:      calcRMI_BPC(),
      rmiStr:   formatCurrency(calcRMI_BPC()),
      reqAge:   '65 anos (idoso) ou qualquer idade (deficiência)',
      reqContrib: 'Não exige contribuição ao INSS',
      nota:     `Renda familiar per capita ≤ R$ ${rendaLimite.toFixed(2)} (1/4 SM). Não acumula com outro benefício.`,
    })
  }

  // Ordenar por urgência
  const order = { imediato: 0, breve: 1, futuro: 2 }
  cenarios.sort((a, b) => (order[a.urgencia] ?? 2) - (order[b.urgencia] ?? 2))

  return cenarios
}

// ─── Comparador de Cenários ────────────────────────────────────────────────

export function compararCenarios(dados) {
  const { mesesContrib, genero, mediaSalarial } = dados
  const base = calcularBeneficios(dados)

  // Projeção: se contribuir mais 12, 24, 36, 60 meses
  const projecoes = [12, 24, 36, 60].map(mesesPlus => ({
    label: `Em ${mesesPlus/12} ano${mesesPlus > 12 ? 's' : ''}`,
    cenarios: calcularBeneficios({ ...dados, mesesContrib: mesesContrib + mesesPlus }),
  }))

  return { base, projecoes }
}

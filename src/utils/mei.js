// ──── MEI / Autônomo — Calculadora de Impostos ────────────────────────────

/**
 * Calcula INSS (contribuição individual)
 * MEI simplificado: 5% do faturamento (limite: R$ 3000/mês) ou 20% do lucro
 * Para autônomo: 20% do faturamento
 */
export function calcINSS(revenue, isMEI = true) {
  if (isMEI) {
    // MEI: máximo R$ 150 de INSS (5% de R$3000)
    return Math.min(revenue * 0.05, 150)
  }
  // Autônomo: 20% do faturamento
  return revenue * 0.20
}

/**
 * Calcula ISS (Imposto Sobre Serviços)
 * Varia por município (2-5%)
 * Default: 5% (São Paulo)
 */
export function calcISS(revenue, rate = 0.05) {
  return revenue * rate
}

/**
 * Calcula DAS (Documento de Arrecadação do Simples Nacional)
 * MEI: contribuição mensal fixa (~R$65-120) + INSS + ISS
 * Usado aqui para calcular como % simplificado
 */
export function calcDAS(revenue, isMEI = true) {
  if (isMEI) {
    // MEI: aprox 20% de contribuição simplificada (estimativa)
    // Inclui INSS + ISS + administração
    return Math.min(revenue * 0.20, 200) // limite aproximado
  }
  // Simples Nacional: média 5-10% do faturamento
  return revenue * 0.08
}

/**
 * Calcula lucro líquido após impostos
 */
export function calcLiquid(revenue, isMEI = true, issRate = 0.05) {
  const inss = calcINSS(revenue, isMEI)
  const iss = calcISS(revenue, issRate)
  const das = calcDAS(revenue, isMEI)
  const totalTaxes = inss + iss + das

  return {
    revenue,
    inss,
    iss,
    das,
    totalTaxes,
    liquid: Math.max(0, revenue - totalTaxes),
    liquidPercent: revenue > 0 ? Math.round(((revenue - totalTaxes) / revenue) * 100) : 0,
  }
}

/**
 * Sugestão de valores de MEI
 */
export const MEI_INFO = {
  name: 'MEI (Microempreendedor Individual)',
  monthlyFixed: 85, // DAS mensal aproximado
  maxMonthly: 6500, // limite de faturamento
  inssRate: 0.05,
  issRateRange: '2-5%',
  features: [
    '✓ INSS baixo (5% ou mín R$65)',
    '✓ Acesso a crédito',
    '✓ Até R$6.500/mês',
    '✓ Simplicidade fiscal',
  ],
}

export const AUTONOMO_INFO = {
  name: 'Autônomo / Profissional Liberal',
  monthlyFixed: 0,
  maxMonthly: null,
  inssRate: 0.20,
  issRateRange: '2-5%',
  features: [
    '✓ Sem limite de faturamento',
    '✓ Maior flexibilidade',
    '✗ INSS mais alto (20%)',
    '✗ Mais burocracia fiscal',
  ],
}

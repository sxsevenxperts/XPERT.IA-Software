export const fmt = {
  currency: (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0),
  number: (val, decimals = 0) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val || 0),
  date: (d) => new Date(d).toLocaleDateString('pt-BR'),
  datetime: (d) => new Date(d).toLocaleString('pt-BR'),
  km: (val) => `${fmt.number(val, 1)} km`,
  percent: (val) => `${fmt.number(val, 1)}%`,
}

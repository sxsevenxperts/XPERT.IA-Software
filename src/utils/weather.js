// ─── Previsão do tempo via Open-Meteo (gratuito, sem API key) ───────────────
// Conectado ao modelo meteorológico ECMWF/GFS — mesmo usado pelo INMET

const WMO = {
  0:  { label: 'Céu limpo',        icon: '☀️',  tip: 'Dia de sol! Passe protetor solar antes de sair.' },
  1:  { label: 'Predomin. limpo',  icon: '🌤️', tip: 'Céu quase limpo. Leve protetor solar por precaução.' },
  2:  { label: 'Parcialmente nublado', icon: '⛅', tip: 'Possíveis rajadas. Atenção na moto.' },
  3:  { label: 'Nublado',          icon: '☁️',  tip: 'Céu fechado, mas sem chuva. Siga tranquilo.' },
  45: { label: 'Neblina',          icon: '🌫️', tip: '⚠️ Neblina! Reduza a velocidade e ligue os faróis.' },
  48: { label: 'Neblina com geada',icon: '🌫️', tip: '⚠️ Neblina densa! Dirijam com cuidado extremo.' },
  51: { label: 'Garoa leve',       icon: '🌦️', tip: 'Garoa. Vista a capa de chuva e dirija devagar.' },
  53: { label: 'Garoa moderada',   icon: '🌦️', tip: 'Garoa moderada. Capa de chuva e atenção à visibilidade.' },
  55: { label: 'Garoa intensa',    icon: '🌧️', tip: '⚠️ Garoa intensa! Capa de chuva obrigatória.' },
  61: { label: 'Chuva fraca',      icon: '🌧️', tip: 'Chuva! Vista a capa de chuva agora.' },
  63: { label: 'Chuva moderada',   icon: '🌧️', tip: '⚠️ Chuva moderada! Reduza a velocidade e cuide da frenagem.' },
  65: { label: 'Chuva forte',      icon: '🌧️', tip: '🚨 Chuva forte! Considere aguardar em local seguro.' },
  80: { label: 'Chuva passageira', icon: '🌦️', tip: 'Pancada de chuva. Capa pronta e atenção ao chão escorregadio.' },
  81: { label: 'Chuva passageira', icon: '🌧️', tip: '⚠️ Pancada forte! Capa de chuva e reduza a velocidade.' },
  82: { label: 'Chuva torrencial', icon: '⛈️', tip: '🚨 TORRENCIAL! Evite sair se possível. Alto risco de alagamento.' },
  95: { label: 'Trovoada',         icon: '⛈️', tip: '🚨 Trovoada! Risco alto. Aguarde a tempestade passar.' },
  96: { label: 'Trovoada + granizo',icon: '⛈️',tip: '🚨 Trovoada com granizo! Não saia agora.' },
  99: { label: 'Trovoada intensa', icon: '⛈️', tip: '🚨 Tempestade severa! Procure abrigo imediatamente.' },
}

function resolveWMO(code) {
  return WMO[code] ?? { label: 'Tempo variável', icon: '🌡️', tip: 'Fique atento às condições do tempo.' }
}

/**
 * Busca condições atuais + probabilidade de chuva para as próximas horas
 * @returns {{ temp, windspeed, weathercode, label, icon, tip, rainProb, source }} | null
 */
export async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&hourly=precipitation_probability` +
    `&forecast_days=1` +
    `&timezone=auto`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8_000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()

    const cw   = data.current_weather
    const code = cw?.weathercode ?? 0
    const wmo  = resolveWMO(code)

    // Probabilidade de chuva nas próximas 3 horas
    const nowHour   = new Date().getHours()
    const hourlyIdx = data.hourly?.time?.findIndex((t) => new Date(t).getHours() === nowHour) ?? 0
    const probs     = data.hourly?.precipitation_probability?.slice(hourlyIdx, hourlyIdx + 3) ?? []
    const rainProb  = probs.length ? Math.max(...probs) : 0

    return {
      temp:        Math.round(cw?.temperature ?? 0),
      windspeed:   Math.round(cw?.windspeed   ?? 0),
      weathercode: code,
      label:       wmo.label,
      icon:        wmo.icon,
      tip:         wmo.tip,
      rainProb,
      isRain:      rainProb >= 40 || [51,53,55,61,63,65,80,81,82,95,96,99].includes(code),
      source:      'Open-Meteo / ECMWF',
    }
  } catch {
    clearTimeout(timer)
    return null
  }
}

# 📊 Análise de Perdas e Manejo Específico

## O que foi adicionado?

A versão expandida do sistema agora considera **15 novos parâmetros** que influenciam diretamente na quantidade final a semear e nas perdas esperadas:

---

## 🔴 Perdas Esperadas (Análise Detalhada)

### Fórmula de Perda Total

```
Perda Total = Perda Climática + Perda Pragas + Perda Doenças + Perda Colheita

Quantidade Com Perdas = Quantidade Prevista × (1 - Perda Total %)
Sementes a Comprar = Quantidade Com Perdas × (1 + Factor Reserva)
```

### Exemplo Prático: Milho em Fortaleza

**Cenário 1: Área com histórico BAIXO de pragas**
```
Perda Climática:   5% (precipitação normal)
Perda Pragas:      5% (histórico baixo = reduz base 8% em 37%)
Perda Doenças:     4% (histórico baixo)
Perda Colheita:    3% (padrão)
─────────────────────
Perda Total:      17% ✅ BAIXO RISCO

Quantidade Original:  50.000 kg
Com Perdas:          41.500 kg
Sementes Reserva:    41.500 × 1.17 = 48.555 kg
```

**Cenário 2: Mesma área com histórico ALTO de pragas**
```
Perda Climática:   5%
Perda Pragas:      11% (histórico alto = multiplica base 8% por 1.4)
Perda Doenças:     6% (histórico alto)
Perda Colheita:    3%
─────────────────────
Perda Total:      25% ⚠️ RISCO MODERADO

Quantidade Original:  50.000 kg
Com Perdas:          37.500 kg
Sementes Reserva:    37.500 × 1.25 = 46.875 kg
```

---

## 🌱 Densidade de Plantio e Sementes

### Cálculo de Sementes Necessárias

```
Sementes/ha = (Densidade Recomendada × Peso Semente) / Germinação / Pureza × Area
```

### Exemplos por Cultura

| Cultura | Densidade Ideal | Peso Semente | Sementes/kg | kg/ha | Área 10ha |
|---------|-----------------|-------------|-----------|-------|----------|
| **Milho** | 50.000 plantas | 300mg | 3.333 | 15 | 150 kg |
| **Feijão** | 200.000 sementes | 250mg | 4.000 | 50 | 500 kg |
| **Tomate** | 30.000 plantas | 0.2mg | 5.000.000 | 6 | 60 kg |
| **Melancia** | 4.000 plantas | 80mg | 12.500 | 0.32 | 3.2 kg |
| **Mandioca** | 8.000 plantas | 5g (estaca) | 200 | 40 | 400 unidades |

### Ajustes por Germinação/Pureza

Se a semente tem **germinação 85% e pureza 90%**:

```
Sementes Necessárias = Base × (1/0.85) × (1/0.90)
                     = Base × 1.30
```

**Exemplo Milho:**
- Base: 15 kg/ha
- Ajustado: 15 × 1.30 = **19.5 kg/ha**
- Área 10ha: **195 kg totais**

---

## 🐛 Pragas e Doenças Esperadas

### Por Cultura e Histórico

**MILHO:**
```
Histórico Baixo (pragas_area="baixa"):
  └─ Pragas: lagarta-do-cartucho, broca
  └─ Doenças: ferrugem

Histórico Médio (pragas_area="media"):
  └─ Pragas: lagarta-do-cartucho, broca, cigarrinha
  └─ Doenças: ferrugem, mancha-de-cercospora

Histórico Alto (pragas_area="alta"):
  └─ Pragas: lagarta-do-cartucho, broca, cigarrinha, elasmo
  └─ Doenças: ferrugem, mancha, antracnose, podrão
```

**Período de Pico Esperado:**
```
V4-V8 (lagarta-do-cartucho): 25-50 dias após plantio
R1-R3 (podrão de espiga):     60-90 dias após plantio
```

---

## 💧 Recomendações de Manejo

### Manejo de Água

```json
{
  "manejo_agua_tipo": "chuva | irrigacao_complementar | irrigacao_integral"
}
```

| Tipo | Recomendação |
|------|--------------|
| **Chuva** | Monitorar precipitação; se <50mm/mês, iniciar irrigação |
| **Complementar** | Irrigar quando acumular <40mm em 10 dias |
| **Integral** | Sistema contínuo; ajustar turno conforme ETo |

### Recomendações de Nutrição

Baseado em NPK:

```
Nitrogênio < 20 ppm:
  └─ Aplicar 30-50 kg N/ha em cobertura aos 30 dias

Fósforo < 10 ppm:
  └─ Aplicar 20 kg P2O5/ha no pré-plantio

Potássio < 40 ppm:
  └─ Aplicar 40 kg K2O/ha (melhora resistência)
```

### Recomendações de Solo

```
pH < 5.5 (Ácido):
  └─ Aplicar calcário 1-2 ton/ha (após análise)

pH > 7.5 (Alcalino):
  └─ Reduz disponibilidade de micronutrientes

Compactação Alta:
  └─ Realizar descompactação ou plantio direto

Cobertura Anterior = Pousio:
  └─ Considerar plantio de cobertura (crotalária) antes da próxima safra
```

---

## 📋 Exemplo Completo de Uso

### Requisição com TODOS os parâmetros

```bash
curl -X POST "http://localhost:8000/api/v1/predictions/parecer" \
  -H "Content-Type: application/json" \
  -d '{
    "cultura": "milho",
    "municipio": "Fortaleza",
    "agricultor_id": 1,
    "area_hectares": 10.0,

    "ph": 6.2,
    "nitrogenio_ppm": 35,
    "fosforo_ppm": 18,
    "potassio_ppm": 65,
    "materia_organica": 2.8,

    "variedade_cultura": "IAC V450 Milho",
    "taxa_germinacao_semente": 0.85,
    "pureza_semente": 0.92,

    "manejo_agua_tipo": "irrigacao_complementar",
    "profundidade_lencol_freatico": 140.0,

    "compactacao_solo": "media",
    "cobertura_anterior": "feijao",

    "historico_pragas_area": "media",
    "historico_doencas_area": "media",

    "ultimo_defensivo_dias": 30,
    "risco_tolerance_agricultor": "moderado"
  }'
```

### Resposta Esperada (Extratos Principais)

```json
{
  "analise_perdas": {
    "perda_total_esperada_percent": 19.2,
    "detalhamento": {
      "perda_climatica_percent": 5.0,
      "perda_pragas_percent": 8.8,
      "perda_doencas_percent": 4.4,
      "perda_colheita_percent": 1.0
    },
    "quantidade_esperada_com_perdas_kg": 40.600,
    "recomendacao": "Semear com factor de segurança 1.19x para compensar perdas"
  },

  "plantio_recomendado": {
    "densidade_plantio_plantas_ha": 50000.0,
    "sementes_kg_por_hectare": 19.8,
    "sementes_totais_a_comprar_kg": 235.6,
    "variedade_recomendada": "IAC V450 Milho",
    "taxa_germinacao_esperada": "85%",
    "pureza_semente_esperada": "92%"
  },

  "pragas_doencas_esperadas": {
    "pragas": [
      "lagarta-do-cartucho",
      "broca-dos-colmos",
      "cigarrinha-do-milho"
    ],
    "doencas": [
      "ferrugem-comum",
      "mancha-de-cercospora"
    ],
    "periodo_pico_pressao": "V4-V8 (lagarta) / R1-R3 (podrão)",
    "recomendacoes_defensivos": [
      "Monitorar semanalmente por lagarta-do-cartucho, broca-dos-colmos",
      "Alertar para presença de ferrugem-comum, mancha-de-cercospora...",
      "Iniciar controle preventivo 15 dias antes do pico esperado"
    ]
  },

  "recomendacoes_manejo": {
    "agua": [
      "Irrigar quando precipitação acumular <40mm em 10 dias",
      "Verificar profundidade do lençol em 140.0cm"
    ],
    "nutricao": [
      "N em nível adequado: evitar excessos para não aumentar pragas",
      "Baixo P: aplicar 20 kg P2O5/ha no pré-plantio"
    ],
    "solo": [
      "Compactação média: considerar descompactação",
      "Rotação com feijão anterior: bom para nitrogênio fixado"
    ],
    "colheita": [
      "Colher quando teor de água atingir 45%",
      "Realizar colheita em horário ameno para reduzir danos",
      "Limpar máquinas entre talhões"
    ]
  }
}
```

---

## 🎯 Interpretação Prática

### Quando a Análise Recomenda Maior Densidade?

1. **Taxa de germinação BAIXA** (<70%) → Semear mais para garantir população
2. **Pureza BAIXA** (<85%) → Descartar lote, ou ajustar 30-40% a mais
3. **Histórico de pragas/doencas ALTO** → Aceitar 20-25% de perdas, semear mais
4. **Compactação ALTA** → Emergência prejudicada, aumentar densidade 5-10%

### Quando Reduzir Perdas (Economizar Sementes)?

1. **Taxa germinação 95%+** → Usar densidade padrão (menos sementes)
2. **Pureza 98%+** → Usar densidade padrão
3. **Histórico de pragas BAIXO** → Perda <12%, factor reserva 1.10-1.12
4. **Manejo preventivo ativo** → Defensivos planejados, reduz perdas

### Exemplo de Economia

```
Cenário 1 (Risco Alto):
  Sementes: 235 kg
  Custo R$ 100/kg = R$ 23.500

Cenário 2 (Risco Baixo):
  Sementes: 180 kg
  Custo R$ 100/kg = R$ 18.000

Economia: R$ 5.500 por safra!
```

---

## ✅ Checklist antes de Semear

- [ ] Variedade selecionada com assertividade >90%
- [ ] Sementes compradas com quantidade = **recomendação × 1.15 extra**
- [ ] Germinação/Pureza confirmadas por análise
- [ ] Sistema de irrigação pronto (se necessário)
- [ ] Defensivos para pragas esperadas em estoque
- [ ] Adubo calculado conforme recomendação NPK
- [ ] Solo preparado (compactação, pH dentro do ideal)
- [ ] Data de plantio sincronizada com pico de demanda

---

## 📞 Suporte

Dúvidas sobre:
- **Perdas esperadas**: Contate extensão rural local
- **Variedades**: Consulte manual de cultivo da cultivar
- **Defensivos**: Procure agronomista credenciado
- **Financiamento**: Verificar linhas de crédito rural (PRONAF, ABC)

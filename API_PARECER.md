# 🤖 Farm SX Predictive AI - Endpoint /parecer

## Visão Geral

O endpoint `/parecer` é o **núcleo da análise preditiva AI** que o usuário solicitou. Ele realiza:

1. **Coleta de dados** de 4 fontes simultâneas (CEASA, clima, economia, consumo)
2. **Análise multidimensional** cruzando 24+ variáveis em 6 dimensões
3. **Validação de assertividade** - retorna erro se <90%
4. **Geração de parecer** estruturado com recomendação econômica
5. **Armazenamento** de análises no banco de dados
6. **Comparação** com culturas alternativas por rentabilidade

---

## 🔌 Endpoint Principal

### POST `/api/v1/predictions/parecer`

**Descrição:** Gera parecer AI completo com análise integrada e assertividade validada.

**Parâmetros Query/Body:**

```json
{
  "cultura": "milho",
  "municipio": "Fortaleza",
  "agricultor_id": 1,
  "area_hectares": 10.0,

  "ph": 6.0,
  "nitrogenio_ppm": 30,
  "fosforo_ppm": 15,
  "potassio_ppm": 60,
  "materia_organica": 2.5,

  "variedade_cultura": "IAC V450 Milho",
  "taxa_germinacao_semente": 0.85,
  "pureza_semente": 0.90,

  "manejo_agua_tipo": "chuva",
  "profundidade_lencol_freatico": 150.0,

  "compactacao_solo": "baixa",
  "cobertura_anterior": "pousio",

  "historico_pragas_area": "media",
  "historico_doencas_area": "media",

  "ultimo_defensivo_dias": 0,
  "risco_tolerance_agricultor": "moderado"
}
```

**Exemplo cURL:**

```bash
curl -X POST "http://localhost:8000/api/v1/predictions/parecer?cultura=milho&municipio=Fortaleza&agricultor_id=1&area_hectares=10&ph=6.0&nitrogenio_ppm=30&fosforo_ppm=15&potassio_ppm=60&materia_organica=2.5"
```

### Resposta de Sucesso (200)

```json
{
  "status": "sucesso",
  "data_analise": "2026-03-24T15:30:45.123456",
  "cultura": "milho",
  "municipio": "Fortaleza",
  "area_hectares": 10.0,

  "assertividade_percentual": 92.5,
  "confianca_geral": 91.2,
  "assertividade_validacao": "✅ ANÁLISE CONFIÁVEL",
  "variaveis_criticas": ["precipitacao", "preco_atual"],

  "parecer_executivo": {
    "opiniao": "Milho é ALTAMENTE RECOMENDADO para plantio em Fortaleza nos próximos 60 dias. Previsão de lucro de R$ 15.000 com assertividade 92.5%. Condições climáticas favoráveis e demanda de mercado em alta.",
    "nivel_assertividade": "92%",
    "periodo_validade": "2026-04-23T15:30:45.123456",
    "score_qualidade": 0.93
  },

  "previsoes": {
    "produtividade_estimada_ton_ha": 4.5,
    "quantidade_prevista_kg": 45000.0,
    "preco_previsto_kg": 0.85
  },

  "analise_economica": {
    "receita_total_estimada": 38250.0,
    "custos_totais": 23000.0,
    "lucro_liquido_estimado": 15250.0,
    "margem_percentual": 39.8,
    "roi_percentual": 66.3,
    "ponto_equilibrio_kg": 27059.0,
    "break_even_dias": 45
  },

  "recomendacao_plantio": {
    "data_plantio_recomendada": "2026-04-05",
    "data_colheita_prevista": "2026-07-15",
    "mes_melhor_venda": 7,
    "racional": "Sincronizado com pico de demanda para melhor preço"
  },

  "analise_riscos": {
    "risco_climatico": "baixo",
    "risco_mercado": "medio",
    "risco_economico": "baixo",
    "risco_geral": "baixo"
  },

  "recomendacoes_acao": [
    "Aplicar nitrogênio de cobertura aos 30 dias pós-plantio para maximizar produção",
    "Monitorar previsão de chuvas; se <40mm/mês, iniciar irrigação de suplementação",
    "Buscar financiamento rural com taxa SELIC atual de 10.5%",
    "Sincronizar colheita com picos de demanda em junho-julho para melhor preço"
  ],

  "alertas_ativos": [
    {
      "severidade": "media",
      "mensagem": "Volatilidade de preço em 12% - monitorar CEASA semanalmente",
      "acao_sugerida": "Consultar cotações diárias e considerar contrato forward com cooperativa"
    }
  ],

  "oportunidades_identificadas": [
    {
      "tipo": "financiamento",
      "descricao": "Linha de crédito rural com taxa 8% ao ano",
      "potencial_ganho": 1840.0
    },
    {
      "tipo": "venda",
      "descricao": "Contrato direto com cooperativa garante 15% acima do preço CEASA",
      "potencial_ganho": 5737.5
    }
  ],

  "analise_perdas": {
    "perda_total_esperada_percent": 18.5,
    "detalhamento": {
      "perda_climatica_percent": 5.0,
      "perda_pragas_percent": 8.8,
      "perda_doencas_percent": 3.2,
      "perda_colheita_percent": 1.5
    },
    "quantidade_esperada_com_perdas_kg": 36750.0,
    "recomendacao": "Semear com factor de segurança 1.23x para compensar perdas"
  },

  "plantio_recomendado": {
    "densidade_plantio_plantas_ha": 50000.0,
    "sementes_kg_por_hectare": 23.5,
    "sementes_totais_a_comprar_kg": 235.0,
    "variedade_recomendada": "IAC V450 Milho",
    "taxa_germinacao_esperada": "85%",
    "pureza_semente_esperada": "90%"
  },

  "pragas_doencas_esperadas": {
    "pragas": [
      "lagarta-do-cartucho",
      "broca-dos-colmos",
      "cigarrinha-do-milho"
    ],
    "doencas": [
      "ferrugem-comum",
      "mancha-de-cercospora",
      "antracnose"
    ],
    "periodo_pico_pressao": "V4-V8 (lagarta) / R1-R3 (podrão)",
    "recomendacoes_defensivos": [
      "Monitorar semanalmente por lagarta-do-cartucho, broca-dos-colmos",
      "Alertar para presença de ferrugem-comum, mancha-de-cercospora em período: V4-V8 (lagarta) / R1-R3 (podrão)",
      "Iniciar controle preventivo 15 dias antes do pico esperado"
    ],
    "alerta": "⚠️ Monitorar semanalmente a partir da emergência das plantas"
  },

  "recomendacoes_manejo": {
    "agua": [
      "Monitorar precipitação; se <50mm/mês, iniciar irrigação de compensação",
      "Verificar profundidade do lençol em 150.0cm"
    ],
    "nutricao": [
      "Deficiência de N: aplicar 30-50 kg N/ha em cobertura aos 30 dias",
      "Baixo P: aplicar 20 kg P2O5/ha no pré-plantio"
    ],
    "solo": [
      "Compactação baixa: adequada para plantio",
      "Considerar plantio de cobertura (crotalária) antes da próxima safra"
    ],
    "colheita": [
      "Colher quando teor de água atingir 45%",
      "Realizar colheita em horário ameno (manhã/final de tarde) para reduzir danos",
      "Limpar máquinas entre talhões para evitar transmissão de pragas/doenças"
    ]
  },

  "comparacao_culturas": {
    "cultura_analisada": "milho",
    "lucro_estimado_r$": 15250.0,
    "alternativas_rentaveis": [
      {
        "cultura": "feijão",
        "lucro_estimado": 12000.0,
        "margem": 35.2
      },
      {
        "cultura": "mandioca",
        "lucro_estimado": 18000.0,
        "margem": 42.1
      }
    ]
  }
}
```

### Resposta de Erro (422 - Assertividade Insuficiente)

```json
{
  "detail": {
    "erro": "Assertividade insuficiente",
    "mensagem": "Assertividade insuficiente: 78.0%. Mínimo requerido: 90.0%. Verifique dados de entrada.",
    "recomendacao": "Forneça dados mais completos: análise de solo recente, histórico de clima local, dados de produção anterior",
    "dados_necessarios": {
      "solo": "pH, NPK, matéria orgânica completos",
      "clima": "Previsão de 15+ dias",
      "consumo": "Histórico de 12+ meses",
      "economia": "Indicadores atualizados"
    }
  }
}
```

---

## 📋 Endpoints Auxiliares

### GET `/api/v1/predictions/pareceres/{agricultor_id}`

Lista todos os pareceres gerados para um agricultor.

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/predictions/pareceres/1"
```

**Resposta:**
```json
{
  "agricultor_id": 1,
  "total_pareceres": 3,
  "pareceres": [
    {
      "id": 1,
      "cultura": "milho",
      "municipio": "Fortaleza",
      "area_hectares": 10.0,
      "data_plantio_recomendada": "2026-04-05",
      "data_colheita_prevista": "2026-07-15",
      "produtividade_media": 4.5,
      "lucro_estimado": 15250.0,
      "risco": "baixo",
      "data_analise": "2026-03-24T15:30:45.123456"
    }
  ]
}
```

### GET `/api/v1/predictions/pareceres/{agricultor_id}/{plano_id}`

Obtém detalhes completos de um parecer gerado.

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/predictions/pareceres/1/1"
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│ POST /parecer (cultura, municipio, solo_data, agricultor_id) │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──► CEASA Collector
             │    └─► obter_preco_atual()
             │    └─► obter_tendencia_preco()
             │
             ├──► Climate Collector
             │    └─► obter_previsao_tempo()
             │    └─► obter_indice_secas()
             │    └─► obter_umidade_relativa()
             │
             ├──► Economic Collector
             │    └─► obter_ipca()
             │    └─► obter_selic()
             │    └─► obter_inflacao_alimentos()
             │    └─► obter_desemprego()
             │
             └──► Consumption Collector
                  └─► obter_consumo_historico()
                  └─► previsao_consumo()
                  └─► analisar_sazonalidade()
                  └─► identificar_picos_consumo()
             │
             ▼
     ┌───────────────────────────────────┐
     │ PredictiveAnalysisEngine          │
     │ ├─ VariableSet (24+ variáveis)   │
     │ └─ analisar_plantio()             │
     └───────┬───────────────────────────┘
             │
             ├──► _calcular_assertividade()
             │    └─ Valida >90% ou lança erro
             │
             ├──► _prever_produtividade()
             │    └─ Pesos: clima 30%, solo 40%, economia 20%, demanda 10%
             │
             ├──► _prever_preco()
             │    └─ Pesos: inflação 30%, tendência 40%, demanda 20%, economia 10%
             │
             ├──► _calcular_custo_total()
             │    └─ Ajustado por inflação e SELIC
             │
             ├──► _analisar_risco_*()
             │    └─ Clima, mercado, economia → consolidação
             │
             ├──► _otimizar_timing()
             │    └─ Sincronizar com picos de demanda
             │
             ├──► _gerar_parecer_executivo()
             │    └─ Estrutura: recomendação + opinião + assertividade%
             │
             ├──► _gerar_recomendacoes()
             │    └─ Específicas para o contexto econômico
             │
             └──► _comparar_com_outras_culturas()
                  └─ Ranking por rentabilidade
             │
             ▼
     ┌──────────────────────────┐
     │ PredictiveAnalysis       │
     │ (25+ campos estruturados) │
     └────────┬─────────────────┘
              │
              ├──► Salvar em PlanoBuscaPlantio
              ├──► Criar alertas em Alerta
              │
              ▼
         Resposta JSON estruturada
```

---

## 💡 Dimensões de Análise

### 1. Solo (5 variáveis)
- pH (4.0-8.5)
- Nitrogênio (ppm)
- Fósforo (ppm)
- Potássio (ppm)
- Matéria Orgânica (%)

### 2. Clima (5 variáveis)
- Precipitação (mm/mês)
- Temperatura média (°C)
- Umidade relativa (%)
- Dias sem chuva
- Índice de secas (baixo/médio/alto)

### 3. Mercado (3 variáveis)
- Preço atual (R$/kg)
- Tendência preço (alta/estável/baixa)
- Volatilidade (%)

### 4. Consumo/Demanda (4 variáveis)
- Consumo histórico médio (kg)
- Consumo previsto 6m (kg)
- Sazonalidade média
- Pico demanda mês

### 5. Economia (4 variáveis)
- IPCA (%)
- SELIC (%)
- Inflação alimentos (%)
- Taxa desemprego (%)

### 6. Produção (3 variáveis)
- Produtividade histórica (ton/ha)
- Área plantada (ha)
- Custo produção (R$/ha)

---

## 📊 Exemplo de Uso Completo

```bash
# 1. Gerar análise AI completa
curl -X POST "http://localhost:8000/api/v1/predictions/parecer\
?cultura=milho\
&municipio=Fortaleza\
&agricultor_id=1\
&area_hectares=10\
&ph=6.2\
&nitrogenio_ppm=35\
&fosforo_ppm=18\
&potassio_ppm=65\
&materia_organica=2.8" \
  -H "Authorization: Bearer {token}"

# 2. Listar todos os pareceres do agricultor
curl "http://localhost:8000/api/v1/predictions/pareceres/1" \
  -H "Authorization: Bearer {token}"

# 3. Obter parecer específico com detalhes e alertas
curl "http://localhost:8000/api/v1/predictions/pareceres/1/5" \
  -H "Authorization: Bearer {token}"
```

---

## ✅ Validações Implementadas

1. **Assertividade >90%**: Lança erro 422 se insuficiente
2. **Integridade de dados**: Tratamento de exceções em cada collector
3. **Plausibilidade**: pH 4.0-8.5, Temperatura 15-40°C, SELIC 2-20%
4. **Completude**: Bônus se todos os campos críticos preenchidos
5. **Coerência**: Validação de relações entre variáveis

---

## 🗄️ Persistência

- Análises salvas em `PlanoBuscaPlantio`
- Alertas criados em `Alerta`
- Histórico completo disponível para relatórios
- Período de validade: 30 dias (renovável)

---

## 🚀 Próximos Passos

1. ✅ PredictiveAnalysisEngine criado
2. ✅ Endpoints /parecer, /pareceres, /pareceres/:id criados
3. ⏳ Integração com dashboard para visualizar pareceres
4. ⏳ Agendamento automático de análises periódicas
5. ⏳ Notificações quando assertividade cai ou oportunidades surgem

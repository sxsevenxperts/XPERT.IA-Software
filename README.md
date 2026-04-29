# XPERT.IA — Agente SDR com IA

Agente de vendas automatizado com inteligência artificial para atendimento, qualificação e encaminhamento de leads.

## Produtos

| Produto | Descrição | Repositório |
|---------|-----------|-------------|
| **Agente SDR** | Atendimento automatizado + funil de leads | Este repo |
| **EasyDrive** | App para motoristas de aplicativo | [easydrive](https://github.com/sxsevenxperts/easydrive) |
| **PrevOS** | Sistema previdenciário para advogados | [prevos](https://github.com/sxsevenxperts/prevos) |

## Workflows n8n

| Arquivo | Versão | Descrição |
|---------|--------|-----------|
| `workflow-agente-sdr-v2.json` | v2.0 | Agente SDR base |
| `workflow-agente-sdr-n8n-v2.3.json` | v2.3 | Multi-Agente Dinâmico (versão atual) |

## Como usar

1. Importe o arquivo `.json` no seu n8n
2. Configure as credenciais (WhatsApp, Claude API, CRM)
3. Ative o workflow

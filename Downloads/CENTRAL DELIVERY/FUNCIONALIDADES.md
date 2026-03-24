# 🚚 CENTRAL DELIVERY - Funcionalidades por Perfil

---

## 👨‍💼 1. ADMIN (Administrador)

### Dashboard Principal
- 📊 **Estatísticas em Tempo Real**
  - Empresas Ativas
  - Entregadores Ativos
  - Faturamento Total
  - Próximos Pagamentos

### 🏢 GERENCIAR EMPRESAS
- ✅ **Visualizar** lista de todas as empresas
- ✅ **Adicionar** nova empresa
  - Nome da empresa
  - Email
  - Telefone
  - Data de pagamento
- ✅ **Deletar** empresa
- ✅ **Suspender/Ativar** empresa
- ✅ Ver saldo de cada empresa
- ✅ Ver data de pagamento

### 🛵 GERENCIAR ENTREGADORES
- ✅ **Visualizar** lista de todos os entregadores
- ✅ **Adicionar** novo entregador
  - Nome completo
  - Telefone
  - Email
  - CPF
- ✅ **Deletar** entregador
- ✅ **Suspender/Ativar** entregador
- ✅ Ver número de entregas
- ✅ Ver rating/avaliação

### 💳 FATURAMENTO & PAGAMENTOS
- ✅ **Visualizar** faturamento total
- ✅ **Ver** saldo por empresa
- ✅ **Acompanhar** datas de pagamento
- ✅ **Calcular** percentual de faturamento por empresa
- ✅ **Alertas** de próximos pagamentos
- ✅ **Exportar** relatórios

---

## 🏢 2. COMPANY (Empresa Parceira)

### Dashboard Principal
- 📊 **Estatísticas da Empresa**
  - Pedidos Hoje
  - Pedidos Pendentes
  - Pedidos Em Entrega
  - Pedidos Completos

### 📦 MEUS PEDIDOS
- ✅ **Visualizar** todos os pedidos da empresa
  - Status (Pendente, Em Entrega, Completo)
  - Cliente
  - Endereço
  - Valor
  - Hora do pedido
- ✅ **Criar** novo pedido
- ✅ **Acompanhar** status do pedido em tempo real
- ✅ **Cancelar** pedido (se ainda pendente)
- ✅ **Detalhes** de cada pedido

### 💳 PAGAMENTOS
- ✅ **Ver** saldo da empresa
- ✅ **Acompanhar** histórico de transações
- ✅ **Data** do próximo pagamento
- ✅ **Faturas** do mês

### ⚙️ CONFIGURAÇÕES
- ✅ **Editar** dados da empresa
- ✅ **Alterar** telefone e email
- ✅ **Gerenciar** usuários da empresa
- ✅ **Horário** de funcionamento

---

## 🛵 3. DRIVER (Entregador)

### Dashboard Principal
- 📊 **Estatísticas Pessoais**
  - Saldo Disponível
  - Entregas Hoje
  - Entregas Em Andamento
  - Rating/Avaliação

### 📍 ENTREGAS EM ANDAMENTO
- ✅ **Visualizar** entregas que está fazendo
  - Cliente
  - Endereço
  - Prioridade (Normal/Urgente)
  - Taxa da entrega
- ✅ **Marcar** como entregue
- ✅ **Confirmar** recebimento do cliente
- ✅ **Não Entregue** (com motivo)
- ✅ **Localização** do cliente (mapa)

### 📦 ENTREGAS DISPONÍVEIS
- ✅ **Ver** lista de entregas disponíveis
  - Cliente
  - Endereço
  - Distância
  - Valor da entrega
  - Prioridade
- ✅ **Aceitar** entrega
- ✅ **Recusar** entrega
- ✅ **Filtrar** por:
  - Distância
  - Valor
  - Prioridade

### 💵 MINHA CARTEIRA
- ✅ **Saldo disponível** para saque
- ✅ **Histórico** de ganhos
- ✅ **Solicitar** saque
- ✅ **Forma** de pagamento (PIX, banco)

### ⭐ MEU PERFIL
- ✅ **Rating/Avaliação** (1-5 estrelas)
- ✅ **Total** de entregas realizadas
- ✅ **Taxa** de sucesso
- ✅ **Tempo médio** de entrega
- ✅ **Reclamações** recebidas

---

## 📊 Comparativo de Acesso

| Funcionalidade | Admin | Company | Driver |
|---|---|---|---|
| Gerenciar Empresas | ✅ | ❌ | ❌ |
| Gerenciar Entregadores | ✅ | ❌ | ❌ |
| Faturamento Completo | ✅ | ❌ | ❌ |
| Ver Pedidos | ✅ | ✅ | ❌ |
| Criar Pedidos | ❌ | ✅ | ❌ |
| Aceitar Entregas | ❌ | ❌ | ✅ |
| Ver Meu Saldo | ❌ | ✅ | ✅ |
| Solicitar Saque | ❌ | ❌ | ✅ |

---

## 🔐 Credenciais Demo

```
👨‍💼 ADMIN
Email: aleff@central.com
Senha: 123456
Nome: Carlos Mendonça

🏢 COMPANY
Email: empresa@central.com
Senha: 123456
Nome: Farmácia São Lucas

🛵 DRIVER
Email: driver@central.com
Senha: 123456
Nome: João Silva
```

---

## 🚀 URL da Aplicação

**Local:** http://localhost:5173

**Repositório:** https://github.com/sxsevenxperts/appcentraldeliveryfinal

---

*Desenvolvido com ❤️ pela Seven Xperts*

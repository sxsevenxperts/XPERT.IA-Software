# 🌸 Clínica Jacyara Ponte — Sistema de Agendamentos

Sistema completo de agendamentos para clínica de estética com gestão de procedimentos, clientes, profissionais, pacotes e financeiro.

## 🚀 Início Rápido

### 1. Setup Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá para **SQL Editor**
3. Cole e execute o arquivo **`supabase-setup.sql`**
4. Aguarde a conclusão

### 2. Criar Usuário de Demo

**Email:** `jacyaraponte@gmail.com`
**Senha:** `Jacyara10`

#### Via Dashboard (Recomendado)
1. No Supabase, vá em **Authentication** → **Users**
2. Clique em **Invite user**
3. Email: `jacyaraponte@gmail.com`
4. Password: `Jacyara10`
5. Clique em **Send invite**

O trigger automático criará o perfil na tabela `profiles`.

#### Via SQL (após criar no Dashboard)
```sql
SELECT public.criar_usuario_demo();
```

### 3. Configurar Credenciais no App

Edite `index.html` (linhas ~950):

```javascript
const SUPABASE_URL = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'SUA_ANON_KEY';
```

Encontre essas chaves em:
- Supabase Dashboard → **Settings** → **API**
- Copie `Project URL` e `anon public key`

### 4. Servir Localmente

```bash
# Python
python3 -m http.server 4500

# Node.js
npx http-server -p 4500

# PHP
php -S localhost:4500
```

Acesse: **http://localhost:4500**

## 🎯 Funcionalidades

### 📅 Agenda
- Calendário visual (dia/semana/mês)
- Drag & drop para agendar
- Cores por profissional
- Status: agendado, confirmado, concluído, cancelado, faltou

### 👥 Gestão
- **Clientes:** nome, telefone, WhatsApp, CPF, endereço
- **Profissionais:** especialidade, cor de agenda, bio
- **Procedimentos:** duração, preço, categoria, intervalo recomendado

### 📦 Pacotes
- Criar pacotes customizados
- Rastrear uso de sessões
- Alertas quando faltam ≤2 sessões
- Barra de progresso visual

### 💰 Financeiro
- Gráfico de receita (últimos 30 dias)
- Registrar pagamentos (Pix, dinheiro, cartão, transferência)
- Status: pago/pendente
- Resumo por forma de pagamento

### 📱 WhatsApp (Evolution API)
- Lembretes 24h antes do agendamento
- Alertas de pacote quase acabando
- Templates customizáveis
- Envio manual ou automático

### ⚙️ Configurações
- Dados da clínica
- Horários de funcionamento
- Credenciais Evolution API
- Templates de mensagens WhatsApp

## 📊 Banco de Dados

### Tabelas Principais
- `profiles` — usuários (id, nome, role, email)
- `clientes` — clientes da clínica
- `profissionais` — profissionais/esteticistas
- `procedimentos` — serviços oferecidos
- `agendamentos` — agendamentos (cliente, profissional, data/hora, status)
- `pacotes_cliente` — pacotes de sessões
- `pagamentos` — registro de pagamentos

### Segurança
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Políticas de acesso por role
- ✅ Triggers automáticos

### Views
- `v_agendamentos` — agendamentos com dados completos
- `v_financeiro_mensal` — resumo de receita por mês

## 🔧 Configurar WhatsApp

1. Abra o app e vá em **⚙️ Configurações**
2. Seção **📱 WhatsApp (Evolution API)**
3. Preencha:
   - **URL da API:** http://seu-evolution-api.com
   - **API Key:** sua-chave-api
   - **Nome da Instância:** seu-numero-whatsapp
4. Clique em **🧪 Testar Envio** para validar

## 📱 Roles de Acesso

- **admin** — acesso total (criar clientes, profissionais, ver financeiro)
- **profissional** — ver seus agendamentos
- **recepcionista** — gerenciar agendamentos e clientes

## 🌐 Deploy

### Vercel / Netlify / GitHub Pages
```bash
# 1. Faça um fork do repositório
# 2. Conecte ao Vercel/Netlify
# 3. Configure variáveis de ambiente:
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

### Auto-Hospedagem
- Copie os arquivos para seu servidor
- Configure CORS no Supabase
- Use um reverse proxy (Nginx) se necessário

## 📚 Arquivos

- **index.html** — App web completo (88KB)
- **supabase-setup.sql** — Schema e dados iniciais (12KB)
- **README.md** — Este arquivo

## 🚧 Melhorias Futuras

- [ ] Relatórios em PDF
- [ ] Integração Google Calendar
- [ ] SMS automático como backup
- [ ] Dashboard analytics avançado
- [ ] App mobile nativa (React Native)
- [ ] Integração Hotmart para venda de pacotes

## 📞 Suporte

- Documentação: [supabase.com/docs](https://supabase.com/docs)
- Evolution API: [evolution-api.com](https://evolution-api.com)
- FullCalendar: [fullcalendar.io](https://fullcalendar.io)

---

🌸 **Clínica Jacyara Ponte — Sistema de Agendamentos**
Desenvolvido com ❤️ em 2026

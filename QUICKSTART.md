# ⚡ Quick Start — 5 Minutos

## Passo 1: Setup Supabase (2 min)

1. Entre em https://supabase.com → crie um projeto
2. Copie: **Project URL** e **anon public key** (Settings → API)
3. Abra **SQL Editor** → cole tudo de `supabase-setup.sql` → Execute

Pronto! ✅

## Passo 2: Criar Seu Usuário (1 min)

1. No Supabase: **Authentication** → **Users** → **Invite user**
2. Email: `jacyaraponte@gmail.com`
3. Senha: `Jacyara10`
4. **Send invite**

Pronto! ✅

## Passo 3: Configurar o App (1 min)

1. Abra `index.html` em editor de texto
2. Procure (Ctrl+F): `const SUPABASE_URL =`
3. Substitua:
   ```javascript
   const SUPABASE_URL = 'https://SEU_PROJECT_ID.supabase.co';
   const SUPABASE_ANON = 'SUA_ANON_KEY';
   ```
4. Salve

Pronto! ✅

## Passo 4: Abrir no Navegador (1 min)

```bash
# Opção A: Python (mais fácil)
python3 -m http.server 4500

# Opção B: Node.js
npx http-server -p 4500

# Opção C: Abrir direto no navegador
# Clique com botão direito em index.html → Abrir com navegador
```

Acesse: **http://localhost:4500**

## Login

**Email:** `jacyaraponte@gmail.com`
**Senha:** `Jacyara10`

---

## 🎉 Pronto!

Você tem um sistema de agendamentos funcional!

### Próximos passos:
1. Abra **⚙️ Configurações** → preencha dados da clínica
2. Crie **👤 Clientes** e **💆 Profissionais**
3. Cadastre **✨ Procedimentos**
4. Comece a agendar! 📅

---

## 📱 WhatsApp (opcional)

Se quiser lembretes automáticos via WhatsApp:
1. Configure Evolution API em **⚙️ Configurações**
2. Ativa em **🔔 Lembretes WhatsApp Automáticos**

---

Dúvidas? Veja `README.md` para documentação completa.

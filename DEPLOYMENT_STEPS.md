# Smart Market - Deployment Steps

Complete estes passos para fazer o deploy completo da integração Hotmart.

## Pré-requisitos

- ✅ Supabase CLI instalado: `npm install -g supabase`
- ✅ Credenciais Supabase (Access Token)
- ✅ Conta Hotmart com acesso a Webhooks

---

## Passo 1: Autenticar no Supabase CLI

```bash
supabase login
```

Será solicitado seu **Access Token** do Supabase. Você pode gerar um em:
- https://app.supabase.com/account/tokens

---

## Passo 2: Ligar ao Projeto Supabase

```bash
cd /Users/sergioponte/.claude/worktrees/quizzical-heyrovsky

# Link com seu projeto
supabase link --project-ref [seu-project-ref]
```

Você pode encontrar `project-ref` em:
- https://app.supabase.com/project/[project-ref]/settings/general

---

## Passo 3: Deploy das Migrations

```bash
# Aplicar migrations ao banco de dados
supabase db push
```

Isto vai executar:
- `add_hotmart_loja_fields.sql` - Adiciona campos de autenticação e assinatura
- Cria tabela `pagamentos`
- Cria índices para performance

---

## Passo 4: Deploy da Edge Function

```bash
# Deploy do webhook handler Hotmart
supabase functions deploy payment-hotmart
```

Após sucesso, você receberá a URL:
```
✓ Function payment-hotmart deployed successfully
  URL: https://[project-ref].supabase.co/functions/v1/payment-hotmart
```

Salve esta URL! 📌

---

## Passo 5: Configurar Webhook no Hotmart

1. Acesse: https://app.hotmart.com (Configurações)
2. Vá em: **Configurações** → **Webhooks**
3. Clique em: **Novo Webhook**
4. Preencha:
   - **URL:** `https://[project-ref].supabase.co/functions/v1/payment-hotmart`
   - **Eventos:** (marque todas)
     - ✅ PURCHASE_APPROVED
     - ✅ PURCHASE_CANCELED
     - ✅ PURCHASE_REFUNDED
5. Clique em: **Salvar**

### Testar o Webhook

No dashboard do webhook, clique em **Testar** para enviar uma requisição de teste.

Você deve ver:
```json
{
  "success": true,
  "message": "Loja created/updated successfully"
}
```

---

## Passo 6: Verificar Environment Variables

A edge function precisa de acesso a:
- `SUPABASE_URL` ✅ (automático)
- `SUPABASE_ANON_KEY` ✅ (automático)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (automático)

Todos são injetados automaticamente pelo Supabase. Sem necessidade de configuração manual.

---

## Passo 7: Testar Fluxo Completo

### Teste 1: Login com credenciais criadas manualmente

```sql
-- No SQL Editor do Supabase, execute:
INSERT INTO lojas (
  login_usuario,
  senha_usuario,
  nome_usuario,
  plano,
  data_expiracao,
  ativo
) VALUES (
  'teste@example.com',
  '12345678901',
  'Loja Teste',
  'premium',
  NOW() + INTERVAL '30 days',
  true
);
```

Depois login em: `LoginLoja`
- Email: `teste@example.com`
- Senha: `12345678901`

### Teste 2: Compra real no Hotmart

1. Faça uma compra pequena (ou use compra de teste do Hotmart)
2. Webhook deve disparar automaticamente
3. Verificar se usuário foi criado em `auth.users`
4. Verificar se loja foi criada em `lojas` table
5. Fazer login com email + CPF usado na compra

---

## Verificar se Funcionou

### Logs da Edge Function

```bash
supabase functions download payment-hotmart
tail -f payment-hotmart.log
```

Ou via Dashboard:
- https://app.supabase.com/project/[project-ref]/functions

### Database

Verifique se as tabelas existem:
```sql
SELECT * FROM lojas;
SELECT * FROM pagamentos;
```

### Auth Users

Verifique se os usuários foram criados:
- https://app.supabase.com/project/[project-ref]/auth/users

---

## Troubleshooting

### ❌ "Function not deployed"
```bash
# Re-deploy
supabase functions deploy payment-hotmart --no-verify-jwt
```

### ❌ "Migration failed"
```bash
# Ver status
supabase db pull

# Tentar novamente
supabase db push
```

### ❌ "Webhook not triggering"
- Verificar URL do webhook está correta
- Clicar em "Último evento" no Hotmart para ver erro
- Verificar logs da function no Supabase dashboard

### ❌ "User not created in Auth"
- Webhook pode estar falhando silenciosamente
- Verificar logs da function
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está disponível

---

## Próximos Passos

Após tudo estar funcionando:

1. ✅ Testar com compra real no Hotmart
2. ✅ Verificar email de confirmação
3. ✅ Testar login com email + CPF
4. ✅ Testar mudança de senha
5. ✅ Monitorar logs por 24h

---

## Checklist Final

- [ ] Supabase CLI instalado
- [ ] `supabase login` executado
- [ ] `supabase link` configurado
- [ ] `supabase db push` executado com sucesso
- [ ] `supabase functions deploy payment-hotmart` executado
- [ ] Webhook URL configurado no Hotmart
- [ ] Webhook testado com sucesso
- [ ] Login manual testado
- [ ] Compra teste completada
- [ ] Usuário criado em Auth
- [ ] Loja criada em Database

Quando tudo estiver marcado ✅, seu sistema está 100% pronto para produção! 🎉

---

## Support

Para problemas:
1. Verificar logs: `supabase functions download payment-hotmart`
2. Ver erros do Hotmart: Dashboard Webhooks → Último evento
3. Consultar documentação: `HOTMART_WEBHOOK_SETUP.md`

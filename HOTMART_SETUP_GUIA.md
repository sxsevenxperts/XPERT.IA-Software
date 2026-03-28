# 🔗 Guia de Setup - Hotmart + Smart Market

## 1. Criar Produtos no Hotmart

### Produto 1: PREMIUM MENSAL

**Básico:**
- Nome: `Smart Market Premium - Mensal`
- Preço: `R$ 799,90`
- Tipo: `Assinatura (Recorrente)`
- Recorrência: `Mensal`

**Descrição:**
Copiar de `HOTMART_DESCRICAO_PRODUTO.md` (seção "Descrição Longa")

**Imagem:**
Usar logo Smart Market ou screenshot do dashboard

**Acesso:**
- Tipo de entrega: `URL de Redirecionamento`
- URL: `https://diversos-smartmarket.yuhqmc.easypanel.host`

---

### Produto 2: PREMIUM ANUAL

**Básico:**
- Nome: `Smart Market Premium - Anual (12x)`
- Preço: `R$ 699,00`
- Tipo: `Assinatura (Recorrente)`
- Recorrência: `Mensal (12 vezes)`

**Descrição:**
Mesma da Mensal + adicionar:
```
🎁 BÔNUS ANUAL:
✅ Economize R$ 1.210,80 (12,6% desconto)
✅ Consultor BI + 20h de consultoria
✅ Setup gratuito de integração PDV
✅ Treinamento expandido (até 10 pessoas)
```

**Acesso:**
- Tipo de entrega: `URL de Redirecionamento`
- URL: `https://diversos-smartmarket.yuhqmc.easypanel.host`

---

## 2. Obter IDs dos Produtos

Após criar na Hotmart, você receberá:
- **ID do Produto Mensal:** `XXXXX` (procure em "Produtos" → "Editar")
- **ID do Produto Anual:** `XXXXX`

Os links de checkout serão:
```
Mensal: https://pay.hotmart.com/XXXXX
Anual:  https://pay.hotmart.com/XXXXX
```

---

## 3. Configurar no Smart Market

### Passo 1: Atualizar Billing.jsx

Após obter os IDs, atualize em `src/pages/Billing.jsx`:

```javascript
const HOTMART_CHECKOUT_MONTHLY = 'https://pay.hotmart.com/SEU_ID_MENSAL'
const HOTMART_CHECKOUT_ANNUAL = 'https://pay.hotmart.com/SEU_ID_ANUAL'
```

### Passo 2: Commit e Push

```bash
git add src/pages/Billing.jsx
git commit -m "config: add Hotmart checkout links for PREMIUM plans"
git push origin claude/quizzical-heyrovsky:main
```

EasyPanel fará deploy automático em ~30 segundos.

---

## 4. Testar no Hotmart

1. Acesse o Hotmart como visitante (não logado)
2. Procure por "Smart Market Premium"
3. Clique em "Comprar"
4. Verifique que os valores estão corretos:
   - Mensal: R$ 799,90
   - Anual: 12 × R$ 699,00 = R$ 8.388,00

---

## 5. Integrar Webhook Hotmart (Opcional mas Recomendado)

Para sincronizar pagamentos com o banco de dados:

### No Hotmart:
1. Configurações → Webhooks
2. Adicionar URL: `https://diversos-smartmarket.yuhqmc.easypanel.host/webhook/hotmart`
3. Selecionar eventos:
   - `purchase.approved` (cliente pagou)
   - `purchase.canceled` (cliente cancelou)
   - `purchase.refunded` (reembolso)

### No Smart Market:
O webhook será processado automaticamente (já está configurado em Edge Functions).

---

## 6. Testar Fluxo Completo

✅ Usuário clica "Renovar" no Billing
✅ Abre Hotmart (PREMIUM Mensal ou PREMIUM Anual)
✅ Realiza pagamento
✅ Hotmart envia webhook
✅ Smart Market atualiza `subscriptions` table
✅ Usuário vê "Assinatura Ativa"

---

## 7. Configurações Recomendadas no Hotmart

**Taxa de Hotmart:**
- Hotmart cobra ~10-13% de taxa
- Smart Market margem: 94% (amplo)
- Recomendado manter

**Suporte:**
- Email suporte na Hotmart apontando para: `support@sevenxperts.com.br`
- Chat via WhatsApp: `Seu número de WhatsApp`

**Formulário de Checkout:**
Personalizar com:
- Logo Smart Market
- Cores Seven Xperts (verde/escuro)
- Mensagem: "Análise IA 24/7 + Consultor BI Dedicado"

---

## 📋 Checklist

- [ ] Produto PREMIUM Mensal criado no Hotmart
- [ ] Produto PREMIUM Anual criado no Hotmart
- [ ] IDs dos produtos obtidos
- [ ] Billing.jsx atualizado com links
- [ ] Commit feito e pushed
- [ ] Deploy verificado
- [ ] Teste de fluxo realizado
- [ ] Webhook Hotmart configurado (opcional)

---

## 💬 Próximos Passos

1. Você cria os produtos no Hotmart
2. Me envia os IDs
3. Eu atualizo o Billing.jsx
4. Deploy automático
5. Pronto para receber pagamentos! 💰

---

**Dúvidas sobre Hotmart?**
Acesse: https://hotmart.com/pt-BR/ajuda/

**Dúvidas sobre Smart Market?**
Contato: `support@sevenxperts.com.br`

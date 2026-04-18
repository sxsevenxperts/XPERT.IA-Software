# ⚙️ Setup para Deploy Automático no EasyPanel

## 📋 Pré-requisito

Para que o deploy automático funcione, você precisa configurar a integração entre GitHub e EasyPanel.

### Passo 1: Acesse seu Painel EasyPanel

```bash
# A URL do seu painel EasyPanel deve ser algo como:
https://[seu-servidor].com/easypanel
# ou
https://[seu-ip]/easypanel
# ou através do seu dashboard hospedado
```

**Você precisa fornecer essa URL para eu continuar com o deploy.**

---

## 🔧 Se já tem EasyPanel configurado:

### Opção A: Deploy via Webhook do GitHub (AUTOMÁTICO)

1. No painel EasyPanel, procure por **"Webhooks"** ou **"GitHub Integration"**
2. Copie o webhook URL fornecido pelo EasyPanel
3. No GitHub, acesse:
   - Repositório: `sxsevenxperts/XPERT.IA-Software`
   - Settings → Webhooks → Add webhook
   - Cale a URL do webhook do EasyPanel
   - Selecione eventos: `push`
   - Ative o webhook

4. **Pronto!** Próximos pushes acionarão deploy automaticamente

### Opção B: Deploy Manual via EasyPanel CLI

```bash
# Se tem EasyPanel CLI instalado:
easypanel login
easypanel deploy easydrive --branch main
```

### Opção C: Deploy Manual via Painel Web

1. Acesse seu painel EasyPanel
2. Selecione aplicação: **EasyDrive**
3. Clique em **"Deploy"** ou **"Redeploy"**
4. Selecione commit: `b2ac923` (ou latest)
5. Clique **"Deploy"**

---

## 📍 Instruções Específicas Solicitadas

**Por favor, forneça:**

```
1. URL do seu painel EasyPanel:    [ ]
2. Nome da aplicação no EasyPanel:  [easydrive ou outro?]
3. Branch conectado:                [main]
4. Método preferido:                [automático/manual/CLI]
```

---

## ✅ Deploy já está pronto

- ✅ Código atualizado no GitHub
- ✅ Build testado e validado
- ✅ Commit `b2ac923` aguardando deploy
- ⏳ Aguardando configuração EasyPanel

**Próximo passo**: Você fornecer URL/credenciais EasyPanel para eu acionar o deploy.


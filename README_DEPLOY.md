# 🚀 Guia Completo de Deploy - EasyPanel

## 📋 Índice
1. [Deploy Local (Teste)](#deploy-local-teste)
2. [Deploy no EasyPanel (Produção)](#deploy-no-easypanel-produção)
3. [Troubleshooting](#troubleshooting)

---

## Deploy Local (Teste)

Antes de fazer deploy no EasyPanel, teste localmente:

```bash
# 1. Clone o repositório
git clone https://github.com/sxsevenxperts/appjacyaramobile.git
cd appjacyaramobile

# 2. Configure .env (copiar do .env.example)
cp .env.example .env

# 3. Execute o script de deploy
bash deploy.sh
```

**Acesse:** http://localhost

---

## Deploy no EasyPanel (Produção)

### Passo 1: Acesse o EasyPanel

1. Vá em: https://app.easypanel.io
2. Faça login com sua conta
3. Clique em **Applications** no menu lateral

### Passo 2: Criar Nova Aplicação

1. Clique em **New Application**
2. Selecione **Docker**
3. Cole o URL do repositório:
   ```
   https://github.com/sxsevenxperts/appjacyaramobile.git
   ```
4. Clique em **Next**

### Passo 3: Configurar Build

Na seção **Build Configuration:**

- **Dockerfile path:** `./Dockerfile`
- **Build context:** `.`
- **Port:** `80`
- **Build type:** Docker

Clique em **Next**

### Passo 4: Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione exatamente estas variáveis:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://gzkwtiihltahvnmtrgfv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a3d0aWlobHRhaHZubXRyZ2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTIyOTksImV4cCI6MjA4OTc4ODI5OX0.qvaoTJbOSV-6jQ-PwDxunqdt-blScWt7tPEPqiLKVZY` |
| `VITE_SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a3d0aWlobHRhaHZubXRyZ2Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxMjI5OSwiZXhwIjoyMDg5Nzg4Mjk5fQ.k-42YmwH07MH0DHndHEYQASkElzSJGvZF29nqnHHmAs` |

> **Importante:** Copie EXATAMENTE conforme acima, sem espaços extras.

### Passo 5: Configurar Network

Na seção **Network:**

- **Internal Port:** `80`
- **External Port:** `80` (HTTP)
- **Health check path:** `/`

### Passo 6: Deploy

1. Clique em **Create Application**
2. Aguarde enquanto a imagem Docker é buildada e deployada
3. O deploy pode levar 3-5 minutos

---

## ✅ Verificar Deploy

### 1. Via EasyPanel Dashboard

No dashboard do EasyPanel, você verá:
- **Status:** deve estar em verde ("Running")
- **Health:** deve estar passando
- **Logs:** deve mostrar aplicação rodando

### 2. Via Terminal

```bash
# Ver logs
docker logs clinica-jacyara-app

# Verificar saúde
curl http://localhost/

# Ver containers rodando
docker ps | grep clinica
```

### 3. Acessar a Aplicação

- **Local:** http://localhost
- **EasyPanel:** https://[seu-dominio].easypanel.io
- **Custom Domain:** https://seu-dominio.com (se configurado)

---

## 🔐 SSL/HTTPS (Opcional)

1. No EasyPanel, vá em **Application → Settings**
2. Procure por **SSL/HTTPS** ou **Certificate**
3. Clique em **Enable** ou **Auto (Let's Encrypt)**
4. Salve as alterações

A configuração de SSL leva ~5 minutos.

---

## 📱 Configurar Domínio Customizado (Opcional)

### 1. No seu provedor de DNS

Crie um registro CNAME apontando para:
```
seu-dominio.com CNAME seu-easypanel-domain.com
```

### 2. No EasyPanel

1. Vá em **Application → Settings → Domains**
2. Clique em **Add Domain**
3. Digite seu domínio: `seu-dominio.com`
4. Clique em **Add**
5. Aguarde confirmação (pode levar alguns minutos)

---

## 🐛 Troubleshooting

### ❌ Build falhou com erro de dependências

**Solução:**
```bash
# Limpar e rebuildar
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### ❌ App roda mas retorna erro 502

**Solução:**
1. Verifique se as variáveis de ambiente estão corretas
2. Ver logs: `docker logs clinica-jacyara-app`
3. Reiniciar container: `docker restart clinica-jacyara-app`

### ❌ Health check falhando

**Solução:**
```bash
# Aguardar mais tempo (app está compilando)
sleep 30

# Checar saúde novamente
curl -v http://localhost/
```

### ❌ Porta 80 já em uso

**Solução:**
```bash
# Parar container anterior
docker-compose down

# Liberar porta
lsof -i :80
kill -9 <PID>

# Reiniciar
docker-compose up -d
```

### ❌ Erro de autenticação Supabase

**Solução:**
1. Verifique se as chaves de API estão corretas no `.env`
2. Confira se não há espaços em branco nas chaves
3. Teste localmente antes de fazer push

---

## 📚 Recursos Adicionais

- **Documentação EasyPanel:** https://easypanel.io/docs
- **Documentação Supabase:** https://supabase.com/docs
- **Docker Compose:** https://docs.docker.com/compose
- **Nginx:** https://nginx.org/en/docs

---

## ✨ Próximos Passos Após Deploy

1. ✅ Testar a aplicação em produção
2. ✅ Configurar SSL/HTTPS
3. ✅ Configurar domínio customizado
4. ✅ Monitorar logs e performance
5. ✅ Configurar backups automáticos (EasyPanel → Application → Backups)
6. ✅ Implementar CI/CD com GitHub Actions (opcional)

---

**App pronto para produção! 🎉**

Desenvolvido com ❤️ para Clínica Estética Jacyara Ponte

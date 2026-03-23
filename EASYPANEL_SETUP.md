# 🚀 Deploy no EasyPanel - Clínica Estética Jacyara Ponte

## ✅ Quick Start

1. **Clone o repositório no EasyPanel:**
```bash
git clone https://github.com/sxsevenxperts/appjacyaramobile.git
cd appjacyaramobile
```

2. **Configure as variáveis de ambiente:**
   - Crie arquivo `.env` baseado em `.env.example`
   - Atualize as credenciais Supabase se necessário

3. **Deploy via Docker:**
```bash
docker-compose up -d
```

4. **Acesse:**
   - URL: `http://seu-dominio` ou `https://seu-dominio`
   - Health check: `http://seu-dominio/`

---

## 📋 Configuração do EasyPanel

### 1. Criar Aplicação

1. Vá em **Applications** → **New Application**
2. Selecione **Docker**
3. Cole o repositório:
   ```
   https://github.com/sxsevenxperts/appjacyaramobile.git
   ```

### 2. Configurar Build

- **Dockerfile path:** `./Dockerfile`
- **Build context:** `.`
- **Port:** `80`

### 3. Variáveis de Ambiente

Clique em **Environment Variables** e adicione:

```
VITE_SUPABASE_URL=https://gzkwtiihltahvnmtrgfv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a3d0aWlobHRhaHZubXRyZ2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTIyOTksImV4cCI6MjA4OTc4ODI5OX0.qvaoTJbOSV-6jQ-PwDxunqdt-blScWt7tPEPqiLKVZY
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a3d0aWlobHRhaHZubXRyZ2Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxMjI5OSwiZXhwIjoyMDg5Nzg4Mjk5fQ.k-42YmwH07MH0DHndHEYQASkElzSJGvZF29nqnHHmAs
```

### 4. Network

- **Internal Port:** `80`
- **External Port:** `80` (ou `443` com SSL)
- **Health check:** `GET /`

---

## 🔄 Deploy Automático

### Via GitHub Actions

1. Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EasyPanel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.EASYPANEL_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "action": "redeploy",
              "applicationId": "${{ secrets.EASYPANEL_APP_ID }}"
            }' \
            https://api.easypanel.io/v1/applications/redeploy
```

2. Configure secrets no GitHub:
   - `EASYPANEL_TOKEN` - Token de autenticação do EasyPanel
   - `EASYPANEL_APP_ID` - ID da aplicação no EasyPanel

---

## 📊 Monitoramento

### Logs

```bash
docker logs clinica-jacyara-app -f
```

### Saúde

```bash
curl http://localhost/
```

### Métricas

EasyPanel fornece:
- CPU usage
- Memory usage
- Network I/O
- Container status

---

## 🔐 SSL/HTTPS

1. **Ativar HTTPS:**
   - EasyPanel → Application → Settings
   - Toggle: **Enable SSL/HTTPS**

2. **Certificado:**
   - Auto: Let's Encrypt (recomendado)
   - Manual: Upload seu certificado

---

## 📱 Domínio Customizado

1. **Aponte seu domínio:**
   ```
   CNAME → seu-easypanel-domain.com
   ```

2. **Configure no EasyPanel:**
   - Application → Settings → Domains
   - Adicione seu domínio

---

## 🐛 Troubleshooting

### App não inicia

```bash
# Ver logs
docker logs clinica-jacyara-app

# Verificar saúde
curl http://localhost/

# Reiniciar
docker-compose restart app
```

### Porta em uso

```bash
docker-compose down
docker-compose up -d
```

### Build falhando

Verifique se as variáveis de ambiente estão corretas:
```bash
env | grep VITE_
```

---

## 📈 Performance Tips

1. **Cache:** Nginx serve arquivos com cache headers
2. **Compression:** Gzip habilitado no nginx
3. **CDN:** Usar CDN para assets estáticos
4. **Replicas:** Escalar para múltiplas instâncias se necessário

---

## 🚀 URLs

| Ambiente | URL |
|----------|-----|
| Development | `http://localhost` |
| EasyPanel | `https://seu-dominio.easypanel.io` |
| Custom Domain | `https://seu-dominio.com` |
| GitHub | `https://github.com/sxsevenxperts/appjacyaramobile` |

---

## ✨ Próximos Passos

1. Configurar domínio customizado
2. Ativar SSL/HTTPS
3. Configurar backups automáticos
4. Monitorar logs e performance
5. Implementar CI/CD com GitHub Actions

---

**App pronto para produção! 🎉**

Desenvolvido com ❤️ para Clínica Estética Jacyara Ponte

# 🚀 Deploy da EasyDrive

## Build & Deploy Rápido

```bash
# 1. Build
npm run build

# 2. Copiar para servidor (ajuste o caminho)
# Opção A: Servidor local
cp -r dist/* /var/www/easydrive/

# Opção B: Servidor remoto
scp -r dist/* user@server.com:/var/www/easydrive/

# 3. Restart servidor (se usar PM2)
pm2 restart easydrive

# 4. Restart nginx/apache
sudo systemctl restart nginx  # ou apache2
```

## Cache do Browser

Se não vê mudanças, limpe o cache:

**Chrome/Edge/Firefox:**
- `Ctrl + Shift + Delete` → Limpar dados de navegação
- Ou: `Ctrl + F5` (hard refresh)

**Safari:**
- `Cmd + Option + E` → Esvaziar cache
- Ou: `Cmd + Shift + R` (force reload)

## Novas Features Implementadas

✅ **GPS em Tempo Real**
- Atualiza ~2-3 vezes por segundo
- watchPosition + fallback 1Hz
- Marker "Você" sincroniza com posição atual

✅ **Alerta de Fadiga**
- Notifica após 6h+ de direção
- Uma notificação por dia
- Configurável em Configurações

✅ **Compartilhar Viagem ao Vivo**
- Botão verde "📍 Compartilhar Viagem ao Vivo"
- Gera link Google Maps com GPS atual
- Integração WhatsApp opcional

✅ **Postos de Gasolina Próximos**
- Botão laranja "🛢️ Postos Próximos"
- Busca até 50km
- Ordenado por distância
- Link direto para Google Maps

✅ **Rotas Inteligentes**
- Prioriza segurança em áreas perigosas
- Label "🛡️ Mais Segura" em zonas de risco
- Evita tráfego automaticamente

## Commits Feitos

```
e580e89 fix: prioritize location updates with zero throttling
9151c7c fix: maximize GPS update frequency for real-time tracking
91751ce feat: add nearby gas stations finder with map navigation
23c0a7d feat: add live trip sharing with real-time location via WhatsApp
6aa0553 feat: add fatigue alert tracking for driver safety
da00376 fix: optimize GPS tracking and route re-ranking for safety
```

## Verificação Pós-Deploy

1. **GPS Atualiza em Tempo Real?**
   - Marker "Você" deve se mover suavemente enquanto se move
   - Deve atualizar a cada 1-2 segundos

2. **Funciona Compartilhamento?**
   - Clique botão "Compartilhar Viagem ao Vivo"
   - Modal deve aparecer
   - Link deve copiar para clipboard

3. **Postos Aparecem?**
   - Clique "Postos Próximos" durante viagem
   - Modal com lista deve aparecer
   - Deve mostrar distância em km

4. **Alerta de Fadiga?**
   - Dirija por 6+ horas
   - Deve receber notificação
   - Verificar "Configurações" → Alerta de Fadiga

---

**Dúvidas?** Verifique se o build está no local correto e se o servidor está servindo os novos arquivos.

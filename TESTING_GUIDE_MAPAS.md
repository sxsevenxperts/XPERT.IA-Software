# 🧪 Guia Completo de Testes - Mapas Inteligentes

**Status**: Build ✅ | Dev Server ✅ | Pronto para Testes

---

## 📋 Pré-Requisitos

- ✅ Projeto rodando em http://localhost:5173
- ✅ Supabase conectado e autenticado
- ✅ GPS ativado no dispositivo/browser
- ✅ Permissões de localização concedidas ao navegador

---

## 🧪 Teste 1: Build sem Erros

### Executado ✅
```bash
npm run build
```

**Resultado**: Build bem-sucedido em 2.58s
- ✅ MapaRotaInteligente.jsx compilado
- ✅ geocoding.js compilado  
- ✅ react-leaflet integrado
- ✅ Dist gerado sem erros críticos

---

## 🧪 Teste 2: Dev Server Rodando

### Status ✅
```bash
npm run dev
```

**Verificação**:
- ✅ Servidor Vite ouvindo porta 5173
- ✅ Sem erros de módulo
- ✅ HMR funcionando

**Para verificar**: Abrir http://localhost:5173 no navegador

---

## 🧪 Teste 3: Iniciar Corrida com GPS Real

### Passos

1. **Ir para Dashboard → Iniciar Corrida**
2. **Preencher:**
   - Plataforma: Uber
   - Origem: Avenida Paulista, São Paulo
   - Destino: Shopping Center Norte, São Paulo
3. **Clicar "Iniciar Corrida"**
4. **Verificar:**
   - [ ] Mapa renderiza
   - [ ] Marcador azul aparece (sua posição)
   - [ ] Linha tracejada mostra rota
   - [ ] Distância e tempo aparecem
   - [ ] Sem erros vermelhos no console

---

## 🧪 Teste 4: GPS em Tempo Real

**Esperado:**
- GPS atualiza a cada 5-10 segundos
- Marcador azul se move no mapa
- Precisão mostrada em metros

**Para verificar** (DevTools → Console):
```javascript
// Procurar por mensagens GPS
// Deve atualizar a cada 5s
```

---

## 🧪 Teste 5: Validação de Contramão

**Esperado:**
- [ ] Aviso amarelo para contramão: `⚠️ CONTRAMÃO: [Rua]`
- [ ] Ou aviso azul para sentido único
- [ ] Ou sucesso verde se nenhuma contramão
- [ ] Avisos aparecem antes de navegar

---

## 🧪 Teste 6: History com Maps Expansível

### Passos

1. **Ir para Dashboard → Histórico**
2. **Encontrar corrida anterior**
3. **Clicar "🗺️ Ver rota"**

**Esperado:**
- [ ] Botão muda para "Ocultar"
- [ ] Mapa aparece com rota histórica
- [ ] Distância e tempo exibidos
- [ ] Pode levar 1-3s (geocoding sob demanda)

---

## 🧪 Teste 7: Deep Links

### Waze
- [ ] Botão abre Waze com destino correto
- [ ] URL: `https://waze.com/ul?navigate=yes&ll=...`

### Google Maps  
- [ ] Botão abre Google Maps
- [ ] Rota origem → destino é traçada
- [ ] Modo: Dirigindo

---

## 🧪 Teste 8: Geocoding Accuracy

**Testar endereços diferentes:**
- Avenida Paulista, São Paulo
- Pinheiros, São Paulo
- Shopping Center Norte, São Paulo

**Esperado:**
- Localização correta (lat/lng)
- Sem timeouts
- Responde em < 500ms

---

## 📊 Performance Esperada

| Métrica | Tempo |
|---------|-------|
| Build | < 3s |
| Dev server inicia | < 10s |
| Mapa renderiza | < 2s |
| GPS captura | < 5s |
| Geocoding | 200-500ms |
| Rota calcula | 300-800ms |

---

## 🐛 Troubleshooting

### Mapa não aparece
- Verificar console por erro de geocoding
- Testar outro endereço
- Limpar cache (Ctrl+Shift+R)

### GPS não funciona
- Verificar permissão de localização (ícone GPS na barra)
- Deve estar em HTTPS ou localhost
- Recarregar página se precisão > 100m

### Contramão não detecta
- Normal se Overpass API está lento
- Pode não ter dados para rua específica

---

## ✅ Checklist Final

- [ ] Build sem erros
- [ ] Dev server rodando na porta 5173
- [ ] Mapa aparece em ActiveTrip.jsx
- [ ] GPS capturado com precisão
- [ ] Geocoding converte endereços corretamente
- [ ] Contramão detectado (ou validação funciona)
- [ ] Waze deep link abre
- [ ] Google Maps deep link abre
- [ ] History mostra mapas expansíveis
- [ ] Performance < 3s total até funcional
- [ ] Mobile responsivo
- [ ] Sem erros críticos no console

---

**Status**: Pronto para Testes ✅  
**Desenvolvido por**: Claude + Sergioponte  
**Data**: 2026-04-18

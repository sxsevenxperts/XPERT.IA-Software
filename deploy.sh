#!/bin/bash

# 🚀 Script de Deploy para EasyPanel - Clínica Estética Jacyara Ponte

echo "================================"
echo "🚀 Deploy EasyPanel"
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}⚠️  docker-compose.yml não encontrado${NC}"
    echo "Execute este script na raiz do repositório:"
    echo "cd appjacyaramobile && bash deploy.sh"
    exit 1
fi

echo -e "${BLUE}1️⃣  Verificando Git...${NC}"
git status
echo ""

# 2. Verificar .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "Copiando de .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env criado${NC}"
    echo "⚠️  Edite .env com suas variáveis de ambiente"
    exit 1
fi

echo -e "${GREEN}✅ .env encontrado${NC}"
echo ""

# 3. Carregar variáveis do .env
export $(cat .env | grep -v '^#' | xargs)

# 4. Build da imagem Docker
echo -e "${BLUE}2️⃣  Building Docker image...${NC}"
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ Build falhou${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker image built${NC}"
echo ""

# 5. Iniciar container
echo -e "${BLUE}3️⃣  Iniciando container...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ Container não iniciou${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Container iniciado${NC}"
echo ""

# 6. Aguardar saúde do container
echo -e "${BLUE}4️⃣  Aguardando health check...${NC}"
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ $HEALTH -eq 200 ]; then
    echo -e "${GREEN}✅ Aplicação saudável (HTTP $HEALTH)${NC}"
else
    echo -e "${YELLOW}⚠️  Health check retornou HTTP $HEALTH${NC}"
    echo "Ver logs com: docker logs clinica-jacyara-app"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Deploy Local Completo!${NC}"
echo "================================"
echo ""
echo "📍 Acesse em: http://localhost"
echo ""
echo "Para deploy no EasyPanel:"
echo "1. Vá em: https://app.easypanel.io"
echo "2. Clique em 'New Application' → 'Docker'"
echo "3. Cole o repo: https://github.com/sxsevenxperts/appjacyaramobile.git"
echo "4. Configure as variáveis de ambiente (ver EASYPANEL_SETUP.md)"
echo "5. Clique em 'Deploy'"
echo ""
echo "📚 Guia completo: EASYPANEL_SETUP.md"

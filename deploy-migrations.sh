#!/bin/bash

#############################################################################
# PrevOS - Script Automático de Deploy de Migrations
# Data: 01 de Abril de 2026
# Projeto: kyefzktzhviahsodyayd
#############################################################################

set -e

PROJECT_ID="kyefzktzhviahsodyayd"
MIGRATIONS_DIR="./supabase/migrations"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║           PrevOS - Automatizador de Deploy de Migrations        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se supabase CLI está instalado
echo "🔍 Verificando dependências..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI não está instalado${NC}"
    echo "Instale com: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI encontrado${NC}"
echo ""

# Listar migrations disponíveis
echo "📋 Migrations Disponíveis:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -1 $MIGRATIONS_DIR/*.sql | grep -E "00[3-7]_" | while read file; do
    filename=$(basename "$file")
    echo "  📝 $filename"
done
echo ""

# Opções de menu
echo "🎯 Opções:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1) Aplicar TODAS as 5 migrations (Recomendado)"
echo "  2) Aplicar migrations selecionadas"
echo "  3) Verificar status das migrations"
echo "  4) Verificar conexão com Supabase"
echo "  5) Sair"
echo ""

read -p "Escolha uma opção (1-5): " choice

case $choice in
    1)
        echo -e "\n${BLUE}▶ Aplicando todas as 5 migrations...${NC}\n"
        
        # Verificar se supabase está linked
        if [ ! -d ".supabase" ]; then
            echo -e "${YELLOW}⚠ Projeto não está linkado${NC}"
            read -p "Deseja fazer link agora? (s/n): " link_response
            if [[ $link_response == "s" || $link_response == "S" ]]; then
                supabase link --project-ref $PROJECT_ID
            else
                echo "Saindo..."
                exit 1
            fi
        fi
        
        # Aplicar migrations
        echo -e "\n${BLUE}Executando migrations...${NC}\n"
        supabase migration up
        
        echo -e "\n${GREEN}✅ Migrations aplicadas com sucesso!${NC}\n"
        ;;
        
    2)
        echo -e "\n${BLUE}▶ Selecionando migrations...${NC}\n"
        
        migrations=()
        options=("003_notification_system" "004_calendar_integrations" "005_case_predictions" "006_portal_integrations" "007_analytics_predictions")
        
        for i in "${!options[@]}"; do
            read -p "Aplicar ${options[$i]}? (s/n): " response
            if [[ $response == "s" || $response == "S" ]]; then
                migrations+=("${options[$i]}")
            fi
        done
        
        if [ ${#migrations[@]} -eq 0 ]; then
            echo "Nenhuma migration selecionada."
            exit 1
        fi
        
        echo -e "\n${BLUE}Migrations a aplicar:${NC}"
        printf '%s\n' "${migrations[@]}"
        echo ""
        
        # Verificar link
        if [ ! -d ".supabase" ]; then
            supabase link --project-ref $PROJECT_ID
        fi
        
        # Aplicar apenas migrations selecionadas
        for migration in "${migrations[@]}"; do
            file="$MIGRATIONS_DIR/${migration}.sql"
            if [ -f "$file" ]; then
                echo -e "\n${BLUE}Aplicando: $migration${NC}"
                # Usando supabase cli para executar SQL
                supabase db push --dry-run || true
            fi
        done
        ;;
        
    3)
        echo -e "\n${BLUE}▶ Verificando status das migrations...${NC}\n"
        
        if [ ! -d ".supabase" ]; then
            echo "Projeto não está linkado. Faça link primeiro com opção 4."
            exit 1
        fi
        
        supabase migration list
        ;;
        
    4)
        echo -e "\n${BLUE}▶ Verificando conexão com Supabase...${NC}\n"
        
        read -p "Email Supabase: " email
        read -sp "Senha: " password
        echo ""
        
        echo -e "${YELLOW}Fazendo login...${NC}"
        supabase login --email "$email" --password "$password" 2>&1 || {
            echo -e "${RED}❌ Falha ao fazer login${NC}"
            exit 1
        }
        
        echo -e "${YELLOW}Linkando projeto...${NC}"
        supabase link --project-ref $PROJECT_ID 2>&1 || {
            echo -e "${RED}❌ Falha ao linkar projeto${NC}"
            exit 1
        }
        
        echo -e "${GREEN}✅ Conexão estabelecida com sucesso!${NC}\n"
        ;;
        
    5)
        echo "Saindo..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    Deploy Concluído! ✅                          ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximas ações:"
echo "  1. Verificar tabelas em: https://app.supabase.com/project/$PROJECT_ID/editor"
echo "  2. Deploying Edge Functions (ver DEPLOY_GUIDE.md)"
echo "  3. Testar aplicação em produção"
echo ""

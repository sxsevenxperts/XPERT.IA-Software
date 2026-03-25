#!/bin/bash

# Script para criar novo banco Farm-SX no Supabase self-hosted
# Copie e cole este arquivo completo no console do EasyPanel

echo "=== Conectando ao PostgreSQL ==="

# Conectar ao PostgreSQL e executar os comandos SQL
docker-compose exec -T postgres psql -U postgres << EOF

-- Criar novo banco
CREATE DATABASE farm_sx_db;

-- Criar usuário específico
CREATE USER farm_user WITH PASSWORD 'Senha123!Farm-SX';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE farm_sx_db TO farm_user;

-- Conectar ao novo banco
\c farm_sx_db

-- Criar extensão UUID se necessária
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Listar bancos (verificação)
\l

-- Sair
\q

EOF

echo "=== Banco criado com sucesso! ==="
echo ""
echo "Connection string para o Farm-SX:"
echo "postgresql://farm_user:Senha123!Farm-SX@postgres:5432/farm_sx_db"
echo ""
echo "Próximo passo: Configure as variáveis de ambiente no EasyPanel"

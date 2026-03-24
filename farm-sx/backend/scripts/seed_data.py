#!/usr/bin/env python
"""Script para popular banco de dados com dados iniciais"""

import sys
sys.path.insert(0, '/Users/sergioponte/APPS/.claude/worktrees/keen-moore/farm-sx/backend')

from src.core.database import SessionLocal, Base, engine
from src.models.database_models import (
    Agricultor, Propriedade, OportunidadeSubsidio, IndicadorEconomico
)
from datetime import datetime, timedelta

def seed_database():
    """Popular banco com dados iniciais"""

    # Criar tabelas
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Limpar dados existentes
        db.query(Agricultor).delete()
        db.query(OportunidadeSubsidio).delete()
        db.query(IndicadorEconomico).delete()
        db.commit()

        # 1. Criar agricultores de teste
        agricultores = [
            {
                'nome': 'João da Silva',
                'email': 'joao@farm.local',
                'telefone': '85999999999',
                'cpf': '12345678901',
                'endereco': 'Rua A, 123',
                'cidade': 'Fortaleza',
                'estado': 'CE'
            },
            {
                'nome': 'Maria Santos',
                'email': 'maria@farm.local',
                'telefone': '85988888888',
                'cpf': '12345678902',
                'endereco': 'Rua B, 456',
                'cidade': 'Caucaia',
                'estado': 'CE'
            },
            {
                'nome': 'Pedro Oliveira',
                'email': 'pedro@farm.local',
                'telefone': '85977777777',
                'cpf': '12345678903',
                'endereco': 'Rua C, 789',
                'cidade': 'Pacajus',
                'estado': 'CE'
            }
        ]

        agr_objs = []
        for agr_data in agricultores:
            agr = Agricultor(**agr_data)
            db.add(agr)
            db.flush()
            agr_objs.append(agr)
            print(f"✓ Agricultor criado: {agr.nome}")

        # 2. Criar propriedades
        propriedades_dados = [
            {
                'agricultor_id': agr_objs[0].id,
                'nome': 'Propriedade Principal',
                'area_total_hectares': 15,
                'area_cultivavel': 12,
                'municipio': 'Fortaleza',
                'latitude': -3.7319,
                'longitude': -38.5267,
                'tipo_solo': 'argiloso'
            },
            {
                'agricultor_id': agr_objs[1].id,
                'nome': 'Sítio Cascata',
                'area_total_hectares': 20,
                'area_cultivavel': 16,
                'municipio': 'Caucaia',
                'latitude': -3.9287,
                'longitude': -38.6540,
                'tipo_solo': 'arenoso'
            },
            {
                'agricultor_id': agr_objs[2].id,
                'nome': 'Fazenda Verde',
                'area_total_hectares': 25,
                'area_cultivavel': 20,
                'municipio': 'Pacajus',
                'latitude': -4.2001,
                'longitude': -38.3308,
                'tipo_solo': 'siltoso'
            }
        ]

        for prop_data in propriedades_dados:
            prop = Propriedade(**prop_data)
            db.add(prop)
            print(f"✓ Propriedade criada: {prop.nome}")

        # 3. Criar oportunidades de subsídios
        subsidios = [
            {
                'titulo': 'PRONAF - Programa Nacional de Fortalecimento da Agricultura Familiar',
                'descricao': 'Crédito para custeio e investimento em propriedades familiares',
                'tipo': 'credito',
                'orgao': 'Banco do Brasil',
                'municipios_validos': ['Fortaleza', 'Caucaia', 'Pacajus', 'Maranguape'],
                'culturas_validas': ['milho', 'feijão', 'mandioca', 'tomate', 'melancia'],
                'valor_minimo': 2500,
                'valor_maximo': 500000,
                'taxa_juros': 4.5,
                'data_inicio': datetime.now(),
                'data_fim': datetime.now() + timedelta(days=365),
                'requisitos': 'Possuir propriedade declarada e estar ativo na agricultura',
                'link_documentacao': 'https://www.bb.com.br/pronaf',
                'telefone_contato': '0800 123 456',
                'email_contato': 'pronaf@bb.com.br',
                'aprovacao_taxa': 0.85,
                'tempo_processamento_dias': 15,
                'ativo': True
            },
            {
                'titulo': 'Seguro Safra 2024',
                'descricao': 'Seguro para proteção contra riscos climáticos',
                'tipo': 'seguro',
                'orgao': 'MAPA',
                'municipios_validos': ['Ceará'],
                'culturas_validas': ['milho', 'feijão', 'arroz', 'trigo'],
                'valor_minimo': 5000,
                'valor_maximo': 1000000,
                'taxa_juros': None,
                'data_inicio': datetime.now(),
                'data_fim': datetime.now() + timedelta(days=180),
                'requisitos': 'Ser agricultor familiar ou médio produtor',
                'link_documentacao': 'https://www.gov.br/agricultura/seguro-safra',
                'telefone_contato': '0800 987 654',
                'email_contato': 'info@seguro-safra.br',
                'aprovacao_taxa': 0.92,
                'tempo_processamento_dias': 10,
                'ativo': True
            },
            {
                'titulo': 'Crédito Sustentável',
                'descricao': 'Crédito com juros reduzidos para práticas sustentáveis',
                'tipo': 'credito',
                'orgao': 'Caixa Econômica Federal',
                'municipios_validos': None,  # Todos os municípios
                'culturas_validas': None,  # Todas as culturas
                'valor_minimo': 10000,
                'valor_maximo': 300000,
                'taxa_juros': 3.8,
                'data_inicio': datetime.now(),
                'data_fim': datetime.now() + timedelta(days=365),
                'requisitos': 'Implementar práticas sustentáveis na propriedade',
                'link_documentacao': 'https://www.caixa.gov.br/sustentavel',
                'telefone_contato': '0800 726 0001',
                'email_contato': 'credito@caixa.gov.br',
                'aprovacao_taxa': 0.78,
                'tempo_processamento_dias': 20,
                'ativo': True
            },
            {
                'titulo': 'Subvenção para Modernização de Equipamentos',
                'descricao': 'Subvenção do estado para modernizar equipamentos agrícolas',
                'tipo': 'subvencao',
                'orgao': 'Secretaria de Agricultura do Ceará',
                'municipios_validos': ['Fortaleza', 'Caucaia', 'Pacajus'],
                'culturas_validas': None,
                'valor_minimo': 50000,
                'valor_maximo': 200000,
                'taxa_juros': None,
                'data_inicio': datetime.now(),
                'data_fim': datetime.now() + timedelta(days=90),
                'requisitos': 'Ser produtor rural com propriedade registrada',
                'link_documentacao': 'https://www.ceará.gov.br/agricultura',
                'telefone_contato': '(85) 3101-0000',
                'email_contato': 'modernizacao@ceara.gov.br',
                'aprovacao_taxa': 0.65,
                'tempo_processamento_dias': 30,
                'ativo': True
            }
        ]

        for sub_data in subsidios:
            sub = OportunidadeSubsidio(**sub_data)
            db.add(sub)
            print(f"✓ Oportunidade criada: {sub.titulo}")

        # 4. Criar indicadores econômicos
        indicadores = [
            {
                'tipo': 'IPCA',
                'valor': 4.52,
                'data': datetime.now().date(),
                'fonte': 'IBGE'
            },
            {
                'tipo': 'SELIC',
                'valor': 10.50,
                'data': datetime.now().date(),
                'fonte': 'BCB'
            },
            {
                'tipo': 'Desemprego',
                'valor': 7.8,
                'data': datetime.now().date(),
                'fonte': 'IBGE'
            },
            {
                'tipo': 'Inflação Alimentos',
                'valor': 8.2,
                'data': datetime.now().date(),
                'fonte': 'IBGE'
            },
            {
                'tipo': 'Taxa de Câmbio USD/BRL',
                'valor': 5.25,
                'data': datetime.now().date(),
                'fonte': 'BCB'
            }
        ]

        for ind_data in indicadores:
            ind = IndicadorEconomico(**ind_data)
            db.add(ind)
            print(f"✓ Indicador criado: {ind.tipo}")

        # Commit
        db.commit()
        print("\n✅ Dados de seed carregados com sucesso!")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao carregar seed data: {e}")
        raise

    finally:
        db.close()

if __name__ == '__main__':
    seed_database()

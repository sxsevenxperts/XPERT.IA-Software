from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from src.core.database import Base

class Agricultor(Base):
    __tablename__ = "agricultores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    telefone = Column(String(20))
    cpf = Column(String(14), unique=True, index=True)
    endereco = Column(String(255))
    cidade = Column(String(100))
    estado = Column(String(2))
    data_criacao = Column(DateTime, default=datetime.utcnow)
    ativo = Column(Boolean, default=True)

    propriedades = relationship("Propriedade", back_populates="agricultor")
    plantios = relationship("Plantio", back_populates="agricultor")
    planos_plantio = relationship("PlanoBuscaPlantio", back_populates="agricultor")
    analises_solo = relationship("AnaliseSolo", back_populates="agricultor")
    registros_produtos = relationship("RegistroProduto", back_populates="agricultor")
    alertas = relationship("Alerta", back_populates="agricultor")

class Propriedade(Base):
    __tablename__ = "propriedades"

    id = Column(Integer, primary_key=True, index=True)
    agricultor_id = Column(Integer, ForeignKey("agricultores.id"), nullable=False)
    nome = Column(String(255), nullable=False)
    area_total_hectares = Column(Float, nullable=False)
    area_cultivavel = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    tipo_solo = Column(String(100))
    data_criacao = Column(DateTime, default=datetime.utcnow)

    agricultor = relationship("Agricultor", back_populates="propriedades")
    plantios = relationship("Plantio", back_populates="propriedade")
    analises_solo = relationship("AnaliseSolo", back_populates="propriedade")

class Plantio(Base):
    __tablename__ = "plantios"

    id = Column(Integer, primary_key=True, index=True)
    agricultor_id = Column(Integer, ForeignKey("agricultores.id"), nullable=False)
    propriedade_id = Column(Integer, ForeignKey("propriedades.id"), nullable=False)
    cultura = Column(String(100), nullable=False)
    municipio = Column(String(100), nullable=False)
    area_plantada_hectares = Column(Float, nullable=False)
    data_plantio = Column(Date, nullable=False)
    data_colheita_prevista = Column(Date)
    data_colheita_real = Column(Date)
    produtividade_estimada = Column(Float)
    produtividade_real = Column(Float)
    quantidade_colhida_kg = Column(Float)
    renda_estimada = Column(Float)
    renda_real = Column(Float)
    status = Column(String(50), default="planejado")  # planejado, em_crescimento, colhido
    data_criacao = Column(DateTime, default=datetime.utcnow)

    agricultor = relationship("Agricultor", back_populates="plantios")
    propriedade = relationship("Propriedade", back_populates="plantios")
    registros_produtos = relationship("RegistroProduto", back_populates="plantio")

class PlanoBuscaPlantio(Base):
    __tablename__ = "planos_busca_plantio"

    id = Column(Integer, primary_key=True, index=True)
    agricultor_id = Column(Integer, ForeignKey("agricultores.id"), nullable=False)
    cultura = Column(String(100), nullable=False)
    municipio = Column(String(100), nullable=False)
    area_hectares = Column(Float, nullable=False)
    produtividade_media = Column(Float)
    data_plantio_recomendada = Column(Date, nullable=False)
    data_colheita_prevista = Column(Date, nullable=False)
    quantidade_a_plantar_kg = Column(Float)
    lucro_estimado = Column(Float)
    risco = Column(String(20))  # baixo, medio, alto
    canais_venda = Column(JSON)  # lista de canais recomendados
    demanda_pico_mes = Column(Integer)
    recomendacoes = Column(Text)
    data_criacao = Column(DateTime, default=datetime.utcnow)

    agricultor = relationship("Agricultor", back_populates="planos_plantio")

class ConsumoHistorico(Base):
    __tablename__ = "consumo_historico"

    id = Column(Integer, primary_key=True, index=True)
    cultura = Column(String(100), nullable=False, index=True)
    municipio = Column(String(100), nullable=False)
    mes = Column(Integer)
    ano = Column(Integer)
    quantidade_consumida_kg = Column(Float)
    preco_medio = Column(Float)
    demanda_relative = Column(Float)
    fonte = Column(String(100))  # CEASA, CONAB, etc
    data_atualizacao = Column(DateTime, default=datetime.utcnow)

class PrevisaoConsumo(Base):
    __tablename__ = "previsoes_consumo"

    id = Column(Integer, primary_key=True, index=True)
    cultura = Column(String(100), nullable=False, index=True)
    municipio = Column(String(100), nullable=False)
    mes_previsao = Column(Integer)
    ano_previsao = Column(Integer)
    quantidade_prevista_kg = Column(Float)
    intervalo_confianca_min = Column(Float)
    intervalo_confianca_max = Column(Float)
    sazonalidade = Column(Float)
    data_geracao = Column(DateTime, default=datetime.utcnow)

class IndicadorEconomico(Base):
    __tablename__ = "indicadores_economicos"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(100), nullable=False)  # IPCA, SELIC, Desemprego, etc
    valor = Column(Float, nullable=False)
    data = Column(Date, nullable=False)
    fonte = Column(String(100))  # IBGE, BCB, etc
    data_atualizacao = Column(DateTime, default=datetime.utcnow)

class AnaliseSolo(Base):
    __tablename__ = "analises_solo"

    id = Column(Integer, primary_key=True, index=True)
    agricultor_id = Column(Integer, ForeignKey("agricultores.id"), nullable=False)
    propriedade_id = Column(Integer, ForeignKey("propriedades.id"), nullable=False)
    data_coleta = Column(Date, nullable=False)
    profundidade_cm = Column(Float)  # cm
    ph = Column(Float)
    materia_organica_percent = Column(Float)
    nitrogenio_ppm = Column(Float)
    fosforo_ppm = Column(Float)
    potassio_ppm = Column(Float)
    calcio_ppm = Column(Float)
    magnesio_ppm = Column(Float)
    acidez_al3_ppm = Column(Float)
    texture = Column(String(50))  # argiloso, arenoso, siltoso
    umidade_percent = Column(Float)
    densidade_solo = Column(Float)
    condutividade_eletrica = Column(Float)
    recomendacoes = Column(Text)
    laboratorio = Column(String(100))
    data_analise = Column(DateTime, default=datetime.utcnow)

    agricultor = relationship("Agricultor", back_populates="analises_solo")
    propriedade = relationship("Propriedade", back_populates="analises_solo")

class RegistroProduto(Base):
    __tablename__ = "registros_produtos"

    id = Column(Integer, primary_key=True, index=True)
    agricultor_id = Column(Integer, ForeignKey("agricultores.id"), nullable=False)
    plantio_id = Column(Integer, ForeignKey("plantios.id"), nullable=False)
    tipo_produto = Column(String(100), nullable=False)  # insumo, agroquimico, mecanizacao
    nome = Column(String(255), nullable=False)
    categoria = Column(String(100))  # adubo, herbicida, pesticida, fertilizante
    data_aplicacao = Column(Date, nullable=False)
    quantidade_usada = Column(Float)
    unidade = Column(String(50))  # kg, L, etc
    custo = Column(Float)
    fabricante = Column(String(255))
    lote = Column(String(100))
    validade = Column(Date)
    metodo_aplicacao = Column(String(100))  # pulverizacao, cobertura, fertirrigacao
    efeitos_observados = Column(Text)
    data_registro = Column(DateTime, default=datetime.utcnow)

    agricultor = relationship("Agricultor", back_populates="registros_produtos")
    plantio = relationship("Plantio", back_populates="registros_produtos")

class OportunidadeSubsidio(Base):
    __tablename__ = "oportunidades_subsidios"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=False)
    tipo = Column(String(100), nullable=False)  # credito, subvencao, seguro, bolsa
    orgao = Column(String(255), nullable=False)  # MAPA, INCRA, CEF, etc
    municipios_validos = Column(JSON)  # lista de municipios
    culturas_validas = Column(JSON)  # lista de culturas elegíveis
    valor_minimo = Column(Float)
    valor_maximo = Column(Float)
    taxa_juros = Column(Float)
    data_inicio = Column(Date)
    data_fim = Column(Date)
    requisitos = Column(Text)
    link_documentacao = Column(String(500))
    telefone_contato = Column(String(20))
    email_contato = Column(String(255))
    aprovacao_taxa = Column(Float)  # taxa de aprovação histórica
    tempo_processamento_dias = Column(Integer)
    ativo = Column(Boolean, default=True)
    data_atualizacao = Column(DateTime, default=datetime.utcnow)

class CandidaturaSubsidio(Base):
    __tablename__ = "candidaturas_subsidios"

    id = Column(Integer, primary_key=True, index=True)
    agricultor_id = Column(Integer, ForeignKey("agricultores.id"), nullable=False)
    oportunidade_id = Column(Integer, ForeignKey("oportunidades_subsidios.id"), nullable=False)
    status = Column(String(50), default="candidato")  # candidato, enviado, aprovado, rejeitado
    data_candidatura = Column(Date, nullable=False)
    data_envio = Column(Date)
    data_resposta = Column(Date)
    valor_solicitado = Column(Float)
    valor_aprovado = Column(Float)
    observacoes = Column(Text)
    documento_candidatura = Column(String(500))  # URL do documento
    data_criacao = Column(DateTime, default=datetime.utcnow)

class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    agricultor_id = Column(Integer, ForeignKey("agricultores.id"), nullable=False)
    tipo = Column(String(100), nullable=False)  # clima, mercado, subsidio, consumo, solo
    titulo = Column(String(255), nullable=False)
    mensagem = Column(Text, nullable=False)
    urgencia = Column(String(20))  # baixa, media, alta, critica
    lido = Column(Boolean, default=False)
    link_acao = Column(String(500))
    data_criacao = Column(DateTime, default=datetime.utcnow)

    agricultor = relationship("Agricultor", back_populates="alertas")

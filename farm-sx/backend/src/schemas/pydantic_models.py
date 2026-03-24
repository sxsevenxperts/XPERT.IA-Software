from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List

# Agricultor
class AgricultorCreate(BaseModel):
    nome: str
    email: EmailStr
    telefone: Optional[str] = None
    cpf: str
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None

class AgricultorResponse(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str]
    cidade: Optional[str]
    estado: Optional[str]
    data_criacao: datetime

    class Config:
        from_attributes = True

# Plantio
class PlantioCreate(BaseModel):
    cultura: str
    municipio: str
    area_plantada_hectares: float
    data_plantio: date
    produtividade_estimada: Optional[float] = None

class PlantioResponse(BaseModel):
    id: int
    cultura: str
    municipio: str
    area_plantada_hectares: float
    data_plantio: date
    data_colheita_prevista: Optional[date]
    produtividade_estimada: Optional[float]
    renda_estimada: Optional[float]
    status: str

    class Config:
        from_attributes = True

# Plano Busca Plantio
class PlanoBuscaPlantioResponse(BaseModel):
    id: int
    cultura: str
    municipio: str
    area_hectares: float
    data_plantio_recomendada: date
    data_colheita_prevista: date
    quantidade_a_plantar_kg: Optional[float]
    lucro_estimado: Optional[float]
    risco: str
    canais_venda: Optional[List[str]]
    recomendacoes: Optional[str]

    class Config:
        from_attributes = True

# Análise de Solo
class AnaliseSoloCreate(BaseModel):
    propriedade_id: int
    data_coleta: date
    profundidade_cm: Optional[float] = None
    ph: Optional[float] = None
    materia_organica_percent: Optional[float] = None
    nitrogenio_ppm: Optional[float] = None
    fosforo_ppm: Optional[float] = None
    potassio_ppm: Optional[float] = None
    calcio_ppm: Optional[float] = None
    magnesio_ppm: Optional[float] = None
    acidez_al3_ppm: Optional[float] = None
    texture: Optional[str] = None
    umidade_percent: Optional[float] = None
    laboratorio: Optional[str] = None

class AnaliseSoloResponse(BaseModel):
    id: int
    propriedade_id: int
    data_coleta: date
    ph: Optional[float]
    materia_organica_percent: Optional[float]
    nitrogenio_ppm: Optional[float]
    fosforo_ppm: Optional[float]
    potassio_ppm: Optional[float]
    recomendacoes: Optional[str]
    laboratorio: Optional[str]
    data_analise: datetime

    class Config:
        from_attributes = True

# Registro de Produtos
class RegistroProdutoCreate(BaseModel):
    plantio_id: int
    tipo_produto: str
    nome: str
    categoria: Optional[str] = None
    data_aplicacao: date
    quantidade_usada: float
    unidade: str
    custo: Optional[float] = None
    fabricante: Optional[str] = None
    lote: Optional[str] = None
    metodo_aplicacao: Optional[str] = None

class RegistroProdutoResponse(BaseModel):
    id: int
    plantio_id: int
    tipo_produto: str
    nome: str
    categoria: Optional[str]
    data_aplicacao: date
    quantidade_usada: float
    unidade: str
    custo: Optional[float]
    metodo_aplicacao: Optional[str]
    data_registro: datetime

    class Config:
        from_attributes = True

# Oportunidade Subsídio
class OportunidadeSubsidioResponse(BaseModel):
    id: int
    titulo: str
    descricao: str
    tipo: str
    orgao: str
    valor_minimo: Optional[float]
    valor_maximo: Optional[float]
    taxa_juros: Optional[float]
    data_inicio: Optional[date]
    data_fim: Optional[date]
    link_documentacao: Optional[str]
    telefone_contato: Optional[str]
    email_contato: Optional[str]
    ativo: bool

    class Config:
        from_attributes = True

class OportunidadeSubsidioCreate(BaseModel):
    titulo: str
    descricao: str
    tipo: str
    orgao: str
    municipios_validos: Optional[List[str]] = None
    culturas_validas: Optional[List[str]] = None
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    taxa_juros: Optional[float] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    requisitos: Optional[str] = None
    link_documentacao: Optional[str] = None
    telefone_contato: Optional[str] = None
    email_contato: Optional[str] = None

# Candidatura Subsídio
class CandidaturaSubsidioCreate(BaseModel):
    oportunidade_id: int
    data_candidatura: date
    valor_solicitado: Optional[float] = None

class CandidaturaSubsidioResponse(BaseModel):
    id: int
    oportunidade_id: int
    status: str
    data_candidatura: date
    valor_solicitado: Optional[float]
    valor_aprovado: Optional[float]
    data_criacao: datetime

    class Config:
        from_attributes = True

# Consumo Histórico
class ConsumoHistoricoResponse(BaseModel):
    id: int
    cultura: str
    municipio: str
    mes: int
    ano: int
    quantidade_consumida_kg: float
    preco_medio: Optional[float]
    demanda_relative: Optional[float]

    class Config:
        from_attributes = True

# Indicador Económico
class IndicadorEconomicoResponse(BaseModel):
    id: int
    tipo: str
    valor: float
    data: date
    fonte: Optional[str]

    class Config:
        from_attributes = True

# Alerta
class AlertaResponse(BaseModel):
    id: int
    tipo: str
    titulo: str
    mensagem: str
    urgencia: str
    lido: bool
    data_criacao: datetime

    class Config:
        from_attributes = True

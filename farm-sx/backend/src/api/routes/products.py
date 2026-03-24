from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.core.database import get_db
from src.models.database_models import RegistroProduto, Plantio, Agricultor
from src.schemas.pydantic_models import RegistroProdutoCreate, RegistroProdutoResponse
from typing import List, Optional

router = APIRouter(prefix="/api/v1/products", tags=["products"])

@router.post("/register", response_model=RegistroProdutoResponse)
def register_product(
    product: RegistroProdutoCreate,
    db: Session = Depends(get_db)
):
    """Register product/input used in a planting"""
    # Verify plantio exists
    plantio = db.query(Plantio).filter(Plantio.id == product.plantio_id).first()
    if not plantio:
        raise HTTPException(status_code=404, detail="Plantio not found")

    db_product = RegistroProduto(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/plantio/{plantio_id}", response_model=List[RegistroProdutoResponse])
def get_plantio_products(
    plantio_id: int,
    db: Session = Depends(get_db)
):
    """Get all products registered for a specific planting"""
    products = db.query(RegistroProduto).filter(
        RegistroProduto.plantio_id == plantio_id
    ).all()
    return products

@router.get("/agricultor/{agricultor_id}/history", response_model=List[RegistroProdutoResponse])
def get_agricultor_product_history(
    agricultor_id: int,
    tipo_produto: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get product usage history for a farmer"""
    query = db.query(RegistroProduto).filter(
        RegistroProduto.agricultor_id == agricultor_id
    )

    if tipo_produto:
        query = query.filter(RegistroProduto.tipo_produto == tipo_produto)

    return query.order_by(RegistroProduto.data_aplicacao.desc()).all()

@router.get("/analysis/{plantio_id}")
def get_product_analysis(
    plantio_id: int,
    db: Session = Depends(get_db)
):
    """Get analysis of products used in a planting"""
    plantio = db.query(Plantio).filter(Plantio.id == plantio_id).first()
    if not plantio:
        raise HTTPException(status_code=404, detail="Plantio not found")

    products = db.query(RegistroProduto).filter(
        RegistroProduto.plantio_id == plantio_id
    ).all()

    analysis = {
        "plantio_id": plantio_id,
        "cultura": plantio.cultura,
        "municipio": plantio.municipio,
        "area_hectares": plantio.area_plantada_hectares,
        "total_produtos": len(products),
        "custo_total": sum(p.custo or 0 for p in products),
        "custo_por_hectare": sum(p.custo or 0 for p in products) / plantio.area_plantada_hectares if plantio.area_plantada_hectares > 0 else 0,
        "por_tipo": {},
        "por_categoria": {},
        "timeline": []
    }

    # Group by type
    for product in products:
        tipo = product.tipo_produto
        if tipo not in analysis["por_tipo"]:
            analysis["por_tipo"][tipo] = {
                "quantidade": 0,
                "custo": 0,
                "produtos": []
            }

        analysis["por_tipo"][tipo]["quantidade"] += 1
        analysis["por_tipo"][tipo]["custo"] += product.custo or 0
        analysis["por_tipo"][tipo]["produtos"].append({
            "nome": product.nome,
            "quantidade": product.quantidade_usada,
            "unidade": product.unidade,
            "custo": product.custo
        })

        # Group by category
        categoria = product.categoria or "Sem categoria"
        if categoria not in analysis["por_categoria"]:
            analysis["por_categoria"][categoria] = {
                "quantidade": 0,
                "custo": 0
            }
        analysis["por_categoria"][categoria]["quantidade"] += 1
        analysis["por_categoria"][categoria]["custo"] += product.custo or 0

        # Add to timeline
        analysis["timeline"].append({
            "data": product.data_aplicacao.isoformat(),
            "nome": product.nome,
            "tipo": tipo,
            "categoria": categoria,
            "quantidade": product.quantidade_usada,
            "unidade": product.unidade,
            "metodo": product.metodo_aplicacao
        })

    # Sort timeline
    analysis["timeline"].sort(key=lambda x: x["data"])

    return analysis

@router.get("/efficiency/{agricultor_id}")
def get_product_efficiency(
    agricultor_id: int,
    db: Session = Depends(get_db)
):
    """Analyze product efficiency by comparing results"""
    # Get all plantios for the agricultor
    plantios = db.query(Plantio).filter(
        Plantio.agricultor_id == agricultor_id,
        Plantio.produtividade_real != None
    ).all()

    if not plantios:
        raise HTTPException(status_code=404, detail="No completed plantios found")

    efficiency_data = []

    for plantio in plantios:
        products = db.query(RegistroProduto).filter(
            RegistroProduto.plantio_id == plantio.id
        ).all()

        total_cost = sum(p.custo or 0 for p in products)
        productivity = plantio.produtividade_real or 0
        revenue = plantio.renda_real or 0

        efficiency_data.append({
            "plantio_id": plantio.id,
            "cultura": plantio.cultura,
            "data_plantio": plantio.data_plantio.isoformat(),
            "custo_produtos": total_cost,
            "produtividade_real": productivity,
            "renda_real": revenue,
            "lucro_liquido": revenue - total_cost,
            "roi": ((revenue - total_cost) / total_cost * 100) if total_cost > 0 else 0
        })

    return {
        "agricultor_id": agricultor_id,
        "plantios_analisados": len(efficiency_data),
        "dados": efficiency_data,
        "roi_medio": sum(p["roi"] for p in efficiency_data) / len(efficiency_data) if efficiency_data else 0
    }

@router.post("/recommendations/{plantio_id}")
def get_product_recommendations(
    plantio_id: int,
    db: Session = Depends(get_db)
):
    """Get recommendations for products based on soil and history"""
    plantio = db.query(Plantio).filter(Plantio.id == plantio_id).first()
    if not plantio:
        raise HTTPException(status_code=404, detail="Plantio not found")

    # Get agricultor's similar plantios
    similar_plantios = db.query(Plantio).filter(
        Plantio.agricultor_id == plantio.agricultor_id,
        Plantio.cultura == plantio.cultura,
        Plantio.id != plantio_id
    ).all()

    recommendations = []

    if similar_plantios:
        # Analyze products used in similar plantios
        product_frequency = {}
        best_roi_plantio = max(similar_plantios,
                              key=lambda p: (p.renda_real or 0) - sum(
                                  db.query(func.sum(RegistroProduto.custo)).filter(
                                      RegistroProduto.plantio_id == p.id
                                  ).scalar() or 0))

        best_products = db.query(RegistroProduto).filter(
            RegistroProduto.plantio_id == best_roi_plantio.id
        ).all()

        for product in best_products:
            recommendations.append({
                "nome": product.nome,
                "tipo": product.tipo_produto,
                "categoria": product.categoria,
                "motivo": "Usado em plantio com melhor desempenho",
                "custo": product.custo,
                "metodo": product.metodo_aplicacao
            })

    return {
        "plantio_id": plantio_id,
        "cultura": plantio.cultura,
        "municipio": plantio.municipio,
        "recomendacoes": recommendations
    }

import React, { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import Card from '../components/Card'

export default function ProductManagement() {
  const [showForm, setShowForm] = useState(false)
  const [products, setProducts] = useState([
    {
      id: 1,
      nome: 'Ureia',
      tipo: 'insumo',
      categoria: 'fertilizante',
      data: '2024-02-20',
      quantidade: 50,
      unidade: 'kg',
      custo: 450
    },
    {
      id: 2,
      nome: 'Roundup',
      tipo: 'agroquimico',
      categoria: 'herbicida',
      data: '2024-02-15',
      quantidade: 10,
      unidade: 'L',
      custo: 280
    },
    {
      id: 3,
      nome: 'Calcário',
      tipo: 'insumo',
      categoria: 'corretivo',
      data: '2024-02-10',
      quantidade: 200,
      unidade: 'kg',
      custo: 600
    }
  ])

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'insumo',
    categoria: 'fertilizante',
    data: '',
    quantidade: '',
    unidade: 'kg',
    custo: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setProducts([
      {
        id: products.length + 1,
        ...formData
      },
      ...products
    ])
    setFormData({
      nome: '',
      tipo: 'insumo',
      categoria: 'fertilizante',
      data: '',
      quantidade: '',
      unidade: 'kg',
      custo: ''
    })
    setShowForm(false)
  }

  const totalCost = products.reduce((sum, p) => sum + (p.custo || 0), 0)

  const getTipoColor = (tipo) => {
    const cores = {
      insumo: 'bg-blue-100 text-blue-800',
      agroquimico: 'bg-red-100 text-red-800',
      mecanizacao: 'bg-yellow-100 text-yellow-800'
    }
    return cores[tipo] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Produtos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-farm-600 text-white px-4 py-2 rounded-lg hover:bg-farm-700"
        >
          <Plus size={20} />
          Registrar Produto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-8 bg-white">
          <h2 className="text-xl font-bold mb-4">Registrar Novo Produto</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nome do produto"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="insumo">Insumo</option>
                <option value="agroquimico">Agroquímico</option>
                <option value="mecanizacao">Mecanização</option>
              </select>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="fertilizante">Fertilizante</option>
                <option value="herbicida">Herbicida</option>
                <option value="pesticida">Pesticida</option>
                <option value="corretivo">Corretivo</option>
              </select>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Quantidade"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <select
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="un">Unidade</option>
              </select>
              <input
                type="number"
                placeholder="Custo (R$)"
                value={formData.custo}
                onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-farm-600 text-white px-4 py-2 rounded hover:bg-farm-700">
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary */}
      <Card className="mb-8 bg-farm-50 border border-farm-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-farm-700 text-sm">Total de Produtos</p>
            <p className="text-2xl font-bold text-farm-900">{products.length}</p>
          </div>
          <div>
            <p className="text-farm-700 text-sm">Custo Total</p>
            <p className="text-2xl font-bold text-farm-900">R$ {totalCost}</p>
          </div>
          <div>
            <p className="text-farm-700 text-sm">Insumos</p>
            <p className="text-2xl font-bold text-farm-900">{products.filter(p => p.tipo === 'insumo').length}</p>
          </div>
          <div>
            <p className="text-farm-700 text-sm">Agroquímicos</p>
            <p className="text-2xl font-bold text-farm-900">{products.filter(p => p.tipo === 'agroquimico').length}</p>
          </div>
        </div>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {products.map(product => (
          <Card key={product.id} className="bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={20} className="text-farm-600" />
                  <h3 className="text-lg font-semibold">{product.nome}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getTipoColor(product.tipo)}`}>
                    {product.tipo}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{product.categoria}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-600 text-xs">Data</p>
                    <p className="font-semibold">{product.data}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Quantidade</p>
                    <p className="font-semibold">{product.quantidade} {product.unidade}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Custo Unitário</p>
                    <p className="font-semibold">R$ {(product.custo / product.quantidade).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Custo Total</p>
                    <p className="font-semibold text-farm-600">R$ {product.custo}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

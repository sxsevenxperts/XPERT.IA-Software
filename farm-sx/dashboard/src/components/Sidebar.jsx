import React from 'react'
import { Link } from 'react-router-dom'
import { Home, BarChart3, Leaf, Package, DollarSign, TrendingUp, BarChart2, Lightbulb, X, Zap, TrendingDown } from 'lucide-react'

export default function Sidebar({ open, onClose }) {
  const mainLinks = [
    { path: '/', label: 'Início', icon: Home },
  ]

  const agricultureLinks = [
    { path: '/predictions', label: 'Parecer AI', icon: Zap },
    { path: '/solo', label: 'Análise de Solo', icon: Leaf },
    { path: '/produtos', label: 'Gestão de Produtos', icon: Package },
    { path: '/economia', label: 'Economia', icon: BarChart2 },
    { path: '/subsidios', label: 'Subsídios', icon: DollarSign },
    { path: '/recomendacoes', label: 'Recomendações', icon: Lightbulb },
  ]

  const livestockLinks = [
    { path: '/livestock', label: 'Análise de Pecuária', icon: TrendingDown },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 h-screen bg-farm-800 text-white shadow-lg transform transition-transform md:translate-x-0 z-40 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-farm-100">Menu</h2>
            <button onClick={onClose} className="md:hidden">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-6">
            {/* Main Links */}
            <div className="space-y-2">
              {mainLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-farm-700 transition-colors"
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Agriculture Section */}
            <div>
              <h3 className="px-4 py-2 text-xs font-semibold text-farm-300 uppercase tracking-wider">Agricultura</h3>
              <div className="space-y-2">
                {agricultureLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-farm-700 transition-colors text-sm"
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Livestock Section */}
            <div>
              <h3 className="px-4 py-2 text-xs font-semibold text-farm-300 uppercase tracking-wider">Pecuária</h3>
              <div className="space-y-2">
                {livestockLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-farm-700 transition-colors text-sm"
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-farm-700 rounded-lg p-4">
              <p className="text-farm-100 text-xs mb-2">Dica</p>
              <p className="text-sm">
                Mantenha seus dados atualizados para análises mais precisas e recomendações personalizadas
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

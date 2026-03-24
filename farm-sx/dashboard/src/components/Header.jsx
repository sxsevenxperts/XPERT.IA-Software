import React from 'react'
import { Menu, Leaf, LogOut } from 'lucide-react'

export default function Header({ onMenuClick }) {
  return (
    <header className="bg-farm-700 text-white shadow-lg">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-farm-600 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Leaf size={32} className="text-farm-300" />
            <div>
              <h1 className="text-2xl font-bold">Farm SX</h1>
              <p className="text-farm-100 text-sm">Predictive OS</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-farm-100">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm">Conectado</span>
          </div>
          <button className="p-2 hover:bg-farm-600 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

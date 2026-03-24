import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import SoilAnalysis from './pages/SoilAnalysis'
import ProductManagement from './pages/ProductManagement'
import SubsidiesOpportunities from './pages/SubsidiesOpportunities'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-auto main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/solo" element={<SoilAnalysis />} />
              <Route path="/produtos" element={<ProductManagement />} />
              <Route path="/subsidios" element={<SubsidiesOpportunities />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function Livestock() {
  const [rebanhoType, setRebanhoType] = useState('gado_leite');
  const [quantidade, setQuantidade] = useState(50);
  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalise = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/livestock/analise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agricultor_id: 1,
          tipo_rebanho: rebanhoType,
          quantidade_animais: quantidade,
          raca_predominante: rebanhoType === 'gado_leite' ? 'Holandesa' : 'Nelore',
          producao_diaria: rebanhoType === 'gado_leite' ? 15 : 1.2,
          custos_alimentacao_dia_animal: rebanhoType === 'gado_leite' ? 15 : 18,
          dias_produtivos_ano: 330,
          vacinacao_atualizada: true,
          frequencia_ordenha_dia: rebanhoType === 'gado_leite' ? 2 : 0
        })
      });

      const data = await response.json();
      setAnalise(data);
    } catch (error) {
      console.error('Erro ao analisar rebanho:', error);
    } finally {
      setLoading(false);
    }
  };

  const tiposRebanho = [
    { id: 'gado_leite', label: 'Gado Leiteiro', icon: '' },
    { id: 'gado_corte', label: 'Gado de Corte', icon: '' },
    { id: 'ovino', label: 'Ovelhas', icon: '' },
    { id: 'suíno', label: 'Suinos', icon: '' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analise de Pecuaria</h1>
          <p className="text-gray-600">Otimize sua produção animal com análise AI integrada</p>
        </div>

        {/* Seleção de Tipo de Rebanho */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Tipo de Rebanho</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {tiposRebanho.map(tipo => (
              <button
                key={tipo.id}
                onClick={() => setRebanhoType(tipo.id)}
                className={`p-4 rounded-lg font-semibold transition-all ${
                  rebanhoType === tipo.id
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-3xl mb-2">{tipo.icon}</div>
                {tipo.label}
              </button>
            ))}
          </div>

          {/* Quantidade */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Quantidade de Animais
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="500"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value))}
                className="w-20 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={handleAnalise}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg w-full transition-all disabled:opacity-50"
          >
            {loading ? 'Analisando...' : 'Analisar Rebanho'}
          </button>
        </div>

        {/* Resultados */}
        {analise && (
          <>
            {/* Parecer Executivo */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">Parecer AI</h2>
              <p className="text-lg mb-4">{analise.parecer_executivo.opiniao}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-400 bg-opacity-50 rounded-lg p-4">
                  <div className="text-sm opacity-90">Assertividade</div>
                  <div className="text-2xl font-bold">{analise.assertividade_percentual}%</div>
                </div>
                <div className="bg-blue-400 bg-opacity-50 rounded-lg p-4">
                  <div className="text-sm opacity-90">Qualidade</div>
                  <div className="text-2xl font-bold">{(analise.parecer_executivo.score_qualidade * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-blue-400 bg-opacity-50 rounded-lg p-4">
                  <div className="text-sm opacity-90">Validade</div>
                  <div className="text-sm font-bold">90 dias</div>
                </div>
              </div>
            </div>

            {/* Indicadores Econômicos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-gray-600 text-sm mb-1">Receita Anual</div>
                <div className="text-3xl font-bold text-green-600">
                  R$ {(analise.analise_economica.receita_bruta_anual / 1000).toFixed(0)}k
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-gray-600 text-sm mb-1">Custos Anuais</div>
                <div className="text-3xl font-bold text-red-600">
                  R$ {(analise.analise_economica.custos_totais_anual / 1000).toFixed(0)}k
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-gray-600 text-sm mb-1">Lucro Líquido</div>
                <div className="text-3xl font-bold text-blue-600">
                  R$ {(analise.analise_economica.lucro_liquido_anual / 1000).toFixed(0)}k
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-gray-600 text-sm mb-1">ROI Anual</div>
                <div className="text-3xl font-bold text-purple-600">
                  {analise.analise_economica.roi_percentual.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Produção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Producao</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Produção Diária</span>
                    <span className="font-bold">{analise.producao.producao_diaria_total.toFixed(0)} {analise.producao.unidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Produção Anual</span>
                    <span className="font-bold">{(analise.producao.producao_anual_total / 1000).toFixed(0)}k {analise.producao.unidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Por Animal/Ano</span>
                    <span className="font-bold">{analise.producao.producao_por_animal_ano.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Saude Animal</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Status Sanitário</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      analise.saude_animal.probabilidade_doenca === 'baixa' ? 'bg-green-100 text-green-800' :
                      analise.saude_animal.probabilidade_doenca === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {analise.saude_animal.probabilidade_doenca.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Vacinação</span>
                    <span className="font-bold">{analise.saude_animal.vacinacao_atualizada ? 'Atualizada' : 'Desatualizada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Sanidade Geral</span>
                    <span className="font-bold capitalize">{analise.saude_animal.sanidade_geral}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pontos Críticos */}
            {analise.pontos_criticos.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-red-800 mb-4">Pontos Criticos</h3>
                <ul className="space-y-2">
                  {analise.pontos_criticos.map((ponto, idx) => (
                    <li key={idx} className="text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {ponto}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendações */}
            <div className="bg-blue-50 rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Recomendacoes</h3>
              <ul className="space-y-2">
                {analise.recomendacoes_manejo.map((rec, idx) => (
                  <li key={idx} className="text-blue-800 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Investimentos Sugeridos */}
            {analise.investimentos_sugeridos.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Investimentos Sugeridos</h3>
                <div className="space-y-4">
                  {analise.investimentos_sugeridos.map((inv, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="font-bold text-gray-900">{inv.tipo}</div>
                      <div className="text-sm text-gray-600">
                        Investimento: R$ {inv.custo_investimento.toLocaleString()} | ROI: {inv.roi_meses} meses
                      </div>
                      {inv.aumento_producao_percent > 0 && (
                        <div className="text-sm text-green-600">Aumento: +{inv.aumento_producao_percent}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Oportunidades */}
            {analise.oportunidades.length > 0 && (
              <div className="bg-green-50 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4">Oportunidades</h3>
                <ul className="space-y-2">
                  {analise.oportunidades.map((oport, idx) => (
                    <li key={idx} className="text-green-800 flex items-start gap-2">
                      <span className="text-green-600 mt-1">*</span>
                      {oport}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Estado Inicial */}
        {!analise && !loading && (
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4"></div>
            <p>Clique em "Analisar Rebanho" para gerar parecer AI completo</p>
          </div>
        )}
      </div>
    </div>
  );
}

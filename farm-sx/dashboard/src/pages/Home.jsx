import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const setores = [
    {
      id: 'agricultura',
      titulo: 'Agricultura & Hortifruticultura',
      descricao: 'Análise de culturas, perdas, densidade de plantio e manejo agrícola',
      icone: '',
      cor: 'from-green-400 to-green-600',
      subsetores: [
        { nome: 'Grãos (Milho, Feijão)', icon: '' },
        { nome: 'Horticultura (Tomate, Alface)', icon: '' },
        { nome: 'Fruticultura (Melancia, Melão)', icon: '' },
        { nome: 'Raízes (Mandioca, Cenoura)', icon: '' }
      ],
      features: [
        'Análise de perdas esperadas',
        'Cálculo de densidade de plantio',
        'Previsão de produtividade',
        'Análise de pragas e doenças',
        'Recomendações de manejo',
        'Otimização econômica'
      ],
      pages: [
        { nome: 'Parecer AI', rota: '/predictions' },
        { nome: 'Análise de Solo', rota: '/solo' },
        { nome: 'Economia', rota: '/economia' },
        { nome: 'Subsídios', rota: '/subsidios' },
        { nome: 'Recomendações', rota: '/recomendacoes' }
      ]
    },
    {
      id: 'pecuaria',
      titulo: 'Pecuária',
      descricao: 'Análise de rebanhos, produção animal, saúde e rentabilidade',
      icone: '',
      cor: 'from-amber-400 to-amber-600',
      subsetores: [
        { nome: 'Gado Leiteiro', icon: '' },
        { nome: 'Gado de Corte', icon: '' },
        { nome: 'Ovelhas', icon: '' },
        { nome: 'Suínos', icon: '' }
      ],
      features: [
        'Análise de produção animal',
        'Indicadores zootécnicos',
        'Cálculo de custos completo',
        'Análise de saúde animal',
        'Recomendações de investimento',
        'Projeção de rentabilidade'
      ],
      pages: [
        { nome: 'Análise de Rebanho', rota: '/livestock' },
        { nome: 'Análise Econômica', rota: '/livestock' },
        { nome: 'Indicadores Zootécnicos', rota: '/livestock' },
        { nome: 'Investimentos Sugeridos', rota: '/livestock' }
      ]
    }
  ];

  const handleSetorClick = (setorId) => {
    if (setorId === 'agricultura') {
      navigate('/predictions');
    } else if (setorId === 'pecuaria') {
      navigate('/livestock');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Farm SX Predictive OS</h1>
          <p className="text-xl opacity-90">
            Inteligência Artificial integrada para otimizar sua produção agrícola e pecuária
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {setores.map((setor) => (
            <div
              key={setor.id}
              className="group cursor-pointer"
              onClick={() => handleSetorClick(setor.id)}
            >
              {/* Card Principal */}
              <div className={`bg-gradient-to-br ${setor.cor} rounded-2xl shadow-2xl overflow-hidden group-hover:shadow-3xl transition-all transform group-hover:scale-105`}>
                <div className="p-8 text-white relative">
                  <div className="text-6xl mb-4">{setor.icone}</div>
                  <h2 className="text-3xl font-bold mb-3">{setor.titulo}</h2>
                  <p className="text-lg opacity-90 mb-6">{setor.descricao}</p>

                  {/* Subsetores */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold opacity-75 mb-3">Abrange:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {setor.subsetores.map((sub, idx) => (
                        <div key={idx} className="bg-white bg-opacity-20 rounded-lg px-3 py-2 text-sm">
                          {sub.icon} {sub.nome}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="bg-white text-gray-800 font-bold py-3 px-6 rounded-lg w-full hover:bg-opacity-90 transition-all">
                    Acessar {setor.titulo.split(' ')[0]}
                  </button>
                </div>
              </div>

              {/* Features & Pages */}
              <div className="mt-6 space-y-4">
                {/* Features */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Recursos Incluídos</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {setor.features.map((feature, idx) => (
                      <div key={idx} className="text-sm text-gray-700">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Páginas Relacionadas */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Páginas</h3>
                  <div className="space-y-2">
                    {setor.pages.map((page, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(page.rota);
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 hover:text-gray-900"
                      >
                        {page.nome}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estatísticas */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">50+</div>
            <div className="text-gray-700">Endpoints API</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600">90%+</div>
            <div className="text-gray-700">Assertividade AI</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-amber-600">100+</div>
            <div className="text-gray-700">Variáveis Analisadas</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-purple-600">24/7</div>
            <div className="text-gray-700">Disponível</div>
          </div>
        </div>

        {/* Como Funciona */}
        <div className="mt-16 bg-white rounded-2xl shadow-2xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4"></div>
              <h3 className="font-bold mb-2">1. Coleta de Dados</h3>
              <p className="text-gray-600 text-sm">Fornece informações sobre sua produção</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4"></div>
              <h3 className="font-bold mb-2">2. Análise AI</h3>
              <p className="text-gray-600 text-sm">Sistema cruza 100+ variáveis multidimensionalmente</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4"></div>
              <h3 className="font-bold mb-2">3. Parecer Estruturado</h3>
              <p className="text-gray-600 text-sm">Recebe recomendações assertivas</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4"></div>
              <h3 className="font-bold mb-2">4. Otimização</h3>
              <p className="text-gray-600 text-sm">Implementa para aumentar lucro</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para Otimizar sua Produção?</h2>
          <p className="text-lg opacity-90 mb-8">
            Escolha seu setor acima e comece uma análise integrada com IA
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/predictions')}
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all"
            >
              Ir para Agricultura
            </button>
            <button
              onClick={() => navigate('/livestock')}
              className="bg-amber-300 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all"
            >
              Ir para Pecuária
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 px-8 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="opacity-75">
            Farm SX Predictive OS © 2024 | Inteligência Artificial para Agricultura & Pecuária
          </p>
        </div>
      </div>
    </div>
  );
}

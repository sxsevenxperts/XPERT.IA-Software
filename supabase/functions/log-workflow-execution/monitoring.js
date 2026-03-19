// =====================
// MONITORAMENTO - EXECUÇÕES DO WORKFLOW
// =====================

let executionData = [];
let filteredData = [];
let executionChart = null;
let errorChart = null;

async function loadMonitoringData() {
  try {
    if (!currentUser) return;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', currentUser.id)
      .gte('timestamp_inicio', twentyFourHoursAgo)
      .order('timestamp_inicio', { ascending: false });

    if (error) {
      console.error('Error loading executions:', error);
      return;
    }

    executionData = data || [];
    filteredData = executionData;

    updateMetricsCards();
    renderExecutionChart();
    renderErrorChart();
    renderExecutionTable();
  } catch (error) {
    console.error('Error in loadMonitoringData:', error);
  }
}

function updateMetricsCards() {
  const total = filteredData.length;
  const sucesso = filteredData.filter(e => e.status === 'sucesso').length;
  const taxa = total > 0 ? ((sucesso / total) * 100).toFixed(1) : 0;
  const tokensTotal = filteredData.reduce((sum, e) => sum + (e.tokens_total || 0), 0);
  const custoTotal = filteredData.reduce((sum, e) => sum + (parseFloat(e.custo_usd) || 0), 0);
  const duracaoMedia = filteredData.length > 0 
    ? Math.round(filteredData.reduce((sum, e) => sum + (e.duracao_ms || 0), 0) / filteredData.length)
    : 0;
  const duracaoMax = filteredData.length > 0
    ? Math.max(...filteredData.map(e => e.duracao_ms || 0))
    : 0;
  const leadsUnicos = new Set(filteredData.map(e => e.lead_id).filter(Boolean)).size;

  const els = {
    'metric-total-execucoes': total,
    'metric-taxa-sucesso': taxa + '%',
    'metric-tokens-total': tokensTotal.toLocaleString(),
    'metric-custo-total': custoTotal.toFixed(2),
    'metric-duracao-media': duracaoMedia + 'ms',
    'metric-duracao-max': duracaoMax + 'ms',
    'metric-leads-processados': leadsUnicos
  };

  Object.entries(els).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function renderExecutionChart() {
  const ctx = document.getElementById('chart-executions');
  if (!ctx) return;

  const hourlyData = {};
  filteredData.forEach(exec => {
    const hour = new Date(exec.timestamp_inicio).toISOString().substring(0, 13);
    hourlyData[hour] = (hourlyData[hour] || 0) + 1;
  });

  const labels = Object.keys(hourlyData).sort();
  const data = labels.map(label => hourlyData[label]);

  if (executionChart) executionChart.destroy();

  executionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.map(l => l.substring(11) + 'h'),
      datasets: [{
        label: 'Execuções',
        data: data,
        borderColor: '#1f6feb',
        backgroundColor: 'rgba(31, 111, 235, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#6e7681' }, grid: { color: '#30363d' } },
        x: { ticks: { color: '#6e7681' }, grid: { color: '#30363d' } }
      }
    }
  });
}

function renderErrorChart() {
  const ctx = document.getElementById('chart-errors');
  if (!ctx) return;

  const errorByAgent = { principal: 0, objecao: 0, extra: 0 };
  const totalByAgent = { principal: 0, objecao: 0, extra: 0 };

  filteredData.forEach(exec => {
    const agent = exec.agent_type || 'extra';
    totalByAgent[agent]++;
    if (exec.status === 'erro') errorByAgent[agent]++;
  });

  const errorRates = Object.keys(errorByAgent).map(agent => 
    totalByAgent[agent] > 0 ? ((errorByAgent[agent] / totalByAgent[agent]) * 100).toFixed(1) : 0
  );

  if (errorChart) errorChart.destroy();

  errorChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Principal', 'Objeção', 'Extra'],
      datasets: [{
        label: 'Taxa de Erro (%)',
        data: errorRates,
        backgroundColor: ['#da3633', '#f85149', '#fb8500']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: '#6e7681' }, grid: { color: '#30363d' } },
        x: { ticks: { color: '#6e7681' }, grid: { color: '#30363d' } }
      }
    }
  });
}

function renderExecutionTable() {
  const tbody = document.getElementById('execution-table-body');
  if (!tbody) return;

  if (filteredData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:40px;text-align:center;color:#6e7681;">Nenhuma execução encontrada</td></tr>';
    return;
  }

  const statusEmoji = { sucesso: '✓', erro: '✗', timeout: '⏱' };
  const statusColor = { sucesso: '#1a7f0a', erro: '#da3633', timeout: '#f85149' };

  tbody.innerHTML = filteredData.slice(0, 20).map(exec => {
    const row = `<tr style="border-bottom:1px solid #30363d;">
      <td style="padding:12px;color:#e6edf3;">${exec.lead_id ? exec.lead_id.substring(0, 8) : '-'}</td>
      <td style="padding:12px;color:#e6edf3;font-size:12px;text-transform:capitalize;">${exec.agent_type}</td>
      <td style="padding:12px;"><span style="background:${statusColor[exec.status]};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;">${statusEmoji[exec.status]} ${exec.status}</span></td>
      <td style="padding:12px;text-align:right;color:#6e7681;font-size:12px;">${exec.tokens_total || 0}</td>
      <td style="padding:12px;text-align:right;color:#6e7681;font-size:12px;">${exec.duracao_ms}ms</td>
      <td style="padding:12px;text-align:right;color:#6e7681;font-size:12px;">$${parseFloat(exec.custo_usd || 0).toFixed(4)}</td>
      <td style="padding:12px;color:#6e7681;font-size:12px;">${new Date(exec.timestamp_inicio).toLocaleString('pt-BR')}</td>
    </tr>`;
    return row;
  }).join('');
}

function filterExecutions() {
  const agentType = document.getElementById('filter-agent-type')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  const period = document.getElementById('filter-period')?.value || '24h';

  const now = Date.now();
  const periodMs = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 }[period] || 24 * 60 * 60 * 1000;
  const periodStart = new Date(now - periodMs).toISOString();

  filteredData = executionData.filter(exec => {
    const matchAgent = !agentType || exec.agent_type === agentType;
    const matchStatus = !status || exec.status === status;
    const matchPeriod = exec.timestamp_inicio >= periodStart;
    return matchAgent && matchStatus && matchPeriod;
  });

  updateMetricsCards();
  renderExecutionChart();
  renderErrorChart();
  renderExecutionTable();
}

function refreshMonitoringData() {
  loadMonitoringData();
}

document.addEventListener('page-shown', (e) => {
  if (e.detail?.page === 'monitoramento') loadMonitoringData();
});
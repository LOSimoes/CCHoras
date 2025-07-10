document.addEventListener('DOMContentLoaded', () => {
  // 1. Seleciona os elementos da interface (DOM)
  const elements = {
    authModal: document.getElementById('auth-modal'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    showRegisterLink: document.getElementById('show-register'),
    showLoginLink: document.getElementById('show-login'),
    authErrorDiv: document.getElementById('auth-error'),
    logoutBtn: document.getElementById('logout-btn'),
    mainCalculatorDiv: document.querySelector('.calculator'),
    leaveRequestsPanel: document.getElementById('leave-requests-panel'),
    leaveRequestsList: document.getElementById('leave-requests-list'),
    newLeaveRequestBtn: document.getElementById('new-leave-request-btn'),
    leaveRequestModal: document.getElementById('leave-request-modal'),
    leaveRequestForm: document.getElementById('leave-request-form'),
    cancelLeaveRequestBtn: document.getElementById('cancel-leave-request-btn'),
    adminPanel: document.getElementById('admin-panel'),
    adminLeaveRequestsList: document.getElementById('admin-leave-requests-list'),
    updateLeaveLimitBtn: document.getElementById('update-leave-limit-btn'),
    adminUsersList: document.getElementById('admin-users-list'),
    editUserModal: document.getElementById('edit-user-modal'),
    editUserForm: document.getElementById('edit-user-form'),
    editUserId: document.getElementById('edit-user-id'),
    editUsername: document.getElementById('edit-username'),
    editUserPassword: document.getElementById('edit-user-password'),
    editUserError: document.getElementById('edit-user-error'),
    cancelEditUserBtn: document.getElementById('cancel-edit-user-btn'),
    dateSelector: document.getElementById('date-selector'),
    historyResult: document.getElementById('history-result').querySelector('strong'),
    monthSummary: document.getElementById('month-summary').querySelector('strong'),
    hoursContainer: document.getElementById('hours-container'),
    hoursForm: document.getElementById('hours-form'),
    addBtn: document.getElementById('add-hour-btn'),
    resultDiv: document.getElementById('result'),
    exportBtn: document.getElementById('export-btn'),
    chartCanvas: document.getElementById('week-chart'),
    errorDiv: document.getElementById('error'),
  };

  let authToken = localStorage.getItem('authToken');
  let isAdminUser = localStorage.getItem('isAdminUser') === 'true';
  let currentUserId = localStorage.getItem('currentUserId');
  let weekChartInstance = null; // Variável para guardar a instância do gráfico

  // 2. Funções Auxiliares
  // ======================

  const updateAllDisplays = (date) => {
    if (!authToken) {
      elements.historyResult.textContent = '0h 0m';
      elements.monthSummary.textContent = '0h 0m';
      if (weekChartInstance) {
        weekChartInstance.destroy();
        weekChartInstance = null;
      }
      return;
    }
    updateHistoryDisplay(date);
    updateMonthSummary(date);
    updateWeekChart(date);
    loadLeaveRequests();
    if (isAdminUser) {
      loadAdminLeaveRequests();
      loadAdminUsers();
    }
  };

  const formatLeaveStatus = (status) => {
    const statusMap = { pending: 'Pendente', approved: 'Aprovado', denied: 'Negado' };
    const colorMap = { pending: '#e0e0e0', approved: '#b9f6ca', denied: '#ff8a80' };
    return `<span style="color: ${colorMap[status] || '#fff'}">${statusMap[status] || 'Desconhecido'}</span>`;
  };

  const renderLeaveRequests = (requests, listElement, isAdminView) => {
    listElement.innerHTML = '';
    if (requests.length === 0) {
      listElement.innerHTML = '<li>Nenhum pedido encontrado.</li>';
      return;
    }
    requests.forEach(req => {
      const li = document.createElement('li');
      const adminButtons = isAdminView ? `<div>
        <button class="approve-btn" data-action="approved" data-id="${req._id}">Aprovar</button>
        <button class="deny-btn" data-action="denied" data-id="${req._id}">Negar</button>
        <button class="delete-btn" data-action="delete" data-id="${req._id}">Excluir</button>
      </div>` : '';
      li.innerHTML = `<span>${isAdminView ? `<b>${req.username}:</b> ` : ''}${req.date} - ${formatLeaveStatus(req.status)}</span> ${adminButtons}`;
      listElement.appendChild(li);
    });
  };

  const renderAdminUsers = (users) => {
    elements.adminUsersList.innerHTML = '';
    if (!users || users.length === 0) {
      elements.adminUsersList.innerHTML = '<li>Nenhum usuário encontrado.</li>';
      return;
    }
    users.forEach(user => {
      const li = document.createElement('li');
      // O admin pode editar a si mesmo, mas deve ter cuidado.
      const buttons = `<div>
        <button class="edit-user-btn" data-id="${user._id}" data-username="${user.username}">Editar</button>
      </div>`;
      li.innerHTML = `<span><b>${user.username}</b> ${user.isAdmin ? ' (Admin)' : ''}</span> ${buttons}`;
      elements.adminUsersList.appendChild(li);
    });
  };

  // Retorna a data de hoje no formato YYYY-MM-DD
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Formata um total de minutos para o formato "Xh Ym"
  const formatMinutes = (totalMinutes) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return '0h 0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Exibe uma mensagem de erro que desaparece após alguns segundos
  const showError = (message) => {
    elements.errorDiv.textContent = message;
    if (message) {
      setTimeout(() => { elements.errorDiv.textContent = ''; }, 3500);
    }
  };

  // Exibe uma mensagem de sucesso que desaparece
  const showSuccess = (message) => {
    elements.errorDiv.textContent = message;
    elements.errorDiv.classList.add('success');
    elements.errorDiv.classList.remove('error');
    if (message) {
      setTimeout(() => {
        elements.errorDiv.textContent = '';
        elements.errorDiv.classList.remove('success');
      }, 3500);
    }
  };

  // Converte uma string de tempo (ex: "2h30m") em minutos. Retorna null se o formato for inválido.
  const parseTimeToMinutes = (str) => {
    str = str.trim().toLowerCase().replace(',', '.');
    if (!str) return 0;

    // Formato: 8 ou 8.5 (assume que são horas)
    if (!isNaN(parseFloat(str)) && isFinite(str)) {
      return Math.round(parseFloat(str) * 60);
    }

    // Formato: 1:45
    if (str.includes(':')) {
      const [h, m] = str.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        return h * 60 + m;
      }
    }

    // Formato: 2h30m, 2.5h, 45m
    let totalMinutes = 0;
    const hourMatch = str.match(/(\d+(\.\d+)?)h/);
    const minuteMatch = str.match(/(\d+)m/);

    if (hourMatch) totalMinutes += parseFloat(hourMatch[1]) * 60;
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1], 10);

    if (hourMatch || minuteMatch) return Math.round(totalMinutes);

    return null; // Retorna null se nenhum formato for reconhecido
  };

  // Função centralizada para chamadas à API
  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido na resposta da API.' }));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    // Retorna o blob diretamente se for um download de arquivo
    if (response.headers.get('Content-Type')?.includes('csv')) {
      return response.blob();
    }

    return response.json();
  };

  // 3. Funções Principais da Aplicação
  // =================================

  const loadLeaveRequests = async () => {
    if (!authToken) return;
    try {
      const requests = await authenticatedFetch('/api/leave-requests');
      renderLeaveRequests(requests, elements.leaveRequestsList, false);
    } catch (err) {
      showError(err.message || 'Falha ao carregar pedidos de folga.');
    }
  };

  const loadAdminLeaveRequests = async () => {
    if (!authToken || !isAdminUser) return;
    try {
      const requests = await authenticatedFetch('/api/admin/leave-requests');
      renderLeaveRequests(requests, elements.adminLeaveRequestsList, true);
    } catch (err) {
      showError(err.message || 'Falha ao carregar pedidos para administração.');
    }
  };

  const loadAdminUsers = async () => {
    if (!authToken || !isAdminUser) return;
    try {
      const users = await authenticatedFetch('/api/admin/users');
      renderAdminUsers(users);
    } catch (err) {
      showError(err.message || 'Falha ao carregar usuários.');
    }
  };

  const updateHistoryDisplay = async (date) => {
    if (!authToken) return;
    try {
      const data = await authenticatedFetch(`/api/hours/${date}`);
      elements.historyResult.textContent = formatMinutes(data.totalMinutes || 0);
    } catch (err) {
      elements.historyResult.textContent = 'Erro';
      showError(err.message || 'Falha ao carregar dados do dia.');
    }
  };

  const updateMonthSummary = async (date) => {
    if (!authToken) return;
    if (!date) {
      elements.monthSummary.textContent = '0h 0m';
      return;
    }
    const [year, month] = date.split('-');
    try {
      const data = await authenticatedFetch(`/api/month-summary/${year}/${parseInt(month, 10)}`);
      elements.monthSummary.textContent = formatMinutes(data.totalMonthMinutes || 0);
    } catch (err) {
      elements.monthSummary.textContent = 'Erro';
      showError(err.message || 'Falha ao carregar resumo do mês.');
    }
  };

  const updateWeekChart = async (baseDateString) => {
    if (!authToken || !baseDateString || !elements.chartCanvas) return;

    const baseDate = new Date(baseDateString + 'T12:00:00Z'); // Usar meio-dia UTC para evitar problemas de fuso
    const dayOfWeek = baseDate.getUTCDay(); // 0 = Domingo, 1 = Segunda, etc.

    let weekHoursData = [0, 0, 0, 0, 0, 0, 0];
    try {
      const data = await authenticatedFetch(`/api/week-data/${baseDateString}`);
      weekHoursData = data.hours;
    } catch (err) {
      showError(err.message || 'Erro de conexão com o gráfico.');
    }

    // Destrói a instância antiga do gráfico, se existir
    if (weekChartInstance) {
      weekChartInstance.destroy();
    }

    // Prepara as cores para o gráfico, destacando o dia selecionado
    const backgroundColors = [];
    for (let i = 0; i < 7; i++) {
      // Usa uma cor mais opaca e forte para o dia selecionado
      backgroundColors.push(i === dayOfWeek ? 'rgba(229, 57, 53, 0.9)' : 'rgba(229, 57, 53, 0.6)');
    }

    // Cria o novo gráfico
    weekChartInstance = new Chart(elements.chartCanvas, {
      type: 'bar',
      data: {
        labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        datasets: [{
          label: 'Horas Trabalhadas',
          data: weekHoursData,
          backgroundColor: backgroundColors, // Usa o array de cores dinâmico
          borderColor: 'rgba(229, 57, 53, 1)', // var(--primary-red)
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => formatMinutes(Math.round(context.raw * 60))
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Horas', color: '#e0e0e0' },
            ticks: { color: '#e0e0e0' }, // var(--text-color)
            grid: { color: '#555' } // var(--border-color)
          },
          x: {
            ticks: { color: '#e0e0e0' }, // var(--text-color)
            grid: { display: false }
          }
        }
      }
    });
  };

  // Adiciona um novo campo de input de horas
  const addHourField = (focus = false) => {
    const group = document.createElement('div');
    group.className = 'input-group';
    group.innerHTML = `
      <input type="text" class="time-input" placeholder="Ex: 2h30m" aria-label="Horas">
      <button type="button" class="remove-btn" title="Remover campo">×</button>
    `;
    elements.hoursContainer.appendChild(group);
    // Foca no novo campo se solicitado, útil ao clicar no botão "+ Adicionar"
    if (focus) {
      group.querySelector('.time-input').focus();
    }
  };

  // Lida com o envio do formulário: calcula, salva e atualiza a interface
  const handleFormSubmit = async (e) => {
    if (!authToken) return;
    e.preventDefault();
    showError('');
    let totalMinutes = 0;
    let hasError = false;

    const inputs = elements.hoursContainer.querySelectorAll('.time-input');
    if (inputs.length === 0) {
      showError('Adicione pelo menos um campo de horas.');
      return;
    }

    for (const input of inputs) {
      const value = input.value;
      if (!value.trim()) continue;

      const parsedMinutes = parseTimeToMinutes(value);
      if (parsedMinutes === null) {
        showError(`Formato inválido: "${value}"`);
        input.focus();
        hasError = true;
        break;
      }
      totalMinutes += parsedMinutes;
    }

    if (hasError) {
      elements.resultDiv.textContent = 'Cálculo atual: 0h 0m';
      return;
    }

    elements.resultDiv.textContent = `Cálculo atual: ${formatMinutes(totalMinutes)}`;

    const selectedDate = elements.dateSelector.value;
    try {
      await authenticatedFetch(`/api/hours/${selectedDate}`, {
        method: 'POST',
        body: JSON.stringify({ totalMinutes })
      });
      updateAllDisplays(selectedDate);
    } catch (err) {
      showError(err.message || 'Erro de conexão ao salvar.');
    }
  };

  // Exporta o histórico do mês selecionado como um arquivo CSV
  const handleExport = async () => {
    if (!authToken) return;
    const selectedDate = elements.dateSelector.value;
    if (!selectedDate) {
      showError("Selecione uma data para definir o mês a ser exportado.");
      return;
    }
    const [year, month] = selectedDate.split('-');

    try {
      const blob = await authenticatedFetch(`/api/export/month/${year}/${parseInt(month, 10)}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `relatorio_horas_${year}-${month}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showError(err.message || 'Falha ao gerar o relatório.');
    }
  };

  const showAuthError = (message) => {
    elements.authErrorDiv.textContent = message;
    setTimeout(() => { elements.authErrorDiv.textContent = ''; }, 3500);
  };

  const updateUIVisibility = (isLoggedIn, isAdmin) => {
    elements.authModal.classList.toggle('is-visible', !isLoggedIn);
    elements.logoutBtn.classList.toggle('hidden', !isLoggedIn);
    elements.mainCalculatorDiv.classList.toggle('hidden', !isLoggedIn);
    elements.leaveRequestsPanel.classList.toggle('hidden', !isLoggedIn);
    elements.adminPanel.classList.toggle('hidden', !isAdmin);
  };

  const setLoggedInState = (token, isAdmin, userId) => {
    authToken = token;
    isAdminUser = isAdmin;
    currentUserId = userId;
    localStorage.setItem('authToken', token);
    localStorage.setItem('isAdminUser', String(isAdmin));
    localStorage.setItem('currentUserId', userId);

    updateUIVisibility(true, isAdmin);

    const today = getTodayString();
    elements.dateSelector.value = today;
    updateAllDisplays(today);
  };

  const setLoggedOutState = () => {
    authToken = null;
    isAdminUser = false;
    currentUserId = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdminUser');
    localStorage.removeItem('currentUserId');

    updateUIVisibility(false, false);
    updateAllDisplays(null);
  };

  // 4. Configuração dos Eventos
  // ==========================
  elements.addBtn.addEventListener('click', () => addHourField(true));
  elements.hoursForm.addEventListener('submit', handleFormSubmit);
  elements.exportBtn.addEventListener('click', handleExport);

  // Usa delegação de eventos para os botões de remover
  elements.hoursContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      if (elements.hoursContainer.querySelectorAll('.input-group').length > 1) {
        e.target.closest('.input-group').remove();
      } else {
        showError('É necessário pelo menos um campo.');
      }
    }
  });

  // Adiciona um novo campo de horas automaticamente ao digitar no último
  elements.hoursContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('time-input')) {
      const allInputs = Array.from(elements.hoursContainer.querySelectorAll('.time-input'));
      const lastInput = allInputs[allInputs.length - 1];

      // Se o usuário está digitando no último campo e ele não está vazio, adicione um novo.
      if (e.target === lastInput && e.target.value.trim() !== '') {
        addHourField(false); // Adiciona sem focar para não interromper a digitação
      }
    }
  });

  elements.dateSelector.addEventListener('change', () => {
    updateAllDisplays(elements.dateSelector.value);
    elements.resultDiv.textContent = 'Cálculo atual: 0h 0m';
    showError('');
  });

  // --- Event Listeners de Autenticação ---
  elements.showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    elements.loginForm.classList.add('hidden');
    elements.registerForm.classList.remove('hidden');
    elements.authErrorDiv.textContent = '';
  });

  elements.showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    elements.registerForm.classList.add('hidden');
    elements.loginForm.classList.remove('hidden');
    elements.authErrorDiv.textContent = '';
  });

  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
      const data = await authenticatedFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setLoggedInState(data.accessToken, data.isAdmin, data.userId);
    } catch (err) {
      showAuthError(err.message);
    }
  });

  elements.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
      await authenticatedFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      showAuthError('Registro bem-sucedido! Por favor, faça o login.');
      elements.registerForm.classList.add('hidden');
      elements.loginForm.classList.remove('hidden');
    } catch (err) {
      showAuthError(err.message);
    }
  });

  elements.logoutBtn.addEventListener('click', () => {
    setLoggedOutState();
  });

  // --- Event Listeners de Folgas ---
  elements.newLeaveRequestBtn.addEventListener('click', () => {
    elements.leaveRequestModal.classList.add('is-visible');
    elements.leaveRequestForm.reset();
  });

  elements.cancelLeaveRequestBtn.addEventListener('click', () => {
    elements.leaveRequestModal.classList.remove('is-visible');
  });

  elements.leaveRequestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('leave-request-date').value;
    const reason = document.getElementById('leave-request-reason').value;

    try {
      await authenticatedFetch('/api/leave-requests', {
        method: 'POST',
        body: JSON.stringify({ date, reason })
      });
      elements.leaveRequestModal.classList.remove('is-visible');
      loadLeaveRequests();
    } catch (err) {
      // Mostra o erro dentro do modal se ele ainda estiver visível
      const modalErrorTarget = elements.leaveRequestModal.querySelector('.error') || elements.errorDiv;
      modalErrorTarget.textContent = err.message;
      setTimeout(() => { modalErrorTarget.textContent = ''; }, 3500);
    }
  });

  elements.adminLeaveRequestsList.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    const action = e.target.dataset.action;
    if (!id || !action) return;

    if (action === 'delete') {
      if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
      try {
        await authenticatedFetch(`/api/admin/leave-requests/${id}`, { method: 'DELETE' });
        loadAdminLeaveRequests();
      } catch (err) {
        showError(err.message || 'Falha ao excluir.');
      }
    } else if (action) {
      try {
        await authenticatedFetch(`/api/admin/leave-requests/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: action })
        });
        loadAdminLeaveRequests();
      } catch (err) {
        showError(err.message || 'Falha ao atualizar status.');
      }
    }
  });

  // --- Event Listeners de Gerenciamento de Usuários ---
  elements.adminUsersList.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-user-btn')) {
      const userId = e.target.dataset.id;
      const username = e.target.dataset.username;

      elements.editUserId.value = userId;
      elements.editUsername.value = username;
      elements.editUserPassword.value = ''; // Limpa o campo de senha
      elements.editUserError.textContent = ''; // Limpa erros anteriores
      elements.editUserModal.classList.add('is-visible');
    }
  });

  elements.cancelEditUserBtn.addEventListener('click', () => {
    elements.editUserModal.classList.remove('is-visible');
  });

  elements.editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = elements.editUserId.value;
    const username = elements.editUsername.value;
    const newPassword = elements.editUserPassword.value;

    const body = { username };
    if (newPassword) {
      body.newPassword = newPassword;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      elements.editUserModal.classList.remove('is-visible');
      showSuccess(response.message || 'Usuário atualizado com sucesso!');
      
      // Se o admin editou a si mesmo, força o logout para evitar inconsistência de sessão
      if (id === currentUserId && body.username) {
        alert('Você alterou seu próprio nome de usuário. Para garantir a consistência da sessão, você será desconectado. Por favor, faça login novamente.');
        setLoggedOutState();
      } else {
        loadAdminUsers(); // Recarrega a lista de usuários
      }
    } catch (err) {
      elements.editUserError.textContent = err.message;
    }
  });

  elements.updateLeaveLimitBtn.addEventListener('click', async () => {
    const limit = parseInt(document.getElementById('leave-limit-input').value, 10);
    try {
      await authenticatedFetch('/api/admin/settings/leave-limit', {
        method: 'POST',
        body: JSON.stringify({ limit })
      });
      showSuccess('Limite de folgas atualizado com sucesso.');
    } catch (err) {
      showError(err.message);
    }
  });

  // 5. Inicialização da Aplicação
  const init = () => {
    if (authToken) {
      setLoggedInState(authToken, isAdminUser, currentUserId);
    } else {
      setLoggedOutState();
    }
  };

  init();
});

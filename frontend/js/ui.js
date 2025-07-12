// Este módulo controla todas as manipulações diretas do DOM.

import { formatMinutes, formatLeaveStatus } from './utils.js';

// 1. Centralized DOM Element Selection
export const elements = {
    // Auth
    authModal: document.getElementById('auth-modal'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    showRegisterLink: document.getElementById('show-register'),
    showLoginLink: document.getElementById('show-login'),
    authErrorDiv: document.getElementById('auth-error'),
    logoutBtn: document.getElementById('logout-btn'),

    // Main App
    mainCalculatorDiv: document.querySelector('.calculator'),
    dateSelector: document.getElementById('date-selector'),
    historyResult: document.getElementById('history-result').querySelector('strong'),
    monthSummary: document.getElementById('month-summary').querySelector('strong'),
    exportBtn: document.getElementById('export-btn'),

    // Hours Form
    hoursForm: document.getElementById('hours-form'),
    hoursContainer: document.getElementById('hours-container'),
    addBtn: document.getElementById('add-hour-btn'),
    resultDiv: document.getElementById('result'),
    errorDiv: document.getElementById('error'),

    // Leave Requests (User)
    leaveRequestsPanel: document.getElementById('leave-requests-panel'),
    leaveRequestsList: document.getElementById('leave-requests-list'),
    newLeaveRequestBtn: document.getElementById('new-leave-request-btn'),
    leaveRequestModal: document.getElementById('leave-request-modal'),
    leaveRequestForm: document.getElementById('leave-request-form'),
    cancelLeaveRequestBtn: document.getElementById('cancel-leave-request-btn'),

    // Admin Panel
    adminPanel: document.getElementById('admin-panel'),
    adminLeaveRequestsList: document.getElementById('admin-leave-requests-list'),
    adminUsersList: document.getElementById('admin-users-list'),
    updateLeaveLimitBtn: document.getElementById('update-leave-limit-btn'),
    leaveLimitInput: document.getElementById('leave-limit-input'),

    // Edit User Modal
    editUserModal: document.getElementById('edit-user-modal'),
    editUserForm: document.getElementById('edit-user-form'),
    editUserId: document.getElementById('edit-user-id'),
    editUsername: document.getElementById('edit-username'),
    editUserPassword: document.getElementById('edit-user-password'),
    editUserError: document.getElementById('edit-user-error'),
    cancelEditUserBtn: document.getElementById('cancel-edit-user-btn'),

    // Chart
    chartCanvas: document.getElementById('week-chart'),
};

// 2. UI Feedback Functions

/**
 * Exibe uma mensagem de erro que desaparece após alguns segundos.
 * @param {string} message A mensagem a ser exibida.
 * @param {HTMLElement} [target=elements.errorDiv] O elemento onde mostrar o erro.
 */
export const showError = (message, target = elements.errorDiv) => {
    target.textContent = message;
    target.classList.remove('success');
    target.classList.add('error');
    if (message) {
        setTimeout(() => { target.textContent = ''; }, 3500);
    }
};

/**
 * Exibe uma mensagem de sucesso que desaparece.
 * @param {string} message A mensagem a ser exibida.
 */
export const showSuccess = (message) => {
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

/**
 * Exibe uma mensagem informativa que desaparece.
 * @param {string} message A mensagem a ser exibida.
 * @param {HTMLElement} [target=elements.errorDiv] O elemento onde mostrar a mensagem.
 * @param {number} [duration=5000] Duração em milissegundos.
 */
export const showInfo = (message, target = elements.errorDiv, duration = 5000) => {
    target.textContent = message;
    target.classList.remove('success', 'error');
    target.classList.add('info'); // Adicione um estilo para .info no seu CSS se desejar
    if (message && duration > 0) {
        setTimeout(() => { target.textContent = ''; target.classList.remove('info'); }, duration);
    }
};

// 3. UI State and Visibility Management

/**
 * Controla a visibilidade dos principais componentes da UI com base no estado de login.
 * @param {boolean} isLoggedIn O usuário está logado?
 * @param {boolean} isAdmin O usuário é um administrador?
 */
export const updateUIVisibility = (isLoggedIn, isAdmin) => {
    elements.authModal.classList.toggle('is-visible', !isLoggedIn);
    elements.logoutBtn.classList.toggle('hidden', !isLoggedIn);
    elements.mainCalculatorDiv.classList.toggle('hidden', !isLoggedIn);
    elements.leaveRequestsPanel.classList.toggle('hidden', !isLoggedIn);
    elements.adminPanel.classList.toggle('hidden', !isAdmin);
};

/**
 * Alterna entre os formulários de login e registro.
 * @param {'login' | 'register'} formToShow O formulário a ser exibido.
 */
export const switchAuthForm = (formToShow) => {
    showError('', elements.authErrorDiv);
    if (formToShow === 'register') {
        elements.loginForm.classList.add('hidden');
        elements.registerForm.classList.remove('hidden');
    } else {
        elements.registerForm.classList.add('hidden');
        elements.loginForm.classList.remove('hidden');
    }
};

/**
 * Mostra ou esconde um modal.
 * @param {HTMLElement} modalElement O elemento do modal.
 * @param {boolean} show `true` para mostrar, `false` para esconder.
 */
export const toggleModal = (modalElement, show) => {
    modalElement.classList.toggle('is-visible', show);
};

// 4. Rendering Functions

/**
 * Renderiza a lista de pedidos de folga.
 * @param {Array<object>} requests A lista de pedidos.
 * @param {HTMLElement} listElement O elemento <ul> onde renderizar.
 * @param {boolean} isAdminView Se a visualização é de administrador (mostra botões).
 */
export const renderLeaveRequests = (requests, listElement, isAdminView) => {
    listElement.innerHTML = '';
    if (!requests || requests.length === 0) {
        listElement.innerHTML = '<li>Nenhum pedido encontrado.</li>';
        return;
    }
    requests.forEach(req => {
        const li = document.createElement('li');
        const adminButtons = isAdminView ? `
            <div>
                <button class="approve-btn" data-action="approved" data-id="${req._id}">Aprovar</button>
                <button class="deny-btn" data-action="denied" data-id="${req._id}">Negar</button>
                <button class="delete-btn" data-action="delete" data-id="${req._id}">Excluir</button>
            </div>` : '';
        
        const statusSpan = `<span class="status-badge status-${req.status}">${formatLeaveStatus(req.status)}</span>`;

        li.innerHTML = `
            <span>${isAdminView ? `<b>${req.username}:</b> ` : ''}${req.date} - ${statusSpan}</span>
            ${adminButtons}`;
        listElement.appendChild(li);
    });
};

/**
 * Renderiza a lista de usuários no painel de administração.
 * @param {Array<object>} users A lista de usuários.
 */
export const renderAdminUsers = (users) => {
    elements.adminUsersList.innerHTML = '';
    if (!users || users.length === 0) {
        elements.adminUsersList.innerHTML = '<li>Nenhum usuário encontrado.</li>';
        return;
    }
    users.forEach(user => {
        const li = document.createElement('li');
        const buttons = `
            <div>
                <button class="edit-user-btn" data-id="${user._id}" data-username="${user.username}">Editar</button>
            </div>`;
        li.innerHTML = `<span><b>${user.username}</b> ${user.isAdmin ? ' (Admin)' : ''}</span> ${buttons}`;
        elements.adminUsersList.appendChild(li);
    });
};

// 5. UI Update & Form Functions

export const updateHistoryDisplay = (totalMinutes) => elements.historyResult.textContent = formatMinutes(totalMinutes);
export const updateMonthSummary = (totalMinutes) => elements.monthSummary.textContent = formatMinutes(totalMinutes);
export const updateCurrentCalculation = (totalMinutes) => elements.resultDiv.textContent = `Cálculo atual: ${formatMinutes(totalMinutes)}`;

export const addHourField = (focus = false) => {
    const group = document.createElement('div');
    group.className = 'input-group';
    group.innerHTML = `
      <input type="text" class="time-input" placeholder="Ex: 2h30m" aria-label="Horas">
      <button type="button" class="remove-btn" title="Remover campo">×</button>
    `;
    elements.hoursContainer.appendChild(group);
    if (focus) {
        group.querySelector('.time-input').focus();
    }
};

export const resetHoursForm = () => {
    elements.hoursContainer.innerHTML = '';
    addHourField();
    updateCurrentCalculation(0);
    showError('');
};

export const populateEditUserModal = (userId, username) => {
    elements.editUserId.value = userId;
    elements.editUsername.value = username;
    elements.editUserPassword.value = '';
    showError('', elements.editUserError);
    toggleModal(elements.editUserModal, true);
};

export const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
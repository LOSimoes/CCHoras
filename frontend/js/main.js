// main.js - O ponto de entrada e orquestrador da aplicação.

// 1. Imports de todos os módulos
import * as api from './api.js';
import * as auth from './auth.js';
import * as ui from './ui.js';
import * as chart from './chart.js';
import * as utils from './utils.js';

// 2. Estado da Aplicação
const appState = {
    currentDate: utils.getTodayString(),
};

// 3. Funções de Lógica e Orquestração

/**
 * Atualiza todos os dados da tela com base na data selecionada.
 * É a função central para recarregar a UI.
 */
async function refreshAllDataForDate() {
    if (!auth.isAuthenticated()) return;

    try {
        const date = appState.currentDate;
        const [year, month] = date.split('-');
        const dayIndex = new Date(date + 'T12:00:00Z').getUTCDay();

        // Dispara todas as chamadas de API em paralelo para mais performance
        const [dayData, monthData, weekData] = await Promise.all([
            api.getHoursForDate(date),
            api.getMonthSummary(year, parseInt(month, 10)),
            api.getWeekData(date)
        ]);

        // Atualiza a UI com os dados recebidos
        ui.updateHistoryDisplay(dayData.totalMinutes);
        ui.updateMonthSummary(monthData.totalMonthMinutes);
        chart.updateChart(weekData.hours, dayIndex);

    } catch (error) {
        ui.showError(error.message || 'Não foi possível carregar os dados.');
    }
}

/**
 * Carrega e renderiza os dados específicos do painel de administração.
 */
async function refreshAdminData() {
    if (!auth.isAdmin()) return;
    try {
        const [leaveRequests, users] = await Promise.all([
            api.getAllLeaveRequests(),
            api.getAllUsers()
        ]);
        ui.renderLeaveRequests(leaveRequests, ui.elements.adminLeaveRequestsList, true);
        ui.renderAdminUsers(users);
    } catch (error) {
        ui.showError(error.message || 'Erro ao carregar dados de administração.');
    }
}

/**
 * Carrega e renderiza os dados específicos do usuário logado.
 */
async function refreshUserData() {
    try {
        const requests = await api.getMyLeaveRequests();
        ui.renderLeaveRequests(requests, ui.elements.leaveRequestsList, false);
    } catch (error) {
        ui.showError(error.message || 'Erro ao carregar seus pedidos de folga.');
    }
}

// 4. Configuração dos Event Listeners

function setupEventListeners() {
    // --- Autenticação ---
    ui.elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.querySelector('#login-username').value;
        const password = e.target.querySelector('#login-password').value;
        try {
            await auth.handleLogin(username, password);
            ui.updateUIVisibility(true, auth.isAdmin());
            ui.elements.dateSelector.value = appState.currentDate;
            await refreshAllDataForDate();
            await refreshUserData();
            if (auth.isAdmin()) {
                await refreshAdminData();
            }
        } catch (error) {
            ui.showError(error.message, ui.elements.authErrorDiv);
        }
    });

    ui.elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.querySelector('#register-username').value;
        const password = e.target.querySelector('#register-password').value;
        try {
            await api.register(username, password);
            ui.showError('Registro bem-sucedido! Por favor, faça o login.', ui.elements.authErrorDiv);
            ui.switchAuthForm('login');
        } catch (error) {
            ui.showError(error.message, ui.elements.authErrorDiv);
        }
    });

    ui.elements.logoutBtn.addEventListener('click', () => {
        auth.handleLogout();
        ui.updateUIVisibility(false, false);
    });

    ui.elements.showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); ui.switchAuthForm('register'); });
    ui.elements.showLoginLink.addEventListener('click', (e) => { e.preventDefault(); ui.switchAuthForm('login'); });

    // --- Aplicação Principal ---
    ui.elements.dateSelector.addEventListener('change', (e) => {
        appState.currentDate = e.target.value;
        ui.resetHoursForm();
        refreshAllDataForDate();
    });

    ui.elements.hoursForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let totalMinutes = 0;
        const inputs = ui.elements.hoursContainer.querySelectorAll('.time-input');

        for (const input of inputs) {
            const value = input.value;
            if (!value.trim()) continue;
            const parsed = utils.parseTimeToMinutes(value);
            if (parsed === null) {
                ui.showError(`Formato inválido: "${value}"`);
                input.focus();
                return;
            }
            totalMinutes += parsed;
        }

        try {
            await api.saveHoursForDate(appState.currentDate, totalMinutes);
            ui.showSuccess('Horas salvas com sucesso!');
            await refreshAllDataForDate();
        } catch (error) {
            ui.showError(error.message);
        }
    });

    ui.elements.hoursContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            if (ui.elements.hoursContainer.querySelectorAll('.input-group').length > 1) {
                e.target.closest('.input-group').remove();
            } else {
                ui.showError('É necessário pelo menos um campo.');
            }
        }
    });
    
    ui.elements.hoursContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('time-input')) {
            let totalMinutes = 0;
            const inputs = ui.elements.hoursContainer.querySelectorAll('.time-input');
            for (const input of inputs) {
                const parsed = utils.parseTimeToMinutes(input.value);
                if (parsed !== null) totalMinutes += parsed;
            }
            ui.updateCurrentCalculation(totalMinutes);
        }
    });

    ui.elements.addBtn.addEventListener('click', () => ui.addHourField(true));

    ui.elements.exportBtn.addEventListener('click', async () => {
        const [year, month] = appState.currentDate.split('-');
        try {
            const blob = await api.exportMonthCSV(year, parseInt(month, 10));
            ui.downloadFile(blob, `relatorio_horas_${year}-${month}.csv`);
        } catch (error) {
            ui.showError(error.message);
        }
    });

    // --- Pedidos de Folga (Usuário) ---
    ui.elements.newLeaveRequestBtn.addEventListener('click', () => { ui.toggleModal(ui.elements.leaveRequestModal, true); ui.elements.leaveRequestForm.reset(); });
    ui.elements.cancelLeaveRequestBtn.addEventListener('click', () => { ui.toggleModal(ui.elements.leaveRequestModal, false); });

    ui.elements.leaveRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = e.target.querySelector('#leave-request-date').value;
        const reason = e.target.querySelector('#leave-request-reason').value;
        try {
            await api.createLeaveRequest(date, reason);
            ui.toggleModal(ui.elements.leaveRequestModal, false);
            await refreshUserData();
        } catch (error) {
            ui.showError(error.message, ui.elements.leaveRequestModal.querySelector('.error'));
        }
    });

    // --- Painel de Administração ---
    ui.elements.adminLeaveRequestsList.addEventListener('click', async (e) => {
        const { id, action } = e.target.dataset;
        if (!id || !action) return;
        if (action === 'delete' && !confirm('Tem certeza que deseja excluir este pedido?')) return;
        try {
            if (action === 'delete') { await api.deleteLeaveRequest(id); } else { await api.updateLeaveRequestStatus(id, action); }
            await refreshAdminData();
        } catch (error) { ui.showError(error.message); }
    });

    ui.elements.adminUsersList.addEventListener('click', (e) => { if (e.target.classList.contains('edit-user-btn')) { const { id, username } = e.target.dataset; ui.populateEditUserModal(id, username); } });
    ui.elements.cancelEditUserBtn.addEventListener('click', () => { ui.toggleModal(ui.elements.editUserModal, false); });

    ui.elements.editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = ui.elements.editUserId.value;
        const username = ui.elements.editUsername.value;
        const newPassword = ui.elements.editUserPassword.value;
        const updateData = { username };
        if (newPassword) { updateData.newPassword = newPassword; }
        try {
            await api.updateUser(id, updateData);
            ui.toggleModal(ui.elements.editUserModal, false);
            ui.showSuccess('Usuário atualizado com sucesso!');

            // Se o admin editou o próprio nome de usuário, força o logout para evitar
            // inconsistência de sessão, pois o token JWT antigo se torna inválido.
            if (id === auth.getUserId() && updateData.username) {
                ui.showInfo('Nome de usuário alterado. Você será desconectado para aplicar a mudança.', ui.elements.errorDiv, 6000);
                // Adiciona um pequeno atraso para o usuário ler a mensagem antes do logout
                setTimeout(() => {
                    auth.handleLogout();
                    ui.updateUIVisibility(false, false);
                }, 2000);
            } else {
                await refreshAdminData();
            }
        } catch (error) { ui.showError(error.message, ui.elements.editUserError); }
    });

    ui.elements.updateLeaveLimitBtn.addEventListener('click', async () => {
        const limit = parseInt(ui.elements.leaveLimitInput.value, 10);
        try {
            await api.updateLeaveLimit(limit);
            ui.showSuccess('Limite de folgas atualizado.');
        } catch (error) { ui.showError(error.message); }
    });
}

// 5. Ponto de Entrada da Aplicação
function initializeApp() {
    auth.initAuth();
    chart.initChart(ui.elements.chartCanvas);
    ui.updateUIVisibility(auth.isAuthenticated(), auth.isAdmin());
    
    if (auth.isAuthenticated()) {
        ui.elements.dateSelector.value = appState.currentDate;
        refreshAllDataForDate();
        refreshUserData();
        if (auth.isAdmin()) {
            refreshAdminData();
        }
    }
    
    setupEventListeners();
}

// Inicia a aplicação quando o DOM estiver pronto.
document.addEventListener('DOMContentLoaded', initializeApp);
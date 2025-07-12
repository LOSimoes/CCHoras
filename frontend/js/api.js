// Este módulo centraliza toda a comunicação com o backend.

let authToken = null;

/**
 * Define o token de autenticação a ser usado nas requisições futuras.
 * @param {string | null} token O token JWT ou null para limpar.
 */
export const setAuthToken = (token) => {
  authToken = token;
};

/**
 * Função genérica e privada para fazer chamadas à API.
 * Adiciona o cabeçalho de autorização e trata erros comuns.
 * @param {string} url O endpoint da API.
 * @param {object} options Opções do fetch (method, body, etc.).
 * @returns {Promise<any>} A resposta da API em JSON ou um Blob.
 */
const apiFetch = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro de comunicação com o servidor.' }));
    throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
  }

  if (response.headers.get('Content-Type')?.includes('csv')) {
    return response.blob();
  }

  return response.json();
};

// --- Endpoints de Autenticação ---

export const login = (username, password) => 
  apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const register = (username, password) => 
  apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });

// --- Endpoints de Horas (Diário) ---

export const getHoursForDate = (date) =>
  apiFetch(`/api/hours/${date}`);

export const saveHoursForDate = (date, totalMinutes) =>
  apiFetch(`/api/hours/${date}`, { method: 'POST', body: JSON.stringify({ totalMinutes }) });

// --- Endpoints de Resumo e Relatórios ---

export const getWeekData = (baseDate) =>
  apiFetch(`/api/week-data/${baseDate}`);

export const getMonthSummary = (year, month) =>
  apiFetch(`/api/month-summary/${year}/${month}`);

export const exportMonthCSV = (year, month) =>
  apiFetch(`/api/export/month/${year}/${month}`);

// --- Endpoints de Pedidos de Folga (Usuário) ---

export const getMyLeaveRequests = () =>
  apiFetch('/api/leave-requests');

export const createLeaveRequest = (date, reason) =>
  apiFetch('/api/leave-requests', { method: 'POST', body: JSON.stringify({ date, reason }) });

// --- Endpoints de Administração (Folgas) ---

export const getAllLeaveRequests = () =>
  apiFetch('/api/admin/leave-requests');

export const updateLeaveRequestStatus = (id, status) =>
  apiFetch(`/api/admin/leave-requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

export const deleteLeaveRequest = (id) =>
  apiFetch(`/api/admin/leave-requests/${id}`, { method: 'DELETE' });

// --- Endpoints de Administração (Usuários e Configurações) ---

export const getAllUsers = () =>
  apiFetch('/api/admin/users');

export const updateUser = (id, updateData) =>
  apiFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(updateData) });

export const updateLeaveLimit = (limit) =>
  apiFetch('/api/admin/settings/leave-limit', { method: 'POST', body: JSON.stringify({ limit }) });
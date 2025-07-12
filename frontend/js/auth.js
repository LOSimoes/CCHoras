// Este módulo gerencia o estado de autenticação (login, logout, token).

import * as api from './api.js';

// O estado de autenticação é mantido em memória e sincronizado com o localStorage.
const state = {
    token: localStorage.getItem('authToken'),
    isAdmin: localStorage.getItem('isAdminUser') === 'true',
    userId: localStorage.getItem('currentUserId'),
};

/**
 * Tenta fazer login com as credenciais fornecidas.
 * Em caso de sucesso, atualiza o estado e o localStorage.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{isAdmin: boolean, userId: string}>} Os dados do usuário logado.
 */
export async function handleLogin(username, password) {
    const data = await api.login(username, password);
    
    // Atualiza o estado local e o localStorage
    state.token = data.accessToken;
    state.isAdmin = data.isAdmin;
    state.userId = data.userId;

    localStorage.setItem('authToken', state.token);
    localStorage.setItem('isAdminUser', String(state.isAdmin));
    localStorage.setItem('currentUserId', state.userId);

    // Configura o token no módulo da API para requisições futuras
    api.setAuthToken(state.token);

    return { isAdmin: state.isAdmin, userId: state.userId };
}

/**
 * Desloga o usuário, limpando o estado, o localStorage e o token da API.
 */
export function handleLogout() {
    // Limpa o estado local
    state.token = null;
    state.isAdmin = false;
    state.userId = null;

    // Limpa o localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdminUser');
    localStorage.removeItem('currentUserId');

    // Remove o token do módulo da API
    api.setAuthToken(null);
}

/**
 * Inicializa o estado de autenticação ao carregar a aplicação.
 * Verifica se há um token no localStorage e o configura na API.
 */
export function initAuth() {
    if (state.token) {
        api.setAuthToken(state.token);
    }
}

// Funções "getter" para que outros módulos possam consultar o estado de forma segura.
export const isAuthenticated = () => !!state.token;
export const isAdmin = () => state.isAdmin;
export const getUserId = () => state.userId;
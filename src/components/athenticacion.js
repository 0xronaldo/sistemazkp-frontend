// Funciones de autenticacion
// Maneja registro, login y logout

import api from './connissuer';
/**
 * Registra un nuevo usuario con email y password
 * @param {string} name - Nombre completo del usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Password del usuario
 * @returns {Promise} - Datos del usuario con DID y credencial
 */
export const registerUser = async (name, email, password) => {
    try {
        console.log('[Auth] Registrando usuario:', { name, email });
        
        const response = await api.post('/api/register', {
            name,
            email,
            password
        });

        const { did, user, zkpData, credential } = response.data;

        console.log('[Auth] Registro exitoso:', {
            did,
            userName: user.name,
            hasCredential: !!credential
        });

        // Guardar datos en localStorage
        const userData = {
            ...user,
            did,
            zkpData,
            credential
        };
        
        localStorage.setItem('zkp_user', JSON.stringify(userData));
        
        return userData;
    } catch (error) {
        console.error('[Auth] Error en registro:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Error al registrar usuario');
    }
};

/**
 * Inicia sesion con email y password
 * @param {string} email - Email del usuario
 * @param {string} password - Password del usuario
 * @returns {Promise} - Datos del usuario
 */
export const loginUser = async (email, password) => {
    try {
        console.log('[Auth] Iniciando sesion:', { email });
        
        const response = await api.post('/api/login', {
            email,
            password
        });

        const userData = response.data;
        
        console.log('[Auth] Login exitoso:', {
            userName: userData.user?.name,
            hasDID: !!userData.did
        });

        localStorage.setItem('zkp_user', JSON.stringify(userData));
        
        return userData;
    } catch (error) {
        console.error('[Auth] Error en login:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Error al iniciar sesion');
    }
};

/**
 * Cierra sesion del usuario
 */
export const logoutUser = () => {
    console.log('[Auth] Cerrando sesion');
    localStorage.removeItem('zkp_user');
    localStorage.removeItem('zkp_token');
};

/**
 * Obtiene el usuario guardado en localStorage
 * @returns {Object|null} - Usuario guardado o null
 */
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('zkp_user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    } catch (error) {
        console.error('[Auth] Error obteniendo usuario:', error);
        return null;
    }
};

/**
 * Verifica si hay un usuario autenticado
 * @returns {boolean} - true si hay usuario
 */
export const isAuthenticated = () => {
    return !!getCurrentUser();
};
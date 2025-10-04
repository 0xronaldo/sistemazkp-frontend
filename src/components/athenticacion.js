// Funciones de autenticacion
// Maneja registro, login y logout con almacenamiento seguro

import { apiClient, SessionManager } from './connissuer';

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
        
        // Validaciones
        if (!name || !email || !password) {
            throw new Error('Todos los campos son obligatorios');
        }
        
        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        
        const response = await apiClient.register(name, email, password);

        const { did, user, zkpData, credential, token } = response.data;

        console.log('[Auth] Registro exitoso:', {
            did,
            userName: user.name,
            hasCredential: !!credential
        });

        // Preparar datos del usuario
        const userData = {
            ...user,
            did,
            zkpData,
            credential,
            token,
            type: 'email-password',
            timestamp: Date.now()
        };
        
        // Guardar en sesion segura (Base64 + sessionStorage)
        SessionManager.saveUser(userData);
        
        return userData;
    } catch (error) {
        console.error('[Auth] Error en registro:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || error.message || 'Error al registrar usuario');
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
        
        if (!email || !password) {
            throw new Error('Email y contraseña son obligatorios');
        }
        
        const response = await apiClient.login(email, password);

        const { did, user, zkpData, credential, token } = response.data;
        
        console.log('[Auth] Login exitoso:', {
            userName: user?.name,
            hasDID: !!did
        });

        const userData = {
            ...user,
            did,
            zkpData,
            credential,
            token,
            type: 'email-password',
            timestamp: Date.now()
        };
        
        // Guardar en sesion segura
        SessionManager.saveUser(userData);
        
        return userData;
    } catch (error) {
        console.error('[Auth] Error en login:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            throw new Error('Email o contraseña incorrectos');
        } else if (error.response?.status === 404) {
            throw new Error('Usuario no encontrado');
        }
        
        throw new Error(error.response?.data?.error || error.message || 'Error al iniciar sesion');
    }
};

/**
 * Cierra sesion del usuario
 */
export const logoutUser = () => {
    console.log('[Auth] Cerrando sesion');
    
    // Intentar notificar al backend
    apiClient.logout().catch(err => {
        console.warn('[Auth] No se pudo notificar logout:', err.message);
    });
    
    // Limpiar sesion segura
    SessionManager.clearUser();
};

/**
 * Obtiene el usuario guardado en sesion
 * @returns {Object|null} - Usuario guardado o null
 */
export const getCurrentUser = () => {
    try {
        const user = SessionManager.getUser();
        
        if (user) {
            console.log('[Auth] Usuario actual:', user.email || user.walletAddress);
        }
        
        return user;
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
    return SessionManager.hasActiveSession();
};

/**
 * Renueva el timestamp de la sesion
 */
export const renewSession = () => {
    SessionManager.renewSession();
};

/**
 * Obtiene el DID del usuario actual
 * @returns {string|null} - DID o null
 */
export const getUserDID = () => {
    const user = getCurrentUser();
    return user?.did || null;
};

/**
 * Obtiene el email del usuario actual
 * @returns {string|null} - Email o null
 */
export const getUserEmail = () => {
    const user = getCurrentUser();
    return user?.email || null;
};
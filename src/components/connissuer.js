// Configuracion de axios para comunicacion con el BACKEND
// IMPORTANTE: No apuntar directamente al issuer node,
//  sino al backend Express
// El backend actua como proxy y maneja la logica

import axios from 'axios';

// ============================================
// UTILIDADES DE SEGURIDAD 
// ============================================

// Clave para ofuscar datos (en produccion usar variable de entorno)
const STORAGE_KEY = 'zkp_session_data';
const ENCRYPTION_SALT = 'zkp_salt_v1';

// Codificar datos a Base64
const encodeData = (data) => {
    try {
        const jsonString = JSON.stringify(data);
        const encoded = btoa(unescape(encodeURIComponent(jsonString)));
        // Agregar salt para ofuscar
        return `${ENCRYPTION_SALT}.${encoded}`;
    } catch (error) {
        console.error('[Encode Error]', error);
        return null;
    }
};

// Decodificar datos desde Base64
const decodeData = (encodedData) => {
    try {
        if (!encodedData || !encodedData.includes('.')) return null;
        
        const [salt, encoded] = encodedData.split('.');
        if (salt !== ENCRYPTION_SALT) return null;
        
        const decoded = decodeURIComponent(escape(atob(encoded)));
        return JSON.parse(decoded);
    } catch (error) {
        console.error('[Decode Error]', error);
        return null;
    }
};

// ============================================
// el uso de storage de forma encryptada
// CAMBIADO A localStorage para persistencia
// ============================================

export const SecureStorage = {
    // Guardar datos codificados en localStorage (persiste al cerrar navegador)
    setItem: (key, value) => {
        const encoded = encodeData(value);
        if (encoded) {
            localStorage.setItem(key, encoded); // ✅ Cambiado a localStorage
            return true;
        }
        return false;
    },
    
    // Obtener datos decodificados
    getItem: (key) => {
        const encoded = localStorage.getItem(key); // ✅ Cambiado a localStorage
        return encoded ? decodeData(encoded) : null;
    },
    
    // Eliminar dato
    removeItem: (key) => {
        localStorage.removeItem(key); // ✅ Cambiado a localStorage
    },
    
    // Limpiar todo
    clear: () => {
        localStorage.clear(); // ✅ Cambiado a localStorage
    }
};

// ============================================
// session de usuario
// ============================================

export const SessionManager = {
    // Guardar usuario en sesion (localStorage - persiste al cerrar navegador)
    saveUser: (userData) => {
        return SecureStorage.setItem(STORAGE_KEY, {
            user: userData,
            timestamp: Date.now(),
            expiresIn: 86400000 // 24 horas (en milisegundos)
        });
    },
    
    // Obtener usuario de sesion
    getUser: () => {
        const sessionData = SecureStorage.getItem(STORAGE_KEY);
        
        if (!sessionData) return null;
        
        // Verificar si la sesion expiro
        const elapsed = Date.now() - sessionData.timestamp;
        if (elapsed > sessionData.expiresIn) {
            console.warn('[Session] Sesion expirada');
            SessionManager.clearUser();
            return null;
        }
        
        return sessionData.user;
    },
    
    // Limpiar sesion
    clearUser: () => {
        SecureStorage.removeItem(STORAGE_KEY);
    },
    
    // Verificar si hay sesion activa
    hasActiveSession: () => {
        return SessionManager.getUser() !== null;
    },
    
    // Renovar timestamp de sesion
    renewSession: () => {
        const user = SessionManager.getUser();
        if (user) {
            SessionManager.saveUser(user);
        }
    }
};

// ============================================
// ENDPOINTS CENTRALIZADOS
// ============================================

export const API_ENDPOINTS = {
    // Autenticacion
    AUTH: {
        REGISTER: '/api/register',
        LOGIN: '/api/login',
        WALLET_AUTH: '/api/wallet-auth',
        LOGOUT: '/api/logout',
        VERIFY_SESSION: '/api/verify-session'
    },
/*    
    // Identidades (DIDs)
    IDENTITY: {
        CREATE: '/v2/identities',
        GET_BY_ID: (id) => `/v2/identities/${id}`,
        LIST: '/v2/identities'
    },
    
    // Credenciales
    CREDENTIALS: {
        CREATE: '/v2/credentials',
        GET_BY_ID: (id) => `/v2/credentials/${id}`,
        LIST: '/v2/credentials',
        REVOKE: (id) => `/v2/credentials/${id}/revoke`
    },
*/    
    // Pruebas ZKP
    PROOFS: {
        GENERATE: '/api/proofs/generate',
        VERIFY: '/api/proofs/verify'
    },
    
    // Usuario
    USER: {
        PROFILE: '/api/user/profile'
    }
};

// ============================================
// Cfg axios
// ============================================

const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Interceptor para requests
api.interceptors.request.use(
    (config) => {
        console.log('[API Request]', config.method.toUpperCase(), config.url);
        
        // Obtener usuario de sesion segura
        const user = SessionManager.getUser();
        
        // Si hay usuario con token, agregarlo
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        
        // Renovar sesion en cada request
        if (user) {
            SessionManager.renewSession();
        }
        
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Interceptor para responses
api.interceptors.response.use(
    (response) => {
        console.log('[API Response]', response.status, response.config.url);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error('[API Response Error]', {
                status: error.response.status,
                data: error.response.data,
                url: error.config?.url
            });
            
            // Si es 401, limpiar sesion y redirigir
            if (error.response.status === 401) {
                SessionManager.clearUser();
                window.location.href = '/';
            }
        } else if (error.request) {
            console.error('[API No Response]', error.request);
        } else {
            console.error('[API Setup Error]', error.message);
        }
        return Promise.reject(error);
    }
);

// ============================================
// FUNCIONES e2e
// ============================================

export const apiClient = {
    // Registro de usuario
    register: (name, email, password) => {
        return api.post(API_ENDPOINTS.AUTH.REGISTER, { name, email, password });
    },
    
    // Login con email/password
    login: (email, password) => {
        return api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    },
    
    // Autenticacion con wallet
    walletAuth: (walletAddress, signature) => {
        return api.post(API_ENDPOINTS.AUTH.WALLET_AUTH, { walletAddress, signature });
    },
    
    // Logout
    logout: () => {
        return api.post(API_ENDPOINTS.AUTH.LOGOUT);
    },
    
    // Crear identidad DID
    createIdentity: (identityData) => {
        return api.post(API_ENDPOINTS.IDENTITY.CREATE, identityData);
    },
    
    // Crear credencial
    createCredential: (credentialData) => {
        return api.post(API_ENDPOINTS.CREDENTIALS.CREATE, credentialData);
    },
    
    // Generar prueba ZKP
    generateProof: (proofData) => {
        return api.post(API_ENDPOINTS.PROOFS.GENERATE, proofData);
    },
    
    // Verificar prueba ZKP
    verifyProof: (proofData) => {
        return api.post(API_ENDPOINTS.PROOFS.VERIFY, proofData);
    },
    
    // Obtener perfil de usuario
    getUserProfile: () => {
        return api.get(API_ENDPOINTS.USER.PROFILE);
    }
};

export default api;


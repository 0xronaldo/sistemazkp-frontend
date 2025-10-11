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

        const { did, user, zkpData, credential } = response.data;

        console.log('[Auth] ✅ Registro exitoso');
        console.log('[Auth] 📄 DID creado:', did);
        console.log('[Auth] 📄 CREDENCIAL COMPLETA recibida:', JSON.stringify(credential, null, 2));
        console.log('[Auth] 🔐 Verificación ZKP:', user.zkpVerified ? 'VERIFICADA ✓' : 'NO VERIFICADA ✗');
        
        // Validar que la credencial tenga los campos necesarios
        if (!credential || !credential.credentialSubject) {
            console.error('[Auth] ❌ ERROR: Credencial incompleta - falta credentialSubject');
            throw new Error('El backend no devolvió una credencial válida');
        }
        if (!credential.issuer) {
            console.error('[Auth] ❌ ERROR: Credencial incompleta - falta issuer');
            throw new Error('La credencial no tiene issuer');
        }
        
        console.log('[Auth] ✓ Credencial validada correctamente');
        console.log('[Auth] ✓ credentialSubject:', credential.credentialSubject);
        console.log('[Auth] ✓ issuer:', credential.issuer);

        // Preparar datos del usuario igual que en wallet-auth
        const userData = {
            name: user.name,
            email: user.email,
            did: did,
            credential: credential, // Credencial completa W3C
            zkpData: zkpData,
            type: 'email-password',
            authMethod: 'email',
            state: user.state || 'active',
            timestamp: Date.now(),
            // Agregar verificación ZKP automática
            zkpVerified: user.zkpVerified || false,
            zkpVerificationDetails: user.zkpVerificationDetails || null
        };
        
        console.log('[Auth] 🔐 Verificación ZKP automática:', user.zkpVerified ? 'VERIFICADA ✓' : 'NO VERIFICADA ✗');
        if (user.zkpVerificationDetails) {
            console.log('[Auth] 📊 Detalles de verificación ZKP:', user.zkpVerificationDetails);
            if (user.zkpVerificationDetails.fullData) {
                console.log('[Auth] 📊 Datos completos de verificación disponibles');
            }
        }
        
        // Guardar en localStorage (persiste al cerrar navegador - 24h)
        const saved = SessionManager.saveUser(userData);
        console.log('[Auth] ✅ Usuario guardado en localStorage:', saved);
        console.log('[Auth] 📦 Datos almacenados:', {
            email: user.email,
            did: did,
            hasCredential: !!credential
        });
        
        return userData;
    } catch (error) {
        console.error('[Auth] Error en registro:', error.response?.data || error.message);
        
        // Mensajes detallados de error
        let errorMessage = 'Error al crear cuenta: ';
        
        if (error.response?.status === 400) {
            errorMessage = error.response.data.error || 'Datos inválidos o incompletos';
        } else if (error.response?.status === 500) {
            const serverError = error.response.data.error || error.response.data.details;
            
            if (serverError && serverError.includes('Issuer Node')) {
                errorMessage = '🔐 Error del sistema de credenciales ZKP:\n\n';
                errorMessage += serverError;
                errorMessage += '\n\n⚠️ No se puede crear una cuenta sin una credencial ZKP válida.';
            } else if (serverError && serverError.includes('DID')) {
                errorMessage = '🆔 Error al crear identidad descentralizada (DID):\n\n';
                errorMessage += serverError;
            } else {
                errorMessage += serverError || 'Error interno del servidor';
            }
        } else {
            errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        }
        
        throw new Error(errorMessage);
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

        const { did, user, zkpData, credential } = response.data;
        
        console.log('[Auth] ✅ Login exitoso - Credencial ZKP verificada');
        console.log('[Auth] 📄 DID recuperado:', did);
        console.log('[Auth] 📄 CREDENCIAL COMPLETA recuperada:', JSON.stringify(credential, null, 2));
        console.log('[Auth] 🔐 Verificación ZKP: VERIFICADA ✓');
        
        // Validar que la credencial tenga los campos necesarios
        if (!credential || !credential.credentialSubject) {
            console.error('[Auth] ❌ ERROR: Credencial incompleta - falta credentialSubject');
            throw new Error('El backend no devolvió una credencial válida');
        }
        if (!credential.issuer) {
            console.error('[Auth] ❌ ERROR: Credencial incompleta - falta issuer');
            throw new Error('La credencial no tiene issuer');
        }
        
        // Validar que la verificación ZKP fue exitosa (obligatorio para login)
        if (!user.zkpVerified) {
            console.error('[Auth] ❌ ERROR: Login sin verificación ZKP válida');
            throw new Error('Error de autenticación: La credencial ZKP no fue verificada');
        }
        
        console.log('[Auth] ✓ Credencial validada correctamente');
        console.log('[Auth] ✓ credentialSubject:', credential.credentialSubject);
        console.log('[Auth] ✓ issuer:', credential.issuer);

        // Preparar datos del usuario igual que en wallet-auth
        const userData = {
            name: user.name,
            email: user.email,
            did: did,
            credential: credential, // Credencial completa W3C
            zkpData: zkpData,
            type: 'email-password',
            authMethod: 'email',
            state: user.state || 'active',
            timestamp: Date.now(),
            // Agregar verificación ZKP automática
            zkpVerified: user.zkpVerified || false,
            zkpVerificationDetails: user.zkpVerificationDetails || null
        };
        
        console.log('[Auth] 🔐 Verificación ZKP automática:', user.zkpVerified ? 'VERIFICADA ✓' : 'NO VERIFICADA ✗');
        if (user.zkpVerificationDetails) {
            console.log('[Auth] 📊 Detalles de verificación ZKP:', user.zkpVerificationDetails);
            if (user.zkpVerificationDetails.fullData) {
                console.log('[Auth] 📊 Datos completos de verificación disponibles');
            }
        }
        
        // Guardar en sesion segura (localStorage - persiste 24h)
        const saved = SessionManager.saveUser(userData);
        console.log('[Auth] ✅ Datos guardados en localStorage:', saved);
        
        return userData;
    } catch (error) {
        console.error('[Auth] Error en login:', error.response?.data || error.message);
        
        // Manejo específico para errores de verificación ZKP con mensajes detallados
        if (error.response?.data?.zkpVerificationFailed) {
            const errorData = error.response.data;
            let userMessage = errorData.error || '🔐 Verificación ZKP fallida';
            
            if (errorData.details) {
                userMessage += '\n\n📋 Detalles: ' + errorData.details;
            }
            
            if (errorData.stage) {
                userMessage += '\n\n⚠️ Etapa de error: ' + errorData.stage;
            }
            
            if (errorData.technicalReason) {
                userMessage += '\n\n🔧 Razón técnica: ' + errorData.technicalReason;
            }
            
            throw new Error(userMessage);
        }
        
        if (error.response?.data?.zkpVerificationError) {
            const errorData = error.response.data;
            let userMessage = errorData.error || '🔐 Error al verificar credencial';
            
            if (errorData.details) {
                userMessage += '\n\n' + errorData.details;
            }
            
            if (errorData.solution) {
                userMessage += '\n\n💡 Solución: ' + errorData.solution;
            }
            
            throw new Error(userMessage);
        }
        
        if (error.response?.data?.requiresCredential) {
            const errorData = error.response.data;
            let userMessage = errorData.error || 'No tienes una credencial ZKP válida';
            
            if (errorData.reason) {
                userMessage += '\n\nCódigo: ' + errorData.reason;
            }
            
            throw new Error(userMessage);
        }
        
        // Errores estándar
        if (error.response?.status === 401) {
            throw new Error(error.response.data.error || 'Email o contraseña incorrectos');
        } else if (error.response?.status === 404) {
            throw new Error('Usuario no encontrado');
        } else if (error.response?.status === 503) {
            throw new Error(error.response.data.error || 'Servicio temporalmente no disponible');
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
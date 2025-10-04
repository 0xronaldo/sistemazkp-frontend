// Logica de autenticacion con wallet (MetaMask)
// Maneja conexion, firma y autenticacion con blockchain
// Usa SessionManager para almacenamiento seguro

import { apiClient, SessionManager } from './connissuer';

/**
 * Verifica si MetaMask esta instalado
 * @returns {boolean} - true si MetaMask esta disponible
 */
export const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
};

/**
 * Solicita conexion a MetaMask y obtiene la direccion de la wallet
 * @returns {Promise<string>} - Direccion de la wallet
 */
export const connectWallet = async () => {
    try {
        if (!isMetaMaskInstalled()) {
            throw new Error('MetaMask no esta instalado. Por favor instala MetaMask.');
        }

        console.log('[Wallet] Solicitando conexion a MetaMask...');

        // Solicitar acceso a las cuentas
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
            throw new Error('No se pudo obtener ninguna cuenta de MetaMask');
        }

        const walletAddress = accounts[0];
        console.log('[Wallet] Wallet conectada:', walletAddress);

        return walletAddress;
    } catch (error) {
        console.error('[Wallet] Error conectando wallet:', error);
        
        if (error.code === 4001) {
            throw new Error('Usuario rechazo la conexion a MetaMask');
        }
        
        throw error;
    }
};

/**
 * Autentica al usuario usando su wallet
 * Crea o recupera un DID asociado a la wallet address
 * @param {string} walletAddress - Direccion de la wallet
 * @param {string} signature - Firma opcional para verificacion
 * @returns {Promise} - Datos del usuario con DID
 */
export const authenticateWithWallet = async (walletAddress, signature = null) => {
    try {
        console.log('[Wallet] Autenticando con wallet:', walletAddress);

        const response = await apiClient.walletAuth(walletAddress, signature);

        const { did, user, zkpData, credential, token } = response.data;

        console.log('[Wallet] Autenticacion exitosa:', {
            did,
            walletAddress,
            hasCredential: !!credential
        });
        
        console.log('[Wallet] 📄 CREDENCIAL COMPLETA recibida:', JSON.stringify(credential, null, 2));
        
        // Validar que la credencial tenga los campos necesarios
        if (credential && !credential.credentialSubject) {
            console.warn('[Wallet] ⚠️ ADVERTENCIA: Credencial incompleta - falta credentialSubject');
        }
        if (credential && !credential.issuer) {
            console.warn('[Wallet] ⚠️ ADVERTENCIA: Credencial incompleta - falta issuer');
        }

        // Preparar datos del usuario
        const userData = {
            ...user,
            did,
            zkpData,
            credential,
            walletAddress,
            token,
            type: 'wallet',
            timestamp: Date.now()
        };
        
        // Guardar en sesion segura (Base64 + sessionStorage)
        SessionManager.saveUser(userData);
        
        return userData;
    } catch (error) {
        console.error('[Wallet] Error en autenticacion:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || error.message || 'Error autenticando con wallet');
    }
};

/**
 * Solicita firma de un mensaje con MetaMask
 * Util para verificar propiedad de la wallet
 * @param {string} walletAddress - Direccion de la wallet
 * @param {string} message - Mensaje a firmar (por defecto usa timestamp)
 * @returns {Promise<string>} - Firma del mensaje
 */
export const signMessage = async (walletAddress, message = null) => {
    try {
        if (!isMetaMaskInstalled()) {
            throw new Error('MetaMask no esta instalado');
        }

        // Si no se proporciona mensaje, usar uno por defecto con timestamp
        const messageToSign = message || `Autenticacion ZKP - ${Date.now()}`;

        console.log('[Wallet] Solicitando firma de mensaje...');

        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [messageToSign, walletAddress]
        });

        console.log('[Wallet] Mensaje firmado exitosamente');
        return signature;
    } catch (error) {
        console.error('[Wallet] Error firmando mensaje:', error);
        
        if (error.code === 4001) {
            throw new Error('Usuario rechazo la firma del mensaje');
        }
        
        throw error;
    }
};

/**
 * Obtiene el balance de ETH de una wallet
 * @param {string} walletAddress - Direccion de la wallet
 * @returns {Promise<string>} - Balance en ETH
 */
export const getWalletBalance = async (walletAddress) => {
    try {
        if (!isMetaMaskInstalled()) {
            throw new Error('MetaMask no esta instalado');
        }

        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [walletAddress, 'latest']
        });

        // Convertir de wei a ETH
        const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
        return ethBalance.toFixed(4);
    } catch (error) {
        console.error('[Wallet] Error obteniendo balance:', error);
        throw error;
    }
};

/**
 * Obtiene la red actual de MetaMask
 * @returns {Promise<string>} - Chain ID
 */
export const getCurrentChain = async () => {
    try {
        if (!isMetaMaskInstalled()) {
            throw new Error('MetaMask no esta instalado');
        }

        const chainId = await window.ethereum.request({
            method: 'eth_chainId'
        });

        return chainId;
    } catch (error) {
        console.error('[Wallet] Error obteniendo chain:', error);
        throw error;
    }
};

/**
 * Detecta cambios en la cuenta de MetaMask
 * @param {function} callback - Funcion a ejecutar cuando cambia la cuenta
 */
export const onAccountsChanged = (callback) => {
    if (isMetaMaskInstalled()) {
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('[Wallet] Cuenta cambiada:', accounts[0]);
            
            // Si el usuario desconecto todas las cuentas
            if (accounts.length === 0) {
                SessionManager.clearUser();
                callback(null);
            } else {
                callback(accounts[0]);
            }
        });
    }
};

/**
 * Detecta cambios en la red de MetaMask
 * @param {function} callback - Funcion a ejecutar cuando cambia la red
 */
export const onChainChanged = (callback) => {
    if (isMetaMaskInstalled()) {
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('[Wallet] Red cambiada:', chainId);
            callback(chainId);
            
            // Recargar la pagina cuando cambia la red (recomendado por MetaMask)
            window.location.reload();
        });
    }
};

/**
 * Conecta y autentica con wallet en un solo paso
 * Opcionalmente solicita firma para mayor seguridad
 * @param {boolean} requireSignature - Si se requiere firma del usuario
 * @returns {Promise} - Datos del usuario autenticado
 */
export const connectAndAuthenticate = async (requireSignature = false) => {
    try {
        // 1. Conectar wallet
        const walletAddress = await connectWallet();
        
        // 2. Opcionalmente solicitar firma
        let signature = null;
        if (requireSignature) {
            const message = `Autenticar en Sistema ZKP\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
            signature = await signMessage(walletAddress, message);
        }
        
        // 3. Autenticar con el backend
        const userData = await authenticateWithWallet(walletAddress, signature);
        
        return userData;
    } catch (error) {
        console.error('[Wallet] Error en proceso completo:', error);
        throw error;
    }
};
/**
 * ZKP GENERATOR - Generación de pruebas Zero-Knowledge usando Polygon ID SDK
 * 
 * Flujo:
 * 1. Usuario tiene credencial del Issuer Node
 * 2. Frontend genera prueba ZKP
 * 3. Backend verifica la prueba
 */

import { 
  core,
  iden3comm,
  proof,
  credentials
} from '@0xpolygonid/js-sdk';

/**
 * Generar prueba ZKP para verificación de usuario
 * @param {Object} credential - Credencial verificable del usuario
 * @param {string} issuerDID - DID del emisor
 * @param {Object} query - Query para la prueba (ej: authMethod, isVerified)
 * @returns {Promise<Object>} - Prueba ZKP generada
 */
export async function generateVerificationProof(credential, issuerDID, query) {
    try {
        console.log('[ZKP] Generando prueba de verificación...');
        console.log('[ZKP] Query:', query);

        // Configurar el proof request
        const proofReq = {
            circuitId: 'credentialAtomicQueryMTPV2',
            id: Math.floor(Math.random() * 1000000),
            query: {
                allowedIssuers: [issuerDID],
                context: 'ipfs://QmXAHpXSPcj2J7wreCkKkvvXgT67tbQDvFxmTHudXQYBEp',
                type: 'ZKPAuthCredential',
                credentialSubject: query
            }
        };

        console.log('[ZKP] Proof request configurado:', proofReq);

        // Generar la prueba
        const zkProof = await proof.generateProof(proofReq, credential);

        console.log('[ZKP] ✅ Prueba generada exitosamente');

        return {
            proof: zkProof,
            query: query,
            circuitId: proofReq.circuitId,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('[ZKP] ❌ Error generando prueba:', error);
        throw new Error(`Error al generar prueba ZKP: ${error.message}`);
    }
}

/**
 * Generar prueba de método de autenticación
 * @param {Object} credential - Credencial del usuario
 * @param {string} issuerDID - DID del emisor
 * @param {string} authMethod - 'wallet' o 'email'
 * @returns {Promise<Object>} - Prueba ZKP
 */
export async function generateAuthMethodProof(credential, issuerDID, authMethod = 'wallet') {
    const query = {
        authMethod: {
            $eq: authMethod
        }
    };

    return generateVerificationProof(credential, issuerDID, query);
}

/**
 * Generar prueba de cuenta verificada
 * @param {Object} credential - Credencial del usuario
 * @param {string} issuerDID - DID del emisor
 * @returns {Promise<Object>} - Prueba ZKP
 */
export async function generateIsVerifiedProof(credential, issuerDID) {
    const query = {
        isVerified: {
            $eq: true
        }
    };

    return generateVerificationProof(credential, issuerDID, query);
}

/**
 * Generar prueba de estado de cuenta
 * @param {Object} credential - Credencial del usuario
 * @param {string} issuerDID - DID del emisor
 * @param {string} state - Estado esperado (ej: 'active')
 * @returns {Promise<Object>} - Prueba ZKP
 */
export async function generateAccountStateProof(credential, issuerDID, state = 'active') {
    const query = {
        accountState: {
            $eq: state
        }
    };

    return generateVerificationProof(credential, issuerDID, query);
}

/**
 * Generar prueba de antigüedad de cuenta
 * @param {Object} credential - Credencial del usuario
 * @param {string} issuerDID - DID del emisor
 * @param {number} minDays - Días mínimos de antigüedad
 * @returns {Promise<Object>} - Prueba ZKP
 */
export async function generateAccountAgeProof(credential, issuerDID, minDays = 30) {
    const minTimestamp = Math.floor(Date.now() / 1000) - (minDays * 24 * 60 * 60);
    
    const query = {
        registrationDate: {
            $lt: minTimestamp
        }
    };

    return generateVerificationProof(credential, issuerDID, query);
}

/**
 * Generar prueba combinada (múltiples condiciones)
 * @param {Object} credential - Credencial del usuario
 * @param {string} issuerDID - DID del emisor
 * @param {Object} conditions - Condiciones a probar
 * @returns {Promise<Object>} - Prueba ZKP
 */
export async function generateCombinedProof(credential, issuerDID, conditions) {
    const query = {};

    if (conditions.isVerified !== undefined) {
        query.isVerified = { $eq: conditions.isVerified };
    }

    if (conditions.accountState) {
        query.accountState = { $eq: conditions.accountState };
    }

    if (conditions.authMethod) {
        query.authMethod = { $eq: conditions.authMethod };
    }

    if (conditions.minAge) {
        const minTimestamp = Math.floor(Date.now() / 1000) - (conditions.minAge * 24 * 60 * 60);
        query.registrationDate = { $lt: minTimestamp };
    }

    return generateVerificationProof(credential, issuerDID, query);
}

/**
 * Preparar credencial para el SDK
 * @param {Object} credentialData - Datos de la credencial del backend
 * @returns {Object} - Credencial formateada para el SDK
 */
export function prepareCredentialForSDK(credentialData) {
    // El SDK espera la credencial en formato W3C VC
    return {
        '@context': credentialData['@context'],
        type: credentialData.type,
        credentialSubject: credentialData.credentialSubject,
        credentialSchema: credentialData.credentialSchema,
        issuer: credentialData.issuer || credentialData.credentialSubject?.id,
        issuanceDate: credentialData.issuanceDate,
        expirationDate: credentialData.expirationDate
    };
}

/**
 * Enviar prueba ZKP al backend para verificación
 * @param {Object} proof - Prueba ZKP generada
 * @param {string} backendUrl - URL del backend
 * @returns {Promise<Object>} - Resultado de la verificación
 */
export async function sendProofToBackend(proof, backendUrl = 'http://localhost:5000') {
    try {
        console.log('[ZKP] Enviando prueba al backend...');

        const response = await fetch(`${backendUrl}/verify-proof`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                proof: proof.proof,
                circuitId: proof.circuitId,
                query: proof.query
            })
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const result = await response.json();
        console.log('[ZKP] ✅ Respuesta del backend:', result);

        return result;

    } catch (error) {
        console.error('[ZKP] ❌ Error enviando prueba:', error);
        throw error;
    }
}

/**
 * Flujo completo: Generar y verificar prueba
 * @param {Object} credential - Credencial del usuario
 * @param {string} issuerDID - DID del emisor
 * @param {Object} query - Query para la prueba
 * @returns {Promise<boolean>} - true si la prueba es válida
 */
export async function generateAndVerifyProof(credential, issuerDID, query) {
    try {
        // 1. Preparar credencial
        const preparedCred = prepareCredentialForSDK(credential);

        // 2. Generar prueba
        const proof = await generateVerificationProof(preparedCred, issuerDID, query);

        // 3. Enviar al backend para verificación
        const result = await sendProofToBackend(proof);

        return result.verified === true;

    } catch (error) {
        console.error('[ZKP] Error en flujo completo:', error);
        return false;
    }
}

// Exportar todas las funciones
export default {
    generateVerificationProof,
    generateAuthMethodProof,
    generateIsVerifiedProof,
    generateAccountStateProof,
    generateAccountAgeProof,
    generateCombinedProof,
    prepareCredentialForSDK,
    sendProofToBackend,
    generateAndVerifyProof
};

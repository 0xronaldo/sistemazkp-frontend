/**
 * ZKP Generator - Simplificado para Producción
 * 
 * ARQUITECTURA:
 * - Frontend: Envía credenciales al backend
 * - Backend: Genera y verifica proofs ZKP usando Polygon ID SDK
 * 
 * Esta es la arquitectura correcta para Polygon ID:
 * El SDK completo requiere Node.js y no funciona bien en navegadores
 */

/**
 * Verifica una credencial enviándola al backend
 * El backend generará el proof ZKP y lo verificará
 * 
 * @param {Object} credential - Credencial W3C del usuario
 * @param {string} issuerDID - DID del emisor
 * @returns {Promise<Object>} - Resultado de la verificación con proof
 */
export async function verifyCredential(credential, issuerDID) {
    try {
        console.log('🔐 [ZKP] Iniciando verificación de credencial...');
        console.log('📄 [ZKP] Credencial a verificar:', {
            id: credential.id,
            issuer: credential.issuer,
            hasSubject: !!credential.credentialSubject,
            subjectId: credential.credentialSubject?.id
        });
        console.log('📝 [ZKP] Issuer DID:', issuerDID);

        const response = await fetch('http://localhost:5000/api/verify-credential', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credential: credential,
                issuerDID: issuerDID
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ [ZKP] Error del backend:', data);
            return {
                success: false,
                verified: false,
                error: data.error || 'Error verificando credencial',
                message: data.message || 'La verificación falló',
                stage: data.stage
            };
        }

        console.log('✅ [ZKP] Verificación completada:', {
            verified: data.verified,
            hasProof: !!data.proof,
            hasFullData: !!data.fullData,
            method: data.proof?.method
        });
        
        return {
            success: data.success !== false,
            verified: data.verified,
            proof: data.proof,
            fullData: data.fullData, // ← IMPORTANTE: Pasar datos completos para JSON viewer
            message: data.message || 'Credencial verificada correctamente',
            warning: data.warning,
            localVerification: data.localVerification
        };
    } catch (error) {
        console.error('❌ [ZKP] Error en verificación:', error.message);
        return {
            success: false,
            verified: false,
            error: error.message,
            message: `Error de conexión: ${error.message}`
        };
    }
}

/**
 * Alias para compatibilidad con código existente
 */
export async function generateIsVerifiedProof(credential, issuerDID) {
    return verifyCredential(credential, issuerDID);
}

/**
 * Alias para compatibilidad con código existente
 */
export async function generateAuthMethodProof(credential, issuerDID) {
    return verifyCredential(credential, issuerDID);
}

/**
 * Alias para compatibilidad con código existente
 */
export async function generateAccountStateProof(credential, issuerDID) {
    return verifyCredential(credential, issuerDID);
}

/**
 * Ya no necesario - la verificación se hace directamente
 * Mantenido para compatibilidad
 */
export async function sendProofToBackend(proof) {
    return proof;
}

// Exportación por defecto
export default {
    verifyCredential,
    generateIsVerifiedProof,
    generateAuthMethodProof,
    generateAccountStateProof,
    sendProofToBackend
};

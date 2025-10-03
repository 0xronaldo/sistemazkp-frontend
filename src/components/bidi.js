// Utilidades para trabajar con DIDs (Decentralized Identifiers)
// Funciones helper para formatear, validar y trabajar con DIDs

/**
 * Valida si un string es un DID valido
 * @param {string} did - DID a validar
 * @returns {boolean} - true si es valido
 */
export const isValidDID = (did) => {
    if (!did || typeof did !== 'string') {
        return false;
    }
    
    // Formato basico: did:method:network:identifier
    const didRegex = /^did:[a-z0-9]+:[a-z0-9]+:.+$/i;
    return didRegex.test(did);
};

/**
 * Extrae el metodo de un DID (polygonid, ethr, key, etc)
 * @param {string} did - DID completo
 * @returns {string|null} - Metodo del DID
 */
export const getDIDMethod = (did) => {
    if (!isValidDID(did)) {
        return null;
    }
    
    const parts = did.split(':');
    return parts[1] || null;
};

/**
 * Extrae la red/network de un DID
 * @param {string} did - DID completo
 * @returns {string|null} - Network del DID
 */
export const getDIDNetwork = (did) => {
    if (!isValidDID(did)) {
        return null;
    }
    
    const parts = did.split(':');
    return parts[2] || null;
};

/**
 * Extrae el identificador unico de un DID
 * @param {string} did - DID completo
 * @returns {string|null} - Identificador
 */
export const getDIDIdentifier = (did) => {
    if (!isValidDID(did)) {
        return null;
    }
    
    const parts = did.split(':');
    return parts.slice(3).join(':') || null;
};

/**
 * Formatea un DID para mostrar (version corta)
 * Ejemplo: did:polygonid:polygon:amoy:2qXYZ... -> did:...2qXYZ...
 * @param {string} did - DID completo
 * @param {number} charsToShow - Caracteres a mostrar al final
 * @returns {string} - DID formateado
 */
export const formatDIDShort = (did, charsToShow = 8) => {
    if (!isValidDID(did)) {
        return 'Invalid DID';
    }
    
    const identifier = getDIDIdentifier(did);
    if (!identifier || identifier.length <= charsToShow) {
        return did;
    }
    
    return `did:...${identifier.slice(-charsToShow)}`;
};

/**
 * Parsea un DID completo y retorna sus componentes
 * @param {string} did - DID completo
 * @returns {Object} - Objeto con componentes del DID
 */
export const parseDID = (did) => {
    if (!isValidDID(did)) {
        return null;
    }
    
    return {
        full: did,
        method: getDIDMethod(did),
        network: getDIDNetwork(did),
        identifier: getDIDIdentifier(did),
        isValid: true
    };
};

/**
 * Compara dos DIDs para ver si son iguales
 * @param {string} did1 - Primer DID
 * @param {string} did2 - Segundo DID
 * @returns {boolean} - true si son iguales
 */
export const compareDIDs = (did1, did2) => {
    if (!isValidDID(did1) || !isValidDID(did2)) {
        return false;
    }
    
    return did1.toLowerCase() === did2.toLowerCase();
};

/**
 * Genera un formato de visualizacion completo del DID
 * @param {string} did - DID completo
 * @returns {Object} - Objeto con informacion formateada
 */
export const getDIDDisplayInfo = (did) => {
    const parsed = parseDID(did);
    
    if (!parsed) {
        return {
            valid: false,
            short: 'Invalid',
            full: did
        };
    }
    
    return {
        valid: true,
        short: formatDIDShort(did),
        full: did,
        method: parsed.method,
        network: parsed.network,
        identifier: parsed.identifier
    };
}; 
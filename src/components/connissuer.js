// Configuracion de axios para comunicacion con el BACKEND
// IMPORTANTE: No apuntar directamente al issuer node, sino a nuestro backend Express
// El backend actua como proxy y maneja la logica de seguridad

import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 15 segundos timeout
});

// Interceptor para requests - logging y manejo de errores
api.interceptors.request.use(
    (config) => {
        console.log('[API Request]', config.method.toUpperCase(), config.url);
        
        // Agregar token si existe en localStorage
        const token = localStorage.getItem('zkp_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Interceptor para responses - logging y manejo de errores
api.interceptors.response.use(
    (response) => {
        console.log('[API Response]', response.status, response.config.url);
        return response;
    },
    (error) => {
        if (error.response) {
            // El servidor respondio con un status code fuera del rango 2xx
            console.error('[API Response Error]', {
                status: error.response.status,
                data: error.response.data,
                url: error.config?.url
            });
        } else if (error.request) {
            // La request se hizo pero no hubo respuesta
            console.error('[API No Response]', error.request);
        } else {
            // Algo paso al configurar la request
            console.error('[API Setup Error]', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;


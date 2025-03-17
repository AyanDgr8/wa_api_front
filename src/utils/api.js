// src/utils/api.js
import axios from 'axios';
import { getDeviceId, clearDeviceId } from './device';
// With direct console usage:
const logger = console;
const apiUrl = process.env.REACT_APP_API_URL;

const api = axios.create({
    baseURL: apiUrl
});

let isLoggingOut = false;

// Function to handle logout
const handleLogout = async (message, force = false) => {
    if (isLoggingOut) return; // Prevent multiple logouts
    isLoggingOut = true;

    logger.info('Handling logout:', { message, force });

    try {
        const token = localStorage.getItem('token');
        if (token && !force) {
            await api.post('/logout', null, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': getDeviceId()
                }
            });
        }
    } catch (error) {
        logger.error('Error during logout:', error);
    } finally {
        localStorage.clear();
        sessionStorage.clear();
        clearDeviceId();
        
        if (message) {
            alert(message);
        }
        window.location.href = '/login';
        isLoggingOut = false;
    }
};

// Function to check session status
const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token || isLoggingOut) return;
    
    try {
        await api.get('/check-session', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-device-id': getDeviceId()
            }
        });
    } catch (error) {
        if (error.response?.status === 401) {
            const forceLogout = error.response?.data?.forceLogout;
            const message = error.response?.data?.message;
            handleLogout(message, forceLogout);
        }
    }
};

// Add device ID and token to all requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['x-device-id'] = getDeviceId();
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    response => response,
    async error => {
        logger.error('API Error:', error.response?.data);

        if (error.response?.status === 401) {
            const forceLogout = error.response?.data?.forceLogout;
            const message = error.response?.data?.message;
            
            if (forceLogout) {
                // Prevent further API calls during logout
                isLoggingOut = true;
                
                // Clear all storage
                localStorage.clear();
                sessionStorage.clear();
                clearDeviceId();

                // Show message to user
                if (message) {
                    alert(message);
                }

                // Redirect to login page
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

// Check session status frequently (every 500ms instead of 2000ms)
const sessionCheckInterval = setInterval(checkSession, 500);

// Check session on visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Immediately check session when tab becomes visible
        checkSession();
    }
});

// Also check session on window focus
window.addEventListener('focus', checkSession);

// Check session on network reconnection
window.addEventListener('online', checkSession);

// Cleanup intervals when page unloads
window.addEventListener('beforeunload', () => {
    clearInterval(sessionCheckInterval);
    const token = localStorage.getItem('token');
    if (token && !isLoggingOut) {
        try {
            // Synchronous XHR for cleanup
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${apiUrl}/logout`, false);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('x-device-id', getDeviceId());
            xhr.send();
        } catch (error) {
            logger.error('Error during cleanup:', error);
        }
    }
});

// Export the api instance and the apiUrl for use in other components
export { apiUrl };
export default api;
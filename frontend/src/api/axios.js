// src/api/axios.js
import axios from "axios";

// 🔧 Base URL (configurabile via .env)
// es: VITE_BFF_URL=http://app.localhost
const baseURL = import.meta.env.VITE_BFF_URL || "http://app.localhost";

const api = axios.create({
  baseURL,
  withCredentials: true, // necessario per i cookie HttpOnly
});

// Riferimento all'AuthProvider (viene impostato da setAuthService)
let authService = null;

/**
 * Collega il servizio di autenticazione (AuthProvider)
 * @param {object} service { triggerRefresh, logout }
 */
export function setAuthService(service) {
  authService = service;
}

// Stato di refresh
let isRefreshing = false;
let pendingRequests = [];

// Gestione della coda
function enqueueRequest(cb) {
  return new Promise((resolve, reject) => {
    pendingRequests.push({ resolve, reject, cb });
  });
}

function processQueue(error = null) {
  pendingRequests.forEach(({ resolve, reject, cb }) => {
    if (error) reject(error);
    else resolve(cb());
  });
  pendingRequests = [];
}

// Interceptor di risposta
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      if (!authService) {
        console.warn("⚠️ authService non inizializzato in axios");
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await authService.triggerRefresh();
          isRefreshing = false;
          processQueue();

          // ritenta la richiesta originale
          return api(originalRequest);
        } catch (refreshErr) {
          console.warn("⚠️ Refresh fallito, logout:", refreshErr);
          isRefreshing = false;
          processQueue(refreshErr);

          try {
            await authService.logout();
          } catch (_) {
            // ignora eventuali errori nel logout
          }

          return Promise.reject(refreshErr);
        }
      } else {
        // se un refresh è già in corso, accoda la richiesta
        try {
          await enqueueRequest(() => api(originalRequest));
          return api(originalRequest);
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }

    // altri errori: propagali normalmente
    return Promise.reject(error);
  }
);

export default api;

// src/api/axios.js
import axios from "axios";
import createAuthService from "../auth/auth-service";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "",
  withCredentials: true, // importantissimo per inviare cookie HttpOnly
});

// authService will be injected later to avoid cycle import
let authService = null;
export function setAuthService(svc) {
  authService = svc;
}

/**
 * Response interceptor behavior:
 * - se response.status === 403 (o 401) => tenta refresh tramite authService.triggerRefresh()
 * - se il refresh va a buon fine, ritenta la richiesta originale
 * - se il refresh fallisce -> reindirizza a login tramite authService.onLogout()
 *
 * Queuing: se c'è già un refresh in corso, le richieste successive attendono la stessa promessa.
 */
let isRefreshing = false;
let pendingRequests = [];

function enqueueRequest(cb) {
  return new Promise((resolve, reject) => {
    pendingRequests.push({ resolve, reject, cb });
  });
}

function processQueue(error) {
  pendingRequests.forEach(({ resolve, reject, cb }) => {
    if (error) reject(error);
    else resolve(cb());
  });
  pendingRequests = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only intercept network responses (avoid infinite loops)
    if (status === 401 || status === 403) {
      if (!authService) {
        // non possiamo gestire, fallback: logout
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshed = await authService.triggerRefresh(); // returns { ok, expires_in } or throws
          isRefreshing = false;
          processQueue();
          if (refreshed && originalRequest) {
            // retry original request
            return api(originalRequest);
          }
        } catch (refreshErr) {
          isRefreshing = false;
          processQueue(refreshErr);
          // refresh fallito -> logout (redirect to login)
          authService.onLogout(); // non ritorna
          return Promise.reject(refreshErr);
        }
      } else {
        // c'è già un refresh in corso -> metti in coda e riprova dopo
        try {
          await enqueueRequest(() => api(originalRequest));
          return api(originalRequest);
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

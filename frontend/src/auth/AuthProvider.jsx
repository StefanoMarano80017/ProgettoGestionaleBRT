// src/auth/AuthProvider.jsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api, { setAuthService } from "../api/axios";
import { useNavigate } from "react-router-dom";

/**
 * AuthContext:
 * - login(credentials) -> calls /authBff/login
 * - logout() -> calls /authBff/logout + clears state + redirect to login
 * - triggerRefresh() -> calls /authBff/refresh (used by axios interceptor)
 * - isAuthenticated boolean (best-effort)
 *
 * Nota: perché i token sono HttpOnly, non possiamo leggere lo stato "autenticato" direttamente.
 * Usare una flag locale aggiornata al login/refresh/logout e interrogabile dalle pagine.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // expiresIn (s) per schedulare refresh proattivo
  const refreshTimerId = useRef(null);
  const latestExpiresIn = useRef(null);

  // evita chiamate multiple di refresh
  let refreshPromiseRef = useRef(null);

  const scheduleRefresh = useCallback((expiresInSeconds) => {
    latestExpiresIn.current = expiresInSeconds;
    if (refreshTimerId.current) {
      clearTimeout(refreshTimerId.current);
      refreshTimerId.current = null;
    }
    // Refresh a 80% del ciclo
    const ms = Math.max(2000, Math.floor(expiresInSeconds * 0.8 * 1000));
    refreshTimerId.current = setTimeout(async () => {
      try {
        await triggerRefresh();
      } catch (e) {
        // se il refresh fallisce, logout
        onLogout();
      }
    }, ms);
  }, []);

  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimerId.current) {
      clearTimeout(refreshTimerId.current);
      refreshTimerId.current = null;
    }
    latestExpiresIn.current = null;
  }, []);

  // login: posta credentials al BFF che restituisce expires_in e setta cookie
  const login = useCallback(async (username, password) => {
    const resp = await api.post("/authBff/login", { username, password }, { withCredentials: true });
    if (resp.status === 200 && resp.data && resp.data.expires_in) {
      setIsAuthenticated(true);
      scheduleRefresh(resp.data.expires_in);
      return resp.data;
    }
    // fallback: se non ritorna expires_in assumiamo autenticato e non scheduliamo
    setIsAuthenticated(true);
    return { ok: true };
  }, [scheduleRefresh]);

  // logout: chiama BFF logout e pulisce stato
  const onLogout = useCallback(async () => {
    try {
      await api.post("/authBff/logout", {}, { withCredentials: true });
    } catch (e) {
      // ignora errori di logout remoto
    } finally {
      clearScheduledRefresh();
      setIsAuthenticated(false);
      // redirect to login page
      navigate("/login", { replace: true });
    }
  }, [navigate, clearScheduledRefresh]);

  // triggerRefresh: usato sia proattivamente che dall'interceptor
  const triggerRefresh = useCallback(async () => {
    // se c'è già un refresh in corso, ritorna la stessa promessa
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      try {
        const resp = await api.post("/authBff/refresh", {}, { withCredentials: true });
        if (resp.status === 200 && resp.data && resp.data.expires_in) {
          setIsAuthenticated(true);
          scheduleRefresh(resp.data.expires_in);
          return resp.data;
        } else {
          // consideriamo refresh fallito
          setIsAuthenticated(false);
          throw new Error("Refresh failed");
        }
      } catch (err) {
        setIsAuthenticated(false);
        clearScheduledRefresh();
        throw err;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [scheduleRefresh, clearScheduledRefresh]);

  // init: potremmo chiamare un whoami opzionale lato BFF per capire stato iniziale
  useEffect(() => {
    // set authService in axios for interceptor usage
    const authService = {
      triggerRefresh,
      onLogout,
    };
    setAuthService(authService);

    // opzionale: we can call /authBff/whoami to determine initial state
    // ma non tutti i BFF espongono whoami; se lo fai, che risponda 200 quando cookie valido
    (async function init() {
      try {
        const who = await api.get("/authBff/whoami", { withCredentials: true });
        if (who.status === 200) {
          setIsAuthenticated(true);
          // If backend returns expires_in here, schedule
          if (who.data?.expires_in) scheduleRefresh(who.data.expires_in);
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        // non autenticato all'avvio
        setIsAuthenticated(false);
      }
    })();

    return () => {
      clearScheduledRefresh();
    };
  }, [triggerRefresh, onLogout, scheduleRefresh, clearScheduledRefresh]);

  const value = {
    isAuthenticated,
    login,
    logout: onLogout,
    triggerRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// src/auth/AuthProvider.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || "http://app.local.test";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { setUser, setLoading, setSessionInfo } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshTimerId = useRef(null);
  const refreshPromiseRef = useRef(null);
  const bcRef = useRef(null); // 🔊 BroadcastChannel reference

  /** Inizializza il broadcast channel */
  useEffect(() => {
    const bc = new BroadcastChannel("auth_channel");
    bcRef.current = bc;

    bc.onmessage = async (event) => {
      const { type, payload } = event.data || {};
      console.log("📡 Broadcast received:", type, payload);

      switch (type) {
        case "logout":
          await onLogout(true); // true = da broadcast
          break;
        case "login":
        case "refresh":
          await triggerRefresh(); // aggiorna anche questa tab
          break;
        default:
          break;
      }
    };

    return () => bc.close();
  }, []);

  const broadcast = useCallback((type, payload = null) => {
    if (bcRef.current) {
      console.log("📢 Broadcast:", type, payload);
      bcRef.current.postMessage({ type, payload });
    }
  }, []);

  /** 🧹 Cancella eventuali timer di refresh */
  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimerId.current) clearTimeout(refreshTimerId.current);
    refreshTimerId.current = null;
  }, []);

  /** ⏱️ Pianifica il prossimo refresh automatico */
  const scheduleRefresh = useCallback(
    (expiresInSeconds) => {
      clearScheduledRefresh();
      const ms = Math.max(2000, Math.floor(expiresInSeconds * 0.8 * 1000));

      refreshTimerId.current = setTimeout(async () => {
        try {
          console.info("⏰ Scheduled refresh triggered");
          await triggerRefresh();
        } catch (err) {
          console.warn("Scheduled refresh failed:", err);
          onLogout();
        }
      }, ms);
    },
    [clearScheduledRefresh]
  );

  /** 🔐 Login */
  const login = useCallback(
    async (username, password) => {
      setLoading(true);
      try {
        const resp = await fetch(`${BFF_BASE_URL}/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!resp.ok) throw new Error("Login fallito");
        const data = await resp.json();
        setIsAuthenticated(true);
        setUser(data.user);
        setSessionInfo(data.session);
        if (data.expires_in) scheduleRefresh(data.expires_in);
        broadcast("login", { user: data.user });
        return data;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setSessionInfo, scheduleRefresh, setLoading, broadcast]
  );

  /** ♻️ Refresh */
  const triggerRefresh = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      console.group("🔄 REFRESH FLOW");
      try {
        const resp = await fetch(`${BFF_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!resp.ok) {
          console.error("❌ Refresh HTTP failed:", resp.status);
          throw new Error("Refresh non riuscito");
        }

        const data = await resp.json();
        console.log("✅ Refresh payload:", data);

        setIsAuthenticated(!!data.user);
        if (data.user) setUser(data.user);
        if (data.session) setSessionInfo(data.session);
        if (data.expires_in) scheduleRefresh(data.expires_in);

        broadcast("refresh", { user: data.user });

        console.groupEnd();
        return data;
      } catch (err) {
        console.error("❌ Refresh token failed:", err);
        setIsAuthenticated(false);
        setUser(null);
        clearScheduledRefresh();
        console.groupEnd();
        throw err;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [scheduleRefresh, clearScheduledRefresh, setUser, setSessionInfo, broadcast]);

  /** 🚪 Logout */
  const onLogout = useCallback(
    async (fromBroadcast = false) => {
      try {
        await fetch(`${BFF_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {}

      clearScheduledRefresh();
      setIsAuthenticated(false);
      setUser(null);
      setSessionInfo(null);
      setLoading(false);

      if (!fromBroadcast) broadcast("logout");
      navigate("/login", { replace: true });
    },
    [clearScheduledRefresh, setUser, setSessionInfo, setLoading, navigate, broadcast]
  );

  /** 🚀 Refresh iniziale */
  useEffect(() => {
    (async () => {
      try {
        await triggerRefresh();
      } catch {
        setIsAuthenticated(false);
        setUser(null);
        setSessionInfo(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [triggerRefresh, setUser, setSessionInfo, setLoading]);

  /** 👁️ Refresh quando la scheda torna attiva */
  useEffect(() => {
    const handleFocus = async () => {
      console.log("🪟 Window focused → refreshing");
      try {
        await triggerRefresh();
      } catch {
        onLogout();
      }
    };

    const handleVisibility = async () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ Tab visibile → refreshing");
        try {
          await triggerRefresh();
        } catch {
          onLogout();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [triggerRefresh, onLogout]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout: onLogout,
        triggerRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

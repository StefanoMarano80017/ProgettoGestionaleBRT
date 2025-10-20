import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
  const latestExpiresIn = useRef(null);

  // ====================================
  // 🔁 SCHEDULAZIONE REFRESH
  // ====================================
  const scheduleRefresh = useCallback((expiresInSeconds) => {
    latestExpiresIn.current = expiresInSeconds;
    if (refreshTimerId.current) clearTimeout(refreshTimerId.current);

    const ms = Math.max(2000, Math.floor(expiresInSeconds * 0.8 * 1000));
    console.log(`🕒 Refresh token scheduled in ${Math.floor(ms / 1000)}s`);

    refreshTimerId.current = setTimeout(async () => {
      console.log("🔄 Triggering scheduled token refresh...");
      try {
        await triggerRefresh();
      } catch (err) {
        console.warn("⚠️ Scheduled refresh failed:", err);
        onLogout();
      }
    }, ms);
  }, []);

  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimerId.current) clearTimeout(refreshTimerId.current);
    refreshTimerId.current = null;
    latestExpiresIn.current = null;
  }, []);

  // ====================================
  // 🔐 LOGIN
  // ====================================
  const login = useCallback(
    async (username, password) => {
      console.group("🔑 LOGIN FLOW");
      try {
        const resp = await fetch(`${BFF_BASE_URL}/authBff/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          console.error("❌ Login failed:", err);
          throw new Error(err.error || "Login fallito");
        }

        const data = await resp.json();
        console.log("✅ Login response payload:", data);

        setIsAuthenticated(true);
        if (data.user) setUser(data.user);
        if (data.session) setSessionInfo(data.session);
        if (data.expires_in) scheduleRefresh(data.expires_in);

        console.groupEnd();
        return data;
      } catch (err) {
        setIsAuthenticated(false);
        setUser(null);
        setSessionInfo(null);
        clearScheduledRefresh();
        console.groupEnd();
        throw err;
      }
    },
    [scheduleRefresh, clearScheduledRefresh, setUser]
  );


  // ====================================
  // 🚪 LOGOUT
  // ====================================
  const onLogout = useCallback(async () => {
    console.log("🚪 Performing logout...");
    try {
      await fetch(`${BFF_BASE_URL}/authBff/logout`, { method: "POST", credentials: "include" });
    } catch (err) {
      console.warn("⚠️ Logout request failed:", err);
    } finally {
      clearScheduledRefresh();
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      navigate("/login", { replace: true });
    }
  }, [navigate, clearScheduledRefresh, setUser, setLoading]);

  // ====================================
  // 🔄 REFRESH TOKEN
  // ====================================
  const triggerRefresh = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      console.group("🔄 REFRESH FLOW");
      try {
        const resp = await fetch(`${BFF_BASE_URL}/authBff/refresh`, { method: "POST", credentials: "include" });

        if (!resp.ok) {
          setIsAuthenticated(false);
          setUser(null);
          throw new Error("Refresh non riuscito");
        }

        const data = await resp.json();
        console.log("✅ Refresh response payload:", data);

        setIsAuthenticated(true);
        if (data.user) setUser(data.user); // aggiorna profilo
        if (data.expires_in) scheduleRefresh(data.expires_in);

        console.groupEnd();
        return data;
      } catch (err) {
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
  }, [scheduleRefresh, clearScheduledRefresh, setUser]);

  // ====================================
  // 🔍 INITIAL REFRESH ALL’AVVIO
  // ====================================
  useEffect(() => {
    (async () => {
      console.log("🚀 Initial auth check → calling refresh...");
      try {
        const data = await triggerRefresh();
        if (data?.expires_in) scheduleRefresh(data.expires_in);
        setIsAuthenticated(true);
        console.log("✅ Initial refresh OK — user authenticated");
      } catch (err) {
        console.warn("⚠️ Initial refresh failed:", err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [triggerRefresh, scheduleRefresh, setLoading, setUser]);

  // ====================================
  // 🧩 CONTEXT VALUE
  // ====================================
  const value = {
    isAuthenticated,
    login,
    logout: onLogout,
    triggerRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

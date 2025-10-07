import React from "react";
import { authenticate } from "@mocks/UsersMock";

// Renamed from app/layouts/AuthContext.jsx to app/providers/AuthProvider.jsx
// Provides authentication context (user, token, role helpers)
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = React.useState({ user: null, token: null });

  const login = async (username, password) => {
    const res = await authenticate(username, password);
    const next = { user: res.user, token: res.token };
    setState(next);
    localStorage.setItem("auth", JSON.stringify(next));
    return next;
  };

  const logout = () => {
    setState({ user: null, token: null });
    localStorage.removeItem("auth");
  };

  const hasRole = (role) => !!state?.user?.roles?.includes(role);

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: !!state.token,
    roles: state.user?.roles || [],
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

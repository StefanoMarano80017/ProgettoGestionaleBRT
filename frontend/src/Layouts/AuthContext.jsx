import React from "react";
import { authenticate } from "../mocks/UsersMock";

const AuthContext = React.createContext(null);
export const useAuth = () => React.useContext(AuthContext);

export function AuthProvider({ children }) {
  const [state, setState] = React.useState(() => {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : { user: null, token: null };
  });

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
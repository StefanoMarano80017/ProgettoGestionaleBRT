// src/auth/auth-service.js
// helper per iniettare triggerRefresh/onLogout in axios
// non strettamente necessario se usi setAuthService dal provider
export default function createAuthService({ triggerRefresh, onLogout }) {
  return { triggerRefresh, onLogout };
}

import React, { createContext, useState, useEffect } from 'react';
import keycloak from './keycloak';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [keycloakInstance, setKeycloakInstance] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    keycloak.init({ onLoad: 'login-required', checkLoginIframe: false })
      .then(authenticated => {
        setIsAuthenticated(authenticated);
        setKeycloakInstance(keycloak);

        // refresh token automatico
        const interval = setInterval(() => {
          keycloak.updateToken(60).catch(() => {
            keycloak.logout();
          });
        }, 60000);

        return () => clearInterval(interval);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ keycloak: keycloakInstance, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

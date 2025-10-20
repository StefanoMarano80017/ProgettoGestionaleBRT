// src/context/UserContext.jsx
import React, { createContext, useContext, useState, useMemo } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [rawUser, setRawUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);

  // creiamo un oggetto “user” con getter
  const user = useMemo(() => {
    if (!rawUser) return null;

    return {
      ...rawUser,

      // getter per id
      get id() {
        return this.sub;
      },

      // getter per fullName
      get fullName() {
        return `${this.given_name} ${this.family_name}`;
      },

      // getter per role stringa
      get rolesString() {
        return this.role?.join(', ') || '';
      },

      // getter per ultimo accesso (dal contesto sessionInfo)
      get lastAccess() {
        // sessionInfo deve essere disponibile nel contesto
        if (!sessionInfo?.lastLogins || sessionInfo.lastLogins.length === 0) return null;
        return sessionInfo.lastLogins[0]; // il più recente
      },
    };
  }, [rawUser]);

  return (
    <UserContext.Provider value={{ user, setUser: setRawUser, loading, setLoading, sessionInfo, setSessionInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

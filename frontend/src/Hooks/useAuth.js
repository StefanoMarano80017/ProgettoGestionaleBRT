import React from 'react';
import AuthContext from '@layouts/AuthContext';

// Dedicated hook file to satisfy react-refresh/only-export-components
export function useAuth() {
  return React.useContext(AuthContext);
}

export default useAuth;

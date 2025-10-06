import React from 'react';
import { AuthContext } from '@/app/providers/AuthProvider';

// Simple hook wrapper around AuthContext provided by AuthProvider.
// Returns the same shape that AuthProvider exposes: { user, token, isAuthenticated, roles, login, logout, hasRole }
export default function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

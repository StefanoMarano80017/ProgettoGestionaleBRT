import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useApi = () => {
  const { keycloak } = useContext(AuthContext);

  const api = axios.create({
    baseURL: 'https://api.example.com',
  });

  // interceptor per aggiungere il token aggiornato
  api.interceptors.request.use(async config => {
    if (keycloak) {
      await keycloak.updateToken(60); // refresh se scade entro 60s
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  });

  return api;
};
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useApi = () => {
  const { keycloak } = useContext(AuthContext);

  const api = axios.create({
    baseURL: 'https://api.example.com',
  });

  return api;
};
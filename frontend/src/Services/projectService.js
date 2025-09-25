import api from './api';
import axios from "axios";

// --- Projects REST API ---
export const getAllProjects = async () => {
  const response = await axios.get("/mock/projects");
  console.log("FETCHED projects:", response.data);
  return response.data;
};

export const getProject = (id) => api.get(`/projects/${id}`);

export const createProject = (data) => api.post('/projects', data);

export const updateProject = (id, data) => api.put(`/projects/${id}`, data);

export const deleteProject = (id) => api.delete(`/projects/${id}`);

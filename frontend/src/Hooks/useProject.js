import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../Services/api";
import {getAllProjects} from "../Services/projectService"
import axios from 'axios';

// GET all projects
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
  });
};

// DELETE project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/mock/projects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
};

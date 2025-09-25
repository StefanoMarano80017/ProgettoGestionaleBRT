import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '../Services/userService';

export function useUsers() {
  return useQuery(['users'], userService.getAllUsers);
}

export function useUser(id) {
  return useQuery(['user', id], () => userService.getUser(id));
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation(userService.createUser, {
    onSuccess: () => queryClient.invalidateQueries(['users']),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation(({ id, data }) => userService.updateUser(id, data), {
    onSuccess: () => queryClient.invalidateQueries(['users']),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation(userService.deleteUser, {
    onSuccess: () => queryClient.invalidateQueries(['users']),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'analista' | 'visualizador';
  ativo: boolean;
  createdAt: string;
}

export interface CreateUsuarioData {
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'analista' | 'visualizador';
  ativo?: boolean;
}

export interface UpdateUsuarioData {
  nome?: string;
  email?: string;
  senha?: string;
  role?: 'admin' | 'analista' | 'visualizador';
  ativo?: boolean;
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const response = await api.get<Usuario[]>('/usuarios');
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useUsuario(id: string) {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: async () => {
      const response = await api.get<Usuario>(`/usuarios/${id}`);
      return response.data;
    },
    enabled: !!id,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUsuarioData) => {
      const response = await api.post<Usuario>('/usuarios', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUsuarioData }) => {
      const response = await api.put<Usuario>(`/usuarios/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

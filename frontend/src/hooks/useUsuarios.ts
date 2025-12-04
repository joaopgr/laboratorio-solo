import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'funcionario' | 'estagiario' | 'recepcao' | 'visitante';
  ativo: boolean;
  createdAt: string;
}

export interface CreateUsuarioData {
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'funcionario' | 'estagiario' | 'recepcao' | 'visitante';
  ativo?: boolean;
}

export interface UpdateUsuarioData {
  nome?: string;
  email?: string;
  senha?: string;
  role?: 'admin' | 'funcionario' | 'estagiario' | 'recepcao' | 'visitante';
  ativo?: boolean;
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      try {
        console.log('🔍 Fazendo requisição para /api/usuarios...');
        const response = await api.get<Usuario[]>('/usuarios');
        console.log('✅ Resposta recebida:', response.status, response.data?.length || 0, 'usuários');
        if (response.data && response.data.length > 0) {
          console.log('👥 Primeiros usuários:', response.data.slice(0, 3).map(u => u.nome));
        }
        return response.data || [];
      } catch (error: any) {
        console.error('❌ Erro ao carregar usuários:', error);
        console.error('📋 Detalhes do erro:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        // Se for erro 403, pode ser problema de permissão
        if (error.response?.status === 403) {
          console.error('⚠️ Acesso negado (403) - verifique permissões da rota');
        }
        // Retornar array vazio em caso de erro para não quebrar a UI
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 0, // Sempre buscar dados frescos
    cacheTime: 0, // Não cachear
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

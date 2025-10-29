import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// Tipos locais para evitar problemas de import
export interface Atividade {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: 'tarefa' | 'aviso' | 'lembrete';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  responsavel?: string;
  prazo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAtividadeData {
  titulo: string;
  descricao?: string;
  tipo?: 'tarefa' | 'aviso' | 'lembrete';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavel?: string;
  prazo?: string;
}

export interface UpdateAtividadeData {
  titulo?: string;
  descricao?: string;
  tipo?: 'tarefa' | 'aviso' | 'lembrete';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  responsavel?: string;
  prazo?: string;
}

export interface AtividadeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  prioridade?: string;
  tipo?: string;
}

export function useAtividades(filters: AtividadeFilters = {}) {
  return useQuery({
    queryKey: ['atividades', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.prioridade) params.append('prioridade', filters.prioridade);
      if (filters.tipo) params.append('tipo', filters.tipo);

      const response = await api.get(`/atividades?${params.toString()}`);
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useAtividade(id: string) {
  return useQuery({
    queryKey: ['atividade', id],
    queryFn: async () => {
      const response = await api.get(`/atividades/${id}`);
      return response.data;
    },
    enabled: !!id,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useCreateAtividade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAtividadeData) => {
      const response = await api.post('/atividades', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
    },
  });
}

export function useUpdateAtividade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAtividadeData }) => {
      const response = await api.put(`/atividades/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividade', id] });
    },
  });
}

export function useUpdateAtividadeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/atividades/${id}/status`, { status });
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividade', id] });
    },
  });
}

export function useDeleteAtividade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/atividades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
    },
  });
}

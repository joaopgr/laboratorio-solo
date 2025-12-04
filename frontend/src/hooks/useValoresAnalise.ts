import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface ValoresAnalise {
  solo: {
    rotina: number;
    organica: number;
    micronutrientes: number;
    prem: number;
    enxofre: number;
    nitrogenio: number;
    granulometria: number;
  };
  foliar: {
    rotina: number;
    organica: number;
    micronutrientes: number;
    prem: number;
    enxofre: number;
    nitrogenio: number;
    granulometria: number;
  };
}

export interface UpdateValorData {
  modulo: 'solo' | 'foliar';
  tipo: string;
  valor: number;
}

export function useValoresAnalise() {
  return useQuery({
    queryKey: ['valores-analise'],
    queryFn: async () => {
      const response = await api.get<ValoresAnalise>('/valores-analise');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
}

export function useValoresAnaliseByModulo(modulo: 'solo' | 'foliar') {
  return useQuery({
    queryKey: ['valores-analise', modulo],
    queryFn: async () => {
      const response = await api.get<Record<string, number>>(`/valores-analise/${modulo}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateValorAnalise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateValorData) => {
      const response = await api.put('/valores-analise', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valores-analise'] });
    },
  });
}


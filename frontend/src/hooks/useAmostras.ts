import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { Amostra, CreateAmostraData, AmostraFilters, PaginationMeta } from '../../../shared/types'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export function useAmostras(filters: AmostraFilters = {}) {
  const { modulo } = useModule()
  
  return useQuery(
    ['amostras', filters, modulo],
    async () => {
      const response = await api.get<{ amostras: Amostra[], pagination: PaginationMeta }>('/amostras', {
        params: {
          ...filters,
          modulo
        }
      })
      return {
        amostras: response.data.amostras,
        pagination: response.data.pagination
      }
    },
    {
      refetchOnWindowFocus: false,
    }
  )
}

export function useAmostra(id: string) {
  return useQuery(
    ['amostra', id],
    async () => {
      const response = await api.get<Amostra>(`/amostras/${id}`)
      return response.data
    },
    {
      enabled: !!id,
    }
  )
}

export function useAmostrasByLote(loteId: string, filters: Partial<AmostraFilters> = {}) {
  return useQuery(
    ['amostras', 'lote', loteId, filters],
    async () => {
      const response = await api.get<Amostra[]>(`/amostras/lote/${loteId}`, {
        params: filters
      })
      return response.data
    },
    {
      enabled: !!loteId,
      keepPreviousData: true,
    }
  )
}

export function useCreateAmostra() {
  const queryClient = useQueryClient()
  const { modulo } = useModule()

  return useMutation(
    async (data: CreateAmostraData) => {
      const response = await api.post<Amostra>('/amostras', {
        ...data,
        modulo
      })
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['amostras'])
        queryClient.invalidateQueries(['amostras', 'lote', data.loteId])
        queryClient.invalidateQueries(['lotes'])
        toast.success('Amostra criada com sucesso!')
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Erro ao criar amostra'
        toast.error(message)
      },
    }
  )
}

export function useUpdateAmostra() {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ id, data }: { id: string; data: Partial<CreateAmostraData> }) => {
      const response = await api.put<Amostra>(`/amostras/${id}`, data)
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['amostras'])
        queryClient.invalidateQueries(['amostra', data.id])
        queryClient.invalidateQueries(['amostras', 'lote', data.loteId])
        queryClient.invalidateQueries(['lotes'])
        toast.success('Amostra atualizada com sucesso!')
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Erro ao atualizar amostra'
        toast.error(message)
      },
    }
  )
}

export function useDeleteAmostra() {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ id, cascade = false }: { id: string; cascade?: boolean }) => {
      const params = cascade ? '?cascade=true' : ''
      await api.delete(`/amostras/${id}${params}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['amostras'])
        queryClient.invalidateQueries(['resultados'])
        toast.success('Amostra deletada com sucesso!')
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Erro ao deletar amostra'
        toast.error(message)
      },
    }
  )
}

// Hook para buscar o próximo número sequencial de amostra
export function useNextSampleNumber() {
  return useQuery(
    ['next-sample-number'],
    async () => {
      const response = await api.get<{ nextNumber: number }>('/amostras/next-number')
      return response.data.nextNumber
    },
    {
      staleTime: 0, // Sempre buscar o número mais atual
    }
  )
}

// Hook para atualizar tipos de análise em lote
export function useUpdateAmostrasLote() {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ amostraIds, tiposAnalise }: { amostraIds: string[], tiposAnalise: Partial<Pick<Amostra, 'rotina' | 'organica' | 'micronutrientes' | 'enxofre' | 'prem' | 'nitrogenio' | 'granulometria' | 'foliar'>> }) => {
      const response = await api.put('/amostras/batch', { amostraIds, tiposAnalise })
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['amostras'])
        queryClient.invalidateQueries(['lotes'])
        queryClient.invalidateQueries(['relatorios'])
        toast.success(data.message)
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Erro ao atualizar amostras'
        toast.error(message)
      },
    }
  )
}



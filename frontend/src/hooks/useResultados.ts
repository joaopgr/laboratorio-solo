import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { Resultado, CreateResultadoData, CreateResultadosLoteData, ResultadoFilters } from '../../../shared/types'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'

export function useResultados(filters: ResultadoFilters = {}) {
  const { modulo } = useModule()
  
  return useQuery(
    ['resultados', filters, modulo],
    async () => {
      
      // Filtrar tipos não aplicáveis ao foliar antes de serializar
      const tiposAnaliseFiltrados = { ...(filters.tiposAnalise || {}) }
      
      if (modulo === 'foliar') {
        // Remover tipos não aplicáveis ao foliar
        delete tiposAnaliseFiltrados.organica
        delete tiposAnaliseFiltrados.prem
        delete tiposAnaliseFiltrados.granulometria
      }
      
      // Serializar tiposAnalise como string JSON
      const params = {
        ...filters,
        tiposAnalise: JSON.stringify(tiposAnaliseFiltrados),
        categoria: modulo
      }
      
      
      const response = await api.get<{ resultados: Resultado[], pagination: any }>('/resultados', {
        params
      })
      return {
        resultados: response.data.resultados,
        pagination: response.data.pagination
      }
    },
    {
      refetchOnWindowFocus: false,
    }
  )
}

export function useResultado(id: string) {
  return useQuery(
    ['resultado', id],
    async () => {
      const response = await api.get<Resultado>(`/resultados/${id}`)
      return response.data
    },
    {
      enabled: !!id,
    }
  )
}

export function useResultadosByAmostra(amostraId: string) {
  return useQuery(
    ['resultados', 'amostra', amostraId],
    async () => {
      const response = await api.get<{ resultados: Resultado[], pagination: any }>(`/resultados?amostraId=${amostraId}`)
      return response.data.resultados
    },
    {
      enabled: !!amostraId,
    }
  )
}

export function useAmostraStatus(amostraId: string) {
  return useQuery(
    ['resultados', 'amostra', amostraId, 'status'],
    async () => {
      const response = await api.get<{ amostraId: string, completa: boolean }>(`/resultados/amostra/${amostraId}/status`)
      return response.data
    },
    {
      enabled: !!amostraId,
    }
  )
}

export function useCreateResultado() {
  const queryClient = useQueryClient()
  const { modulo } = useModule()

  return useMutation(
    async (data: CreateResultadoData) => {
      const response = await api.post<Resultado>('/resultados', {
        ...data,
        categoria: modulo
      })
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['resultados'])
        queryClient.invalidateQueries(['resultado', data.id])
        queryClient.invalidateQueries(['amostra', data.amostraId])
        queryClient.invalidateQueries(['resultados', 'amostra', data.amostraId])
      },
      onError: (error: any) => {
        console.error('🔍 Debug: Erro completo no useCreateResultado:', error)
        console.error('🔍 Debug: Response data:', error.response?.data)
        console.error('🔍 Debug: Response status:', error.response?.status)
        const message = error.response?.data?.error || 'Erro ao criar resultado'
        toast.error(message)
      },
    }
  )
}

export function useUpdateResultado() {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ id, data }: { id: string; data: Partial<CreateResultadoData> }) => {
      const response = await api.put<Resultado>(`/resultados/${id}`, data)
      return response.data
    },
    {
      onSuccess: (data) => {
        
        // Invalidar todas as queries relacionadas
        queryClient.invalidateQueries(['resultados'])
        queryClient.invalidateQueries(['resultado', data.id])
        queryClient.invalidateQueries(['amostra', data.amostraId])
        queryClient.invalidateQueries(['amostras'])
        
        // Invalidar especificamente a consulta por amostra
        queryClient.invalidateQueries(['resultados', 'amostra', data.amostraId])
        
        // Forçar refetch da consulta específica
        queryClient.refetchQueries(['resultados', 'amostra', data.amostraId])
        
        // Remover query específica do cache para forçar nova busca
        queryClient.removeQueries(['resultados', 'amostra', data.amostraId])
        
        toast.success('Resultado atualizado com sucesso!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Erro ao atualizar resultado'
        toast.error(message)
      },
    }
  )
}

export function useDeleteResultado() {
  const queryClient = useQueryClient()

  return useMutation(
    async (id: string) => {
      await api.delete(`/resultados/${id}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['resultados'])
        toast.success('Resultado deletado com sucesso!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Erro ao deletar resultado'
        toast.error(message)
      },
    }
  )
}

export function useCreateResultadosLote() {
  const queryClient = useQueryClient()
  const { modulo } = useModule()

  return useMutation(
    async (data: CreateResultadosLoteData) => {
      // Adicionar categoria a cada resultado individual
      const resultadosComCategoria = data.resultados.map(resultado => ({
        ...resultado,
        categoria: modulo
      }))
      
      const response = await api.post<Resultado[]>('/resultados/lote', {
        resultados: resultadosComCategoria
      })
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['resultados'])
        queryClient.invalidateQueries(['amostras'])
        const count = Array.isArray(data) ? data.length : (data?.length || 0)
        toast.success(`${count} resultados criados com sucesso!`)
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Erro ao criar resultados em lote'
        toast.error(message)
      },
    }
  )
}



import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { LoteAmostra, LoteAmostraFilters, CreateLoteAmostraData } from '../../../shared/types'
import { useModule } from '../contexts/ModuleContext'

// Hook para buscar lotes
export function useLotes(filters: LoteAmostraFilters = {}) {
  const { modulo } = useModule()
  
  return useQuery({
    queryKey: ['lotes', filters, modulo],
    queryFn: async () => {
      const params: any = { ...filters }
      
      // Se tipoAnalise não foi explicitamente definido nos filtros, usar o do contexto
      if (!('tipoAnalise' in filters)) {
        params.modulo = modulo  // Backend usa 'modulo', não 'tipoAnalise'
      }
      // Se foi definido como undefined, não adicionar o parâmetro (buscar todos)
      // Se foi definido com um valor específico, usar esse valor
      
      const response = await api.get<{ lotes: LoteAmostra[], pagination: any }>('/lotes', {
        params
      })
      return {
        lotes: response.data.lotes,
        pagination: response.data.pagination
      }
    }
  })
}

// Hook para buscar um lote específico por ID (sem filtro de tipo)
export function useLoteById(id: string) {
  return useQuery({
    queryKey: ['lote', id],
    queryFn: async () => {
      const response = await api.get<LoteAmostra>(`/lotes/${id}`)
      return response.data
    },
    enabled: !!id, // Só executar se o ID estiver presente
  })
}

// Hook para buscar próximo número de lote
export function useNextLoteNumber() {
  const { modulo } = useModule()
  
  return useQuery({
    queryKey: ['lotes', 'next-number', modulo],
    queryFn: async () => {
      const response = await api.get<{ nextNumber: string }>('/lotes/next-number', {
        params: { modulo }
      })
      return response.data
    }
  })
}

// Hook para buscar lote por ID
export function useLote(id: string) {
  return useQuery({
    queryKey: ['lote', id],
    queryFn: async () => {
      const response = await api.get<LoteAmostra>(`/lotes/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// Hook para criar lote
export function useCreateLote() {
  const queryClient = useQueryClient()
  const { modulo } = useModule()

  return useMutation({
    mutationFn: async (data: CreateLoteAmostraData) => {
      const response = await api.post<LoteAmostra>('/lotes', {
        ...data,
        modulo
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

// Hook para atualizar lote
export function useUpdateLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateLoteAmostraData> }) => {
      const response = await api.put<LoteAmostra>(`/lotes/${id}`, data)
      return response.data
    },
    onSuccess: (data, variables) => {
      // Invalidar queries de lotes
      queryClient.invalidateQueries({ queryKey: ['lotes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      // Invalidar query específica do lote
      queryClient.invalidateQueries({ queryKey: ['lote', variables.id] })
      // Atualizar cache do lote específico
      queryClient.setQueryData({ queryKey: ['lote', variables.id] }, data)
    },
  })
}

// Hook para deletar lote
export function useDeleteLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, cascade = false }: { id: string; cascade?: boolean }) => {
      const params = cascade ? '?cascade=true' : ''
      await api.delete(`/lotes/${id}${params}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes'] })
      queryClient.invalidateQueries({ queryKey: ['amostras'] })
      queryClient.invalidateQueries({ queryKey: ['resultados'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

// Hook para limpar lotes vazios
export function useCleanEmptyLotes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.delete<{ 
        message: string
        deletedCount: number
        deletedLotes: string[]
      }>('/lotes/clean-empty')
      return response.data
    },
    onSuccess: () => {
      // Invalidar todas as queries de lotes para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['lotes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}


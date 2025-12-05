import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { Cliente, CreateClienteData, ClienteFilters } from '../../../shared/types'
import toast from 'react-hot-toast'

export function useClientes(filters: ClienteFilters = {}) {
  return useQuery({
    queryKey: ['clientes', filters],
    queryFn: async () => {
      const response = await api.get<{ clientes: Cliente[], pagination: any }>('/clientes', {
        params: filters
      })
      return {
        clientes: response.data.clientes,
        pagination: response.data.pagination
      }
    }
  })
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const response = await api.get<Cliente>(`/clientes/${id}`, {
        params: { include: 'lotes' }
      })
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateClienteData) => {
      const response = await api.post<Cliente>('/clientes', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente criado com sucesso!')
    },
    onError: (error: any) => {
      let message = 'Erro ao criar cliente'
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Se houver detalhes de validação do Zod
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => {
            const field = detail.path?.join('.') || 'campo'
            return `${field}: ${detail.message}`
          })
          message = errorMessages.join('; ') || errorData.error || message
        } else if (errorData.error) {
          message = errorData.error
        }
      }
      
      toast.error(message)
    },
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClienteData> }) => {
      const response = await api.put<Cliente>(`/clientes/${id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['cliente', data.id] })
      toast.success('Cliente atualizado com sucesso!')
    },
    onError: (error: any) => {
      let message = 'Erro ao atualizar cliente'
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Se houver detalhes de validação do Zod
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => {
            const field = detail.path?.join('.') || 'campo'
            return `${field}: ${detail.message}`
          })
          message = errorMessages.join('; ') || errorData.error || message
        } else if (errorData.error) {
          message = errorData.error
        }
      }
      
      toast.error(message)
    },
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clientes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente deletado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao deletar cliente'
      toast.error(message)
    },
  })
}




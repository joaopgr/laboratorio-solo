import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { Cliente, CreateClienteData, ClienteFilters } from '../../../shared/types'
import toast from 'react-hot-toast'

export function useClientes(filters: ClienteFilters = {}) {
  return useQuery(
    ['clientes', filters],
    async () => {
      const response = await api.get<{ clientes: Cliente[], pagination: any }>('/clientes', {
        params: filters
      })
      return {
        clientes: response.data.clientes,
        pagination: response.data.pagination
      }
    },
    {
      keepPreviousData: true,
    }
  )
}

export function useCliente(id: string) {
  return useQuery(
    ['cliente', id],
    async () => {
      const response = await api.get<Cliente>(`/clientes/${id}`, {
        params: { include: 'lotes' }
      })
      return response.data
    },
    {
      enabled: !!id,
    }
  )
}

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation(
    async (data: CreateClienteData) => {
      const response = await api.post<Cliente>('/clientes', data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['clientes'])
        toast.success('Cliente criado com sucesso!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Erro ao criar cliente'
        toast.error(message)
      },
    }
  )
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ id, data }: { id: string; data: Partial<CreateClienteData> }) => {
      const response = await api.put<Cliente>(`/clientes/${id}`, data)
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['clientes'])
        queryClient.invalidateQueries(['cliente', data.id])
        toast.success('Cliente atualizado com sucesso!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Erro ao atualizar cliente'
        toast.error(message)
      },
    }
  )
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation(
    async (id: string) => {
      await api.delete(`/clientes/${id}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['clientes'])
        toast.success('Cliente deletado com sucesso!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Erro ao deletar cliente'
        toast.error(message)
      },
    }
  )
}



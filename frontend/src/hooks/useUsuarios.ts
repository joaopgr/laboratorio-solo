import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
}

export function useUsuarios() {
  return useQuery<Usuario[]>(
    ['usuarios'],
    async () => {
      const response = await api.get('/auth/users')
      return response.data
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false
    }
  )
}


/* 
  CONTEÚDO ORIGINAL DO REGISTRO DE ATIVIDADES COMENTADO TEMPORARIAMENTE (FASE 2).
  Para reativar, remova este comentário e o placeholder abaixo.
*/

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useUsuarios } from '../hooks/useUsuarios'
import { Filter, User, Activity, Package, Trash2, Edit, Plus } from 'lucide-react'

interface Log {
  id: string
  usuarioId?: string
  usuarioNome?: string
  usuarioEmail?: string
  acao: string
  entidade: string
  entidadeId?: string
  entidadeNome?: string
  detalhes?: any
  ip?: string
  userAgent?: string
  createdAt: string
}

interface LogsResponse {
  data: Log[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const ACOES = [
  { value: '', label: 'Todas as ações' },
  { value: 'criar', label: 'Criar' },
  { value: 'editar', label: 'Editar' },
  { value: 'deletar', label: 'Deletar' }
]

const ENTIDADES = [
  { value: '', label: 'Todas as entidades' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'amostra', label: 'Amostra' },
  { value: 'lote', label: 'Lote' }
]

const getAcaoIcon = (acao: string) => {
  switch (acao) {
    case 'criar':
      return <Plus className="w-4 h-4 text-green-600" />
    case 'editar':
      return <Edit className="w-4 h-4 text-blue-600" />
    case 'deletar':
      return <Trash2 className="w-4 h-4 text-red-600" />
    default:
      return <Activity className="w-4 h-4 text-gray-600" />
  }
}

const getAcaoLabel = (acao: string) => {
  switch (acao) {
    case 'criar':
      return 'Criou'
    case 'editar':
      return 'Editou'
    case 'deletar':
      return 'Deletou'
    default:
      return acao
  }
}

const getEntidadeLabel = (entidade: string) => {
  switch (entidade) {
    case 'cliente':
      return 'Cliente'
    case 'amostra':
      return 'Amostra'
    case 'lote':
      return 'Lote'
    default:
      return entidade
  }
}

function useLogs(page: number = 1, filters: any = {}) {
  return useQuery<LogsResponse>({
    queryKey: ['logs', page, filters],
    queryFn: async () => {
      const params: any = { page: page.toString(), limit: '10' }
      // Só enviar filtros se não estiverem vazios
      if (filters.usuarioId && filters.usuarioId.trim() !== '') params.usuarioId = filters.usuarioId
      if (filters.acao && filters.acao.trim() !== '') params.acao = filters.acao
      if (filters.entidade && filters.entidade.trim() !== '') params.entidade = filters.entidade
      
      const response = await api.get('/logs', { params })
      return response.data as LogsResponse
    },
    refetchOnWindowFocus: false
  })
}

export function Logs() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    usuarioId: '',
    acao: '',
    entidade: ''
  })
  
  const { data: logsData, isLoading } = useLogs(page, filters)
  const { data: usuariosData } = useUsuarios()
  
  const usuarios: any[] = Array.isArray(usuariosData) ? usuariosData : []
  const logs: Log[] = logsData?.data || []
  const pagination = logsData?.pagination

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Placeholder temporário - FASE 2 */}
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Em breve</h1>
          <p className="text-gray-600 mt-2">Esta área será implementada na FASE 2 de desenvolvimento.</p>
        </div>
      </div>

      {/*
        CONTEÚDO ORIGINAL DA PÁGINA REGISTRO DE ATIVIDADES (DESABILITADO TEMPORARIAMENTE)
        Para reativar, remova este comentário e o bloco de placeholder acima.

        <div className="space-y-6"> ... conteúdo original completo ... </div>
      */}
    </>
  )
}

// Placeholder temporário (FASE 2)
export function Logs() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Em breve</h1>
        <p className="text-gray-600 mt-2">Esta área será implementada na FASE 2 de desenvolvimento.</p>
      </div>
    </div>
  )
}


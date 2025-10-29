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
      const params: any = { page: page.toString(), limit: '50' }
      if (filters.usuarioId) params.usuarioId = filters.usuarioId
      if (filters.acao) params.acao = filters.acao
      if (filters.entidade) params.entidade = filters.entidade
      
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de Atividades</h1>
          <p className="mt-1 text-sm text-gray-500">
            Histórico de ações realizadas no sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Usuário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <select
              value={filters.usuarioId}
              onChange={(e) => setFilters({ ...filters, usuarioId: e.target.value })}
              className="input w-full"
            >
              <option value="">Todos os usuários</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome} ({usuario.email})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Ação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ação
            </label>
            <select
              value={filters.acao}
              onChange={(e) => setFilters({ ...filters, acao: e.target.value })}
              className="input w-full"
            >
              {ACOES.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Entidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entidade
            </label>
            <select
              value={filters.entidade}
              onChange={(e) => setFilters({ ...filters, entidade: e.target.value })}
              className="input w-full"
            >
              {ENTIDADES.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Carregando logs...</p>
          </div>
        ) : (!logs || logs.length === 0) ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum log encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entidade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.usuarioNome || 'Usuário não identificado'}
                            </p>
                            {log.usuarioEmail && (
                              <p className="text-xs text-gray-500">{log.usuarioEmail}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getAcaoIcon(log.acao)}
                          <span className="text-sm font-medium text-gray-900">
                            {getAcaoLabel(log.acao)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getEntidadeLabel(log.entidade)}
                            </p>
                            {log.entidadeNome && (
                              <p className="text-xs text-gray-500">{log.entidadeNome}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.entidadeId && (
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            ID: {log.entidadeId.substring(0, 8)}...
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination && pagination.pages > 1 && (
              <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} registros
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn btn-sm btn-outline"
                  >
                    Anterior
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-700">
                    Página {page} de {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.pages}
                    className="btn btn-sm btn-outline"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


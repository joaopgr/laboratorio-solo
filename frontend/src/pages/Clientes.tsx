import { useState, useEffect } from 'react'
import { useClientes, useDeleteCliente } from '../hooks/useClientes'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ClienteForm } from '../components/ClienteForm'
import { Cliente } from '../../../shared/types'

export function Clientes() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
  })
  
  const [searchInput, setSearchInput] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | undefined>()
  const [allClientes, setAllClientes] = useState<Cliente[]>([])
  const [hasMore, setHasMore] = useState(true)

  const { data, isLoading } = useClientes(filters)
  const deleteCliente = useDeleteCliente()

  // Debounce para busca automática
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
      // Reset dos clientes carregados quando faz nova busca
      setAllClientes([])
      setHasMore(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Gerenciar clientes carregados
  useEffect(() => {
    if (data?.clientes) {
      if (filters.page === 1) {
        // Primeira página ou nova busca
        setAllClientes(data.clientes)
      } else {
        // Páginas subsequentes - adicionar às existentes
        setAllClientes(prev => [...prev, ...data.clientes])
      }
      
      // Verificar se há mais páginas
      setHasMore(data.clientes.length === filters.limit)
    }
  }, [data, filters.page, filters.limit])

  // Função para carregar mais clientes
  const handleLoadMore = () => {
    setFilters(prev => ({ ...prev, page: prev.page + 1 }))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
    // Reset dos clientes carregados quando faz nova busca
    setAllClientes([])
    setHasMore(true)
  }

  const handleCreateCliente = () => {
    setEditingCliente(undefined)
    setIsFormOpen(true)
  }

  const handleEditCliente = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setIsFormOpen(true)
  }

  const handleDeleteCliente = async (cliente: Cliente) => {
    if (window.confirm(`Tem certeza que deseja deletar o cliente "${cliente.nome}"?`)) {
      try {
        await deleteCliente.mutateAsync(cliente.id)
      } catch (error: any) {
        console.error('Erro ao deletar cliente:', error)
        
        // Verificar se é erro de cliente com lotes associados
        if (error?.response?.status === 400 && error?.response?.data?.error?.includes('amostras associadas')) {
          alert(`❌ Não é possível deletar o cliente "${cliente.nome}" porque ele possui lotes e amostras associadas.\n\nPara deletar este cliente, primeiro remova todos os lotes e amostras relacionados.`)
        } else {
          alert(`❌ Erro ao deletar cliente: ${error?.response?.data?.error || 'Erro desconhecido'}`)
        }
      }
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingCliente(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie os clientes do laboratório</p>
        </div>
        <button 
          onClick={handleCreateCliente}
          className="btn btn-primary btn-md flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="card border-emerald-300">
        <div className="card-content">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar clientes... (digite e aguarde ou pressione ENTER)"
                  className="input pl-10 w-full border-emerald-300"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-md"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Results info */}
          {(allClientes.length > 0 || (data?.clientes && data.clientes.length > 0)) && (
        <div className="text-sm text-gray-600">
          {filters.search ? (
            <span>Encontrados {allClientes.length || data?.clientes?.length || 0} cliente(s) para "{filters.search}"</span>
          ) : (
            <span>Mostrando {allClientes.length || data?.clientes?.length || 0} cliente(s) carregados</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card border-emerald-300">
        <div className="card-content p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Buscando clientes...</p>
            </div>
          ) : (allClientes.length === 0 && (!data?.clientes || data.clientes.length === 0)) ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                {filters.search ? `Nenhum cliente encontrado para "${filters.search}"` : 'Nenhum cliente cadastrado'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr className="table-row">
                    <th className="table-head">Nome</th>
                    <th className="table-head">CPF</th>
                    <th className="table-head">Email</th>
                    <th className="table-head">Telefone</th>
                    <th className="table-head">Cidade</th>
                            <th className="table-head">Lotes</th>
                    <th className="table-head">Ações</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {(allClientes.length > 0 ? allClientes : (data?.clientes || [])).map((cliente: any) => (
                    <tr key={cliente.id} className="table-row cursor-pointer">
                      <td className="table-cell font-medium">
                        <Link 
                          to={`/clientes/${cliente.id}`}
                          className="block w-full h-full"
                        >
                          {cliente.nome}
                        </Link>
                      </td>
                      <td className="table-cell">
                        <Link 
                          to={`/clientes/${cliente.id}`}
                          className="block w-full h-full"
                        >
                          {cliente.cpf}
                        </Link>
                      </td>
                      <td className="table-cell">
                        <Link 
                          to={`/clientes/${cliente.id}`}
                          className="block w-full h-full"
                        >
                          {cliente.email || '-'}
                        </Link>
                      </td>
                      <td className="table-cell">
                        <Link 
                          to={`/clientes/${cliente.id}`}
                          className="block w-full h-full"
                        >
                          {cliente.telefone || '-'}
                        </Link>
                      </td>
                      <td className="table-cell">
                        <Link 
                          to={`/clientes/${cliente.id}`}
                          className="block w-full h-full"
                        >
                          {cliente.cidade || '-'}
                        </Link>
                      </td>
                      <td className="table-cell">
                        <Link 
                          to={`/clientes/${cliente.id}`}
                          className="block w-full h-full"
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {cliente.lotes?.length || 0}
                          </span>
                        </Link>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/clientes/${cliente.id}`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Ver detalhes"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCliente(cliente)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Editar cliente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCliente(cliente)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Deletar cliente"
                            disabled={deleteCliente.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Botão Mostrar Mais */}
          {hasMore && (allClientes.length > 0 || (data?.clientes && data.clientes.length > 0)) && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="btn btn-outline flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span>Carregando...</span>
                  </>
                ) : (
                  <>
                    <span>Mostrar mais</span>
                    <span className="text-sm text-gray-500">(+10)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <ClienteForm
        cliente={editingCliente}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />
    </div>
  )
}



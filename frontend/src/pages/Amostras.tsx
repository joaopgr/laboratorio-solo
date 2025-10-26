import { useState, useEffect } from 'react'
import { useAmostras, useDeleteAmostra } from '../hooks/useAmostras'
import { Plus, Search, Edit, Trash2, Eye, ArrowUpDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AmostraForm } from '../components/AmostraForm'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { Amostra } from '../../../shared/types'

export function Amostras() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
  })
  
  const [searchInput, setSearchInput] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAmostra, setEditingAmostra] = useState<Amostra | undefined>()
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    amostra: Amostra | null
    message: string
    relatedData: any
  }>({
    isOpen: false,
    amostra: null,
    message: '',
    relatedData: null
  })

  const { data, isLoading } = useAmostras(filters)
  const deleteAmostra = useDeleteAmostra()

  // Debounce para busca automática
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Usar dados diretamente do React Query
  const amostras = data?.data || []
  const hasMore = amostras.length === filters.limit

  const handleDelete = async (id: string) => {
    const amostra = amostras.find(a => a.id === id)
    if (!amostra) return

    try {
      await deleteAmostra.mutateAsync({ id })
      // Os dados serão atualizados automaticamente pelo React Query
    } catch (error: any) {
      console.error('Erro ao excluir amostra:', error)
      
      // Verificar se é erro de amostra com resultados associados
      if (error?.response?.status === 400 && error?.response?.data?.hasRelatedData) {
        const relatedData = error.response.data.relatedData
        const message = error.response.data.message
        
        setDeleteModal({
          isOpen: true,
          amostra,
          message,
          relatedData
        })
      } else {
        alert(`❌ Erro ao excluir amostra: ${error?.response?.data?.error || 'Erro desconhecido'}`)
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.amostra) return

    try {
      await deleteAmostra.mutateAsync({ id: deleteModal.amostra.id, cascade: true })
      setDeleteModal({ isOpen: false, amostra: null, message: '', relatedData: null })
    } catch (error: any) {
      console.error('Erro ao excluir amostra em cascata:', error)
      alert(`❌ Erro ao excluir amostra: ${error?.response?.data?.error || 'Erro desconhecido'}`)
    }
  }

  const handleEdit = (amostra: Amostra) => {
    setEditingAmostra(amostra)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingAmostra(undefined)
  }

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setFilters(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Amostras</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Amostra
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar amostras..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Amostras */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading && amostras.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando amostras...</p>
          </div>
        ) : amostras.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Nenhuma amostra encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identificação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cultura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {amostras.map((amostra) => (
                  <tr key={amostra.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {amostra.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {amostra.identificacao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {amostra.cultura}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        amostra.status === 'concluida' ? 'bg-green-100 text-green-800' :
                        amostra.status === 'em_analise' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {amostra.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/amostras/${amostra.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(amostra)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(amostra.id)}
                          className="text-red-600 hover:text-red-900"
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

        {/* Botão Carregar Mais */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Carregando...
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-4 h-4" />
                  Carregar Mais
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal do Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingAmostra ? 'Editar Amostra' : 'Nova Amostra'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <AmostraForm
              amostra={editingAmostra}
              isOpen={true}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Deleção */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, amostra: null, message: '', relatedData: null })}
        onConfirm={handleConfirmDelete}
        title="Deletar Amostra"
        message={deleteModal.message}
        confirmText="Sim, deletar tudo"
        cancelText="Cancelar"
        isLoading={deleteAmostra.isLoading}
        type="danger"
      />
    </div>
  )
}
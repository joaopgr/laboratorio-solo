import { useState, useEffect, useMemo } from 'react'
import { useLotes, useDeleteLote, useCleanEmptyLotes } from '../hooks/useLotes'
import { Search, Trash2, Eye, Calendar, Package, User, AlertTriangle, Plus, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LoteAmostra } from '../../../shared/types'
import { AtualizarAmostrasLote } from '../components/AtualizarAmostrasLote'
import { GerarLaudoModal } from '../components/GerarLaudoModal'
import { GerarLaudosLote } from '../components/GerarLaudosLote'
import { ConfirmModal } from '../components/ConfirmModal'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import toast from 'react-hot-toast'

export function Lotes() {
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    pago: undefined as boolean | undefined,
    concluido: undefined as boolean | undefined,
  })
  
  const [searchInput, setSearchInput] = useState('')
  const [isAtualizarLoteOpen, setIsAtualizarLoteOpen] = useState(false)
  const [isGerarLaudoOpen, setIsGerarLaudoOpen] = useState(false)
  const [isGerarLaudosLoteOpen, setIsGerarLaudosLoteOpen] = useState(false)
  const [loteSelecionado, setLoteSelecionado] = useState<LoteAmostra | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [loteToDelete, setLoteToDelete] = useState<LoteAmostra | null>(null)
  const [cascadeDeleteModal, setCascadeDeleteModal] = useState<{
    isOpen: boolean
    lote: LoteAmostra | null
    message: string
    relatedData: any
  }>({
    isOpen: false,
    lote: null,
    message: '',
    relatedData: null
  })

  const { data, isLoading } = useLotes(filters)
  const deleteLote = useDeleteLote()
  const cleanEmptyLotes = useCleanEmptyLotes()

  // Filtrar lotes vazios (com 0 amostras)
  const lotesComAmostras = useMemo(() => {
    if (!data?.lotes) return []
    return data.lotes.filter((lote: any) => lote.amostras && lote.amostras.length > 0)
    }, [data?.lotes])

  // Contar lotes vazios
  const lotesVazios = useMemo(() => {
    if (!data?.lotes) return []
    return data.lotes.filter((lote: any) => !lote.amostras || lote.amostras.length === 0)
    }, [data?.lotes])

  // Debounce para busca automática
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handlePaymentFilter = (pago: boolean | undefined) => {
    setFilters(prev => ({ ...prev, pago, page: 1 }))
  }

  const handleCompletionFilter = (concluido: boolean | undefined) => {
    setFilters(prev => ({ ...prev, concluido, page: 1 }))
  }

  const handleDeleteLote = (lote: LoteAmostra) => {
    setLoteToDelete(lote)
    setIsDeleteConfirmOpen(true)
  }

  const confirmDeleteLote = async () => {
    if (!loteToDelete) return

    try {
      await deleteLote.mutateAsync({ id: loteToDelete.id })
      toast.success('Lote deletado com sucesso!')
      setIsDeleteConfirmOpen(false)
      setLoteToDelete(null)
    } catch (error: any) {
      console.error('Erro ao deletar lote:', error)
      
      // Verificar se é erro de lote com amostras associadas
      if (error?.response?.status === 400 && error?.response?.data?.hasRelatedData) {
        const relatedData = error.response.data.relatedData
        const message = error.response.data.message
        
        setIsDeleteConfirmOpen(false)
        setCascadeDeleteModal({
          isOpen: true,
          lote: loteToDelete,
          message,
          relatedData
        })
      } else {
        toast.error(`❌ Erro ao deletar lote: ${error?.response?.data?.error || 'Erro desconhecido'}`)
      }
    }
  }

  const handleConfirmCascadeDelete = async () => {
    if (!cascadeDeleteModal.lote) return

    try {
      await deleteLote.mutateAsync({ id: cascadeDeleteModal.lote.id, cascade: true })
      toast.success('Lote e dados relacionados deletados com sucesso!')
      setCascadeDeleteModal({ isOpen: false, lote: null, message: '', relatedData: null })
    } catch (error: any) {
      console.error('Erro ao deletar lote em cascata:', error)
      toast.error(`❌ Erro ao deletar lote: ${error?.response?.data?.error || 'Erro desconhecido'}`)
    }
  }

  const handleCleanEmptyLotes = async () => {
    if (lotesVazios.length === 0) {
      toast('Não há lotes vazios para remover', { icon: 'ℹ️' })
      return
    }

    const confirmMessage = `Tem certeza que deseja remover ${lotesVazios.length} lote(s) vazio(s)?\n\nEsta ação não pode ser desfeita.`
    if (window.confirm(confirmMessage)) {
      try {
        const result = await cleanEmptyLotes.mutateAsync()
        toast.success(result.message)
      } catch (error) {
        console.error('Erro ao remover lotes vazios:', error)
        toast.error('Erro ao remover lotes vazios')
      }
    }
  }

  const handleGerarLaudo = (lote: LoteAmostra) => {
    setLoteSelecionado(lote)
    setIsGerarLaudoOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800'
      case 'em_analise':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído'
      case 'em_analise':
        return 'Em Análise'
      default:
        return 'Pendente'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lotes de Amostras</h1>
          <p className="text-gray-600">Visualize todos os lotes de amostras</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-emerald-300">
        <div className="card-content">
          <div className="space-y-4">
            {/* Busca */}
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar lotes... (digite e aguarde ou pressione ENTER)"
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

            {/* Filtro de Pagamento */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filtrar por pagamento:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePaymentFilter(undefined)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.pago === undefined
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => handlePaymentFilter(true)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.pago === true
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Pagos
                </button>
                <button
                  onClick={() => handlePaymentFilter(false)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.pago === false
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Pendentes
                </button>
              </div>
            </div>

            {/* Filtro de Conclusão */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filtrar por conclusão:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCompletionFilter(undefined)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.concluido === undefined
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => handleCompletionFilter(true)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.concluido === true
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Concluídos
                </button>
                <button
                  onClick={() => handleCompletionFilter(false)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.concluido === false
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Em Análise
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results info */}
      {data && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filters.search || filters.pago !== undefined || filters.concluido !== undefined ? (
              <span>
                Encontrados {lotesComAmostras.length} lote(s)
                {filters.search && ` para "${filters.search}"`}
                {filters.pago !== undefined && (
                  <span className="ml-1">
                    {filters.pago ? 'pagos' : 'pendentes'}
                  </span>
                )}
                {filters.concluido !== undefined && (
                  <span className="ml-1">
                    {filters.concluido ? 'concluídos' : 'em análise'}
                  </span>
                )}
              </span>
            ) : (
              <span>Total de {lotesComAmostras.length} lote(s) com amostras</span>
            )}
          </div>
          
          {/* Botão para adicionar tipos de análise em lote */}
          <button
            onClick={() => setIsAtualizarLoteOpen(true)}
            className="btn btn-primary btn-sm flex items-center mr-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Tipos de Análise
          </button>

          {/* Botão para gerar laudos em lote */}
          <button
            onClick={() => setIsGerarLaudosLoteOpen(true)}
            className="btn btn-secondary btn-sm flex items-center mr-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Gerar Laudos
          </button>

          {/* Botão para limpar lotes vazios */}
          {lotesVazios.length > 0 && (
            <button
              onClick={handleCleanEmptyLotes}
              disabled={cleanEmptyLotes.isPending}
              className="btn btn-outline btn-sm text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center disabled:opacity-50"
            >
              {cleanEmptyLotes.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              {cleanEmptyLotes.isPending ? 'Removendo...' : `Remover ${lotesVazios.length} lote(s) vazio(s)`}
            </button>
          )}
        </div>
      )}

      {/* Lotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : lotesComAmostras.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {filters.search ? `Nenhum lote encontrado para "${filters.search}"` : 'Nenhum lote com amostras cadastrado'}
            </p>
          </div>
        ) : (
          lotesComAmostras.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).map((lote: any) => (
            <div key={lote.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = `/lotes/${lote.id}`}>
              <div className="card-content">
                {/* Header do Lote */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{lote.codigo}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <User className="w-4 h-4 mr-1" />
                      {lote.cliente?.nome}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lote.status)}`}>
                    {getStatusText(lote.status)}
                  </span>
                </div>

                {/* Informações do Lote */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(lote.dataEntrega).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-2" />
                    {lote.amostras?.length || 0} amostra(s)
                  </div>
                </div>

                {/* Observações */}
                {lote.observacoes && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{lote.observacoes}</p>
                )}

                {/* Amostras Preview */}
                {lote.amostras && lote.amostras.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Amostras:</h4>
                    <div className="space-y-1">
                      {lote.amostras.slice(0, 3).map((amostra: any) => (
                        <div key={amostra.id} className="text-xs text-gray-600 flex items-center justify-between">
                          <span>{amostra.codigo} - {amostra.identificacao}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            amostra.status === 'concluida' ? 'bg-green-100 text-green-800' :
                            amostra.status === 'em_analise' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {amostra.status === 'concluida' ? 'Concluída' :
                             amostra.status === 'em_analise' ? 'Em Análise' :
                             'Pendente'}
                          </span>
                        </div>
                      ))}
                      {lote.amostras.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{lote.amostras.length - 3} amostra(s) mais...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/lotes/${lote.id}`}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Ver detalhes"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/clientes/${lote.clienteId}`}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Ver cliente"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <User className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGerarLaudo(lote)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center"
                      title="Gerar laudo"
                      disabled={!lote.amostras || lote.amostras.length === 0}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Gerar Laudo
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteLote(lote)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Deletar lote"
                      disabled={deleteLote.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {lote.pago ? 'Pago' : 'Pendente'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para atualizar tipos de análise em lote */}
      <AtualizarAmostrasLote
        isOpen={isAtualizarLoteOpen}
        onClose={() => setIsAtualizarLoteOpen(false)}
      />

      {/* Modal para gerar laudo */}
      {loteSelecionado && (
        <GerarLaudoModal
          isOpen={isGerarLaudoOpen}
          onClose={() => {
            setIsGerarLaudoOpen(false)
            setLoteSelecionado(null)
          }}
          lote={loteSelecionado}
          amostras={loteSelecionado.amostras || []}
          resultados={[]} // Os resultados serão buscados pelo backend
        />
      )}

      {/* Modal para gerar laudos em lote */}
      {isGerarLaudosLoteOpen && (
        <GerarLaudosLote
          onClose={() => setIsGerarLaudosLoteOpen(false)}
        />
      )}

      {/* Modal de confirmação para exclusão */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false)
          setLoteToDelete(null)
        }}
        onConfirm={confirmDeleteLote}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o lote "${loteToDelete?.codigo}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados serão perdidos.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de confirmação para deleção em cascata */}
      <ConfirmDeleteModal
        isOpen={cascadeDeleteModal.isOpen}
        onClose={() => setCascadeDeleteModal({ isOpen: false, lote: null, message: '', relatedData: null })}
        onConfirm={handleConfirmCascadeDelete}
        title="Deletar Lote e Dados Relacionados"
        message={cascadeDeleteModal.message}
        confirmText="Sim, deletar tudo"
        cancelText="Cancelar"
        isLoading={deleteLote.isPending}
        type="danger"
      />
    </div>
  )
}



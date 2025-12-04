import { useState } from 'react'
import { useLotes, useDeleteLote } from '../hooks/useLotes'
import { Plus, Calendar, Package, Eye, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LoteAmostra, Cliente } from '../../../shared/types'
import { AmostraForm } from './AmostraForm'
import { AnaliseValues } from './AnaliseValues'
import { LoteStatusEditor } from './LoteStatusEditor'
import { ConfirmModal } from './ConfirmModal'
import { useValoresAnaliseContext } from '../contexts/ValoresAnaliseContext'

interface ClienteLotesProps {
  cliente: Cliente
}

export function ClienteLotes({ cliente }: ClienteLotesProps) {
  const [isAmostrasFormOpen, setIsAmostrasFormOpen] = useState(false)
  const [expandedLotes, setExpandedLotes] = useState<Set<string>>(new Set())
  const [selectedLoteForDetails, setSelectedLoteForDetails] = useState<LoteAmostra | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [loteToDelete, setLoteToDelete] = useState<LoteAmostra | null>(null)

  const { data: lotesData, isLoading } = useLotes({ clienteId: cliente.id, limit: 999 })
  const deleteLote = useDeleteLote()

  const lotes = (lotesData?.lotes || []).sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const handleCreateAmostras = () => {
    setIsAmostrasFormOpen(true)
  }

  const handleDeleteLote = (lote: LoteAmostra) => {
    setLoteToDelete(lote)
    setIsDeleteConfirmOpen(true)
  }

  const confirmDeleteLote = async () => {
    if (!loteToDelete) return

    try {
      await deleteLote.mutateAsync({ id: loteToDelete.id })
    } catch (error) {
      console.error('Erro ao deletar lote:', error)
    }
  }

  const handleCloseAmostrasForm = () => {
    setIsAmostrasFormOpen(false)
  }

  const handleViewLoteDetails = (lote: LoteAmostra) => {
    setSelectedLoteForDetails(lote)
  }

  const handleCloseLoteDetails = () => {
    setSelectedLoteForDetails(null)
  }

  const toggleLoteExpansion = (loteId: string) => {
    setExpandedLotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(loteId)) {
        newSet.delete(loteId)
      } else {
        newSet.add(loteId)
      }
      return newSet
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800'
      case 'em_analise':
        return 'bg-blue-100 text-blue-800'
      case 'pago':
        return 'bg-purple-100 text-purple-800'
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
      case 'pago':
        return 'Pago'
      default:
        return 'Pendente'
    }
  }

  // Obter valores dinâmicos do contexto
  const { getValores } = useValoresAnaliseContext()
  
  // Função para calcular valor total do lote
  const calcularValorLote = (lote: LoteAmostra) => {
    if (!lote || !lote.amostras) return 0
    
    const analiseValues = getValores(lote.tipoAnalise as 'solo' | 'foliar')
    let valorTotal = 0
    
    lote.amostras.forEach(amostra => {
      if (amostra.rotina) valorTotal += analiseValues.rotina
      if (amostra.organica) valorTotal += analiseValues.organica
      if (amostra.micronutrientes) valorTotal += analiseValues.micronutrientes
      if (amostra.enxofre) valorTotal += analiseValues.enxofre
      if (amostra.prem) valorTotal += analiseValues.prem
      if (amostra.nitrogenio) valorTotal += analiseValues.nitrogenio
      if (amostra.granulometria) valorTotal += analiseValues.granulometria
    })
    
    return valorTotal
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Carregando lotes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lotes de Amostras</h2>
          <p className="text-gray-600">Histórico de entregas do cliente</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleCreateAmostras}
            className="btn btn-primary btn-md flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Amostra
          </button>
        </div>
      </div>

      {/* Lista de Lotes */}
      {lotes.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum lote cadastrado para este cliente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lotes.map((lote: any) => {
            const isExpanded = expandedLotes.has(lote.id)
            const amostras = lote.amostras || []
            
            return (
              <div key={lote.id} className="card">
                <div className="card-content">
                  {/* Header do Lote */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleLoteExpansion(lote.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{lote.codigo}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(lote.dataEntrega).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="flex items-center">
                            <Package className="w-4 h-4 mr-1" />
                            {amostras.length} amostra(s)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lote.status)}`}>
                        {getStatusText(lote.status)}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleViewLoteDetails(lote)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Ver detalhes das amostras"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLote(lote)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Deletar lote"
                          disabled={deleteLote.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {lote.observacoes && (
                    <p className="text-sm text-gray-600 mt-2">{lote.observacoes}</p>
                  )}

                  {/* Amostras (expandido) */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Amostras do Lote</h4>
                      {amostras.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhuma amostra cadastrada neste lote</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {amostras.map((amostra: any) => (
                            <div key={amostra.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{amostra.codigo}</p>
                                  <p className="text-xs text-gray-600">{amostra.identificacao}</p>
                                  <p className="text-xs text-gray-500">{amostra.cultura}</p>
                                </div>
                                <Link
                                  to={`/amostras/${amostra.id}`}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  Ver detalhes
                                </Link>
                              </div>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  amostra.status === 'concluida' ? 'bg-green-100 text-green-800' :
                                  amostra.status === 'em_analise' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {amostra.status === 'concluida' ? 'Concluída' :
                                   amostra.status === 'em_analise' ? 'Em Análise' :
                                   'Pendente'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal - Usando o mesmo formulário da aba Amostras, mas com cliente pré-selecionado */}
      {isAmostrasFormOpen && (
        <AmostraForm
          isOpen={isAmostrasFormOpen}
          onClose={handleCloseAmostrasForm}
          clienteInicial={cliente}
        />
      )}

      {/* Modal de Detalhes do Lote */}
      {selectedLoteForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalhes do Lote {selectedLoteForDetails.codigo}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLoteForDetails.amostras?.length || 0} amostra(s)
                </p>
              </div>
              <button
                onClick={handleCloseLoteDetails}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Informações do Lote */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Lote</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Código</label>
                    <p className="text-gray-900">{selectedLoteForDetails.codigo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Entrega</label>
                    <p className="text-gray-900">
                      {new Date(selectedLoteForDetails.dataEntrega).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLoteForDetails.status)}`}>
                      {getStatusText(selectedLoteForDetails.status)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pago</label>
                    <p className="text-gray-900">{selectedLoteForDetails.pago ? 'Sim' : 'Não'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor Total</label>
                    <p className="text-gray-900 font-semibold text-green-600">
                      R$ {calcularValorLote(selectedLoteForDetails).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Observações</label>
                    <p className="text-gray-900">{selectedLoteForDetails.observacoes || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Editor de Status */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Controle de Status</h3>
                <LoteStatusEditor 
                  lote={selectedLoteForDetails} 
                  onStatusUpdate={() => {
                    // Recarregar dados do lote após atualização
                    window.location.reload()
                  }}
                />
              </div>

              {/* Tipos de Análise e Valores */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Análise e Valores</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Análises Solicitadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLoteForDetails.rotina && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Rotina
                        </span>
                      )}
                      {selectedLoteForDetails.micronutrientes && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Micronutrientes
                        </span>
                      )}
                      {selectedLoteForDetails.organica && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          Matéria Orgânica
                        </span>
                      )}
                      {selectedLoteForDetails.enxofre && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          Enxofre
                        </span>
                      )}
                      {selectedLoteForDetails.prem && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          PREM
                        </span>
                      )}
                      {selectedLoteForDetails.nitrogenio && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
                          Nitrogênio
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Valores</h4>
                    <AnaliseValues
                      rotina={selectedLoteForDetails.rotina}
                      organica={selectedLoteForDetails.organica}
                      micronutrientes={selectedLoteForDetails.micronutrientes}
                      enxofre={selectedLoteForDetails.enxofre}
                      prem={selectedLoteForDetails.prem}
                      nitrogenio={selectedLoteForDetails.nitrogenio}
                      granulometria={selectedLoteForDetails.granulometria}
                      showTotal={true}
                      tipoAnalise={selectedLoteForDetails.tipoAnalise as 'solo' | 'foliar'}
                    />
                  </div>
                </div>
              </div>

              {/* Amostras */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Amostras</h3>
                {selectedLoteForDetails.amostras && selectedLoteForDetails.amostras.length > 0 ? (
                  <div className="space-y-4">
                    {selectedLoteForDetails.amostras.map((amostra, index) => (
                      <div key={amostra.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Amostra {index + 1}</h4>
                          <span className="text-sm text-gray-500">Código: {amostra.codigo}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Identificação</label>
                            <p className="text-gray-900">{amostra.identificacao || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Cultura</label>
                            <p className="text-gray-900">{amostra.cultura || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Localidade</label>
                            <p className="text-gray-900">{amostra.localidade || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Data de Coleta</label>
                            <p className="text-gray-900">
                              {amostra.dataColeta ? new Date(amostra.dataColeta).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Pago</label>
                            <p className="text-gray-900">{amostra.pago ? 'Sim' : 'Não'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Observações</label>
                            <p className="text-gray-900">{amostra.observacoes || '-'}</p>
                          </div>
                        </div>

                        {/* Tipos de Análise e Valores da Amostra */}
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-500">Tipos de Análise e Valores</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <div className="flex flex-wrap gap-1">
                                {amostra.rotina && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Rotina
                                  </span>
                                )}
                                {amostra.micronutrientes && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Micronutrientes
                                  </span>
                                )}
                                {amostra.organica && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Matéria Orgânica
                                  </span>
                                )}
                                {amostra.enxofre && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    Enxofre
                                  </span>
                                )}
                                {amostra.prem && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                    PREM
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <AnaliseValues
                                rotina={amostra.rotina}
                                organica={amostra.organica}
                                micronutrientes={amostra.micronutrientes}
                                enxofre={amostra.enxofre}
                                prem={amostra.prem}
                                nitrogenio={amostra.nitrogenio}
                                granulometria={amostra.granulometria}
                                showTotal={true}
                                tipoAnalise={selectedLoteForDetails.tipoAnalise as 'solo' | 'foliar'}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma amostra encontrada neste lote.</p>
                )}
              </div>
            </div>
          </div>
        </div>
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
    </div>
  )
}

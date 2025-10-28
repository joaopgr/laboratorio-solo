import { useState, useEffect } from 'react'
import { useLotes } from '../hooks/useLotes'
import { useUpdateAmostrasLote } from '../hooks/useAmostras'
import { useResultados } from '../hooks/useResultados'
import { useModule } from '../contexts/ModuleContext'
import { X, Check, Package, Search, AlertTriangle } from 'lucide-react'
import { LoteAmostra } from '../../../shared/types'
import toast from 'react-hot-toast'

interface AtualizarAmostrasLoteProps {
  isOpen: boolean
  onClose: () => void
  loteId?: string
}

export function AtualizarAmostrasLote({ isOpen, onClose, loteId }: AtualizarAmostrasLoteProps) {
  const { modulo } = useModule()
  const [selectedLote, setSelectedLote] = useState<LoteAmostra | null>(null)
  const [selectedAmostras, setSelectedAmostras] = useState<string[]>([])
  const [tiposAnalise, setTiposAnalise] = useState({
    rotina: false,
    organica: false,
    micronutrientes: false,
    enxofre: false,
    prem: false,
    nitrogenio: false,
    granulometria: false,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [tiposExistentes, setTiposExistentes] = useState<Record<string, any>>({})
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [pendingChange, setPendingChange] = useState<{tipo: string, checked: boolean} | null>(null)

  // Buscar lotes do módulo atual - passar undefined como tipoAnalise para buscar todos
  const { data: lotesData } = useLotes({ limit: 1000, tipoAnalise: undefined })
  const updateAmostrasLote = useUpdateAmostrasLote()
  
  // Buscar resultados das amostras selecionadas (usando string com vírgulas)
  const amostraIdsStr = selectedAmostras.length > 0 
    ? selectedAmostras.join(',') 
    : ''
  const { data: resultadosData } = useResultados({ 
    amostraId: amostraIdsStr || undefined 
  })

  // Calcular tipos existentes das amostras selecionadas
  const calcularTiposExistentes = () => {
    if (!selectedLote || selectedAmostras.length === 0) {
      setTiposExistentes({})
      return
    }

    const tipos: Record<string, boolean> = {
      rotina: false,
      organica: false,
      micronutrientes: false,
      enxofre: false,
      prem: false,
      nitrogenio: false,
      granulometria: false,
    }


    // Verificar se pelo menos uma amostra selecionada tem cada tipo
    selectedAmostras.forEach(amostraId => {
      const amostra = selectedLote.amostras?.find(a => a.id === amostraId)
      if (amostra) {
        if (amostra.rotina) tipos.rotina = true
        if (amostra.organica) tipos.organica = true
        if (amostra.micronutrientes) tipos.micronutrientes = true
        if (amostra.enxofre) tipos.enxofre = true
        if (amostra.prem) tipos.prem = true
        if (amostra.nitrogenio) tipos.nitrogenio = true
      }
    })

    setTiposExistentes(tipos)
  }

  // Filtrar amostras por termo de busca
  const filteredAmostras = selectedLote?.amostras?.filter(amostra =>
    amostra.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amostra.identificacao.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Selecionar/deselecionar todas as amostras
  const handleSelectAll = () => {
    if (selectedAmostras.length === filteredAmostras.length) {
      setSelectedAmostras([])
    } else {
      setSelectedAmostras(filteredAmostras.map(a => a.id))
    }
  }

  // Selecionar/deselecionar amostra individual
  const handleSelectAmostra = (amostraId: string) => {
    setSelectedAmostras(prev =>
      prev.includes(amostraId)
        ? prev.filter(id => id !== amostraId)
        : [...prev, amostraId]
    )
  }

  // Verificar se há dados salvos para um tipo específico
  const verificarDadosSalvos = (tipo: string): boolean => {
    if (!resultadosData?.resultados || !Array.isArray(resultadosData.resultados)) return false
    
    // Mapear tipos para tipos de resultado
    const tipoMap: Record<string, string[]> = {
      rotina: ['pH', 'P', 'Ca', 'Mg', 'K', 'Na', 'Al', 'H+Al'],
      organica: ['MO'],
      micronutrientes: ['Fe', 'Zn', 'Cu', 'Mn', 'B'],
      enxofre: ['S'],
      prem: ['PREM'],
      nitrogenio: ['N']
    }
    
    const tiposResultado = tipoMap[tipo] || []
    
    // Verificar se alguma amostra selecionada tem resultados para esses tipos
    return resultadosData.resultados.some((resultado: any) => 
      selectedAmostras.includes(resultado.amostraId) && 
      tiposResultado.includes(resultado.tipo)
    )
  }

  // Atualizar tipos de análise
  const handleTipoChange = (tipo: string, checked: boolean) => {
    // Se está desmarcando um tipo que existia e tem dados salvos, mostrar aviso
    if (!checked && tiposExistentes[tipo] && verificarDadosSalvos(tipo)) {
      setPendingChange({ tipo, checked })
      setWarningMessage(`Ao remover o tipo "${tipo}", todos os dados salvos para este tipo serão perdidos. Deseja continuar?`)
      setShowWarning(true)
      return
    }
    
    // Aplicar mudança normalmente
    setTiposAnalise(prev => ({
      ...prev,
      [tipo]: checked
    }))
  }

  // Confirmar remoção de tipo com dados salvos
  const confirmarRemocao = () => {
    if (pendingChange) {
      setTiposAnalise(prev => ({
        ...prev,
        [pendingChange.tipo]: pendingChange.checked
      }))
    }
    setShowWarning(false)
    setPendingChange(null)
    setWarningMessage('')
  }

  // Cancelar remoção de tipo
  const cancelarRemocao = () => {
    setShowWarning(false)
    setPendingChange(null)
    setWarningMessage('')
  }

  // Submeter atualização
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedAmostras.length === 0) {
      toast.error('Selecione pelo menos uma amostra')
      return
    }

    if (!Object.values(tiposAnalise).some(Boolean)) {
      toast.error('Selecione pelo menos um tipo de análise')
      return
    }

    try {
      await updateAmostrasLote.mutateAsync({
        amostraIds: selectedAmostras,
        tiposAnalise
      })
      
      // Resetar formulário
      setSelectedLote(null)
      setSelectedAmostras([])
      setTiposAnalise({
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
      })
      setSearchTerm('')
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar amostras:', error)
    }
  }

  // Calcular tipos existentes quando amostras selecionadas mudarem
  useEffect(() => {
    calcularTiposExistentes()
  }, [selectedAmostras, selectedLote])

  // Pré-selecionar tipos existentes quando tiposExistentes mudarem
  useEffect(() => {
    
    if (selectedAmostras.length > 0 && Object.keys(tiposExistentes).length > 0) {
      setTiposAnalise(prev => ({
        ...prev,
        ...tiposExistentes
      }))
    } else if (selectedAmostras.length === 0) {
      // Se não há amostras selecionadas, limpar todos os tipos
      setTiposAnalise({
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
      })
    }
  }, [tiposExistentes, selectedAmostras.length])

  // Gerenciar estado do modal
  useEffect(() => {
    if (isOpen) {
      // Quando abre o modal
      if (loteId && lotesData?.lotes) {
        // Se tem loteId, pré-selecionar o lote
        const lote = lotesData.lotes.find((l: any) => l.id === loteId)
        if (lote) {
          setSelectedLote(lote)
        }
      }
    } else {
      // Quando fecha o modal, resetar tudo
      setSelectedLote(null)
      setSelectedAmostras([])
      setTiposAnalise({
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
      })
      setSearchTerm('')
      setTiposExistentes({})
      setShowWarning(false)
      setWarningMessage('')
      setPendingChange(null)
    }
  }, [isOpen, loteId, lotesData])

  if (!isOpen) return null

  return (
    <>
      {/* Modal de aviso sobre perda de dados */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Remoção
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                {warningMessage}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelarRemocao}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRemocao}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirmar Remoção
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal principal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Adicionar Tipos de Análise em Lote
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleção do Lote - só mostra se não foi pré-selecionado */}
          {!loteId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Lote
              </label>
              <select
                value={selectedLote?.id || ''}
                onChange={(e) => {
                  const lote = lotesData?.lotes?.find((l: any) => l.id === e.target.value)
                  setSelectedLote(lote || null)
                  setSelectedAmostras([])
                  setSearchTerm('')
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione um lote...</option>
                {lotesData?.lotes?.map((lote: any) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.codigo} - {lote.cliente?.nome} ({lote.amostras?.length || 0} amostras)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Informação do lote pré-selecionado */}
          {loteId && selectedLote && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="font-medium text-blue-900">Lote Selecionado</h3>
                  <p className="text-sm text-blue-700">
                    {selectedLote.codigo} - {selectedLote.cliente?.nome} ({selectedLote.amostras?.length || 0} amostras)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seleção de Amostras */}
          {selectedLote && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Selecionar Amostras ({selectedAmostras.length} selecionadas)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedAmostras.length === filteredAmostras.length ? 'Deselecionar Todas' : 'Selecionar Todas'}
                </button>
              </div>

              {/* Busca de amostras */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar amostras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>


              {/* Lista de amostras */}
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredAmostras.length === 0 && selectedLote && (
                  <div className="p-4 text-center text-gray-500">
                    Nenhuma amostra encontrada para este lote
                  </div>
                )}
                {filteredAmostras.map(amostra => (
                  <div
                    key={amostra.id}
                    className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedAmostras.includes(amostra.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelectAmostra(amostra.id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                        selectedAmostras.includes(amostra.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedAmostras.includes(amostra.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {amostra.codigo} - {amostra.identificacao}
                        </div>
                        <div className="text-sm text-gray-500">
                          {amostra.cultura} • {amostra.localidade}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Tipos atuais: {[
                            amostra.rotina && 'Rotina',
                            amostra.organica && 'Orgânica',
                            amostra.micronutrientes && 'Micronutrientes',
                            amostra.enxofre && 'Enxofre',
                            amostra.prem && 'PREM',
                            amostra.nitrogenio && 'Nitrogênio'
                          ].filter(Boolean).join(', ') || 'Nenhum'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tipos de Análise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipos de Análise a Adicionar
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'rotina', label: 'Rotina', color: 'bg-blue-100 text-blue-800' },
                { key: 'organica', label: 'Matéria Orgânica', color: 'bg-green-100 text-green-800', solo: true },
                { key: 'micronutrientes', label: 'Micronutrientes', color: 'bg-purple-100 text-purple-800' },
                { key: 'enxofre', label: 'Enxofre', color: 'bg-orange-100 text-orange-800' },
                { key: 'prem', label: 'PREM', color: 'bg-pink-100 text-pink-800', solo: true },
                { key: 'nitrogenio', label: 'Nitrogênio', color: 'bg-cyan-100 text-cyan-800' },
                { key: 'granulometria', label: 'Granulométrica', color: 'bg-indigo-100 text-indigo-800', solo: true },
              ]
                .filter(tipo => {
                  // Filtrar tipos baseado no módulo do lote selecionado
                  const loteModulo = selectedLote?.modulo || modulo
                  if (loteModulo === 'solo' && (tipo as any).solo) return true
                  if (loteModulo === 'foliar') {
                    // Para foliar, excluir tipos solo-only
                    return !(tipo as any).solo
                  }
                  return true
                })
                .map(({ key, label, color }) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tiposAnalise[key as keyof typeof tiposAnalise]}
                    onChange={(e) => handleTipoChange(key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateAmostrasLote.isLoading || selectedAmostras.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {updateAmostrasLote.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Atualizando...</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>Atualizar {selectedAmostras.length} Amostra(s)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

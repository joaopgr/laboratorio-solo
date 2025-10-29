import { useState } from 'react'
import { X, FileText, Download } from 'lucide-react'
import { LoteAmostra, Amostra, Resultado } from '../../../shared/types'
import { useGerarLaudo } from '../hooks/useLaudos'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'

interface GerarLaudoModalProps {
  isOpen: boolean
  onClose: () => void
  lote: LoteAmostra
  amostras: Amostra[]
  resultados: Resultado[]
}

export function GerarLaudoModal({ isOpen, onClose, lote, amostras, resultados }: GerarLaudoModalProps) {
  const { modulo } = useModule()
  const [tipoLaudo, setTipoLaudo] = useState<'geral' | 'granulometrica'>('geral')
  const gerarLaudo = useGerarLaudo()

  const handleGerarLaudo = async () => {
    if (!lote.cliente) {
      toast.error('Dados do cliente não encontrados')
      return
    }

    gerarLaudo.mutate({
      loteId: lote.id,
      tipoAnalise: tipoLaudo
    }, {
      onSuccess: () => {
        onClose()
      }
    })
  }

  const tiposDisponiveis = modulo === 'foliar' 
    ? [
        { value: 'geral', label: 'Laudo Foliar', description: 'Todos os tipos de análise foliar (Rotina, Micronutrientes, Enxofre, Nitrogênio, etc.)' }
      ]
    : [
        { value: 'geral', label: 'Laudo de Solo', description: 'Todos os tipos de análise (Rotina, Matéria Orgânica, Micronutrientes, etc.)' },
        { value: 'granulometrica', label: 'Laudo Granulométrica', description: 'Análise granulométrica com classificação textural' }
      ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Gerar Laudo {modulo === 'foliar' ? 'Foliar' : 'de Solo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {lote.codigo} - {lote.cliente?.nome}
            </h3>
            <p className="text-sm text-gray-600">
              {amostras.length} amostra(s) • {resultados.length} resultado(s)
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Laudo
            </label>
            <div className="space-y-2">
              {tiposDisponiveis.map((tipo) => (
                <label key={tipo.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoLaudo"
                    value={tipo.value}
                    checked={tipoLaudo === tipo.value}
                    onChange={(e) => setTipoLaudo(e.target.value as any)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {tipo.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tipo.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">
                  Informações do Laudo
                </h4>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• Dados completos do cliente</p>
                  <p>• Informações do lote e amostras</p>
                  {tipoLaudo === 'geral' ? (
                    <>
                      <p>• Resultados de todas as análises solicitadas</p>
                      {modulo === 'foliar' ? (
                        <p>• Rotina, Micronutrientes, Enxofre, Nitrogênio, etc.</p>
                      ) : (
                        <p>• Rotina, Matéria Orgânica, Micronutrientes, etc.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p>• Resultados da análise granulométrica</p>
                      <p>• Classificação textural (Areia, Silte, Argila)</p>
                    </>
                  )}
                  <p>• Formato HTML para impressão/PDF</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleGerarLaudo}
              disabled={gerarLaudo.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {gerarLaudo.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Gerar Laudo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

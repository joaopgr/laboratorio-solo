import React, { useState, useEffect } from 'react'
import { useModule } from '../contexts/ModuleContext'
import { useCreateAmostra } from '../hooks/useAmostras'
import { useLoteById } from '../hooks/useLotes'
import { CreateAmostraData } from '../../../shared/types'
import { X } from 'lucide-react'

interface AdicionarAmostraLoteFormProps {
  loteId: string
  onSuccess: () => void
  onCancel: () => void
}

export function AdicionarAmostraLoteForm({ loteId, onSuccess, onCancel }: AdicionarAmostraLoteFormProps) {
  const { modulo } = useModule()
  const { data: lote } = useLoteById(loteId)
  const createAmostra = useCreateAmostra()

  const [formData, setFormData] = useState({
    codigo: '',
    identificacao: '',
    cultura: '',
    localidade: '',
    propriedade: '',
    solicitante: '',
    dataColeta: '',
    observacoes: ''
  })
  
  const [tiposAnalise, setTiposAnalise] = useState({
    rotina: false,
    organica: false,
    micronutrientes: false,
    enxofre: false,
    prem: false,
    nitrogenio: false,
    granulometria: false,
    foliar: false,
  })

  // Gerar próximo código baseado no lote e preencher com valores do lote
  useEffect(() => {
    // Se módulo foliar, marcar os tipos automaticamente
    if (modulo === 'foliar') {
      setTiposAnalise({
        rotina: true,
        organica: false,
        micronutrientes: true,
        enxofre: true,
        prem: false,
        nitrogenio: true,
        granulometria: false,
        foliar: false,
      })
    }
    
    if (lote?.amostras && lote.amostras.length > 0) {
      const ultimaAmostra = lote.amostras[lote.amostras.length - 1]
      const ultimoNumero = parseInt(ultimaAmostra.codigo.replace(/\D/g, '')) || 0
      const proximoCodigo = (ultimoNumero + 1).toString()
      setFormData(prev => ({ ...prev, codigo: proximoCodigo }))
      
      // Preencher com valores da primeira amostra do lote (padrão)
      const primeiraAmostra = lote.amostras[0]
      setFormData(prev => ({
        ...prev,
        localidade: primeiraAmostra.localidade || '',
        propriedade: primeiraAmostra.propriedade || '',
        solicitante: primeiraAmostra.solicitante || '',
        dataColeta: primeiraAmostra.dataColeta || '',
        observacoes: primeiraAmostra.observacoes || ''
      }))
    } else {
      setFormData(prev => ({ ...prev, codigo: '1' }))
    }
  }, [lote, modulo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Formatar data para yyyy-MM-dd antes de enviar
      const dataColetaFormatted = formData.dataColeta 
        ? formData.dataColeta.split('T')[0] 
        : undefined
      
      const amostraData: CreateAmostraData = {
        ...formData,
        dataColeta: dataColetaFormatted,
        tipoAnalise: modulo,
        rotina: tiposAnalise.rotina,
        organica: tiposAnalise.organica,
        micronutrientes: tiposAnalise.micronutrientes,
        enxofre: tiposAnalise.enxofre,
        prem: tiposAnalise.prem,
        nitrogenio: tiposAnalise.nitrogenio,
        granulometria: tiposAnalise.granulometria,
        foliar: tiposAnalise.foliar,
        pago: false,
        loteId
      }

      await createAmostra.mutateAsync(amostraData)
      onSuccess()
    } catch (error) {
      console.error('Erro ao criar amostra:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Adicionar Amostra ao Lote</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identificação
            </label>
            <input
              type="text"
              name="identificacao"
              value={formData.identificacao}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cultura
            </label>
            <input
              type="text"
              name="cultura"
              value={formData.cultura}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localidade (opcional)
            </label>
            <input
              type="text"
              name="localidade"
              value={formData.localidade}
              onChange={handleChange}
              placeholder="Padrão do lote"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Propriedade (opcional)
            </label>
            <input
              type="text"
              name="propriedade"
              value={formData.propriedade}
              onChange={handleChange}
              placeholder="Padrão do lote"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solicitante (opcional)
            </label>
            <input
              type="text"
              name="solicitante"
              value={formData.solicitante}
              onChange={handleChange}
              placeholder="Padrão do lote"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Coleta (opcional)
            </label>
            <input
              type="date"
              name="dataColeta"
              value={formData.dataColeta}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tipos de Análise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipos de Análise
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'rotina', label: 'Rotina' },
                { key: 'organica', label: 'Matéria Orgânica', solo: true },
                { key: 'micronutrientes', label: 'Micronutrientes' },
                { key: 'enxofre', label: 'Enxofre' },
                { key: 'prem', label: 'PREM', solo: true },
                { key: 'nitrogenio', label: 'Nitrogênio' },
                { key: 'granulometria', label: 'Granulométrica', solo: true },
              ]
                .filter(tipo => {
                  const isSoloOnly = (tipo as any).solo
                  
                  // Módulo foliar: mostrar apenas tipos SEM flag .solo (rotina, micronutrientes, enxofre, nitrogenio)
                  if (modulo === 'foliar') {
                    return !isSoloOnly
                  }
                  
                  // Módulo solo: mostrar todos (rotina, micronutrientes, enxofre, nitrogenio são gerais)
                  return true
                })
                .map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tiposAnalise[key as keyof typeof tiposAnalise]}
                      onChange={(e) => setTiposAnalise(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createAmostra.isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createAmostra.isLoading ? 'Criando...' : 'Criar Amostra'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
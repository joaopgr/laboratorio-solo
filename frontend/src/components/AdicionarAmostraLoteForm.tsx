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

  // Gerar próximo código baseado no lote
  useEffect(() => {
    if (lote?.amostras && lote.amostras.length > 0) {
      const ultimaAmostra = lote.amostras[lote.amostras.length - 1]
      const ultimoNumero = parseInt(ultimaAmostra.codigo.replace(/\D/g, '')) || 0
      const proximoCodigo = (ultimoNumero + 1).toString()
      setFormData(prev => ({ ...prev, codigo: proximoCodigo }))
    } else {
      setFormData(prev => ({ ...prev, codigo: '1' }))
    }
  }, [lote])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const amostraData: CreateAmostraData = {
        ...formData,
        tipoAnalise: modulo,
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
        foliar: false,
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
              Localidade
            </label>
            <input
              type="text"
              name="localidade"
              value={formData.localidade}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Propriedade
            </label>
            <input
              type="text"
              name="propriedade"
              value={formData.propriedade}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solicitante
            </label>
            <input
              type="text"
              name="solicitante"
              value={formData.solicitante}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Coleta
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
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
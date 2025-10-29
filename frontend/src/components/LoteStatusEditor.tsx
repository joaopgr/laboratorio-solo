import { useState } from 'react'
import { useUpdateLote } from '../hooks/useLotes'
import { LoteAmostra } from '../../../shared/types'
import { Edit, Check, X } from 'lucide-react'

interface LoteStatusEditorProps {
  lote: LoteAmostra
  onStatusUpdate?: () => void
}

export function LoteStatusEditor({ lote, onStatusUpdate }: LoteStatusEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(lote.status)
  const [isPaid, setIsPaid] = useState(lote.pago)
  const [desconto, setDesconto] = useState(lote.desconto || 0)
  
  const updateLote = useUpdateLote()

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'em_analise', label: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
    { value: 'concluido', label: 'Concluído', color: 'bg-green-100 text-green-800' },
    { value: 'pago', label: 'Pago', color: 'bg-purple-100 text-purple-800' },
  ]

  const handleSave = async () => {
    try {
      await updateLote.mutateAsync({
        id: lote.id,
        data: {
          status: selectedStatus === 'pago' ? 'concluido' : selectedStatus,
          pago: isPaid,
          desconto: desconto
        }
      })
      setIsEditing(false)
      onStatusUpdate?.()
    } catch (error) {
      console.error('Erro ao atualizar status do lote:', error)
    }
  }

  const handleCancel = () => {
    setSelectedStatus(lote.status)
    setIsPaid(lote.pago)
    setDesconto(lote.desconto || 0)
    setIsEditing(false)
  }

  const getCurrentStatus = () => {
    return statusOptions.find(option => option.value === lote.status) || statusOptions[0]
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status do Lote
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Marcar como pago</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desconto (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={desconto}
            onChange={(e) => setDesconto(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={updateLote.isPending}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4 mr-1" />
            Salvar
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCurrentStatus().color}`}>
            {getCurrentStatus().label}
          </span>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Editar status"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Pago:</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          lote.pago 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {lote.pago ? 'Sim' : 'Não'}
        </span>
      </div>

      {lote.desconto !== undefined && lote.desconto > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Desconto:</span>
          <span className="text-sm text-gray-900 font-semibold">
            {lote.desconto.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  )
}








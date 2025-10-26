import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateLote, useUpdateLote } from '../hooks/useLotes'
import { LoteAmostra, CreateLoteAmostraData } from '../../../shared/types'

interface LoteFormProps {
  lote?: LoteAmostra
  clienteId: string
  isOpen: boolean
  onClose: () => void
}

const loteSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  dataEntrega: z.string().min(1, 'Data de entrega é obrigatória'),
  observacoes: z.string().optional().or(z.literal('')),
  status: z.enum(['pendente', 'em_analise', 'concluido']).default('pendente'),
  pago: z.boolean().default(false),
  // Tipo de análise do lote
  tipoAnalise: z.enum(['solo', 'granulometria', 'foliar']).default('solo'),
  // Tipos de análise solicitados para o lote (solo)
  rotina: z.boolean().default(false),
  organica: z.boolean().default(false),
  micronutrientes: z.boolean().default(false),
  enxofre: z.boolean().default(false),
  prem: z.boolean().default(false),
  nitrogenio: z.boolean().default(false),
  // Tipos de análise para granulometria
  granulometria: z.boolean().default(false),
  // Tipos de análise para foliar
  foliar: z.boolean().default(false),
})

type LoteFormData = z.infer<typeof loteSchema>

export function LoteForm({ lote, clienteId, isOpen, onClose }: LoteFormProps) {
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<LoteFormData>({
    resolver: zodResolver(loteSchema),
  })

  const createLote = useCreateLote()
  const updateLote = useUpdateLote()

  useEffect(() => {
    if (isOpen) {
      reset({
        codigo: lote?.codigo || '',
        dataEntrega: lote?.dataEntrega ? new Date(lote.dataEntrega).toISOString().split('T')[0] : '',
        observacoes: lote?.observacoes || '',
        status: (lote?.status === 'pago' ? 'concluido' : lote?.status) || 'pendente',
        pago: lote?.pago || false,
        // Tipo de análise do lote
        tipoAnalise: lote?.tipoAnalise || 'solo',
        // Tipos de análise (solo)
        rotina: lote?.rotina || false,
        organica: lote?.organica || false,
        micronutrientes: lote?.micronutrientes || false,
        enxofre: lote?.enxofre || false,
        prem: lote?.prem || false,
        nitrogenio: lote?.nitrogenio || false,
        // Tipos de análise para granulometria
        granulometria: lote?.granulometria || false,
        // Tipos de análise para foliar
        foliar: lote?.foliar || false,
      })
    }
  }, [isOpen, lote, reset])

  const onSubmit = async (data: LoteFormData) => {
    try {
      const formattedData = {
        ...data,
        dataEntrega: new Date(data.dataEntrega).toISOString(),
        clienteId,
      } as CreateLoteAmostraData
      
      if (lote) {
        await updateLote.mutateAsync({ id: lote.id, data: formattedData })
      } else {
        await createLote.mutateAsync(formattedData)
      }
      onClose()
    } catch (error) {
      console.error('Erro ao salvar lote:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {lote ? 'Editar Lote' : 'Novo Lote'}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Código do Lote */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código do Lote *
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="Ex: LOTE-2024-001"
              {...register('codigo')}
            />
            {errors.codigo && (
              <p className="text-red-500 text-xs mt-1">{errors.codigo.message}</p>
            )}
          </div>

          {/* Data de Entrega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Entrega *
            </label>
            <input
              type="date"
              className="input w-full"
              {...register('dataEntrega')}
            />
            {errors.dataEntrega && (
              <p className="text-red-500 text-xs mt-1">{errors.dataEntrega.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select className="input w-full" {...register('status')}>
              <option value="pendente">Pendente</option>
              <option value="em_analise">Em Análise</option>
              <option value="concluido">Concluído</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
            )}
          </div>

          {/* Pago */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pago"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('pago')}
            />
            <label htmlFor="pago" className="ml-2 block text-sm text-gray-700">
              Lote pago
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              className="input w-full h-20 resize-none"
              placeholder="Observações sobre o lote..."
              {...register('observacoes')}
            />
            {errors.observacoes && (
              <p className="text-red-500 text-xs mt-1">{errors.observacoes.message}</p>
            )}
          </div>

          {/* Tipos de Análise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipos de Análise Solicitados
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rotina"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={watch('rotina') || false}
                  onChange={(e) => setValue('rotina', e.target.checked)}
                />
                <label htmlFor="rotina" className="ml-2 block text-sm text-gray-700">
                  Rotina
                </label>
              </div>
              
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="organica"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={watch('organica') || false}
                  onChange={(e) => setValue('organica', e.target.checked)}
                />
                <label htmlFor="organica" className="ml-2 block text-sm text-gray-700">
                  Matéria Orgânica
                </label>
              </div>
              
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="prem"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={watch('prem') || false}
                  onChange={(e) => setValue('prem', e.target.checked)}
                />
                <label htmlFor="prem" className="ml-2 block text-sm text-gray-700">
                  PREM
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="nitrogenio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={watch('nitrogenio') || false}
                  onChange={(e) => setValue('nitrogenio', e.target.checked)}
                />
                <label htmlFor="nitrogenio" className="ml-2 block text-sm text-gray-700">
                  Nitrogênio
                </label>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={createLote.isLoading || updateLote.isLoading}
            >
              {lote ? 'Salvar Alterações' : 'Criar Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateResultado } from '../hooks/useResultados'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'

const granulometriaResultadoSchema = z.object({
  // Campos específicos da granulométrica
  massaRecipienteAreiaGrossa: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaRecipienteAreiaFina: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaRecipienteSilteArgila: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaRecipienteArgila: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaRecipientePartAreiaGrossa: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaRecipientePartAreiaFina: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaRecipientePartSilteArgila: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaRecipientePartArgila: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaLata: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaLataSu: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaLataSs: z.number().min(0, 'Valor deve ser positivo').optional(),
  proporcaoAreiaGrossa: z.number().min(0, 'Valor deve ser positivo').optional(),
  proporcaoAreiaFina: z.number().min(0, 'Valor deve ser positivo').optional(),
  proporcaoSilte: z.number().min(0, 'Valor deve ser positivo').optional(),
  proporcaoArgila: z.number().min(0, 'Valor deve ser positivo').optional(),
  totalRecuperado: z.number().min(0, 'Valor deve ser positivo').optional(),
  fatorF: z.number().min(0, 'Valor deve ser positivo').optional(),
  classificacaoTextural: z.string().optional(),
  precisao: z.number().min(0, 'Valor deve ser positivo').optional(),
  
  observacoes: z.string().optional(),
  amostraId: z.string().min(1, 'Amostra é obrigatória')
})

type GranulometriaResultadoFormData = z.infer<typeof granulometriaResultadoSchema>

interface GranulometriaResultadoFormProps {
  amostraId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function GranulometriaResultadoForm({ amostraId, onSuccess, onCancel }: GranulometriaResultadoFormProps) {
  const { modulo } = useModule()
  const createResultado = useCreateResultado()
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<GranulometriaResultadoFormData>({
    resolver: zodResolver(granulometriaResultadoSchema),
    defaultValues: {
      amostraId
    }
  })

  // Auto-calcular campos derivados
  const watchedValues = watch()
  
  useEffect(() => {
    // Calcular proporções automáticas
    const areiaGrossa = watchedValues.massaRecipientePartAreiaGrossa || 0
    const areiaFina = watchedValues.massaRecipientePartAreiaFina || 0
    const silte = watchedValues.massaRecipientePartSilteArgila || 0
    const argila = watchedValues.massaRecipientePartArgila || 0
    
    const total = areiaGrossa + areiaFina + silte + argila
    
    if (total > 0) {
      setValue('proporcaoAreiaGrossa', Number((areiaGrossa / total * 100).toFixed(2)))
      setValue('proporcaoAreiaFina', Number((areiaFina / total * 100).toFixed(2)))
      setValue('proporcaoSilte', Number((silte / total * 100).toFixed(2)))
      setValue('proporcaoArgila', Number((argila / total * 100).toFixed(2)))
      setValue('totalRecuperado', Number(total.toFixed(2)))
    }
  }, [watchedValues.massaRecipientePartAreiaGrossa, watchedValues.massaRecipientePartAreiaFina, watchedValues.massaRecipientePartSilteArgila, watchedValues.massaRecipientePartArgila, setValue])

  const onSubmit = async (data: GranulometriaResultadoFormData) => {
    try {
      await createResultado.mutateAsync({
        ...data,
        categoria: modulo
      } as any)
      
      toast.success('Resultado granulométrico salvo com sucesso!')
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao salvar resultado:', error)
      toast.error('Erro ao salvar resultado')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Resultado Granulométrico</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Massas dos Recipientes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Massas dos Recipientes</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">Massa Recipiente Areia Grossa</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('massaRecipienteAreiaGrossa', { valueAsNumber: true })}
                />
                {errors.massaRecipienteAreiaGrossa && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaRecipienteAreiaGrossa.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Massa Recipiente Areia Fina</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('massaRecipienteAreiaFina', { valueAsNumber: true })}
                />
                {errors.massaRecipienteAreiaFina && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaRecipienteAreiaFina.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Massa Recipiente Silte+Argila</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('massaRecipienteSilteArgila', { valueAsNumber: true })}
                />
                {errors.massaRecipienteSilteArgila && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaRecipienteSilteArgila.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Massa Recipiente Argila</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('massaRecipienteArgila', { valueAsNumber: true })}
                />
                {errors.massaRecipienteArgila && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaRecipienteArgila.message}</p>
                )}
              </div>
            </div>

            {/* Massas das Partes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Massas das Partes</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">Massa Parte Areia Grossa</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('massaRecipientePartAreiaGrossa', { valueAsNumber: true })}
                />
                {errors.massaRecipientePartAreiaGrossa && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaRecipientePartAreiaGrossa.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Massa Parte Areia Fina</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('massaRecipientePartAreiaFina', { valueAsNumber: true })}
                />
                {errors.massaRecipientePartAreiaFina && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaRecipientePartAreiaFina.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Massa Parte Silte+Argila</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('massaRecipientePartSilteArgila', { valueAsNumber: true })}
                />
                {errors.massaRecipientePartSilteArgila && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaRecipientePartSilteArgila.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Massa Parte Argila</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('massaRecipientePartArgila', { valueAsNumber: true })}
                />
                {errors.massaRecipientePartArgila && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaRecipientePartArgila.message}</p>
                )}
              </div>
            </div>

            {/* Resultados Calculados */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Resultados Calculados</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">Proporção Areia Grossa (%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full bg-gray-100"
                  {...register('proporcaoAreiaGrossa', { valueAsNumber: true })}
                  readOnly
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Proporção Areia Fina (%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full bg-gray-100"
                  {...register('proporcaoAreiaFina', { valueAsNumber: true })}
                  readOnly
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Proporção Silte (%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full bg-gray-100"
                  {...register('proporcaoSilte', { valueAsNumber: true })}
                  readOnly
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Proporção Argila (%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full bg-gray-100"
                  {...register('proporcaoArgila', { valueAsNumber: true })}
                  readOnly
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Total Recuperado</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full bg-gray-100"
                  {...register('totalRecuperado', { valueAsNumber: true })}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Campos adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="label">
                <span className="label-text">Classificação Textural</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                {...register('classificacaoTextural')}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Precisão</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered w-full"
                {...register('precisao', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="label">
              <span className="label-text">Observações</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              {...register('observacoes')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={createResultado.isLoading}
        >
          {createResultado.isLoading ? 'Salvando...' : 'Salvar Resultado'}
        </button>
      </div>
    </form>
  )
}


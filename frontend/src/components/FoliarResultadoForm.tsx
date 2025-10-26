import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateResultado } from '../hooks/useResultados'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'

const foliarResultadoSchema = z.object({
  // Campos específicos da análise foliar
  massaN: z.number().min(0, 'Valor deve ser positivo').optional(),
  volTit: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaGeral: z.number().min(0, 'Valor deve ser positivo').optional(),
  pAbsFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoPFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  kMgLFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoKFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  caMgLFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoCaFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  mgMgLFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoMgFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  sAbsFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoSFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  brancoSFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  feMgLFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoFeFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  cuMgLFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoCuFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  znMgLFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoZnFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  mnMgLFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoMnFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaBFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  bTransFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  diluicaoBFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  brancoBFoliar: z.number().min(0, 'Valor deve ser positivo').optional(),
  
  // Campos de calibração
  curvaSA: z.number().min(0, 'Valor deve ser positivo').optional(),
  curvaSB: z.number().min(0, 'Valor deve ser positivo').optional(),
  curvaPA: z.number().min(0, 'Valor deve ser positivo').optional(),
  curvaPB: z.number().min(0, 'Valor deve ser positivo').optional(),
  curvaBA: z.number().min(0, 'Valor deve ser positivo').optional(),
  curvaBB: z.number().min(0, 'Valor deve ser positivo').optional(),
  vBranco: z.number().min(0, 'Valor deve ser positivo').optional(),
  massaTris: z.number().min(0, 'Valor deve ser positivo').optional(),
  vTitulado: z.number().min(0, 'Valor deve ser positivo').optional(),
  
  observacoes: z.string().optional(),
  amostraId: z.string().min(1, 'Amostra é obrigatória')
})

type FoliarResultadoFormData = z.infer<typeof foliarResultadoSchema>

interface FoliarResultadoFormProps {
  amostraId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function FoliarResultadoForm({ amostraId, onSuccess, onCancel }: FoliarResultadoFormProps) {
  const { modulo } = useModule()
  const createResultado = useCreateResultado()
  
  const { register, handleSubmit, formState: { errors } } = useForm<FoliarResultadoFormData>({
    resolver: zodResolver(foliarResultadoSchema),
    defaultValues: {
      amostraId
    }
  })

  const onSubmit = async (data: FoliarResultadoFormData) => {
    try {
      await createResultado.mutateAsync({
        ...data,
        categoria: modulo
      } as any)
      
      toast.success('Resultado foliar salvo com sucesso!')
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
          <h3 className="card-title">Resultado Análise Foliar</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Macronutrientes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Macronutrientes</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">Massa N (g)</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('massaN', { valueAsNumber: true })}
                />
                {errors.massaN && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaN.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Vol. Titulado (mL)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-resultado"
                  {...register('volTit', { valueAsNumber: true })}
                />
                {errors.volTit && (
                  <p className="text-red-500 text-sm mt-1">{errors.volTit.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Massa Geral (g)</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('massaGeral', { valueAsNumber: true })}
                />
                {errors.massaGeral && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaGeral.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">P Abs Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('pAbsFoliar', { valueAsNumber: true })}
                />
                {errors.pAbsFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.pAbsFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Diluição P Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  {...register('diluicaoPFoliar', { valueAsNumber: true })}
                />
                {errors.diluicaoPFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.diluicaoPFoliar.message}</p>
                )}
              </div>
            </div>

            {/* Potássio */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Potássio</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">K mg/L Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  {...register('kMgLFoliar', { valueAsNumber: true })}
                />
                {errors.kMgLFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.kMgLFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Diluição K Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  {...register('diluicaoKFoliar', { valueAsNumber: true })}
                />
                {errors.diluicaoKFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.diluicaoKFoliar.message}</p>
                )}
              </div>
            </div>

            {/* Cálcio */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Cálcio</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">Ca mg/L Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  {...register('caMgLFoliar', { valueAsNumber: true })}
                />
                {errors.caMgLFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.caMgLFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Diluição Ca Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  {...register('diluicaoCaFoliar', { valueAsNumber: true })}
                />
                {errors.diluicaoCaFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.diluicaoCaFoliar.message}</p>
                )}
              </div>
            </div>

            {/* Magnésio */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Magnésio</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">Mg mg/L Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  {...register('mgMgLFoliar', { valueAsNumber: true })}
                />
                {errors.mgMgLFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.mgMgLFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Diluição Mg Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  {...register('diluicaoMgFoliar', { valueAsNumber: true })}
                />
                {errors.diluicaoMgFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.diluicaoMgFoliar.message}</p>
                )}
              </div>
            </div>

            {/* Enxofre */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Enxofre</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">S Abs Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('sAbsFoliar', { valueAsNumber: true })}
                />
                {errors.sAbsFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.sAbsFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Diluição S Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  {...register('diluicaoSFoliar', { valueAsNumber: true })}
                />
                {errors.diluicaoSFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.diluicaoSFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Branco S Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('brancoSFoliar', { valueAsNumber: true })}
                />
                {errors.brancoSFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.brancoSFoliar.message}</p>
                )}
              </div>
            </div>

            {/* Micronutrientes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Micronutrientes</h4>
              
              <div>
                <label className="label">
                  <span className="label-text">Fe mg/L Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('feMgLFoliar', { valueAsNumber: true })}
                />
                {errors.feMgLFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.feMgLFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Cu mg/L Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('cuMgLFoliar', { valueAsNumber: true })}
                />
                {errors.cuMgLFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.cuMgLFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Zn mg/L Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('znMgLFoliar', { valueAsNumber: true })}
                />
                {errors.znMgLFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.znMgLFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Mn mg/L Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('mnMgLFoliar', { valueAsNumber: true })}
                />
                {errors.mnMgLFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.mnMgLFoliar.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">B mg/L Foliar</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-resultado"
                  {...register('massaBFoliar', { valueAsNumber: true })}
                />
                {errors.massaBFoliar && (
                  <p className="text-red-500 text-sm mt-1">{errors.massaBFoliar.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
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


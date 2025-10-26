import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { calcularResultadosGranulometricos, formatarValorGranulometrico, DadosGranulometricos, ResultadosGranulometricos } from '../utils/calculosGranulometria'

const granulometriaSchema = z.object({
  // Entrada de Dados - Massa dos Recipientes (g)
  massaRecipienteAreiaGrossa: z.number().min(0, 'Valor deve ser positivo'),
  massaRecipienteAreiaFina: z.number().min(0, 'Valor deve ser positivo'),
  massaRecipienteSilteArgila: z.number().min(0, 'Valor deve ser positivo'),
  massaRecipienteArgila: z.number().min(0, 'Valor deve ser positivo'),
  
  // Entrada de Dados - Massa dos recipientes mais partículas (g)
  massaRecipientePartAreiaGrossa: z.number().min(0, 'Valor deve ser positivo'),
  massaRecipientePartAreiaFina: z.number().min(0, 'Valor deve ser positivo'),
  massaRecipientePartSilteArgila: z.number().min(0, 'Valor deve ser positivo'),
  massaRecipientePartArgila: z.number().min(0, 'Valor deve ser positivo'),
  
  // TFSA (g) e Massas para o fator f
  tfsa: z.number().min(0, 'Valor deve ser positivo'),
  massaLata: z.number().min(0, 'Valor deve ser positivo'),
  massaLataSu: z.number().min(0, 'Valor deve ser positivo'),
  massaLataSs: z.number().min(0, 'Valor deve ser positivo'),
})

type GranulometriaFormData = z.infer<typeof granulometriaSchema>

interface GranulometriaFormProps {
  onSubmit: (dados: DadosGranulometricos) => void
  initialData?: Partial<DadosGranulometricos>
}

export function GranulometriaForm({ onSubmit, initialData }: GranulometriaFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<GranulometriaFormData>({
    resolver: zodResolver(granulometriaSchema),
    defaultValues: initialData
  })

  const [resultados, setResultados] = useState<ResultadosGranulometricos | null>(null)

  // Observar mudanças nos campos para recalcular automaticamente
  const watchedValues = watch()

  useEffect(() => {
    try {
      const dados: DadosGranulometricos = {
        massaRecipienteAreiaGrossa: watchedValues.massaRecipienteAreiaGrossa || 0,
        massaRecipienteAreiaFina: watchedValues.massaRecipienteAreiaFina || 0,
        massaRecipienteSilteArgila: watchedValues.massaRecipienteSilteArgila || 0,
        massaRecipienteArgila: watchedValues.massaRecipienteArgila || 0,
        massaRecipientePartAreiaGrossa: watchedValues.massaRecipientePartAreiaGrossa || 0,
        massaRecipientePartAreiaFina: watchedValues.massaRecipientePartAreiaFina || 0,
        massaRecipientePartSilteArgila: watchedValues.massaRecipientePartSilteArgila || 0,
        massaRecipientePartArgila: watchedValues.massaRecipientePartArgila || 0,
        tfsa: watchedValues.tfsa || 0,
        massaLata: watchedValues.massaLata || 0,
        massaLataSu: watchedValues.massaLataSu || 0,
        massaLataSs: watchedValues.massaLataSs || 0,
      }

      // Verificar se todos os campos obrigatórios estão preenchidos
      const camposObrigatorios = Object.values(dados)
      if (camposObrigatorios.every(valor => typeof valor === 'number' && valor > 0)) {
        const calculados = calcularResultadosGranulometricos(dados)
        setResultados(calculados)
      } else {
        setResultados(null)
      }
    } catch (error) {
      console.error('Erro ao calcular granulometria:', error)
      setResultados(null)
    }
  }, [watchedValues])

  const handleFormSubmit = (data: GranulometriaFormData) => {
    const dados: DadosGranulometricos = {
      massaRecipienteAreiaGrossa: data.massaRecipienteAreiaGrossa,
      massaRecipienteAreiaFina: data.massaRecipienteAreiaFina,
      massaRecipienteSilteArgila: data.massaRecipienteSilteArgila,
      massaRecipienteArgila: data.massaRecipienteArgila,
      massaRecipientePartAreiaGrossa: data.massaRecipientePartAreiaGrossa,
      massaRecipientePartAreiaFina: data.massaRecipientePartAreiaFina,
      massaRecipientePartSilteArgila: data.massaRecipientePartSilteArgila,
      massaRecipientePartArgila: data.massaRecipientePartArgila,
      tfsa: data.tfsa,
      massaLata: data.massaLata,
      massaLataSu: data.massaLataSu,
      massaLataSs: data.massaLataSs,
    }
    onSubmit(dados)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Entrada de Dados */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ENTRADA DE DADOS</h3>
          
          {/* Massa dos Recipientes (g) */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Massa dos Recipientes (g)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">A. Grossa</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaRecipienteAreiaGrossa', { valueAsNumber: true })}
                />
                {errors.massaRecipienteAreiaGrossa && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaRecipienteAreiaGrossa.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">A. Fina</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaRecipienteAreiaFina', { valueAsNumber: true })}
                />
                {errors.massaRecipienteAreiaFina && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaRecipienteAreiaFina.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Silte + Argila</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaRecipienteSilteArgila', { valueAsNumber: true })}
                />
                {errors.massaRecipienteSilteArgila && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaRecipienteSilteArgila.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Argila</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaRecipienteArgila', { valueAsNumber: true })}
                />
                {errors.massaRecipienteArgila && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaRecipienteArgila.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Massa dos recipientes mais partículas (g) */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Massa dos recipientes mais partículas (g)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">A. Grossa</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaRecipientePartAreiaGrossa', { valueAsNumber: true })}
                />
                {errors.massaRecipientePartAreiaGrossa && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaRecipientePartAreiaGrossa.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">A. Fina</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaRecipientePartAreiaFina', { valueAsNumber: true })}
                />
                {errors.massaRecipientePartAreiaFina && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaRecipientePartAreiaFina.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Silte + Argila</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaRecipientePartSilteArgila', { valueAsNumber: true })}
                />
                {errors.massaRecipientePartSilteArgila && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaRecipientePartSilteArgila.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Argila</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaRecipientePartArgila', { valueAsNumber: true })}
                />
                {errors.massaRecipientePartArgila && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaRecipientePartArgila.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* TFSA (g) e Massas para o fator f */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">TFSA (g) e Massas para o fator f</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TFSA (g)</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('tfsa', { valueAsNumber: true })}
                />
                {errors.tfsa && (
                  <p className="text-red-500 text-xs mt-1">{errors.tfsa.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">M. Lata</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaLata', { valueAsNumber: true })}
                />
                {errors.massaLata && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaLata.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">M. Lata + Su</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaLataSu', { valueAsNumber: true })}
                />
                {errors.massaLataSu && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaLataSu.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">M. Lata + Ss</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-resultado"
                  {...register('massaLataSs', { valueAsNumber: true })}
                />
                {errors.massaLataSs && (
                  <p className="text-red-500 text-xs mt-1">{errors.massaLataSs.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resultados Calculados */}
        {resultados && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">RESULTADOS CALCULADOS</h3>
            
            {/* Classificação Textural */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Classificação Textural</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">A. Grossa (%)</label>
                  <div className="input bg-gray-50">{formatarValorGranulometrico(resultados.proporcaoAreiaGrossa)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">A. Fina (%)</label>
                  <div className="input bg-gray-50">{formatarValorGranulometrico(resultados.proporcaoAreiaFina)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Silte (%)</label>
                  <div className="input bg-gray-50">{formatarValorGranulometrico(resultados.proporcaoSilte)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Argila (%)</label>
                  <div className="input bg-gray-50">{formatarValorGranulometrico(resultados.proporcaoArgila)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total (%)</label>
                  <div className="input bg-gray-50">{formatarValorGranulometrico(resultados.totalRecuperado)}</div>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Classificação</label>
                <div className="input bg-blue-50 font-semibold">{resultados.classificacao}</div>
              </div>
            </div>

            {/* Qualidade de Dados */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Qualidade de Dados</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precisão (%)</label>
                  <div className="input bg-gray-50">{formatarValorGranulometrico(resultados.precisao)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classificação</label>
                  <div className="input bg-gray-50">Classificada</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dados</label>
                  <div className={`input font-semibold ${
                    resultados.dados === 'PROSSEGUIR' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {resultados.dados}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!resultados}
          >
            Salvar Análise Granulométrica
          </button>
        </div>
      </form>
    </div>
  )
}
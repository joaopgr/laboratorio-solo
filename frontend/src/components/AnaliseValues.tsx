import { getAnaliseValues, AnaliseType, TipoAnalise } from '../../../shared/types'

interface AnaliseValuesProps {
  rotina: boolean
  organica: boolean
  micronutrientes: boolean
  enxofre: boolean
  prem: boolean
  nitrogenio: boolean
  granulometria?: boolean
  showTotal?: boolean
  tipoAnalise?: TipoAnalise
}

export function AnaliseValues({ 
  rotina, 
  organica, 
  micronutrientes, 
  enxofre, 
  prem, 
  nitrogenio,
  granulometria = false,
  showTotal = false,
  tipoAnalise = 'solo'
}: AnaliseValuesProps) {
  // Obter valores corretos baseados no tipo de análise
  const analiseValues = getAnaliseValues(tipoAnalise)
  
  const analyses = [
    { type: 'rotina' as AnaliseType, enabled: rotina, label: 'Rotina' },
    { type: 'organica' as AnaliseType, enabled: organica, label: 'Matéria Orgânica' },
    { type: 'micronutrientes' as AnaliseType, enabled: micronutrientes, label: 'Micronutrientes' },
    { type: 'enxofre' as AnaliseType, enabled: enxofre, label: 'Enxofre' },
    { type: 'prem' as AnaliseType, enabled: prem, label: 'PREM' },
    { type: 'nitrogenio' as AnaliseType, enabled: nitrogenio, label: 'Nitrogênio' },
    { type: 'granulometria' as AnaliseType, enabled: granulometria, label: 'Granulométrica' },
  ]

  const enabledAnalyses = analyses.filter(analysis => analysis.enabled)
  const total = enabledAnalyses.reduce((sum, analysis) => sum + analiseValues[analysis.type], 0)

  return (
    <div className="space-y-2">
      {enabledAnalyses.map((analysis) => (
        <div key={analysis.type} className="flex justify-between items-center text-sm">
          <span className="text-gray-600">{analysis.label}</span>
          <span className="font-medium text-gray-900">
            R$ {analiseValues[analysis.type].toFixed(2)}
          </span>
        </div>
      ))}
      
      {showTotal && enabledAnalyses.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between items-center font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="text-green-600">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      )}
      
      {enabledAnalyses.length === 0 && (
        <p className="text-gray-500 text-sm">Nenhuma análise selecionada</p>
      )}
    </div>
  )
}

// Função utilitária para calcular o total de um lote
export function calculateLoteTotal(lote: {
  rotina: boolean
  organica: boolean
  micronutrientes: boolean
  enxofre: boolean
  prem: boolean
  nitrogenio: boolean
}, tipoAnalise: TipoAnalise = 'solo'): number {
  let total = 0
  const analiseValues = getAnaliseValues(tipoAnalise)
  
  if (lote.rotina) total += analiseValues.rotina
  if (lote.organica) total += analiseValues.organica
  if (lote.micronutrientes) total += analiseValues.micronutrientes
  if (lote.enxofre) total += analiseValues.enxofre
  if (lote.prem) total += analiseValues.prem
  if (lote.nitrogenio) total += analiseValues.nitrogenio
  
  return total
}

// Função utilitária para calcular o total de uma amostra
export function calculateAmostraTotal(amostra: {
  rotina: boolean
  organica: boolean
  micronutrientes: boolean
  enxofre: boolean
  prem: boolean
  nitrogenio: boolean
}, tipoAnalise: TipoAnalise = 'solo'): number {
  let total = 0
  const analiseValues = getAnaliseValues(tipoAnalise)
  
  if (amostra.rotina) total += analiseValues.rotina
  if (amostra.organica) total += analiseValues.organica
  if (amostra.micronutrientes) total += analiseValues.micronutrientes
  if (amostra.enxofre) total += analiseValues.enxofre
  if (amostra.prem) total += analiseValues.prem
  if (amostra.nitrogenio) total += analiseValues.nitrogenio
  
  return total
}

import { Resultado } from '../../../shared/types'

interface ResultadosCalculadosProps {
  resultado: Resultado
}

export function ResultadosCalculados({ resultado }: ResultadosCalculadosProps) {
  // Função para verificar se há resultados calculados
  const hasCalculatedResults = () => {
    return resultado.caCalculado || 
           resultado.mgCalculado || 
           resultado.kCalculado || 
           resultado.pCalculado || 
           resultado.alCalculado || 
           resultado.hCalculado ||
           resultado.znCalculado ||
           resultado.mnCalculado ||
           resultado.feCalculado ||
           resultado.cuCalculado ||
           resultado.bCalculado
  }

  // Se não há resultados calculados, não renderizar nada
  if (!hasCalculatedResults()) {
    return null
  }

  const resultadosCalculados = [
    { label: 'Cálcio (Ca)', valor: resultado.caCalculado, unidade: 'cmolc/dm³' },
    { label: 'Magnésio (Mg)', valor: resultado.mgCalculado, unidade: 'cmolc/dm³' },
    { label: 'Potássio (K)', valor: resultado.kCalculado, unidade: 'cmolc/dm³' },
    { label: 'Fósforo (P)', valor: resultado.pCalculado, unidade: 'mg/dm³' },
    { label: 'Alumínio (Al)', valor: resultado.alCalculado, unidade: 'cmolc/dm³' },
    { label: 'H+Al', valor: resultado.hCalculado, unidade: 'cmolc/dm³' },
    { label: 'Zinco (Zn)', valor: resultado.znCalculado, unidade: 'mg/dm³' },
    { label: 'Manganês (Mn)', valor: resultado.mnCalculado, unidade: 'mg/dm³' },
    { label: 'Ferro (Fe)', valor: resultado.feCalculado, unidade: 'mg/dm³' },
    { label: 'Cobre (Cu)', valor: resultado.cuCalculado, unidade: 'mg/dm³' },
    { label: 'Boro (B)', valor: resultado.bCalculado, unidade: 'mg/dm³' },
  ].filter(item => item.valor !== null && item.valor !== undefined)

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-primary-900 mb-4">
        Resultados Calculados
      </h4>
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resultadosCalculados.map((item, index) => (
            <div key={index} className="bg-white rounded-md p-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-primary-700">
                  {item.valor?.toFixed(2)} {item.unidade}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


import { useParams } from 'react-router-dom'
import { useResultado } from '../hooks/useResultados'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ResultadosCalculados } from '../components/ResultadosCalculados'

export function ResultadoDetails() {
  const { id } = useParams<{ id: string }>()
  const { data: resultado, isLoading } = useResultado(id!)


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="card">
            <div className="card-content">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!resultado) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Resultado não encontrado</h2>
        <Link to="/resultados" className="btn btn-primary">
          Voltar para Resultados
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/resultados" className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultado - {resultado.amostra?.codigo}</h1>
          <p className="text-gray-600">{resultado.amostra?.lote?.cliente?.nome}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Análise Química Básica</h3>
          </div>
          <div className="card-content space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">pH</label>
                <p className="text-gray-900">{resultado.ph || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">P (Abs)</label>
                <p className="text-gray-900">{resultado.pAbs || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">K (mg/L)</label>
                <p className="text-gray-900">{resultado.kMgL || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Al (cmol)</label>
                <p className="text-gray-900">{resultado.alCmol || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">H+Al</label>
                <p className="text-gray-900">{resultado.h_al || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Branco H+Al</label>
                <p className="text-gray-900">{resultado.branco || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">S</label>
                <p className="text-gray-900">{resultado.s || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Micronutrientes</h3>
          </div>
          <div className="card-content space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Zn</label>
                <p className="text-gray-900">{resultado.zn || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mn</label>
                <p className="text-gray-900">{resultado.mn || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fe</label>
                <p className="text-gray-900">{resultado.fe || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Cu</label>
                <p className="text-gray-900">{resultado.cu || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">B</label>
                <p className="text-gray-900">{resultado.b || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">M.O.</label>
                <p className="text-gray-900">{resultado.mo || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Resultados Calculados */}
      <ResultadosCalculados resultado={resultado} />

      {resultado.observacoes && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Observações</h3>
          </div>
          <div className="card-content">
            <p className="text-gray-900">{resultado.observacoes}</p>
          </div>
        </div>
      )}
    </div>
  )
}



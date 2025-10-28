import { useState } from 'react'
import { useLotes } from '../hooks/useLotes'
import { useModule } from '../contexts/ModuleContext'
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface GerarLaudosLoteProps {
  onClose: () => void
}

export function GerarLaudosLote({ onClose }: GerarLaudosLoteProps) {
  const { modulo } = useModule()
  const [loteInicio, setLoteInicio] = useState('')
  const [loteFim, setLoteFim] = useState('')
  const [tipoAnalise, setTipoAnalise] = useState('geral')
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultados, setResultados] = useState<any[]>([])

  const { data: lotesData } = useLotes({ page: 1, limit: 1000 })

  const handleGerarLaudos = async () => {
    if (!loteInicio || !loteFim) {
      toast.error('Selecione o intervalo de lotes')
      return
    }

    // Extrair prefixo e número dos códigos
    const extrairNumero = (codigo: string) => {
      // Remove o prefixo (ex: "F" de "F1", "F2")
      const match = codigo.match(/(\d+)/)
      return match ? parseInt(match[1]) : 0
    }
    
    const inicio = extrairNumero(loteInicio)
    const fim = extrairNumero(loteFim)

    if (inicio > fim) {
      toast.error('Lote inicial deve ser menor ou igual ao final')
      return
    }

    // Filtrar lotes no intervalo
    const lotesSelecionados = (lotesData?.lotes || []).filter((lote: any) => {
      const numeroLote = extrairNumero(lote.codigo)
      // Verificar se está no intervalo e se o módulo está correto
      return numeroLote >= inicio && numeroLote <= fim && lote.modulo === modulo
    })

    if (lotesSelecionados.length === 0) {
      toast.error('Nenhum lote encontrado no intervalo especificado')
      return
    }

    setIsGenerating(true)
    setResultados([])

    try {
      const response = await fetch('/api/laudos/gerar-lote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loteIds: lotesSelecionados.map((l: any) => l.id),
          tipoAnalise
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResultados(data.resultados)
        toast.success(`${data.sucessos} laudos gerados com sucesso!`)
        
        // Download automático dos laudos gerados com sucesso
        data.resultados.forEach((resultado: any, index: number) => {
          if (resultado.success && resultado.arquivo) {
            setTimeout(() => {
              const link = document.createElement('a')
              link.href = `/api/laudos/download/${resultado.arquivo}`
              link.download = resultado.arquivo
              link.target = '_blank'
              
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }, index * 500) // Delay entre downloads para evitar bloqueio
          }
        })
        
        if (data.falhas > 0) {
          toast.error(`${data.falhas} laudos falharam`)
        }
      } else {
        toast.error('Erro ao gerar laudos')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao gerar laudos')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (arquivo: string) => {
    window.open(`/api/laudos/download/${arquivo}`, '_blank')
  }

  const downloadAll = () => {
    resultados.forEach(resultado => {
      if (resultado.success) {
        setTimeout(() => {
          window.open(`/api/laudos/download/${resultado.arquivo}`, '_blank')
        }, 100)
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Gerar Laudos {modulo === 'foliar' ? 'Foliar' : 'de Solo'} em Lote</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Seleção de Intervalo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lote Inicial
              </label>
              <input
                type="text"
                value={loteInicio}
                onChange={(e) => setLoteInicio(e.target.value)}
                className="input w-full"
                placeholder={modulo === 'foliar' ? "Ex: F1 ou 1" : "Ex: 5"}
                pattern={modulo === 'foliar' ? "[Ff]?\\d+" : "\\d+"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lote Final
              </label>
              <input
                type="text"
                value={loteFim}
                onChange={(e) => setLoteFim(e.target.value)}
                className="input w-full"
                placeholder={modulo === 'foliar' ? "Ex: F2 ou 2" : "Ex: 10"}
                pattern={modulo === 'foliar' ? "[Ff]?\\d+" : "\\d+"}
              />
            </div>
          </div>

          {/* Tipo de Análise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Análise
            </label>
            <select
              value={tipoAnalise}
              onChange={(e) => setTipoAnalise(e.target.value)}
              className="input w-full"
            >
              <option value="geral">{modulo === 'foliar' ? 'Laudo Foliar' : 'Laudo de Solo'}</option>
              <option value="rotina">Rotina</option>
              {modulo === 'solo' && <option value="organica">Matéria Orgânica</option>}
              <option value="micronutrientes">Micronutrientes</option>
              <option value="enxofre">Enxofre</option>
              {modulo === 'solo' && <option value="prem">PREM</option>}
              <option value="nitrogenio">Nitrogênio</option>
              {modulo === 'solo' && <option value="granulometrica">Granulométrica</option>}
            </select>
          </div>

          {/* Botão Gerar */}
          <div className="flex justify-center">
            <button
              onClick={handleGerarLaudos}
              disabled={isGenerating}
              className="btn btn-primary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {isGenerating ? 'Gerando...' : 'Gerar Laudos'}
            </button>
          </div>

          {/* Resultados */}
          {resultados.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Resultados</h3>
                <button
                  onClick={downloadAll}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar Todos
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resultados.map((resultado, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {resultado.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {resultado.cliente} - Lote {resultado.codigo}
                        </p>
                        {resultado.success ? (
                          <p className="text-sm text-gray-600">
                            Arquivo: {resultado.arquivo}
                          </p>
                        ) : (
                          <p className="text-sm text-red-600">
                            Erro: {resultado.error}
                          </p>
                        )}
                      </div>
                    </div>
                    {resultado.success && (
                      <button
                        onClick={() => handleDownload(resultado.arquivo)}
                        className="btn btn-sm btn-secondary flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Baixar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}





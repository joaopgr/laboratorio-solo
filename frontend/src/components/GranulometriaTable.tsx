import { useState } from 'react'
import { Amostra, Resultado } from '../../../shared/types'
import { calcularResultadosGranulometricos, formatarValorGranulometrico, DadosGranulometricos } from '../utils/calculosGranulometria'

interface GranulometriaTableProps {
  amostras: Amostra[]
  resultados: Resultado[]
  tipo?: 'brutos' | 'calculados' // Novo prop para diferenciar o tipo
  subTipo?: 'classificacao' | 'qd_massa' | 'qd_fator' | 'qd_proporcoes' | 'qd_decisao' // Sub-tipos para granulométrica calculada
}

export function GranulometriaTable({ amostras, resultados, tipo = 'brutos', subTipo = 'classificacao' }: GranulometriaTableProps) {
  const [selectedAmostra, setSelectedAmostra] = useState<string | null>(null)

  // Função para obter resultado granulométrico de uma amostra (dados brutos)
  const getResultadoGranulometrico = (amostraId: string) => {
    const dados = converterParaDadosGranulometricos(amostraId)
    return dados
  }

  // Função para obter todos os resultados granulométricos de uma amostra
  const getTodosResultadosGranulometricos = (amostraId: string) => {
    return resultados.filter(r => r.amostraId === amostraId && (
      r.tipo === 'GRAN_MASSA_RECIPIENTES' ||
      r.tipo === 'GRAN_MASSA_RECIPIENTES_PARTICULAS' ||
      r.tipo === 'GRAN_MASSA_FATOR_F'
    ))
  }

  // Função para converter resultados brutos em dados granulométricos
  const converterParaDadosGranulometricos = (amostraId: string): DadosGranulometricos => {
    const todosResultados = getTodosResultadosGranulometricos(amostraId)
    const dados: DadosGranulometricos = {}

    todosResultados.forEach(resultado => {
      switch (resultado.tipo) {
        case 'GRAN_MASSA_RECIPIENTES':
          // Atribuir apenas se o valor não for null/undefined
          if (resultado.massaRecipienteAreiaGrossa !== null && resultado.massaRecipienteAreiaGrossa !== undefined) {
            dados.massaRecipienteAreiaGrossa = resultado.massaRecipienteAreiaGrossa
          }
          if (resultado.massaRecipienteAreiaFina !== null && resultado.massaRecipienteAreiaFina !== undefined) {
            dados.massaRecipienteAreiaFina = resultado.massaRecipienteAreiaFina
          }
          if (resultado.massaRecipienteSilteArgila !== null && resultado.massaRecipienteSilteArgila !== undefined) {
            dados.massaRecipienteSilteArgila = resultado.massaRecipienteSilteArgila
          }
          if (resultado.massaRecipienteArgila !== null && resultado.massaRecipienteArgila !== undefined) {
            dados.massaRecipienteArgila = resultado.massaRecipienteArgila
          }
          break
        case 'GRAN_MASSA_RECIPIENTES_PARTICULAS':
          // Atribuir apenas se o valor não for null/undefined
          if (resultado.massaRecipientePartAreiaGrossa !== null && resultado.massaRecipientePartAreiaGrossa !== undefined) {
            dados.massaRecipientePartAreiaGrossa = resultado.massaRecipientePartAreiaGrossa
          }
          if (resultado.massaRecipientePartAreiaFina !== null && resultado.massaRecipientePartAreiaFina !== undefined) {
            dados.massaRecipientePartAreiaFina = resultado.massaRecipientePartAreiaFina
          }
          if (resultado.massaRecipientePartSilteArgila !== null && resultado.massaRecipientePartSilteArgila !== undefined) {
            dados.massaRecipientePartSilteArgila = resultado.massaRecipientePartSilteArgila
          }
          if (resultado.massaRecipientePartArgila !== null && resultado.massaRecipientePartArgila !== undefined) {
            dados.massaRecipientePartArgila = resultado.massaRecipientePartArgila
          }
          if (resultado.tfsa !== null && resultado.tfsa !== undefined) {
            dados.tfsa = resultado.tfsa
          }
          break
        case 'GRAN_MASSA_FATOR_F':
          // Atribuir apenas se o valor não for null/undefined
          if (resultado.massaLata !== null && resultado.massaLata !== undefined && String(resultado.massaLata).trim() !== '') {
            dados.massaLata = resultado.massaLata
          }
          if (resultado.massaLataSu !== null && resultado.massaLataSu !== undefined && String(resultado.massaLataSu).trim() !== '') {
            dados.massaLataSu = resultado.massaLataSu
          }
          if (resultado.massaLataSs !== null && resultado.massaLataSs !== undefined && String(resultado.massaLataSs).trim() !== '') {
            dados.massaLataSs = resultado.massaLataSs
          }
          break
      }
    })

    return dados
  }

  // Função para formatar valor
  const formatarValor = (valor: any, casasDecimais: number = 2) => {
    if (valor === null || valor === undefined || valor === '') return '-'
    const num = parseFloat(valor)
    if (isNaN(num)) return '-'
    return num.toFixed(casasDecimais)
  }

  // Renderizar tabela baseada no tipo
  const renderTabelaBrutos = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Análise Granulométrica - Dados Brutos</h3>
      </div>
      <div className="card-content p-0">
        <div className="overflow-x-auto">
          <table className="table table-sm" style={{ fontSize: '0.8rem' }}>
            <thead>
              {/* Primeira linha - Cabeçalhos principais */}
              <tr>
                <th rowSpan={2} className="text-center align-middle w-20">Amostra</th>
                <th rowSpan={2} className="text-center align-middle w-40">Cliente</th>
                <th colSpan={4} className="text-center bg-blue-50">Massa dos Recipientes (g)</th>
                <th colSpan={4} className="text-center bg-green-50">Massa Recipiente + Partículas (g)</th>
                <th colSpan={1} className="text-center bg-yellow-50">TFSA (g)</th>
                <th colSpan={3} className="text-center bg-purple-50">Massas para Fator F</th>
              </tr>
              {/* Segunda linha - Subcabeçalhos */}
              <tr>
                <th className="text-center text-xs px-2 py-2 w-24">A. Grossa</th>
                <th className="text-center text-xs px-2 py-2 w-24">A. Fina</th>
                <th className="text-center text-xs px-2 py-2 w-24">Silte+Argila</th>
                <th className="text-center text-xs px-2 py-2 w-24">Argila</th>
                <th className="text-center text-xs px-2 py-2 w-24">A. Grossa</th>
                <th className="text-center text-xs px-2 py-2 w-24">A. Fina</th>
                <th className="text-center text-xs px-2 py-2 w-24">Silte+Argila</th>
                <th className="text-center text-xs px-2 py-2 w-24">Argila</th>
                <th className="text-center text-xs px-2 py-2 w-24">TFSA</th>
                <th className="text-center text-xs px-2 py-2 w-24">M. Lata</th>
                <th className="text-center text-xs px-2 py-2 w-24">M. Lata + Su</th>
                <th className="text-center text-xs px-2 py-2 w-24">M. Lata + Ss</th>
              </tr>
            </thead>
            <tbody>
              {amostras.map((amostra) => {
                const resultado = getResultadoGranulometrico(amostra.id)
                return (
                  <tr key={amostra.id} className="hover:bg-gray-50">
                    <td className="text-center font-medium px-2 py-2">{amostra.codigo}</td>
                    <td className="text-center px-2 py-2">{(amostra as any).cliente?.nome || '-'}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaRecipienteAreiaGrossa, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaRecipienteAreiaFina, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaRecipienteSilteArgila, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaRecipienteArgila, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaRecipientePartAreiaGrossa, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaRecipientePartAreiaFina, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaRecipientePartSilteArgila, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaRecipientePartArgila, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.tfsa, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaLata, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaLataSu, 4)}</td>
                    <td className="text-center px-2 py-2">{formatarValor(resultado?.massaLataSs, 4)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderTabelaCalculados = () => {
    switch (subTipo) {
      case 'classificacao':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">CLASSIFICAÇÃO TEXTURAL</h3>
            </div>
            <div className="card-content p-0">
              <div className="overflow-x-auto">
                <table className="table table-sm" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th className="text-center bg-gray-100 px-3 py-2">AMOSTRA</th>
                      <th colSpan={5} className="text-center bg-blue-50 px-3 py-2">Proporções corrigidas (%)</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Classificação</th>
                    </tr>
                    <tr>
                      <th className="text-center bg-gray-100 px-3 py-2">AMOSTRA</th>
                      <th className="text-center bg-gray-100 px-3 py-2">A. Grossa</th>
                      <th className="text-center bg-gray-100 px-3 py-2">A. Fina</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Silte</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Argila</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Total</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Classificação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amostras.map((amostra) => {
                      const dadosBrutos = converterParaDadosGranulometricos(amostra.id)
                      const resultadosCalculados = calcularResultadosGranulometricos(dadosBrutos)
                      return (
                        <tr key={amostra.id} className="hover:bg-gray-50">
                          <td className="text-center font-medium px-3 py-2">{amostra.codigo}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.classificacaoTexturalAreiaGrossa, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.classificacaoTexturalAreiaFina, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.classificacaoTexturalSilte, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.classificacaoTexturalArgila, 4)}</td>
                          <td className="text-center px-3 py-2 font-medium">{formatarValorGranulometrico(resultadosCalculados.classificacaoTexturalTotal, 4)}</td>
                          <td className="text-center px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              resultadosCalculados.classificacaoTextural && resultadosCalculados.classificacaoTextural !== '-' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {resultadosCalculados.classificacaoTextural || '-'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'qd_massa':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Massa das partículas (g)</h3>
            </div>
            <div className="card-content p-0">
              <div className="overflow-x-auto">
                <table className="table table-sm" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th className="text-center bg-gray-100 px-3 py-2">AMOSTRA</th>
                      <th colSpan={4} className="text-center bg-blue-50 px-3 py-2">Massa das partículas (g)</th>
                      <th colSpan={2} className="text-center bg-green-50 px-3 py-2">Correções (diluição)</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Total recuperado (g)</th>
                    </tr>
                    <tr>
                      <th className="text-center bg-gray-100 px-3 py-2">AMOSTRA</th>
                      <th className="text-center bg-gray-100 px-3 py-2">A. Grossa</th>
                      <th className="text-center bg-gray-100 px-3 py-2">A. Fina</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Silte</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Argila</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Silte</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Argila</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Total recuperado (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amostras.map((amostra) => {
                      const dadosBrutos = converterParaDadosGranulometricos(amostra.id)
                      const resultadosCalculados = calcularResultadosGranulometricos(dadosBrutos)
                      return (
                        <tr key={amostra.id} className="hover:bg-gray-50">
                          <td className="text-center font-medium px-3 py-2">{amostra.codigo}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.massaAreiaGrossa, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.massaAreiaFina, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.massaSilte, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.massaArgila, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.correcaoSilte, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.correcaoArgila, 4)}</td>
                          <td className="text-center px-3 py-2 font-medium">{formatarValorGranulometrico(resultadosCalculados.totalRecuperado, 4)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'qd_fator':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Fator f</h3>
            </div>
            <div className="card-content p-0">
              <div className="overflow-x-auto">
                <table className="table table-sm" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th className="text-center bg-gray-100 px-3 py-2">AMOSTRA</th>
                      <th className="text-center bg-gray-100 px-3 py-2">TFSA</th>
                      <th className="text-center bg-gray-100 px-3 py-2">TFSE</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Umidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amostras.map((amostra) => {
                      const dadosBrutos = converterParaDadosGranulometricos(amostra.id)
                      const resultadosCalculados = calcularResultadosGranulometricos(dadosBrutos)
                      
                      return (
                        <tr key={amostra.id} className="hover:bg-gray-50">
                          <td className="text-center font-medium px-3 py-2">{amostra.codigo}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.tfsa, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.tfse, 4)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.umidade, 4)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'qd_proporcoes':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Proporções das partículas (g/kg)</h3>
            </div>
            <div className="card-content p-0">
              <div className="overflow-x-auto">
                <table className="table table-sm" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th className="text-center bg-gray-100 px-3 py-2">AMOSTRA</th>
                      <th className="text-center bg-gray-100 px-3 py-2">A. Grossa</th>
                      <th className="text-center bg-gray-100 px-3 py-2">A. Fina</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Silte</th>
                      <th className="text-center bg-gray-100 px-3 py-2">Argila</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amostras.map((amostra) => {
                      const dadosBrutos = converterParaDadosGranulometricos(amostra.id)
                      const resultadosCalculados = calcularResultadosGranulometricos(dadosBrutos)
                      
                      return (
                        <tr key={amostra.id} className="hover:bg-gray-50">
                          <td className="text-center font-medium px-3 py-2">{amostra.codigo}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.proporcaoAreiaGrossa, 3)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.proporcaoAreiaFina, 3)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.proporcaoSilte, 3)}</td>
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.proporcaoArgila, 3)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'qd_decisao':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Tomada de Decisão</h3>
            </div>
            <div className="card-content p-0">
              <div className="overflow-x-auto">
                <table className="table table-sm" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th className="text-center bg-blue-50 px-3 py-2">Precisão (%)</th>
                      <th className="text-center bg-blue-50 px-3 py-2">Classificação</th>
                      <th className="text-center bg-blue-50 px-3 py-2">Dados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amostras.map((amostra) => {
                      const dadosBrutos = converterParaDadosGranulometricos(amostra.id)
                      const resultadosCalculados = calcularResultadosGranulometricos(dadosBrutos)
                      
                      return (
                        <tr key={amostra.id} className="hover:bg-gray-50">
                          <td className="text-center px-3 py-2">{formatarValorGranulometrico(resultadosCalculados.precisao, 2)}</td>
                          <td className="text-center px-3 py-2">{resultadosCalculados.classificacao || '-'}</td>
                          <td className="text-center px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              resultadosCalculados.dados === 'PROSSEGUIR' ? 'bg-green-100 text-green-800' : 
                              resultadosCalculados.dados === 'VERIFICAR' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {resultadosCalculados.dados || '-'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabela Principal */}
      {tipo === 'brutos' ? renderTabelaBrutos() : renderTabelaCalculados()}

      {/* Tabela de Detalhes (quando amostra selecionada) */}
      {selectedAmostra && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Detalhes da Análise - Amostra {selectedAmostra}</h3>
            <button 
              onClick={() => setSelectedAmostra(null)}
              className="btn btn-sm btn-outline"
            >
              Fechar Detalhes
            </button>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entrada de Dados */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Entrada de Dados</h4>
                <div className="space-y-4">
                  {/* Massa dos Recipientes */}
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-2">Massa dos Recipientes (g)</h5>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">A. Grossa</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaRecipienteAreiaGrossa, 4)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">A. Fina</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaRecipienteAreiaFina, 4)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Silte + Argila</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaRecipienteSilteArgila, 4)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Argila</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaRecipienteArgila, 4)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Massa dos Recipientes + Partículas */}
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-2">Massa dos Recipientes + Partículas (g)</h5>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">A. Grossa</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaRecipientePartAreiaGrossa, 4)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">A. Fina</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaRecipientePartAreiaFina, 4)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Silte + Argila</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaRecipientePartSilteArgila, 4)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Argila</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaRecipientePartArgila, 4)}</div>
                      </div>
                    </div>
                  </div>

                  {/* TFSA */}
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-2">TFSA (g)</h5>
                    <div className="grid grid-cols-1 gap-3 max-w-xs">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TFSA</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.tfsa, 4)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Massas para o Fator F */}
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-2">Massas para o Fator F</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">M. Lata</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaLata, 4)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">M. Lata + Su</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaLataSu, 4)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">M. Lata + Ss</label>
                        <div className="input bg-gray-50">{formatarValor(getResultadoGranulometrico(selectedAmostra)?.massaLataSs, 4)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

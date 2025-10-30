import { useState, useMemo, useEffect } from 'react'
import { useResultados } from '../hooks/useResultados'
import { useModule } from '../contexts/ModuleContext'
import { Search, Download, ArrowUpDown } from 'lucide-react'
import { exportResultadosCompletos } from '../utils/excelExport'
import { GranulometriaTable } from '../components/GranulometriaTable'
import toast from 'react-hot-toast'

export function Resultados() {
  const { modulo } = useModule()
  
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 1000,
    search: '',
    codigoInicio: '',
    codigoFim: '',
    tiposAnalise: {
      rotina: true,
      organica: false,
      micronutrientes: false,
      enxofre: false,
      prem: false,
      nitrogenio: false,
      granulometria: false
    }
  })

  const [displayedResults, setDisplayedResults] = useState(10)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc') // 'desc' = mais recente primeiro (padrão)

  const { data, isLoading } = useResultados(filters)

  // Determinar filtros ativos
  const filtrosAtivos = useMemo(() => {
    const ativos = []
    if (filters.tiposAnalise.rotina) ativos.push('Rotina')
    if (filters.tiposAnalise.organica) ativos.push('Orgânica')
    if (filters.tiposAnalise.micronutrientes) ativos.push('Micronutrientes')
    if (filters.tiposAnalise.enxofre) ativos.push('Enxofre')
    if (filters.tiposAnalise.prem) ativos.push('PREM')
    if (filters.tiposAnalise.nitrogenio) ativos.push('Nitrogênio')
    if (filters.tiposAnalise.granulometria) ativos.push('Granulometria')
    return ativos
  }, [filters.tiposAnalise])

  // Reset filters when modulo changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      tiposAnalise: {
        rotina: true,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false
      }
    }))
    resetDisplayedResults()
  }, [modulo])

  // Função para mostrar mais resultados
  const mostrarMaisResultados = () => {
    setDisplayedResults(prev => prev + 10)
  }

  // Função para resetar resultados exibidos
  const resetDisplayedResults = () => {
    setDisplayedResults(10)
  }

  // Função para alternar ordem de classificação
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
    resetDisplayedResults()
  }

  // Agrupar resultados por amostra
  const resultadosPorAmostra = useMemo(() => {
    if (!data?.resultados) return []
    
    const agrupados = new Map()
    
    data.resultados.forEach((resultado: any) => {
      const amostraId = resultado.amostraId
      if (!agrupados.has(amostraId)) {
        agrupados.set(amostraId, {
          amostra: {
            id: amostraId,
            codigo: resultado.amostra_codigo,
            identificacao: resultado.amostra_identificacao,
            cultura: resultado.amostra_cultura,
            cliente: {
              nome: resultado.cliente_nome || '-',
              cpf: resultado.cliente_cpf || '-'
            }
          },
          resultados: []
        })
      }
      agrupados.get(amostraId).resultados.push(resultado)
    })
    
    // Filtrar resultados para não mostrar Al separado quando já existe H+Al
    agrupados.forEach((item) => {
      const temHAl = item.resultados.some((r: any) => r.tipo === 'H+Al')
      if (temHAl) {
        item.resultados = item.resultados.filter((r: any) => r.tipo !== 'Al')
      }
    })
    
    // Ordenar por número da amostra baseado no sortOrder
    return Array.from(agrupados.values()).sort((a, b) => {
      const codigoA = a.amostra?.codigo || '0'
      const codigoB = b.amostra?.codigo || '0'
      
      // Para códigos com F (foliar), extrair números e ordenar
      if (/^F\d+$/.test(codigoA) && /^F\d+$/.test(codigoB)) {
        const numA = parseInt(codigoA.replace('F', ''))
        const numB = parseInt(codigoB.replace('F', ''))
        return sortOrder === 'desc' ? numB - numA : numA - numB
      }
      
      // Para códigos numéricos (solo)
      if (/^\d+$/.test(codigoA) && /^\d+$/.test(codigoB)) {
        const numA = parseInt(codigoA)
        const numB = parseInt(codigoB)
        return sortOrder === 'desc' ? numB - numA : numA - numB
      }
      
      // Para outros códigos, usar comparação de strings
      return sortOrder === 'desc' ? codigoB.localeCompare(codigoA) : codigoA.localeCompare(codigoB)
    })
  }, [data?.resultados, sortOrder])

  // Função para atualizar filtros de tipos de análise
  const updateTipoAnalise = (tipo: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      tiposAnalise: {
        ...prev.tiposAnalise,
        [tipo]: checked
      }
    }))
    resetDisplayedResults()
  }

  // Função para marcar todos os tipos de análise
  const marcarTodos = () => {
    setFilters(prev => ({
      ...prev,
      tiposAnalise: {
        rotina: true,
        organica: true,
        micronutrientes: true,
        enxofre: true,
        prem: true,
        nitrogenio: true,
        granulometria: true
      }
    }))
    resetDisplayedResults()
  }

  // Função para desmarcar todos os tipos de análise
  const desmarcarTodos = () => {
    setFilters(prev => ({
      ...prev,
      tiposAnalise: {
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false
      }
    }))
    resetDisplayedResults()
  }

  // Função para determinar se uma coluna deve ser exibida
  const shouldShowColumn = (columnType: string) => {
    // No módulo foliar, não mostrar colunas que não existem
    if (modulo === 'foliar') {
      switch (columnType) {
        case 'pH':
        case 'Na':
        case 'Al':
        case 'H_Al':
          return false // Essas colunas não existem no módulo foliar
        case 'P':
        case 'K':
        case 'Ca':
        case 'Mg':
          return filters.tiposAnalise.rotina
        case 'Fe':
        case 'Zn':
        case 'Cu':
        case 'Mn':
        case 'B':
          return filters.tiposAnalise.micronutrientes
        case 'S':
          return filters.tiposAnalise.enxofre
        case 'N':
          return filters.tiposAnalise.nitrogenio
        case 'MO':
        case 'PREM':
          return false // Essas colunas não existem no módulo foliar
        default:
          return false
      }
    }
    
    // Módulo solo - lógica original
    switch (columnType) {
      case 'pH':
      case 'P':
      case 'Na':
      case 'K':
      case 'Ca':
      case 'Mg':
      case 'Al':
      case 'H_Al':
        return filters.tiposAnalise.rotina
      case 'MO':
        return filters.tiposAnalise.organica
      case 'Fe':
      case 'Zn':
      case 'Cu':
      case 'Mn':
      case 'B':
        return filters.tiposAnalise.micronutrientes
      case 'S':
        return filters.tiposAnalise.enxofre
      case 'PREM':
        return filters.tiposAnalise.prem
      case 'N':
        return filters.tiposAnalise.nitrogenio
      default:
        return false // Retorna false quando nenhum filtro está ativo
    }
  }

  // Função para obter o valor bruto de um tipo específico de análise
  const getValorBruto = (resultados: any[], tipo: string) => {
    // Caso especial para Al - buscar dentro do resultado H+Al
    if (tipo === 'Al') {
      const resultadoHAl = resultados.find(r => r.tipo === 'H+Al')
      if (resultadoHAl && resultadoHAl.al) {
        const valor = parseFloat(resultadoHAl.al)
        if (!isNaN(valor)) {
          return valor.toFixed(2)
        }
      }
      return '-'
    }
    
    // Caso especial para H+Al - buscar o campo h_al dentro do resultado H+Al
    if (tipo === 'H_Al') {
      const resultadoHAl = resultados.find(r => r.tipo === 'H+Al')
      if (resultadoHAl && resultadoHAl.h_al) {
        const valor = parseFloat(resultadoHAl.h_al)
        if (!isNaN(valor)) {
          return valor.toFixed(2)
        }
      }
      return '-'
    }
    
    // Para outros tipos, buscar primeiro no campo flexível, depois no específico
    const resultado = resultados.find(r => r.tipo === tipo)
    if (resultado) {
      // Para pH, buscar no campo específico ph
      if (tipo === 'pH' && resultado.ph !== null && resultado.ph !== undefined) {
        return resultado.ph.toString()
      }
      
      // Para P, buscar no campo específico pAbs
      if (tipo === 'P' && resultado.pAbs !== null && resultado.pAbs !== undefined) {
        return resultado.pAbs.toString()
      }
      
      // Para outros tipos, usar o campo flexível valor
      if (resultado.valor) {
        const valor = parseFloat(resultado.valor)
        if (!isNaN(valor)) {
          return resultado.valor
        }
      }
    }
    
    
    return '-'
  }

  // Função para obter a diluição de um tipo específico de análise
  const getDiluicao = (resultados: any[], tipo: string) => {
    const resultado = resultados.find(r => r.tipo === tipo)
    if (resultado) {
      // Para P, buscar no campo específico diluicaoP
      if (tipo === 'P' && resultado.diluicaoP !== null && resultado.diluicaoP !== undefined) {
        return resultado.diluicaoP.toString()
      }
      
      // Para Boro, aceitar tanto dilB (coluna do banco) quanto diluicaoBFoliar (compatibilidade)
      if (tipo === 'B') {
        const hasDilB = resultado.dilB !== null && resultado.dilB !== undefined && resultado.dilB !== ''
        if (hasDilB) return resultado.dilB.toString()
        const hasDilBFoliar = resultado.diluicaoBFoliar !== null && resultado.diluicaoBFoliar !== undefined && resultado.diluicaoBFoliar !== ''
        if (hasDilBFoliar) return resultado.diluicaoBFoliar.toString()
      }
      
      // Para outros tipos (ou fallback), usar o campo flexível diluicao
      if (resultado.diluicao !== null && resultado.diluicao !== undefined && resultado.diluicao !== '') {
        return resultado.diluicao.toString()
      }
    }
    return '-'
  }


  // Função para obter a massa de um tipo específico de análise
  const getMassa = (resultados: any[], tipo: string) => {
    const resultado = resultados.find(r => r.tipo === tipo)
    
    // Caso especial para Boro - usar massaBFoliar
    if (tipo === 'B' && resultado && resultado.massaBFoliar) {
      return resultado.massaBFoliar
    }
    
    // Caso especial para Nitrogênio - usar massaN
    if (tipo === 'N' && resultado && resultado.massaN) {
      return resultado.massaN
    }
    
    // Para outros tipos, usar o campo massa padrão
    if (resultado && resultado.massa) {
      return resultado.massa
    }
    return '-'
  }

  // Função para obter Volume N
  const getVolumeN = (resultados: any[]) => {
    const resultado = resultados.find(r => r.tipo === 'N')
    if (resultado && resultado.volumeN) {
      return resultado.volumeN
    }
    return '-'
  }

  // Função para obter Fator F
  const getFatorF = (resultados: any[]) => {
    // Primeiro, tentar buscar o valor salvo no resultado N
    const resultadoN = resultados.find(r => r.tipo === 'N')
    if (resultadoN && resultadoN.fatorF) {
      return resultadoN.fatorF
    }
    
    // Se não tiver valor salvo, calcular baseado na Determinação F
    const determinacaoF = resultados.find(r => r.tipo === 'DETERMINACAO_F')
    if (determinacaoF) {
      const { massaTrisR1, massaTrisR2, massaTrisR3, volumeTitR1, volumeTitR2, volumeTitR3 } = determinacaoF;
      
      // Verificar se todos os valores necessários estão presentes
      if (massaTrisR1 && massaTrisR2 && massaTrisR3 && volumeTitR1 && volumeTitR2 && volumeTitR3) {
        try {
          // Cálculo do Fator F conforme especificação:
          // Fator F R1 = (Massa TRIS R1 / 0.12114) * Volume R1 * 0.1
          // Fator F R2 = (Massa TRIS R2 / 0.12114) * Volume R2 * 0.1
          // Fator F R3 = (Massa TRIS R3 / 0.12114) * Volume R3 * 0.1
          // Fator F calculado = média dos fator F R1, R2, R3
          
          const fatorFR1 = (massaTrisR1 / 0.12114) * volumeTitR1 * 0.1;
          const fatorFR2 = (massaTrisR2 / 0.12114) * volumeTitR2 * 0.1;
          const fatorFR3 = (massaTrisR3 / 0.12114) * volumeTitR3 * 0.1;
          
          const fatorFCalculado = (fatorFR1 + fatorFR2 + fatorFR3) / 3;
          
          return fatorFCalculado.toFixed(4);
        } catch (error) {
          console.error('Erro ao calcular Fator F dinamicamente:', error);
        }
      }
    }
    
    return '-'
  }

  // Função para obter Branco N
  const getBrancoN = (resultados: any[]) => {
    const resultado = resultados.find(r => r.tipo === 'N')
    if (resultado && resultado.brancoN) {
      return resultado.brancoN
    }
    return '-'
  }

  // Função para obter Massa Geral
  const getMassaGeral = (resultados: any[]) => {
    // Buscar no resultado do tipo 'MASSA_GERAL' (mesma lógica do backend)
    const resultado = resultados.find(r => r.tipo === 'MASSA_GERAL')
    
    if (resultado && (resultado.massaGeral || resultado.valor)) {
      return resultado.massaGeral || resultado.valor
    }
    
    return '-'
  }


  // Função para obter o branco de um tipo específico de análise
  const getBranco = (resultados: any[], tipo: string) => {
    // Caso especial para H+Al - buscar o campo branco dentro do resultado H+Al
    if (tipo === 'H_Al') {
      const resultadoHAl = resultados.find(r => r.tipo === 'H+Al')
      if (resultadoHAl && resultadoHAl.branco) {
        const valor = parseFloat(resultadoHAl.branco)
        if (!isNaN(valor)) {
          return valor.toFixed(2)
        }
      }
      return '-'
    }
    
    // Caso especial para Boro no módulo foliar - buscar brancoB ou brancoBFoliar
    if (tipo === 'B' && modulo === 'foliar') {
      const resultado = resultados.find(r => r.tipo === tipo)
      if (resultado) {
        // Tentar ambos os nomes de campos (brancoB do banco e brancoBFoliar do schema)
        const brancoBValue = resultado.brancoB || resultado.brancoBFoliar
        if (brancoBValue !== null && brancoBValue !== undefined && brancoBValue !== '') {
          return brancoBValue
        }
      }
      return '-'
    }
    
    // Para outros tipos, buscar o campo branco padrão
    const resultado = resultados.find(r => r.tipo === tipo)
    if (resultado && resultado.branco) {
      return resultado.branco
    }
    return '-'
  }


  // Função para obter o parâmetro A de um tipo específico de análise
  const getParamA = (resultados: any[], tipo: string) => {
    const resultado = resultados.find(r => r.tipo === tipo)
    if (resultado && resultado.param_a && resultado.param_a !== 'null') {
      return resultado.param_a
    }
    return '-'
  }

  // Função para obter o parâmetro B de um tipo específico de análise
  const getParamB = (resultados: any[], tipo: string) => {
    const resultado = resultados.find(r => r.tipo === tipo)
    if (resultado && resultado.param_b && resultado.param_b !== 'null') {
      return resultado.param_b
    }
    return '-'
  }

  // Função para exportar resultados brutos (CSV)
  const exportarResultados = () => {
    const dados = resultadosPorAmostra.map(item => {
      const dadosBrutos: any = {
        'Código Amostra': item.amostra?.codigo || '',
        'Cliente': item.amostra?.lote?.cliente?.nome || '',
        'Cultura': item.amostra?.cultura || '',
        'Data Coleta': item.amostra?.dataColeta ? new Date(item.amostra.dataColeta).toLocaleDateString('pt-BR') : '',
      }

      // Adicionar todos os tipos de análise encontrados
      item.resultados.forEach((resultado: any) => {
        dadosBrutos[resultado.tipo] = resultado.valor || '-'
      })

      return dadosBrutos
    })

    // Converter para CSV
    const headers = Object.keys(dados[0] || {})
    const csvContent = [
      headers.join(','),
      ...dados.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `resultados_brutos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para exportar resultados completos em Excel
  const exportarResultadosCompletosExcel = () => {
    if (!resultadosPorAmostra || resultadosPorAmostra.length === 0) {
      toast.error('Nenhum resultado para exportar')
      return
    }

    try {
      exportResultadosCompletos(resultadosPorAmostra)
      toast.success('Resultados completos exportados com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar resultados:', error)
      toast.error('Erro ao exportar resultados')
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultados</h1>
          <p className="text-gray-600">Valores brutos lançados das análises</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={toggleSortOrder}
            className="btn btn-outline btn-md flex items-center"
            title={`Ordenar ${sortOrder === 'desc' ? 'crescente' : 'decrescente'}`}
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortOrder === 'desc' ? '↓ Mais Recente' : '↑ Mais Antiga'}
          </button>
          <button 
            onClick={exportarResultados}
            className="btn btn-outline btn-md flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
          <button 
            onClick={exportarResultadosCompletosExcel}
            className="btn btn-primary btn-md flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel Completo
        </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            {/* Busca */}
          <div className="space-y-4">
            {/* Busca por texto */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por amostra, cliente ou cultura..."
                    className="input pl-10 w-full"
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({ ...filters, search: e.target.value, page: 1 })
                      resetDisplayedResults()
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Filtro por intervalo de códigos */}
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Código Início
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1 ou F1"
                  className="input w-full"
                  value={filters.codigoInicio}
                  onChange={(e) => {
                    setFilters({ ...filters, codigoInicio: e.target.value, page: 1 })
                    resetDisplayedResults()
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Código Fim
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10 ou F10"
                  className="input w-full"
                  value={filters.codigoFim}
                  onChange={(e) => {
                    setFilters({ ...filters, codigoFim: e.target.value, page: 1 })
                    resetDisplayedResults()
                  }}
                />
              </div>
              {(filters.codigoInicio || filters.codigoFim) && (
                <button
                  onClick={() => {
                    setFilters({ ...filters, codigoInicio: '', codigoFim: '', page: 1 })
                    resetDisplayedResults()
                  }}
                  className="mt-5 px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="Limpar intervalo"
                >
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>
            
            {/* Filtros de Tipos de Análise */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Filtrar por Tipos de Análise:</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={marcarTodos}
                    className="btn btn-sm btn-outline"
                  >
                    Marcar Todos
                  </button>
                  <button
                    onClick={desmarcarTodos}
                    className="btn btn-sm btn-outline"
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tiposAnalise.rotina}
                    onChange={(e) => updateTipoAnalise('rotina', e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm text-gray-700">Rotina</span>
                </label>
                
                {/* Matéria Orgânica - apenas para solo */}
                {modulo === 'solo' && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.tiposAnalise.organica}
                      onChange={(e) => updateTipoAnalise('organica', e.target.checked)}
                      className="checkbox checkbox-sm"
                    />
                    <span className="text-sm text-gray-700">Matéria Orgânica</span>
                  </label>
                )}
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tiposAnalise.micronutrientes}
                    onChange={(e) => updateTipoAnalise('micronutrientes', e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm text-gray-700">Micronutrientes</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tiposAnalise.enxofre}
                    onChange={(e) => updateTipoAnalise('enxofre', e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm text-gray-700">Enxofre</span>
                </label>
                
                {/* PREM - apenas para solo */}
                {modulo === 'solo' && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.tiposAnalise.prem}
                      onChange={(e) => updateTipoAnalise('prem', e.target.checked)}
                      className="checkbox checkbox-sm"
                    />
                    <span className="text-sm text-gray-700">PREM</span>
                  </label>
                )}
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tiposAnalise.nitrogenio}
                    onChange={(e) => updateTipoAnalise('nitrogenio', e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm text-gray-700">Nitrogênio</span>
                </label>
                
                {/* Granulométrica - apenas para solo */}
                {modulo === 'solo' && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.tiposAnalise.granulometria}
                      onChange={(e) => updateTipoAnalise('granulometria', e.target.checked)}
                      className="checkbox checkbox-sm"
                    />
                    <span className="text-sm text-gray-700">Granulométrica</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {filters.tiposAnalise.granulometria && !Object.values(filters.tiposAnalise).some(val => val && val !== filters.tiposAnalise.granulometria) ? (
        // Mostrar tabela granulométrica quando apenas granulométrica estiver selecionada
        <GranulometriaTable 
          amostras={resultadosPorAmostra.map(r => r.amostra)}
          resultados={data?.resultados || []}
          tipo="brutos"
        />
      ) : (
        <>
        <div className="card">
          <div className="card-content p-0">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
            <div className="overflow-hidden">
              <table 
                className="w-full"
                style={{
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem'
                }}
              >
            <thead className="border-b border-gray-200">
              <tr className="border-b border-gray-200">
                <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Amostra</th>
                <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Cliente</th>
                <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Cultura</th>
                
                {/* Colunas de Rotina */}
                {shouldShowColumn('pH') && modulo !== 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">pH</th>}
                {shouldShowColumn('P') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">P</th>}
                {shouldShowColumn('P') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil P</th>}
                {shouldShowColumn('Na') && modulo !== 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Na</th>}
                {shouldShowColumn('Na') && modulo !== 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil Na</th>}
                {shouldShowColumn('K') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">K</th>}
                {shouldShowColumn('K') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil K</th>}
                {shouldShowColumn('Al') && modulo !== 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Al</th>}
                {shouldShowColumn('H_Al') && modulo !== 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">H+Al</th>}
                {shouldShowColumn('H_Al') && modulo !== 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Branco</th>}
                {shouldShowColumn('Ca') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Ca</th>}
                {shouldShowColumn('Ca') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil Ca</th>}
                {shouldShowColumn('Mg') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Mg</th>}
                {shouldShowColumn('Mg') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil Mg</th>}
                
                {/* Colunas de Micronutrientes */}
                {shouldShowColumn('Fe') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Fe</th>}
                {shouldShowColumn('Fe') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil Fe</th>}
                {shouldShowColumn('Zn') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Zn</th>}
                {shouldShowColumn('Zn') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil Zn</th>}
                {shouldShowColumn('Cu') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Cu</th>}
                {shouldShowColumn('Cu') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil Cu</th>}
                {shouldShowColumn('Mn') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Mn</th>}
                {shouldShowColumn('Mn') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil Mn</th>}
                {shouldShowColumn('B') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">B</th>}
                {shouldShowColumn('B') && modulo === 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Massa B</th>}
                {shouldShowColumn('B') && modulo === 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil B</th>}
                {shouldShowColumn('B') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Branco B</th>}
                {shouldShowColumn('B') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">A</th>}
                {shouldShowColumn('B') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">B</th>}
                
                {/* Colunas de Matéria Orgânica */}
                {shouldShowColumn('MO') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">MO</th>}
                {shouldShowColumn('MO') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Massa MO</th>}
                {shouldShowColumn('MO') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Branco MO</th>}
                
                {/* Colunas de Enxofre */}
                {shouldShowColumn('S') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">S</th>}
                {shouldShowColumn('S') && modulo === 'foliar' && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil S</th>}
                {shouldShowColumn('S') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Branco S</th>}
                {shouldShowColumn('S') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Param A</th>}
                {shouldShowColumn('S') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Param B</th>}
                
                {/* Colunas de PREM */}
                {shouldShowColumn('PREM') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">PREM</th>}
                {shouldShowColumn('PREM') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Dil PREM</th>}
                
                {/* Colunas de Nitrogênio */}
                {shouldShowColumn('N') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Massa N</th>}
                {shouldShowColumn('N') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Volume N</th>}
                {shouldShowColumn('N') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Fator F</th>}
                {shouldShowColumn('N') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Branco N</th>}
                
        {/* Coluna de Massa Geral para módulo foliar - apenas no filtro Rotina */}
        {modulo === 'foliar' && filtrosAtivos.includes('Rotina') && <th className="h-12 px-2 text-left align-middle font-medium text-gray-600">Massa Geral</th>}
                  </tr>
                </thead>
                <tbody>
                  {resultadosPorAmostra.slice(0, displayedResults).map((item) => (
                    <tr key={item.amostra?.id} className="border-b border-gray-200">
                      <td className="p-2 align-middle font-medium">{item.amostra?.codigo || '-'}</td>
                      <td className="p-2 align-middle">{item.amostra?.cliente?.nome || '-'}</td>
                      <td className="p-2 align-middle">{item.amostra?.cultura || '-'}</td>
                      
                      {/* Colunas de Rotina */}
                      {shouldShowColumn('pH') && modulo !== 'foliar' && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'pH')}</td>}
                      {shouldShowColumn('P') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'P')}</td>}
                      {shouldShowColumn('P') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'P')}</td>}
                      {shouldShowColumn('Na') && modulo !== 'foliar' && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'Na')}</td>}
                      {shouldShowColumn('Na') && modulo !== 'foliar' && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'Na')}</td>}
                      {shouldShowColumn('K') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'K')}</td>}
                      {shouldShowColumn('K') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'K')}</td>}
                      {shouldShowColumn('Al') && modulo !== 'foliar' && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'Al')}</td>}
                      {shouldShowColumn('H_Al') && modulo !== 'foliar' && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'H_Al')}</td>}
                      {shouldShowColumn('H_Al') && modulo !== 'foliar' && <td className="p-2 align-middle">{getBranco(item.resultados, 'H_Al')}</td>}
                      {shouldShowColumn('Ca') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'Ca')}</td>}
                      {shouldShowColumn('Ca') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'Ca')}</td>}
                      {shouldShowColumn('Mg') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'Mg')}</td>}
                      {shouldShowColumn('Mg') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'Mg')}</td>}
                      
                      {/* Colunas de Micronutrientes */}
                      {shouldShowColumn('Fe') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'Fe')}</td>}
                      {shouldShowColumn('Fe') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'Fe')}</td>}
                      {shouldShowColumn('Zn') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'Zn')}</td>}
                      {shouldShowColumn('Zn') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'Zn')}</td>}
                      {shouldShowColumn('Cu') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'Cu')}</td>}
                      {shouldShowColumn('Cu') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'Cu')}</td>}
                      {shouldShowColumn('Mn') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'Mn')}</td>}
                      {shouldShowColumn('Mn') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'Mn')}</td>}
                      {shouldShowColumn('B') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'B')}</td>}
                      {shouldShowColumn('B') && modulo === 'foliar' && <td className="p-2 align-middle">{getMassa(item.resultados, 'B')}</td>}
                      {shouldShowColumn('B') && modulo === 'foliar' && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'B')}</td>}
                      {shouldShowColumn('B') && <td className="p-2 align-middle">{getBranco(item.resultados, 'B')}</td>}
                      {shouldShowColumn('B') && <td className="p-2 align-middle">{getParamA(item.resultados, 'B')}</td>}
                      {shouldShowColumn('B') && <td className="p-2 align-middle">{getParamB(item.resultados, 'B')}</td>}
                      
                      {/* Colunas de Matéria Orgânica */}
                      {shouldShowColumn('MO') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'MO')}</td>}
                      {shouldShowColumn('MO') && <td className="p-2 align-middle">{getMassa(item.resultados, 'MO')}</td>}
                      {shouldShowColumn('MO') && <td className="p-2 align-middle">{getBranco(item.resultados, 'MO')}</td>}
                      
                      {/* Colunas de Enxofre */}
                      {shouldShowColumn('S') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'S')}</td>}
                      {shouldShowColumn('S') && modulo === 'foliar' && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'S')}</td>}
                      {shouldShowColumn('S') && <td className="p-2 align-middle">{getBranco(item.resultados, 'S')}</td>}
                      {shouldShowColumn('S') && <td className="p-2 align-middle">{getParamA(item.resultados, 'S')}</td>}
                      {shouldShowColumn('S') && <td className="p-2 align-middle">{getParamB(item.resultados, 'S')}</td>}
                      
                      {/* Colunas de PREM */}
                      {shouldShowColumn('PREM') && <td className="p-2 align-middle">{getValorBruto(item.resultados, 'PREM')}</td>}
                      {shouldShowColumn('PREM') && <td className="p-2 align-middle">{getDiluicao(item.resultados, 'PREM')}</td>}
                      
                      {/* Colunas de Nitrogênio */}
                      {shouldShowColumn('N') && <td className="p-2 align-middle">{getMassa(item.resultados, 'N')}</td>}
                      {shouldShowColumn('N') && <td className="p-2 align-middle">{getVolumeN(item.resultados)}</td>}
                      {shouldShowColumn('N') && <td className="p-2 align-middle">{getFatorF(item.resultados)}</td>}
                      {shouldShowColumn('N') && <td className="p-2 align-middle">{getBrancoN(item.resultados)}</td>}
                      
                      {/* Coluna de Massa Geral para módulo foliar - apenas no filtro Rotina */}
                      {modulo === 'foliar' && filtrosAtivos.includes('Rotina') && <td className="p-2 align-middle">{getMassaGeral(item.resultados)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Botão Mostrar Mais */}
      {resultadosPorAmostra.length > displayedResults && (
        <div className="flex justify-center">
          <button
            onClick={mostrarMaisResultados}
            className="btn btn-outline btn-md"
          >
            Mostrar +10 ({resultadosPorAmostra.length - displayedResults} restantes)
          </button>
        </div>
      )}

      {/* Informações sobre os resultados */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-start space-x-3">
            <Search className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Resultados Brutos</h3>
              <p className="text-sm text-gray-600 mt-1">
                Esta aba mostra os valores brutos lançados diretamente das análises, 
                sem aplicação de fórmulas ou cálculos.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Para ver os resultados após aplicação das fórmulas, acesse a aba 
                <strong> "Resultados Calculados"</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}



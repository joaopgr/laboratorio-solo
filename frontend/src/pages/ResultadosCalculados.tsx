import { useState, useMemo, useEffect } from 'react'
import { useResultados } from '../hooks/useResultados'
import { useModule } from '../contexts/ModuleContext'
import { Calculator, Search, Download, ArrowUpDown } from 'lucide-react'
import { exportResultadosCompletos } from '../utils/excelExport'
import { calcularResultados, calcularResultadosFoliar, formatarResultado, DadosBrutos, CalculadosResultados } from '../utils/calculosResultados'
import { GranulometriaTable } from '../components/GranulometriaTable'
import toast from 'react-hot-toast'

export function ResultadosCalculados() {
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

  const [granulometriaSubTipo, setGranulometriaSubTipo] = useState<'classificacao' | 'qd_massa' | 'qd_fator' | 'qd_proporcoes' | 'qd_decisao'>('classificacao')
  const [displayedResults, setDisplayedResults] = useState(10)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc') // 'desc' = mais recente primeiro (padrão)

  const { data, isLoading } = useResultados(filters)

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

  // Reset filters when modulo changes
  useEffect(() => {
    if (modulo === 'foliar') {
      setFilters(prev => ({
        ...prev,
        tiposAnalise: {
          rotina: true,
          organica: false,
          micronutrientes: true,  // Ativar micronutrientes para foliar
          enxofre: true,          // Ativar enxofre para foliar
          prem: false,
          nitrogenio: true,       // Ativar nitrogênio para foliar
          granulometria: false
        }
      }))
    } else {
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
    }
    resetDisplayedResults()
  }, [modulo])

  // Agrupar resultados por amostra
  const resultadosPorAmostra = useMemo(() => {
    if (!data?.data) return []
    
    
    const agrupados = new Map()
    
    data.data.forEach(resultado => {
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
  }, [data?.data, sortOrder])

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
        // ROTINA - Análise de rotina de solo (incluindo cálculos derivados)
        case 'pH':
        case 'P':
        case 'Na':
        case 'K':
        case 'Ca':
        case 'Mg':
        case 'Al':
        case 'H_Al':
        case 'SB':
        case 't':
        case 'CTC':
        case 'V':
        case 'm':
          return filters.tiposAnalise.rotina
        
        // MATÉRIA ORGÂNICA
        case 'MO':
          return filters.tiposAnalise.organica
        
        // MICRONUTRIENTES
        case 'Fe':
        case 'Zn':
        case 'Cu':
        case 'Mn':
        case 'B':
          return filters.tiposAnalise.micronutrientes
        
        // ENXOFRE
        case 'S':
          return filters.tiposAnalise.enxofre
        
        // P REMANESCENTE
        case 'PREM':
          return filters.tiposAnalise.prem
        
        // NITROGÊNIO
        case 'N':
          return filters.tiposAnalise.nitrogenio || false
        
        default:
          return false // Retorna false quando nenhum filtro está ativo
      }
    }


  // Função para calcular resultados finais usando as fórmulas corretas
  const calcularResultadosFinais = (resultados: any[], amostra: any) => {
    // Preparar dados brutos para os cálculos
    const dadosBrutos: DadosBrutos = {}
    
    // Para módulo foliar, buscar o valor real da Massa Geral
    if (modulo === 'foliar') {
      
      // Buscar no resultado do tipo 'MASSA_GERAL' (mesma lógica do backend)
      const resultadoMassaGeral = resultados.find(r => r.tipo === 'MASSA_GERAL')
      
      if (resultadoMassaGeral && (resultadoMassaGeral.massaGeral || resultadoMassaGeral.valor)) {
        const massaGeralStr = String(resultadoMassaGeral.massaGeral || resultadoMassaGeral.valor)
        dadosBrutos.massaGeralBruto = parseFloat(massaGeralStr.replace(',', '.')) || 0.2
      } else {
        dadosBrutos.massaGeralBruto = 0.2 // Fallback se não encontrar MASSA_GERAL
      }
    } else {
      // Para módulo solo, usar valor padrão ou buscar se disponível
      const resultadoMassaGeral = resultados.find(r => r.tipo === 'MASSA_GERAL')
      
      if (resultadoMassaGeral && (resultadoMassaGeral.massaGeral || resultadoMassaGeral.valor)) {
        const massaGeralStr = String(resultadoMassaGeral.massaGeral || resultadoMassaGeral.valor)
        dadosBrutos.massaGeralBruto = parseFloat(massaGeralStr.replace(',', '.')) || 0.2
      } else {
        dadosBrutos.massaGeralBruto = 0.2 // Valor padrão para módulo solo
      }
    }
    
    resultados.forEach(resultado => {
      const { tipo, valor, diluicao, massa, al, h_al, param_a, param_b } = resultado
      
      // Função para obter o valor do branco com lógica especial (igual à aba Resultados)
      const getBrancoValue = (resultado: any, tipo: string) => {
        
        // Caso especial para H+Al - buscar o campo branco dentro do resultado H+Al
        if (tipo === 'H+Al') {
          if (resultado.branco) {
            const valor = parseFloat(resultado.branco)
            if (!isNaN(valor)) {
              return valor
            }
          }
          return 0
        }
        
        // Caso especial para Boro foliar - usar brancoBFoliar
        if (tipo === 'B') {
          if (resultado.brancoBFoliar) {
            return parseFloat(resultado.brancoBFoliar) || 0
          }
          return 0
        }
        
        // Para outros tipos, usar a lógica original
        if (resultado.branco) {
          return parseFloat(resultado.branco) || 0
        }
        
        // Se não encontrar branco específico, usar valor padrão baseado no tipo
        // Valores padrão típicos para análises de solo
        const valoresPadraoBranco: Record<string, number> = {
          'pH': 0.0,    // pH geralmente não tem branco
          'P': 0.0,     // Fósforo - valor padrão
          'Na': 0.0,    // Sódio - valor padrão
          'K': 0.0,     // Potássio - valor padrão
          'Ca': 0.0,    // Cálcio - valor padrão
          'Mg': 0.0,    // Magnésio - valor padrão
          'Fe': 0.0,    // Ferro - valor padrão
          'Zn': 0.0,    // Zinco - valor padrão
          'Cu': 0.0,    // Cobre - valor padrão
          'Mn': 0.0,    // Manganês - valor padrão
          'B': 0.0,     // Boro - valor padrão
          'MO': 0.0,    // Matéria Orgânica - valor padrão
          'S': 0.0,     // Enxofre - valor padrão
          'PREM': 0.0,  // PREM - valor padrão
          'N': 0.0      // Nitrogênio - valor padrão
        }
        
        return valoresPadraoBranco[tipo] || 0
      }
      
      const valorNum = parseFloat(valor?.replace(',', '.')) || 0
      const diluicaoNum = parseFloat(diluicao?.replace(',', '.')) || 1
      const massaNum = parseFloat(massa?.replace(',', '.')) || 0
      const brancoNum = getBrancoValue(resultado, tipo)
      
      switch (tipo) {
        case 'pH':
          dadosBrutos.ph = valorNum
          break
        case 'P':
          dadosBrutos.p = valorNum
          dadosBrutos.p_dil = diluicaoNum
          dadosBrutos.p_param_a = parseFloat(param_a) || 0
          dadosBrutos.p_param_b = parseFloat(param_b) || 0
          break
        case 'Na':
          dadosBrutos.na = valorNum
          dadosBrutos.na_dil = diluicaoNum
          break
        case 'K':
          dadosBrutos.k = valorNum
          dadosBrutos.k_dil = diluicaoNum
          break
        case 'Ca':
          dadosBrutos.ca = valorNum
          dadosBrutos.ca_dil = diluicaoNum
          break
        case 'Mg':
          dadosBrutos.mg = valorNum
          dadosBrutos.mg_dil = diluicaoNum
          break
        case 'H+Al':
          // Para H+Al, extrair todos os campos necessários
          if (al && al !== 'null' && al.trim() !== '') {
            dadosBrutos.al = parseFloat(al.replace(',', '.')) || 0
          }
          if (h_al && h_al !== 'null' && h_al.trim() !== '') {
            dadosBrutos.h_al = parseFloat(h_al.replace(',', '.')) || 0
          }
          if (resultado.branco && resultado.branco !== 'null' && resultado.branco.trim() !== '') {
            dadosBrutos.h_al_branco = parseFloat(resultado.branco.replace(',', '.')) || 0
          }
          break
        case 'MO':
          dadosBrutos.mo = valorNum
          dadosBrutos.mo_massa = massaNum
          dadosBrutos.mo_branco = brancoNum
          break
        case 'Fe':
          dadosBrutos.fe = valorNum
          dadosBrutos.fe_dil = diluicaoNum
          break
        case 'Cu':
          dadosBrutos.cu = valorNum
          dadosBrutos.cu_dil = diluicaoNum
          break
        case 'Zn':
          dadosBrutos.zn = valorNum
          dadosBrutos.zn_dil = diluicaoNum
          break
        case 'Mn':
          dadosBrutos.mn = valorNum
          dadosBrutos.mn_dil = diluicaoNum
          break
        case 'B':
          // Para Boro, só usar valores se não forem null/undefined/vazios
          if (valor && valor !== 'null' && valor.trim() !== '') {
            dadosBrutos.b = valorNum
          }
          if (resultado.branco && resultado.branco !== 'null' && resultado.branco.trim() !== '') {
            dadosBrutos.b_branco = parseFloat(String(resultado.branco).replace(',', '.')) || 0
          }
          // Também verificar se há brancoBFoliar no resultado
          if (resultado.brancoBFoliar !== null && resultado.brancoBFoliar !== undefined) {
            dadosBrutos.b_branco = parseFloat(String(resultado.brancoBFoliar).replace(',', '.')) || 0
          }
          if (param_a && param_a !== 'null' && param_a.trim() !== '') {
            dadosBrutos.b_param_a = parseFloat(param_a)
          }
          if (param_b && param_b !== 'null' && param_b.trim() !== '') {
            dadosBrutos.b_param_b = parseFloat(param_b)
          }
          
          if (diluicao && diluicao !== 'null' && diluicao.trim() !== '') {
            dadosBrutos.b_dil = diluicaoNum
          }
          // Também verificar se há diluicaoBFoliar no resultado
          if (resultado.diluicaoBFoliar !== null && resultado.diluicaoBFoliar !== undefined) {
            dadosBrutos.b_dil = parseFloat(String(resultado.diluicaoBFoliar).replace(',', '.')) || 0
          }
          // Mapear massaBFoliar se disponível
          if (resultado.massaBFoliar !== null && resultado.massaBFoliar !== undefined) {
            dadosBrutos.massaBFoliar = parseFloat(String(resultado.massaBFoliar).replace(',', '.')) || 0
          }
          break
        case 'S':
          dadosBrutos.s = valorNum
          if (resultado.branco && resultado.branco !== 'null' && resultado.branco.trim() !== '') {
            dadosBrutos.s_branco = brancoNum
          }
          if (param_a && param_a !== 'null' && param_a.trim() !== '') {
            dadosBrutos.s_param_a = parseFloat(param_a)
          }
          if (param_b && param_b !== 'null' && param_b.trim() !== '') {
            dadosBrutos.s_param_b = parseFloat(param_b)
          }
          if (diluicao && diluicao !== 'null' && diluicao.trim() !== '') {
            dadosBrutos.s_dil = diluicaoNum
          }
          break
        case 'PREM':
          dadosBrutos.prem = valorNum
          dadosBrutos.prem_dil = diluicaoNum
          dadosBrutos.prem_param_a = parseFloat(param_a) || 0
          dadosBrutos.prem_param_b = parseFloat(param_b) || 0
          break
        case 'MASSA_GERAL':
          // Este caso já é tratado acima, mas deixamos aqui para completude
          break
        case 'DETERMINACAO_F':
          // Este caso não precisa de mapeamento para cálculos
          break
        case 'N':
          // Mapear campos específicos do Nitrogênio
          
          if (resultado.massaN !== null && resultado.massaN !== undefined && resultado.massaN !== '') {
            const massaNStr = String(resultado.massaN)
            dadosBrutos.massaN = parseFloat(massaNStr.replace(',', '.')) || 0
          }
          if (resultado.volumeN !== null && resultado.volumeN !== undefined && resultado.volumeN !== '') {
            const volumeNStr = String(resultado.volumeN)
            dadosBrutos.volumeN = parseFloat(volumeNStr.replace(',', '.')) || 0
          }
          if (resultado.brancoN !== null && resultado.brancoN !== undefined && resultado.brancoN !== '') {
            const brancoNStr = String(resultado.brancoN)
            dadosBrutos.brancoN = parseFloat(brancoNStr.replace(',', '.')) || 0
          }
          if (resultado.fatorF !== null && resultado.fatorF !== undefined && resultado.fatorF !== '') {
            const fatorFStr = String(resultado.fatorF)
            dadosBrutos.fatorF = parseFloat(fatorFStr.replace(',', '.')) || 0
          }
          break
      }
    })
    
    // Debug final dos dados brutos
    
    // Calcular resultados usando as fórmulas específicas do módulo
    
    let calculados: CalculadosResultados
    // FORÇAR uso das fórmulas do módulo foliar para amostras foliares
    const isFoliarSample = amostra?.categoria === 'foliar' || modulo === 'foliar'
    
    if (isFoliarSample) {
      calculados = calcularResultadosFoliar(dadosBrutos)
    } else {
      calculados = calcularResultados(dadosBrutos)
    }
    
    
    // Formatar resultados para exibição
    const resultadosFormatados: any = {}
    
    if (calculados.ph !== undefined) resultadosFormatados.ph = calculados.ph.toFixed(2)
    if (calculados.p !== undefined) resultadosFormatados.p = calculados.p.toFixed(2)
    if (calculados.na !== undefined) resultadosFormatados.na = calculados.na.toFixed(2)
    if (calculados.k !== undefined) resultadosFormatados.k = calculados.k.toFixed(2)
    if (calculados.ca !== undefined) resultadosFormatados.ca = calculados.ca.toFixed(2)
    if (calculados.mg !== undefined) resultadosFormatados.mg = calculados.mg.toFixed(2)
    if (calculados.al !== undefined) resultadosFormatados.al = calculados.al.toFixed(2)
    if (calculados.h_al !== undefined) resultadosFormatados['H+Al'] = calculados.h_al.toFixed(2)
    if (calculados.sb !== undefined) resultadosFormatados.sb = calculados.sb.toFixed(2)
    if (calculados.t !== undefined) resultadosFormatados.t = calculados.t.toFixed(2)
    if (calculados.ctc !== undefined) resultadosFormatados.ctc = calculados.ctc.toFixed(2)
    if (calculados.v !== undefined) resultadosFormatados.v = calculados.v.toFixed(2)
    if (calculados.m !== undefined) resultadosFormatados.m = calculados.m.toFixed(2)
    if (calculados.mo !== undefined) resultadosFormatados.mo = calculados.mo.toFixed(2)
    if (calculados.fe !== undefined) resultadosFormatados.fe = calculados.fe.toFixed(2)
    if (calculados.cu !== undefined) resultadosFormatados.cu = calculados.cu.toFixed(2)
    if (calculados.zn !== undefined) resultadosFormatados.zn = calculados.zn.toFixed(2)
    if (calculados.mn !== undefined) resultadosFormatados.mn = calculados.mn.toFixed(2)
    if (calculados.b !== undefined) resultadosFormatados.b = calculados.b.toFixed(2)
    if (calculados.s !== undefined) resultadosFormatados.s = calculados.s.toFixed(2)
    if (calculados.prem !== undefined) resultadosFormatados.prem = calculados.prem.toFixed(2)
    if (calculados.n !== undefined) resultadosFormatados.n = calculados.n.toFixed(2)
    
    return resultadosFormatados
  }

  // Função para exportar resultados calculados (CSV)
  const exportarResultados = () => {
      const dados = resultadosPorAmostra.map(item => {
        const calculados = calcularResultadosFinais(item.resultados, item.amostra)
        return {
          'Código Amostra': item.amostra?.codigo || '',
          'Cliente': item.amostra?.cliente?.nome || '',
          'Cultura': item.amostra?.cultura || '',
          'Data Coleta': item.amostra?.dataColeta ? new Date(item.amostra.dataColeta).toLocaleDateString('pt-BR') : '',
          'pH': calculados.ph || '',
          'P': calculados.p || '',
          'K': calculados.k || '',
          'Ca': calculados.ca || '',
          'Mg': calculados.mg || '',
          'Fe': calculados.fe || '',
          'Zn': calculados.zn || '',
          'Cu': calculados.cu || '',
          'Mn': calculados.mn || '',
          'MO': calculados.mo || '',
          'S': calculados.s || '',
          'PREM': calculados.prem || '',
        }
      })

    // Converter para CSV
    const headers = Object.keys(dados[0] || {})
    const csvContent = [
      headers.join(','),
      ...dados.map(row => headers.map(header => `"${(row as any)[header] || ''}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `resultados_calculados_${new Date().toISOString().split('T')[0]}.csv`)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultados Calculados</h1>
          <p className="text-gray-600">Resultados finais após cálculos e fórmulas aplicadas</p>
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

            {/* Filtro de Sub-tipos Granulométricos */}
            {filters.tiposAnalise.granulometria && !Object.values(filters.tiposAnalise).some(val => val && val !== filters.tiposAnalise.granulometria) && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Tipo de Resultado Granulométrico:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setGranulometriaSubTipo('classificacao')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      granulometriaSubTipo === 'classificacao'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Classificação Textural
                  </button>
                  <button
                    onClick={() => setGranulometriaSubTipo('qd_massa')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      granulometriaSubTipo === 'qd_massa'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Q.D Massa das Partículas
                  </button>
                  <button
                    onClick={() => setGranulometriaSubTipo('qd_fator')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      granulometriaSubTipo === 'qd_fator'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Q.D Fator F
                  </button>
                  <button
                    onClick={() => setGranulometriaSubTipo('qd_proporcoes')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      granulometriaSubTipo === 'qd_proporcoes'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Q.D Proporções das Partículas
                  </button>
                  <button
                    onClick={() => setGranulometriaSubTipo('qd_decisao')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      granulometriaSubTipo === 'qd_decisao'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Q.D Tomada de Decisão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {filters.tiposAnalise.granulometria && !Object.values(filters.tiposAnalise).some(val => val && val !== filters.tiposAnalise.granulometria) ? (
        // Mostrar tabela granulométrica quando apenas granulométrica estiver selecionada
        <GranulometriaTable 
          amostras={resultadosPorAmostra.map(r => r.amostra)}
          resultados={data?.data || []}
          tipo="calculados"
          subTipo={granulometriaSubTipo}
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
              lineHeight: '1.25rem',
              tableLayout: 'auto'
            }}
          >
            <thead className="table-header">
              <tr className="table-row">
                <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 w-20 text-xs">Amostra</th>
                <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 w-32 text-xs">Cliente</th>
                <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 w-24 text-xs">Cultura</th>
                
                {/* Colunas de Rotina */}
                {shouldShowColumn('pH') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">pH</th>}
                {shouldShowColumn('P') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">P</th>}
                {shouldShowColumn('Na') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">Na</th>}
                {shouldShowColumn('K') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">K</th>}
                {shouldShowColumn('Ca') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">Ca</th>}
                {shouldShowColumn('Mg') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">Mg</th>}
                {shouldShowColumn('Al') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">Al</th>}
                {shouldShowColumn('H_Al') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">H+Al</th>}
                {shouldShowColumn('SB') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">SB</th>}
                {shouldShowColumn('t') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">t</th>}
                {shouldShowColumn('CTC') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">CTC</th>}
                {shouldShowColumn('V') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">V</th>}
                {shouldShowColumn('m') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">m</th>}
                
                {/* Colunas de Micronutrientes */}
                {shouldShowColumn('Fe') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">Fe</th>}
                {shouldShowColumn('Zn') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">Zn</th>}
                {shouldShowColumn('Cu') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">Cu</th>}
                {shouldShowColumn('Mn') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">Mn</th>}
                {shouldShowColumn('B') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">B</th>}
                
                {/* Colunas de Matéria Orgânica */}
                {shouldShowColumn('MO') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">MO</th>}
                
                {/* Colunas de Enxofre */}
                {shouldShowColumn('S') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">S</th>}
                
                {/* Colunas de PREM */}
                {shouldShowColumn('PREM') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">PREM</th>}
                
                {/* Colunas de N */}
                {shouldShowColumn('N') && <th className="h-10 px-1 text-left align-middle font-medium text-gray-600 text-xs w-16">N</th>}
              </tr>
            </thead>
                <tbody className="table-body">
                  {resultadosPorAmostra.slice(0, displayedResults).map((item) => {
                    const calculados = calcularResultadosFinais(item.resultados, item.amostra)
                    return (
                      <tr key={item.amostra?.id} className="border-b border-gray-200">
                        <td className="p-1 align-middle font-medium text-xs">{item.amostra?.codigo || '-'}</td>
                        <td className="p-1 align-middle text-xs">{item.amostra?.cliente?.nome || '-'}</td>
                        <td className="p-1 align-middle text-xs">{item.amostra?.cultura || '-'}</td>
                        
                        {/* Colunas de Rotina */}
                        {shouldShowColumn('pH') && <td className="p-1 align-middle text-xs">{calculados.ph || '-'}</td>}
                        {shouldShowColumn('P') && <td className="p-1 align-middle text-xs">{calculados.p || '-'}</td>}
                        {shouldShowColumn('Na') && <td className="p-1 align-middle text-xs">{calculados.na || '-'}</td>}
                        {shouldShowColumn('K') && <td className="p-1 align-middle text-xs">{calculados.k || '-'}</td>}
                        {shouldShowColumn('Ca') && <td className="p-1 align-middle text-xs">{calculados.ca || '-'}</td>}
                        {shouldShowColumn('Mg') && <td className="p-1 align-middle text-xs">{calculados.mg || '-'}</td>}
                        {shouldShowColumn('Al') && <td className="p-1 align-middle text-xs">{calculados.al || '-'}</td>}
                        {shouldShowColumn('H_Al') && <td className="p-1 align-middle text-xs">{calculados['H+Al'] || '-'}</td>}
                        {shouldShowColumn('SB') && <td className="p-1 align-middle text-xs">{calculados.sb || '-'}</td>}
                        {shouldShowColumn('t') && <td className="p-1 align-middle text-xs">{calculados.t || '-'}</td>}
                        {shouldShowColumn('CTC') && <td className="p-1 align-middle text-xs">{calculados.ctc || '-'}</td>}
                        {shouldShowColumn('V') && <td className="p-1 align-middle text-xs">{calculados.v || '-'}</td>}
                        {shouldShowColumn('m') && <td className="p-1 align-middle text-xs">{calculados.m || '-'}</td>}
                        
                        {/* Colunas de Micronutrientes */}
                        {shouldShowColumn('Fe') && <td className="p-1 align-middle text-xs">{calculados.fe || '-'}</td>}
                        {shouldShowColumn('Zn') && <td className="p-1 align-middle text-xs">{calculados.zn || '-'}</td>}
                        {shouldShowColumn('Cu') && <td className="p-1 align-middle text-xs">{calculados.cu || '-'}</td>}
                        {shouldShowColumn('Mn') && <td className="p-1 align-middle text-xs">{calculados.mn || '-'}</td>}
                        {shouldShowColumn('B') && <td className="p-1 align-middle text-xs">{calculados.b || '-'}</td>}
                        
                        {/* Colunas de Matéria Orgânica */}
                        {shouldShowColumn('MO') && <td className="p-1 align-middle text-xs">{calculados.mo || '-'}</td>}
                        
                        {/* Colunas de Enxofre */}
                        {shouldShowColumn('S') && <td className="p-1 align-middle text-xs">{calculados.s || '-'}</td>}
                        
                        {/* Colunas de PREM */}
                        {shouldShowColumn('PREM') && <td className="p-1 align-middle text-xs">{calculados.prem || '-'}</td>}
                        
                        {/* Colunas de N */}
                        {shouldShowColumn('N') && <td className="p-1 align-middle text-xs">{(() => {
                          const valorN = calculados.n
                          return formatarResultado(valorN) || '-'
                        })()}</td>}
                      </tr>
                    )
                  })}
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

      {/* Informações sobre os cálculos */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-start space-x-3">
            <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Fórmulas Aplicadas</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Para tipos com diluição:</strong> Resultado Final = Valor de Leitura × Diluição
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Para tipos sem diluição:</strong> Resultado Final = Valor de Leitura (pH, MO, S, PREM)
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p><strong>Tipos com diluição:</strong> P, K, Ca, Mg, Fe, Zn, Cu, Mn, H+Al, Na</p>
                <p><strong>Tipos sem diluição:</strong> pH, MO, S, PREM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}

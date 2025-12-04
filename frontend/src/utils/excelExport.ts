import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  filename: string
  sheetName?: string
}

export function exportToExcel(data: any[], options: ExcelExportOptions) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('Dados inválidos para exportação:', data)
    throw new Error('Nenhum dado disponível para exportar')
  }
  
  try {
    // Criar uma nova planilha
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Criar um novo workbook
    const workbook = XLSX.utils.book_new()
    
    // Adicionar a planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Relatório')
    
    // Gerar o arquivo Excel
    XLSX.writeFile(workbook, `${options.filename}.xlsx`)
  } catch (error) {
    console.error('Erro ao gerar arquivo Excel:', error)
    throw new Error(`Erro ao gerar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

// Função específica para relatório geral
export function exportRelatorioGeral(relatorioData: any) {
  if (!relatorioData) {
    console.error('Dados do relatório não disponíveis')
    throw new Error('Dados do relatório não disponíveis')
  }

  // A API retorna 'dados' em vez de 'lotes'
  const { estatisticas, lotes, dados } = relatorioData
  const lotesArray = lotes || dados || []
  
  if (!estatisticas) {
    console.error('Estatísticas não disponíveis:', relatorioData)
    throw new Error('Estatísticas não disponíveis')
  }
  
  if (!Array.isArray(lotesArray)) {
    console.error('Lotes não é um array:', { lotes, dados, lotesArray })
    throw new Error('Dados de lotes inválidos')
  }
  
  // Criar workbook
  const workbook = XLSX.utils.book_new()
  
  // Planilha 1: Estatísticas
  const statsData = [
    { Métrica: 'Total de Lotes', Valor: estatisticas.totalLotes },
    { Métrica: 'Total de Amostras', Valor: estatisticas.totalAmostras },
    { Métrica: 'Total de Resultados', Valor: estatisticas.totalResultados },
    { Métrica: 'Lotes Pendentes', Valor: estatisticas.statusCount.pendente || 0 },
    { Métrica: 'Lotes em Análise', Valor: estatisticas.statusCount.em_analise || 0 },
    { Métrica: 'Lotes Concluídos', Valor: estatisticas.statusCount.concluido || 0 },
    { Métrica: 'Lotes Pagos', Valor: estatisticas.statusCount.pago || 0 },
  ]
  
  const statsSheet = XLSX.utils.json_to_sheet(statsData)
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatísticas')
  
  // Planilha 2: Tipos de Análise
  const tiposData = Object.entries(estatisticas.tiposAnalise).map(([tipo, count]) => ({
    'Tipo de Análise': tipo.charAt(0).toUpperCase() + tipo.slice(1),
    'Quantidade': count
  }))
  
  const tiposSheet = XLSX.utils.json_to_sheet(tiposData)
  XLSX.utils.book_append_sheet(workbook, tiposSheet, 'Tipos de Análise')
  
  // Planilha 3: Lotes
  const lotesData = lotesArray.map((lote: any) => ({
    'Código': lote?.codigo || '-',
    'Cliente': lote?.cliente?.nome || '-',
    'Data Entrega': lote?.dataEntrega ? new Date(lote.dataEntrega).toLocaleDateString('pt-BR') : '-',
    'Amostras': lote?.amostras?.length || 0,
    'Status': lote?.status === 'pendente' ? 'Pendente' :
              lote?.status === 'em_analise' ? 'Em Análise' :
              lote?.status === 'concluido' ? 'Concluído' : 'Pago',
    'Pagamento': lote?.pago ? 'Pago' : 'Pendente'
  }))
  
  if (lotesData.length === 0) {
    console.warn('Nenhum lote para exportar')
  }
  
  const lotesSheet = XLSX.utils.json_to_sheet(lotesData)
  XLSX.utils.book_append_sheet(workbook, lotesSheet, 'Lotes')
  
  // Salvar arquivo
  const filename = `Relatorio_Geral_${new Date().toISOString().split('T')[0]}`
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Função específica para relatório por cliente
export function exportRelatorioCliente(relatorioData: any) {
  if (!relatorioData) {
    console.error('Dados do relatório não disponíveis')
    throw new Error('Dados do relatório não disponíveis')
  }

  // A API retorna 'dados' em vez de 'relatorioPorCliente'
  const { relatorioPorCliente, dados } = relatorioData
  const clientesArray = relatorioPorCliente || dados || []
  
  if (!Array.isArray(clientesArray)) {
    console.error('Dados de relatório por cliente inválidos:', { relatorioPorCliente, dados, clientesArray })
    throw new Error('Dados de relatório por cliente inválidos')
  }
  
  const clientesData = clientesArray.map((clienteData: any) => ({
    'Cliente': clienteData?.cliente?.nome || '-',
    'CPF': clienteData?.cliente?.cpf || '-',
    'Cidade': clienteData?.cliente?.cidade || '-',
    'Total Lotes': clienteData?.estatisticas?.totalLotes || clienteData?.lotes?.length || 0,
    'Total Amostras': clienteData?.estatisticas?.totalAmostras || 0,
    'Total Resultados': clienteData?.estatisticas?.totalResultados || 0,
    'Lotes Pendentes': clienteData?.estatisticas?.statusCount?.pendente || 0,
    'Lotes em Análise': clienteData?.estatisticas?.statusCount?.em_analise || 0,
    'Lotes Concluídos': clienteData?.estatisticas?.statusCount?.concluido || 0,
    'Lotes Pagos': clienteData?.estatisticas?.statusCount?.pago || 0
  }))
  
  const filename = `Relatorio_Clientes_${new Date().toISOString().split('T')[0]}`
  exportToExcel(clientesData, { filename, sheetName: 'Relatório por Cliente' })
}

// Função específica para relatório por cultura
export function exportRelatorioCultura(relatorioData: any) {
  if (!relatorioData) {
    console.error('Dados do relatório não disponíveis')
    throw new Error('Dados do relatório não disponíveis')
  }
  
  if (!relatorioData.culturas) {
    console.error('Dados de culturas não disponíveis')
    throw new Error('Dados de culturas não disponíveis')
  }

  const culturasData = Object.entries(relatorioData.culturas).map(([cultura, dados]: [string, any]) => ({
    'Cultura': cultura,
    'Total': dados.total,
    'Concluídas': dados.concluidas,
    'Pendentes': dados.pendentes
  }))
  
  const filename = `Relatorio_Culturas_${new Date().toISOString().split('T')[0]}`
  exportToExcel(culturasData, { filename, sheetName: 'Relatório por Cultura' })
}

// Função específica para relatório financeiro
export function exportRelatorioFinanceiro(relatorioData: any) {
  if (!relatorioData) {
    console.error('Dados do relatório não disponíveis')
    throw new Error('Dados do relatório não disponíveis')
  }

  // A API retorna 'dados' em vez de 'lotes'
  const { estatisticas, lotes, dados } = relatorioData
  const lotesArray = lotes || dados || []
  
  if (!estatisticas) {
    console.error('Estatísticas não disponíveis:', relatorioData)
    throw new Error('Estatísticas não disponíveis')
  }
  
  if (!Array.isArray(lotesArray)) {
    console.error('Lotes não é um array:', { lotes, dados, lotesArray })
    throw new Error('Dados de lotes inválidos')
  }
  
  // Criar workbook
  const workbook = XLSX.utils.book_new()
  
  // Planilha 1: Resumo Financeiro
  const resumoData = [
    { Métrica: 'Total Faturado', Valor: `R$ ${estatisticas.totalFaturado.toFixed(2).replace('.', ',')}` },
    { Métrica: 'Total Pago', Valor: `R$ ${estatisticas.totalPago.toFixed(2).replace('.', ',')}` },
    { Métrica: 'Total Pendente', Valor: `R$ ${estatisticas.totalPendente.toFixed(2).replace('.', ',')}` },
  ]
  
  const resumoSheet = XLSX.utils.json_to_sheet(resumoData)
  XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo Financeiro')
  
  // Planilha 2: Detalhamento por Lote
  const lotesData = lotesArray.map((lote: any) => {
    // O relatório financeiro retorna valorFinal diretamente
    const valorLote = lote.valorFinal || lote.valorTotal || 0
    return {
      'Código': lote?.codigo || '-',
      'Cliente': lote?.cliente || lote?.cliente_nome || '-',
      'Data Entrega': lote?.dataEntrega ? new Date(lote.dataEntrega).toLocaleDateString('pt-BR') : '-',
      'Amostras': lote?.totalAmostras || lote?.amostras?.length || 0,
      'Valor Total': `R$ ${valorLote.toFixed(2).replace('.', ',')}`,
      'Status Pagamento': lote?.pago ? 'Pago' : 'Pendente',
      'Status Lote': lote?.status === 'pendente' ? 'Pendente' :
                    lote?.status === 'em_analise' ? 'Em Análise' :
                    lote?.status === 'concluido' ? 'Concluído' : 'Pago'
    }
  })
  
  const lotesSheet = XLSX.utils.json_to_sheet(lotesData)
  XLSX.utils.book_append_sheet(workbook, lotesSheet, 'Detalhamento por Lote')
  
  // Salvar arquivo
  const filename = `Relatorio_Financeiro_${new Date().toISOString().split('T')[0]}`
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Função específica para relatório de estatísticas
export function exportRelatorioEstatisticas(relatorioData: any) {
  if (!relatorioData) {
    console.error('Dados do relatório não disponíveis')
    throw new Error('Dados do relatório não disponíveis')
  }

  // O relatório de estatísticas usa o endpoint /dashboard e retorna 'totais'
  const { estatisticas, totais, metricas } = relatorioData
  
  // O endpoint /dashboard retorna totais diretamente com: lotes, amostras, clientes, resultados
  const stats = totais || estatisticas || metricas || relatorioData
  
  if (!stats) {
    console.error('Estatísticas não disponíveis:', relatorioData)
    throw new Error('Estatísticas não disponíveis')
  }
  
  // O endpoint /dashboard retorna totais com: lotes, amostras, clientes, resultados (números diretos)
  const statsData = [
    { Métrica: 'Total de Lotes', Valor: stats.lotes || stats.totalLotes || 0 },
    { Métrica: 'Total de Amostras', Valor: stats.amostras || stats.totalAmostras || 0 },
    { Métrica: 'Total de Clientes', Valor: stats.clientes || stats.totalClientes || 0 },
    { Métrica: 'Total de Resultados', Valor: stats.resultados || stats.totalResultados || 0 }
  ]
  
  const filename = `Relatorio_Estatisticas_${new Date().toISOString().split('T')[0]}`
  exportToExcel(statsData, { filename, sheetName: 'Estatísticas' })
}

// Função para exportar resultados completos (brutos e calculados)
export function exportResultadosCompletos(resultadosData: any) {
  if (!resultadosData) return

  // Criar workbook
  const workbook = XLSX.utils.book_new()
  
  // Planilha 1: Resultados Brutos
  const resultadosBrutos = resultadosData.map((item: any) => {
    const amostra = item.amostra
    const resultados = item.resultados || []
    
    // Função para obter valor bruto
    const getValorBruto = (tipo: string) => {
      const resultado = resultados.find((r: any) => r.tipo === tipo)
      return resultado ? resultado.valor : ''
    }
    
    return {
      'Código': amostra?.codigo || '',
      'Identificação': amostra?.identificacao || '',
      'Localidade': amostra?.localidade || '',
      'Cultura': amostra?.cultura || '',
      'Cliente': amostra?.lote?.cliente?.nome || '',
      'Lote': amostra?.lote?.codigo || '',
      'Data Coleta': amostra?.dataColeta ? new Date(amostra.dataColeta).toLocaleDateString('pt-BR') : '',
      'Status': amostra?.status || '',
      'pH': getValorBruto('pH'),
      'P': getValorBruto('P'),
      'Na': getValorBruto('Na'),
      'K': getValorBruto('K'),
      'H+Al': getValorBruto('H+Al'),
      'Ca': getValorBruto('Ca'),
      'Mg': getValorBruto('Mg'),
      'Fe': getValorBruto('Fe'),
      'Zn': getValorBruto('Zn'),
      'Cu': getValorBruto('Cu'),
      'Mn': getValorBruto('Mn'),
      'MO': getValorBruto('MO'),
      'S': getValorBruto('S'),
      'PREM': getValorBruto('PREM')
    }
  })
  
  const resultadosBrutosSheet = XLSX.utils.json_to_sheet(resultadosBrutos)
  XLSX.utils.book_append_sheet(workbook, resultadosBrutosSheet, 'Resultados Brutos')
  
  // Planilha 2: Resultados Calculados
  const resultadosCalculados = resultadosData.map((item: any) => {
    const amostra = item.amostra
    const resultados = item.resultados || []
    
    // Função para calcular resultado final
    const getResultadoCalculado = (tipo: string) => {
      const resultado = resultados.find((r: any) => r.tipo === tipo)
      if (!resultado) return ''
      
      const valor = parseFloat(resultado.valor)
      const diluicao = parseFloat(resultado.diluicao) || 1
      
      if (isNaN(valor)) return ''
      
      // Aplicar fórmula: valor * diluição
      return (valor * diluicao).toFixed(2)
    }
    
    return {
      'Código': amostra?.codigo || '',
      'Identificação': amostra?.identificacao || '',
      'Localidade': amostra?.localidade || '',
      'Cultura': amostra?.cultura || '',
      'Cliente': amostra?.lote?.cliente?.nome || '',
      'Lote': amostra?.lote?.codigo || '',
      'Data Coleta': amostra?.dataColeta ? new Date(amostra.dataColeta).toLocaleDateString('pt-BR') : '',
      'Status': amostra?.status || '',
      'pH': getResultadoCalculado('pH'),
      'P': getResultadoCalculado('P'),
      'Na': getResultadoCalculado('Na'),
      'K': getResultadoCalculado('K'),
      'H+Al': getResultadoCalculado('H+Al'),
      'Ca': getResultadoCalculado('Ca'),
      'Mg': getResultadoCalculado('Mg'),
      'Fe': getResultadoCalculado('Fe'),
      'Zn': getResultadoCalculado('Zn'),
      'Cu': getResultadoCalculado('Cu'),
      'Mn': getResultadoCalculado('Mn'),
      'MO': getResultadoCalculado('MO'),
      'S': getResultadoCalculado('S'),
      'PREM': getResultadoCalculado('PREM')
    }
  })
  
  const resultadosCalculadosSheet = XLSX.utils.json_to_sheet(resultadosCalculados)
  XLSX.utils.book_append_sheet(workbook, resultadosCalculadosSheet, 'Resultados Calculados')
  
  // Planilha 3: Resumo por Amostra
  const resumoAmostras = resultadosData.map((item: any) => {
    const amostra = item.amostra
    const resultados = item.resultados || []
    
    // Contar tipos de análise solicitados
    const tiposSolicitados = []
    if (amostra?.rotina) tiposSolicitados.push('Rotina')
    if (amostra?.organica) tiposSolicitados.push('Matéria Orgânica')
    if (amostra?.micronutrientes) tiposSolicitados.push('Micronutrientes')
    if (amostra?.enxofre) tiposSolicitados.push('Enxofre')
    if (amostra?.prem) tiposSolicitados.push('PREM')
    
    // Contar resultados lançados
    const resultadosLancados = resultados.length
    
    return {
      'Código': amostra?.codigo || '',
      'Identificação': amostra?.identificacao || '',
      'Localidade': amostra?.localidade || '',
      'Cultura': amostra?.cultura || '',
      'Cliente': amostra?.lote?.cliente?.nome || '',
      'Lote': amostra?.lote?.codigo || '',
      'Data Coleta': amostra?.dataColeta ? new Date(amostra.dataColeta).toLocaleDateString('pt-BR') : '',
      'Status': amostra?.status || '',
      'Tipos Solicitados': tiposSolicitados.join(', '),
      'Resultados Lançados': resultadosLancados,
      'Progresso': `${resultadosLancados}/${tiposSolicitados.length}`,
      'Pago': amostra?.pago ? 'Sim' : 'Não'
    }
  })
  
  const resumoSheet = XLSX.utils.json_to_sheet(resumoAmostras)
  XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo por Amostra')
  
  // Salvar arquivo
  const filename = `Resultados_Completos_${new Date().toISOString().split('T')[0]}`
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Função específica para relatório completo
export function exportRelatorioCompleto(relatorioData: any) {
  if (!relatorioData) {
    console.error('Dados do relatório não disponíveis')
    throw new Error('Dados do relatório não disponíveis')
  }

  const { dados } = relatorioData
  const amostrasArray = dados || []
  
  if (!Array.isArray(amostrasArray)) {
    console.error('Dados de amostras inválidos:', { dados, amostrasArray })
    throw new Error('Dados de amostras inválidos')
  }

  // Determinar módulo (verificar primeira amostra ou usar módulo do filtro)
  const modulo = amostrasArray.length > 0 ? amostrasArray[0].modulo : 'solo'

  // Criar dados formatados para Excel baseado no módulo
  const dadosExcel = amostrasArray.map((amostra: any) => {
    const baseData: any = {
      'Cultura': amostra.cultura || '',
      'Localidade': amostra.localidade || '',
      'Data': amostra.data || '',
    }

    if (amostra.modulo === 'foliar') {
      // Módulo foliar: P, K, Ca, Mg, S, Fe, Cu, Zn, Mn, B, N
      baseData['P'] = amostra.p || ''
      baseData['K'] = amostra.k || ''
      baseData['Ca'] = amostra.ca || ''
      baseData['Mg'] = amostra.mg || ''
      baseData['S'] = amostra.s || ''
      baseData['Fe'] = amostra.fe || ''
      baseData['Cu'] = amostra.cu || ''
      baseData['Zn'] = amostra.zn || ''
      baseData['Mn'] = amostra.mn || ''
      baseData['B'] = amostra.b || ''
      baseData['N'] = amostra.n || ''
    } else {
      // Módulo solo: pH, P, Na, K, Ca, Mg, Al, H+Al, SB, t, CTC, V, m, Fe, Cu, Zn, Mn, B, S, MO, PREM
      baseData['pH'] = amostra.ph || ''
      baseData['P'] = amostra.p || ''
      baseData['Na'] = amostra.na || ''
      baseData['K'] = amostra.k || ''
      baseData['Ca'] = amostra.ca || ''
      baseData['Mg'] = amostra.mg || ''
      baseData['Al'] = amostra.al || ''
      baseData['H+Al'] = amostra.h_al || ''
      baseData['SB'] = amostra.sb || ''
      baseData['t'] = amostra.t || ''
      baseData['CTC'] = amostra.ctc || ''
      baseData['V'] = amostra.v || ''
      baseData['m'] = amostra.m || ''
      baseData['Fe'] = amostra.fe || ''
      baseData['Cu'] = amostra.cu || ''
      baseData['Zn'] = amostra.zn || ''
      baseData['Mn'] = amostra.mn || ''
      baseData['B'] = amostra.b || ''
      baseData['S'] = amostra.s || ''
      baseData['MO'] = amostra.mo || ''
      baseData['PREM'] = amostra.prem || ''
    }

    return baseData
  })

  const filename = `Relatorio_Completo_${new Date().toISOString().split('T')[0]}`
  exportToExcel(dadosExcel, { filename, sheetName: 'Relatório Completo' })
}

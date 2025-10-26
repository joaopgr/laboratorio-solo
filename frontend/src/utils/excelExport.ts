import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  filename: string
  sheetName?: string
}

export function exportToExcel(data: any[], options: ExcelExportOptions) {
  // Criar uma nova planilha
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Criar um novo workbook
  const workbook = XLSX.utils.book_new()
  
  // Adicionar a planilha ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Relatório')
  
  // Gerar o arquivo Excel
  XLSX.writeFile(workbook, `${options.filename}.xlsx`)
}

// Função específica para relatório geral
export function exportRelatorioGeral(relatorioData: any) {
  if (!relatorioData) return

  const { estatisticas, lotes } = relatorioData
  
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
  const lotesData = lotes.map((lote: any) => ({
    'Código': lote.codigo,
    'Cliente': lote.cliente?.nome || '-',
    'Data Entrega': new Date(lote.dataEntrega).toLocaleDateString('pt-BR'),
    'Amostras': lote.amostras?.length || 0,
    'Status': lote.status === 'pendente' ? 'Pendente' :
              lote.status === 'em_analise' ? 'Em Análise' :
              lote.status === 'concluido' ? 'Concluído' : 'Pago',
    'Pagamento': lote.pago ? 'Pago' : 'Pendente'
  }))
  
  const lotesSheet = XLSX.utils.json_to_sheet(lotesData)
  XLSX.utils.book_append_sheet(workbook, lotesSheet, 'Lotes')
  
  // Salvar arquivo
  const filename = `Relatorio_Geral_${new Date().toISOString().split('T')[0]}`
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Função específica para relatório por cliente
export function exportRelatorioCliente(relatorioData: any) {
  if (!relatorioData) return

  const { relatorioPorCliente } = relatorioData
  
  const clientesData = relatorioPorCliente.map((clienteData: any) => ({
    'Cliente': clienteData.cliente.nome,
    'CPF': clienteData.cliente.cpf || '-',
    'Cidade': clienteData.cliente.cidade || '-',
    'Total Lotes': clienteData.lotes.length,
    'Total Amostras': clienteData.totalAmostras,
    'Total Resultados': clienteData.totalResultados,
    'Lotes Pendentes': clienteData.statusCount.pendente || 0,
    'Lotes em Análise': clienteData.statusCount.em_analise || 0,
    'Lotes Concluídos': clienteData.statusCount.concluido || 0,
    'Lotes Pagos': clienteData.statusCount.pago || 0
  }))
  
  const filename = `Relatorio_Clientes_${new Date().toISOString().split('T')[0]}`
  exportToExcel(clientesData, { filename, sheetName: 'Relatório por Cliente' })
}

// Função específica para relatório por cultura
export function exportRelatorioCultura(relatorioData: any) {
  if (!relatorioData) return

  const { relatorioPorCultura } = relatorioData
  
  const culturasData = relatorioPorCultura.map((culturaData: any) => ({
    'Cultura': culturaData.cultura,
    'Total Lotes': culturaData.totalLotes,
    'Total Amostras': culturaData.totalAmostras,
    'Total Clientes': culturaData.totalClientes,
    'Total Resultados': culturaData.totalResultados
  }))
  
  const filename = `Relatorio_Culturas_${new Date().toISOString().split('T')[0]}`
  exportToExcel(culturasData, { filename, sheetName: 'Relatório por Cultura' })
}

// Função específica para relatório financeiro
export function exportRelatorioFinanceiro(relatorioData: any) {
  if (!relatorioData) return

  const { estatisticas, lotes } = relatorioData
  
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
  const lotesData = lotes.map((lote: any) => {
    const valorLote = lote.valorTotal || 0
    return {
      'Código': lote.codigo,
      'Cliente': lote.cliente?.nome || '-',
      'Data Entrega': new Date(lote.dataEntrega).toLocaleDateString('pt-BR'),
      'Amostras': lote.amostras?.length || 0,
      'Valor Total': `R$ ${valorLote.toFixed(2).replace('.', ',')}`,
      'Status Pagamento': lote.pago ? 'Pago' : 'Pendente',
      'Status Lote': lote.status === 'pendente' ? 'Pendente' :
                    lote.status === 'em_analise' ? 'Em Análise' :
                    lote.status === 'concluido' ? 'Concluído' : 'Pago'
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
  if (!relatorioData) return

  const { estatisticas } = relatorioData
  
  const statsData = [
    { Métrica: 'Total de Lotes', Valor: estatisticas.totalLotes },
    { Métrica: 'Total de Amostras', Valor: estatisticas.totalAmostras },
    { Métrica: 'Total de Clientes', Valor: estatisticas.totalClientes },
    { Métrica: 'Tempo Médio de Análise (dias)', Valor: estatisticas.tempoMedioAnalise }
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

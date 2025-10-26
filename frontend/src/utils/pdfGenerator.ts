import { LoteAmostra, Amostra, Resultado } from '../../../shared/types'

interface LaudoData {
  cliente: {
    nome: string
    cpf: string
    email?: string
    telefone?: string
    cidade?: string
    estado?: string
  }
  lote: LoteAmostra
  amostras: Amostra[]
  resultados: Resultado[]
  tipoAnalise?: string // 'geral', 'rotina', 'organica', 'micronutrientes', 'enxofre', 'prem', 'nitrogenio'
}

export function gerarLaudoPDF(data: LaudoData) {
  // Criar HTML para o laudo
  const htmlContent = gerarHTMLLaudo(data)
  
  // Criar nova janela para impressão
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Não foi possível abrir a janela de impressão')
  }
  
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // Aguardar carregamento e imprimir
  printWindow.onload = () => {
    printWindow.print()
    printWindow.close()
  }
}

function gerarHTMLLaudo(data: LaudoData): string {
  const tiposAnalise = []
  if (data.lote.rotina) tiposAnalise.push('Rotina')
  if (data.lote.organica) tiposAnalise.push('Matéria Orgânica')
  if (data.lote.micronutrientes) tiposAnalise.push('Micronutrientes')
  if (data.lote.enxofre) tiposAnalise.push('Enxofre')
  if (data.lote.prem) tiposAnalise.push('PREM')
  if (data.lote.nitrogenio) tiposAnalise.push('Nitrogênio')

  // Agrupar resultados por amostra
  const resultadosPorAmostra = data.resultados.reduce((acc, resultado) => {
    if (!acc[resultado.amostraId]) {
      acc[resultado.amostraId] = []
    }
    acc[resultado.amostraId].push(resultado)
    return acc
  }, {} as Record<string, Resultado[]>)

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Laudo de Análise de Solo</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #2c3e50;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          margin: 0;
        }
        
        .subtitle {
          font-size: 18px;
          color: #34495e;
          margin: 10px 0 0 0;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #2980b9;
          border-bottom: 2px solid #2980b9;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .info-item {
          margin-bottom: 8px;
        }
        
        .info-label {
          font-weight: bold;
          color: #555;
        }
        
        .amostra-item {
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 15px;
          background-color: #f9f9f9;
        }
        
        .amostra-title {
          font-weight: bold;
          color: #e74c3c;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .resultado-tipo {
          margin-bottom: 10px;
        }
        
        .resultado-tipo-title {
          font-weight: bold;
          color: #555;
          margin-bottom: 5px;
        }
        
        .resultado-item {
          margin-left: 20px;
          margin-bottom: 3px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #7f8c8d;
          text-align: center;
        }
        
        .no-results {
          color: #7f8c8d;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">LABORATÓRIO DE ANÁLISE DE SOLOS</h1>
        <p class="subtitle">Relatório de Análise de Solo</p>
      </div>

      <div class="section">
        <h2 class="section-title">DADOS DO CLIENTE</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nome:</span> ${data.cliente.nome}
          </div>
          <div class="info-item">
            <span class="info-label">CPF:</span> ${data.cliente.cpf}
          </div>
          ${data.cliente.email ? `<div class="info-item"><span class="info-label">Email:</span> ${data.cliente.email}</div>` : ''}
          ${data.cliente.telefone ? `<div class="info-item"><span class="info-label">Telefone:</span> ${data.cliente.telefone}</div>` : ''}
          ${data.cliente.cidade ? `<div class="info-item"><span class="info-label">Cidade:</span> ${data.cliente.cidade}</div>` : ''}
          ${data.cliente.estado ? `<div class="info-item"><span class="info-label">Estado:</span> ${data.cliente.estado}</div>` : ''}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">DADOS DO LOTE</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Código do Lote:</span> ${data.lote.codigo}
          </div>
          <div class="info-item">
            <span class="info-label">Data de Entrega:</span> ${data.lote.dataEntrega ? new Date(data.lote.dataEntrega).toLocaleDateString('pt-BR') : 'N/A'}
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span> ${data.lote.status.toUpperCase()}
          </div>
          ${data.lote.observacoes ? `<div class="info-item"><span class="info-label">Observações:</span> ${data.lote.observacoes}</div>` : ''}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">TIPOS DE ANÁLISE SOLICITADOS</h2>
        <p>${tiposAnalise.join(', ')}</p>
      </div>

      <div class="section">
        <h2 class="section-title">AMOSTRAS ANALISADAS</h2>
        ${data.amostras.map((amostra, index) => `
          <div class="amostra-item">
            <div class="amostra-title">${index + 1}. Código: ${amostra.codigo}</div>
            <div class="info-item"><span class="info-label">Identificação:</span> ${amostra.identificacao}</div>
            <div class="info-item"><span class="info-label">Cultura:</span> ${amostra.cultura}</div>
            <div class="info-item"><span class="info-label">Localidade:</span> ${amostra.localidade}</div>
            <div class="info-item"><span class="info-label">Data de Coleta:</span> ${amostra.dataColeta ? new Date(amostra.dataColeta).toLocaleDateString('pt-BR') : 'N/A'}</div>
            ${amostra.observacoes ? `<div class="info-item"><span class="info-label">Observações:</span> ${amostra.observacoes}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2 class="section-title">RESULTADOS DAS ANÁLISES</h2>
        ${data.amostras.map(amostra => {
          const resultadosAmostra = resultadosPorAmostra[amostra.id] || []
          
          if (resultadosAmostra.length === 0) {
            return `
              <div class="amostra-item">
                <div class="amostra-title">Amostra ${amostra.codigo} - ${amostra.identificacao}</div>
                <div class="no-results">Nenhum resultado disponível</div>
              </div>
            `
          }
          
          // Agrupar por tipo de análise
          const resultadosPorTipo = resultadosAmostra.reduce((acc, resultado) => {
            if (!acc[resultado.tipo]) {
              acc[resultado.tipo] = []
            }
            acc[resultado.tipo].push(resultado)
            return acc
          }, {} as Record<string, Resultado[]>)
          
          return `
            <div class="amostra-item">
              <div class="amostra-title">Amostra ${amostra.codigo} - ${amostra.identificacao}</div>
              ${Object.entries(resultadosPorTipo).map(([tipo, resultados]) => `
                <div class="resultado-tipo">
                  <div class="resultado-tipo-title">${tipo}:</div>
                  ${resultados.map(resultado => {
                    if (resultado.valor && resultado.valor !== 'null') {
                      return `<div class="resultado-item">${resultado.valor} ${resultado.unidade || ''}</div>`
                    }
                    return ''
                  }).join('')}
                </div>
              `).join('')}
            </div>
          `
        }).join('')}
      </div>

      <div class="footer">
        <p>Este relatório foi gerado automaticamente pelo sistema de análise de solos.</p>
        <p>Data de geração: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `
}

// Função para gerar laudo por tipo específico
export function gerarLaudoPorTipo(
  data: LaudoData, 
  tipoAnalise: 'rotina' | 'organica' | 'micronutrientes' | 'enxofre' | 'prem' | 'nitrogenio'
) {
  // Filtrar resultados por tipo
  const resultadosFiltrados = data.resultados.filter(resultado => {
    const tipoMap: Record<string, string[]> = {
      rotina: ['pH', 'P', 'Ca', 'Mg', 'K', 'Na', 'Al', 'H+Al'],
      organica: ['MO'],
      micronutrientes: ['Fe', 'Zn', 'Cu', 'Mn', 'B'],
      enxofre: ['S'],
      prem: ['PREM'],
      nitrogenio: ['N']
    }
    
    return tipoMap[tipoAnalise]?.includes(resultado.tipo) || false
  })
  
  const dataFiltrada = {
    ...data,
    resultados: resultadosFiltrados,
    tipoAnalise
  }
  
  gerarLaudoPDF(dataFiltrada)
}

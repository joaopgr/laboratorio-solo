import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface GerarLaudoData {
  loteId: string
  tipoAnalise?: 'geral' | 'granulometrica' | 'foliar'
}

interface GerarLaudoResponse {
  success: boolean
  arquivo?: string
  caminho?: string
  html?: string | string[]
  tipo?: string
  multiplasPaginas?: boolean
  totalPaginas?: number
  lote?: any
  tipoAnalise?: string
}

export function useGerarLaudo() {
  const { modulo } = useModule()
  
  return useMutation<GerarLaudoResponse, Error, GerarLaudoData>({
    mutationFn: async (data) => {
      const response = await api.post('/laudos/gerar', {
        ...data,
        categoria: modulo
      })
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Laudo gerado com sucesso!')
      
      // Se retornou HTML, gerar PDF no frontend
      if (data.tipo === 'html' && data.html) {
        // Função assíncrona para processar os PDFs
        const processarPDFs = async () => {
          // Verificar se há múltiplas páginas
          const htmlContents: string[] = Array.isArray(data.html) ? data.html : (data.html ? [data.html] : [])
          const clienteNome = data.lote?.clienteNome?.replace(/\s+/g, '_') || 'laudo'
          const codigoAmostra = data.lote?.codigo || 'N/A'
          const tipoSufixo = data.tipoAnalise === 'granulometrica' ? '_Fisica' : (data.lote?.modulo === 'foliar' ? '_Foliar' : '')
          
          // Função auxiliar para gerar PDF de um HTML
          const gerarPDFDeHTML = async (htmlContent: string, paginaNum: number, totalPaginas: number) => {
            return new Promise<void>((resolve, reject) => {
              const tempDiv = document.createElement('div')
              tempDiv.style.position = 'fixed'
              tempDiv.style.left = '-9999px'
              tempDiv.style.width = '210mm'
              tempDiv.style.padding = '10mm'
              tempDiv.innerHTML = htmlContent
              document.body.appendChild(tempDiv)
              
              setTimeout(async () => {
                try {
                  const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: tempDiv.scrollWidth,
                    height: tempDiv.scrollHeight
                  })
                  
                  const pdf = new jsPDF('p', 'mm', 'a4')
                  const imgData = canvas.toDataURL('image/png')
                  
                  const imgWidth = 210
                  const pageHeight = 297
                  const imgHeight = (canvas.height * imgWidth) / canvas.width
                  let heightLeft = imgHeight
                  
                  let position = 0
                  
                  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                  heightLeft -= pageHeight
                  
                  while (heightLeft >= 0) {
                    position = heightLeft - imgHeight
                    pdf.addPage()
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                    heightLeft -= pageHeight
                  }
                  
                  // Nome do arquivo: se múltiplas páginas, adicionar número da página
                  const nomeArquivo = totalPaginas > 1 
                    ? `${clienteNome}_${codigoAmostra}${tipoSufixo}_P${paginaNum}.pdf`
                    : `${clienteNome}_${codigoAmostra}${tipoSufixo}.pdf`
                  
                  pdf.save(nomeArquivo)
                  document.body.removeChild(tempDiv)
                  resolve()
                } catch (error) {
                  document.body.removeChild(tempDiv)
                  reject(error)
                }
              }, 1000)
            })
          }
          
          // Gerar PDFs para cada página
          try {
            for (let i = 0; i < htmlContents.length; i++) {
              await gerarPDFDeHTML(htmlContents[i], i + 1, htmlContents.length)
              // Pequeno delay entre downloads para evitar problemas
              if (i < htmlContents.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500))
              }
            }
            
            if (htmlContents.length > 1) {
              toast.success(`${htmlContents.length} laudos gerados com sucesso!`)
            } else {
              toast.success('Laudo baixado com sucesso!')
            }
          } catch (error) {
            console.error('Erro ao gerar PDF:', error)
            toast.error('Erro ao gerar PDF')
          }
        }
        
        // Executar função assíncrona
        processarPDFs()
      } else if (data.arquivo && data.caminho) {
        // Download automático do PDF (comportamento antigo para compatibilidade)
        const link = document.createElement('a')
        link.href = data.caminho
        link.download = data.arquivo
        link.target = '_blank'
        
        // Adicionar ao DOM temporariamente e clicar
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    onError: (error) => {
      console.error('Erro ao gerar laudo:', error)
      toast.error('Erro ao gerar laudo')
    }
  })
}


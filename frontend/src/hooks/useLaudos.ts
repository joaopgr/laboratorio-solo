import { useMutation } from 'react-query'
import { api } from '../services/api'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface GerarLaudoData {
  loteId: string
  tipoAnalise?: 'geral' | 'granulometrica'
}

interface GerarLaudoResponse {
  success: boolean
  arquivo?: string
  caminho?: string
  html?: string
  tipo?: string
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
        // Criar elemento temporário para renderizar o HTML
        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'fixed'
        tempDiv.style.left = '-9999px'
        tempDiv.style.width = '210mm' // A4 width
        tempDiv.innerHTML = data.html
        document.body.appendChild(tempDiv)
        
        // Aguardar imagens carregarem
        setTimeout(async () => {
          try {
            // Capturar o conteúdo como canvas
            const canvas = await html2canvas(tempDiv, {
              scale: 2,
              useCORS: true,
              logging: false
            })
            
            // Criar PDF
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
            
            // Baixar o PDF
            pdf.save('laudo.pdf')
            
            // Remover elemento temporário
            document.body.removeChild(tempDiv)
            
            toast.success('Laudo baixado com sucesso!')
          } catch (error) {
            console.error('Erro ao gerar PDF:', error)
            // Fallback para impressão
            const printWindow = window.open('', '_blank')
            if (printWindow && data.html) {
              printWindow.document.write(data.html)
              printWindow.document.close()
              setTimeout(() => {
                printWindow.focus()
                printWindow.print()
              }, 250)
            }
            document.body.removeChild(tempDiv)
          }
        }, 1000)
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

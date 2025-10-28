import { useMutation } from 'react-query'
import { api } from '../services/api'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'

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
        // Criar uma nova janela com o HTML
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(data.html)
          printWindow.document.close()
          
          // Aguardar o conteúdo carregar e então imprimir/salvar como PDF
          setTimeout(() => {
            printWindow.focus()
            printWindow.print()
          }, 250)
        }
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

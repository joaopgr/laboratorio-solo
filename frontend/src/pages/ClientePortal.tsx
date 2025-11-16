/*
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Amostra, Cliente, LoteAmostra, Resultado } from '../../../shared/types'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, FileText, MapPin, Phone, Mail } from 'lucide-react'
import { GerarLaudoModal } from '../components/GerarLaudoModal'
import toast from 'react-hot-toast'
import { useModule } from '../contexts/ModuleContext'

interface ClientePerfilResponse {
  cliente: Cliente
  resumo: {
    totalLotes: number
    totalAmostras: number
    totalResultados: number
  }
}

type ClienteLote = LoteAmostra & {
  cliente?: Cliente
  amostras?: (Amostra & { resultados?: Resultado[] })[]
}

export function ClientePortal() {
  const { logout } = useAuth()
  const [loteSelecionado, setLoteSelecionado] = useState<ClienteLote | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [loteExpandido, setLoteExpandido] = useState<string | null>(null)
  const { setModulo } = useModule()

  const perfilQuery = useQuery({
    queryKey: ['portal-cliente', 'perfil'],
    queryFn: async () => {
      const response = await api.get<ClientePerfilResponse>('/portal-cliente/perfil')
      return response.data
    },
  })

  const lotesQuery = useQuery({
    queryKey: ['portal-cliente', 'lotes'],
    queryFn: async () => {
      const response = await api.get<ClienteLote[]>('/portal-cliente/lotes')
      return response.data
    },
  })

  const carregando = perfilQuery.isLoading || lotesQuery.isLoading
  const erro = perfilQuery.isError || lotesQuery.isError

  const handleAbrirLaudo = (lote: ClienteLote) => {
    if (!lote.pago) {
      toast.error('Este lote ainda não está liberado. Aguarde a confirmação de pagamento.')
      return
    }

    if (!lote.amostras || lote.amostras.length === 0) {
      toast.error('Este lote ainda não possui amostras cadastradas.')
      return
    }

    const tipoModulo = (lote.tipoAnalise || lote.modulo || 'solo') === 'foliar' ? 'foliar' : 'solo'
    setModulo(tipoModulo)
    setLoteSelecionado(lote)
    setModalAberto(true)
  }

  const toggleLote = (lote: ClienteLote) => {
    if (!lote.pago) {
      toast.error('Finalize o pagamento para visualizar os detalhes do lote.')
      return
    }

    setLoteExpandido(prev => (prev === lote.id ? null : lote.id))
  }

  const resultadosSelecionados = useMemo(() => {
    if (!loteSelecionado?.amostras) return []
    return loteSelecionado.amostras.flatMap(amostra => amostra.resultados ?? [])
  }, [loteSelecionado])

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (erro || !perfilQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-lg rounded-2xl p-8 text-center space-y-4">
          <p className="text-lg font-semibold text-red-600">
            Não foi possível carregar seus dados agora.
          </p>
          <p className="text-sm text-slate-500">
            Tente novamente em instantes. Caso o problema persista, entre em contato com o laboratório.
          </p>
        </div>
      </div>
    )
  }

  const perfil = perfilQuery.data
  const lotes = lotesQuery.data ?? []

  return (
    <>
      {/* Placeholder temporário - FASE 3 */}
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-lg rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Área em desenvolvimento</h1>
          <p className="text-gray-600">Esta área será implementada na FASE 3 de desenvolvimento.</p>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center px-4 py-2 mt-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </button>
        </div>
      </div>

      {/*
        CONTEÚDO ORIGINAL DO PORTAL DO CLIENTE (DESABILITADO TEMPORARIAMENTE)
        Para reativar, remova este comentário e o bloco de placeholder acima.

        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100"> ... conteúdo original completo ... </div>
      */}
    </>
  )
}
*/

import { useAuth } from '../contexts/AuthContext'
import { LogOut } from 'lucide-react'

export function ClientePortal() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">Área em desenvolvimento</h1>
        <p className="text-gray-600">Esta área será implementada na FASE 3 de desenvolvimento.</p>
        <button
          onClick={logout}
          className="inline-flex items-center justify-center px-4 py-2 mt-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </button>
      </div>
    </div>
  )
}

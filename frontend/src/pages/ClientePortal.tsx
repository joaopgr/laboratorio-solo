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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white/90 backdrop-blur-sm border border-emerald-100 shadow-lg rounded-2xl p-6">
          <div className="space-y-2">
            <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Portal do Cliente</span>
            </span>
            <h1 className="text-3xl font-bold text-slate-900">
              Olá, {perfil.cliente.nome}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Visualize suas amostras, lotes e laudos de forma rápida.
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 text-white rounded-xl shadow-lg text-sm font-medium hover:bg-emerald-700 transition transform hover:-translate-y-0.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-emerald-100 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">CPF</p>
            <p className="text-lg font-semibold text-slate-900">{perfil.cliente.cpf || '-'}</p>
          </div>
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-emerald-100 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Contato</p>
            <div className="space-y-1 text-sm text-slate-700">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>{perfil.cliente.telefone || 'Não informado'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>{perfil.cliente.email || 'Não informado'}</span>
              </div>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-emerald-100 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Localização</p>
            <div className="flex items-center space-x-2 text-sm text-slate-700">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>
                {perfil.cliente.cidade || 'Cidade não informada'} - {perfil.cliente.estado || '--'}
              </span>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-emerald-100 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Resumo Geral</p>
            <div className="space-y-1 text-sm text-slate-700">
              <p><span className="font-semibold text-emerald-600">{perfil.resumo.totalLotes}</span> lotes</p>
              <p><span className="font-semibold text-emerald-600">{perfil.resumo.totalAmostras}</span> amostras</p>
              <p><span className="font-semibold text-emerald-600">{perfil.resumo.totalResultados}</span> resultados</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Seus lotes</h2>
            <p className="text-sm text-slate-500">
              Última atualização em {new Date().toLocaleDateString()}
            </p>
          </div>

          {lotes.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-slate-500">
                Nenhum lote cadastrado até o momento. Assim que o laboratório registrar novas amostras,
                elas aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {lotes.map((lote) => {
                const isFoliar = lote.tipoAnalise === 'foliar' || lote.modulo === 'foliar'
                const isExpanded = loteExpandido === lote.id

                return (
                  <div
                    key={lote.id}
                    className="bg-white/95 backdrop-blur border border-emerald-100 rounded-2xl shadow-lg overflow-hidden transition transform hover:-translate-y-0.5"
                  >
                    <button
                      onClick={() => toggleLote(lote)}
                      className="w-full text-left px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 focus:outline-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Lote {lote.codigo}
                          </h3>
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                              lote.pago
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          >
                            {lote.pago ? 'Pago' : 'Pagamento pendente'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          Status: <span className="font-medium uppercase text-slate-700">{lote.status}</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Data de entrega: {lote.dataEntrega ? new Date(lote.dataEntrega).toLocaleDateString() : 'Não informado'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isFoliar ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                          {lote.tipoAnalise || lote.modulo || 'solo'}
                        </span>
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition ${
                            isExpanded ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-200'
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-emerald-100 bg-emerald-50/60">
                        <div className="px-6 py-5 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <p className="text-sm text-emerald-700 font-semibold">
                              Amostras vinculadas ({lote.amostras?.length ?? 0})
                            </p>
                            <button
                              onClick={() => handleAbrirLaudo(lote)}
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Gerar laudo</span>
                            </button>
                          </div>

                          {lote.amostras && lote.amostras.length > 0 ? (
                            <div className="space-y-3">
                              {lote.amostras.map((amostra) => (
                                <div
                                  key={amostra.id}
                                  className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm"
                                >
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">
                                        Amostra {amostra.codigo} - {amostra.identificacao}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Cultura: {amostra.cultura || 'Não informada'} • Coleta em{' '}
                                        {amostra.dataColeta
                                          ? new Date(amostra.dataColeta).toLocaleDateString()
                                          : 'Data não informada'}
                                      </p>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                      {(amostra.resultados?.filter((r) => r.origem === 'calculado').length) ?? 0} resultados calculados
                                    </span>
                                  </div>

                                  {amostra.resultados && amostra.resultados.length > 0 ? (
                                    <div className="mt-3 overflow-x-auto">
                                      <table className="min-w-full text-xs border border-emerald-100 rounded-lg overflow-hidden">
                                        <thead>
                                          <tr className="bg-emerald-600 text-white text-left uppercase tracking-wide">
                                            <th className="py-2 pr-4 font-semibold">Parâmetro</th>
                                            <th className="py-2 pr-4 font-semibold">Valor</th>
                                            <th className="py-2 pr-4 font-semibold">Unidade</th>
                                            <th className="py-2 pr-4 font-semibold">Origem</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {amostra.resultados
                                            .filter((resultado) => resultado.origem === 'calculado')
                                            .map((resultado) => (
                                              <tr key={resultado.id} className="border-t border-emerald-50">
                                                <td className="py-2 pr-4 text-slate-700 font-medium">{resultado.tipo}</td>
                                                <td className="py-2 pr-4 text-slate-600">
                                                  {resultado.valor && !Number.isNaN(Number(resultado.valor))
                                                    ? Number(resultado.valor).toFixed(2)
                                                    : '-'}
                                                </td>
                                                <td className="py-2 pr-4 text-slate-500">{resultado.unidade ?? '-'}</td>
                                                <td className="py-2 pr-4 text-slate-500 capitalize">{resultado.origem ?? '-'}</td>
                                              </tr>
                                            ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-xs text-slate-500">
                                      Ainda não há resultados calculados para esta amostra.
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              Nenhuma amostra cadastrada para este lote até o momento.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {loteSelecionado && (
        <GerarLaudoModal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          lote={loteSelecionado}
          amostras={loteSelecionado.amostras ?? []}
          resultados={resultadosSelecionados}
        />
      )}
    </div>
  )
}


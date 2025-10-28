import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLoteById, useUpdateLote } from '../hooks/useLotes'
import { useResultados } from '../hooks/useResultados'
import { ArrowLeft, Calendar, Package, User, MapPin, FileText, CheckCircle, Clock, Edit3, DollarSign, Plus, Download, AlertCircle } from 'lucide-react'
import { getAnaliseValues } from '../../../shared/types'
import { AtualizarAmostrasLote } from '../components/AtualizarAmostrasLote'
import { GerarLaudoModal } from '../components/GerarLaudoModal'
import { AdicionarAmostraLoteForm } from '../components/AdicionarAmostraLoteForm'
import toast from 'react-hot-toast'

export function LoteDetails() {
  const { id } = useParams<{ id: string }>()
  
  // Buscar o lote específico por ID (sem filtro de tipo)
  const { data: lote, isLoading } = useLoteById(id || '')
  const updateLote = useUpdateLote()
  
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const [isEditingGlobalInfo, setIsEditingGlobalInfo] = useState(false)
  const [isEditingDesconto, setIsEditingDesconto] = useState(false)
  const [desconto, setDesconto] = useState(lote?.desconto || 0)
  const [isAtualizarLoteOpen, setIsAtualizarLoteOpen] = useState(false)
  const [isGerarLaudoOpen, setIsGerarLaudoOpen] = useState(false)
  const [isAdicionarAmostraOpen, setIsAdicionarAmostraOpen] = useState(false)
  const [globalPropriedade, setGlobalPropriedade] = useState('')
  const [globalSolicitante, setGlobalSolicitante] = useState('')
  
  // Buscar resultados das amostras do lote
  const amostraIds = lote?.amostras?.map(a => a.id) || []
  const { data: resultadosData } = useResultados({ amostraId: amostraIds.join(',') })

  useEffect(() => {
    if (lote?.amostras && lote.amostras.length > 0) {
      // Inicializar valores globais baseados na primeira amostra
      const primeiraAmostra = lote.amostras[0]
      setGlobalPropriedade(primeiraAmostra.propriedade || '')
      setGlobalSolicitante(primeiraAmostra.solicitante || '')
    }
    if (lote?.desconto !== undefined) {
      setDesconto(lote.desconto)
    }
  }, [lote])

  // Calcular valor total do lote
  const calcularValorLote = () => {
    if (!lote || !lote.amostras) return 0
    
    // Obter valores corretos baseados no módulo do lote (modulo é 'solo' ou 'foliar')
    const analiseValues = getAnaliseValues(lote.modulo as 'solo' | 'foliar')
    let valorTotal = 0
    
    // Calcular valor baseado nas amostras individuais
    lote.amostras.forEach(amostra => {
      if (amostra.rotina) valorTotal += analiseValues.rotina
      if (amostra.organica) valorTotal += analiseValues.organica
      if (amostra.micronutrientes) valorTotal += analiseValues.micronutrientes
      if (amostra.enxofre) valorTotal += analiseValues.enxofre
      if (amostra.prem) valorTotal += analiseValues.prem
      if (amostra.nitrogenio) valorTotal += analiseValues.nitrogenio
      if (amostra.granulometria) valorTotal += analiseValues.granulometria
    })
    
    // Aplicar desconto se houver
    const descontoAtual = lote.desconto || 0
    const valorComDesconto = valorTotal * (1 - descontoAtual / 100)
    
    return valorComDesconto
  }

  // Atualizar desconto do lote
  const handleUpdateDesconto = async () => {
    if (!lote) return
    
    try {
      await updateLote.mutateAsync({
        id: lote.id,
        data: { desconto }
      })
      
      setIsEditingDesconto(false)
      toast.success('Desconto atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar desconto:', error)
      toast.error('Erro ao atualizar desconto')
    }
  }

  const handleCancelEditDesconto = () => {
    setDesconto(lote?.desconto || 0)
    setIsEditingDesconto(false)
  }

  // Atualizar status de pagamento
  const handleUpdatePayment = async (pago: boolean) => {
    if (!lote) return
    
    try {
      await updateLote.mutateAsync({
        id: lote.id,
        data: { pago }
      })
      
      setIsEditingPayment(false)
      
      toast.success(pago ? 'Lote marcado como pago!' : 'Lote marcado como pendente!')
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error)
      toast.error('Erro ao atualizar status de pagamento')
    }
  }

  const handleUpdateGlobalInfo = async () => {
    if (!lote || !lote.amostras) return

    try {
      // Atualizar todas as amostras do lote com as novas informações globais
      const promises = lote.amostras.map(amostra => 
        fetch(`/api/amostras/${amostra.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propriedade: globalPropriedade,
            solicitante: globalSolicitante,
          }),
        })
      )

      await Promise.all(promises)
      
      setIsEditingGlobalInfo(false)
      toast.success('Informações globais atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar informações globais:', error)
      toast.error('Erro ao atualizar informações globais')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'em_analise':
        return 'bg-blue-100 text-blue-800'
      case 'concluido':
        return 'bg-green-100 text-green-800'
      case 'pago':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente'
      case 'em_analise':
        return 'Em Análise'
      case 'concluido':
        return 'Concluído'
      case 'pago':
        return 'Pago'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="w-4 h-4" />
      case 'em_analise':
        return <AlertCircle className="w-4 h-4" />
      case 'concluido':
        return <CheckCircle className="w-4 h-4" />
      case 'pago':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!lote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/lotes"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para Lotes
          </Link>
        </div>
        
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lote não encontrado</h2>
          <p className="text-gray-600">O lote solicitado não foi encontrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/lotes"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para Lotes
          </Link>
        </div>
      </div>

      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Detalhes do Lote</h1>
        <p className="text-gray-600 mt-1">Informações completas do lote {lote.codigo}</p>
      </div>

      {/* Informações do Lote */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Básicas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Informações do Lote</h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Código</p>
                    <p className="font-medium text-gray-900">{lote.codigo}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Data de Entrega</p>
                    <p className="font-medium text-gray-900">
                      {new Date(lote.dataEntrega).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {getStatusIcon(lote.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lote.status)}`}>
                      {getStatusText(lote.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Pagamento</p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lote.pago ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {lote.pago ? 'Pago' : 'Pendente'}
                      </span>
                      <button
                        onClick={() => setIsEditingPayment(!isEditingPayment)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Editar status de pagamento"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    {isEditingPayment && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdatePayment(true)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            disabled={updateLote.isLoading}
                          >
                            Marcar como Pago
                          </button>
                          <button
                            onClick={() => handleUpdatePayment(false)}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            disabled={updateLote.isLoading}
                          >
                            Marcar como Pendente
                          </button>
                          <button
                            onClick={() => setIsEditingPayment(false)}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {lote.observacoes && (
                <div className="mt-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Observações</p>
                      <p className="text-gray-900">{lote.observacoes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações Globais */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Informações Globais</h2>
                <button
                  onClick={() => setIsEditingGlobalInfo(!isEditingGlobalInfo)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Editar informações globais"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="card-content">
              {isEditingGlobalInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Propriedade
                      </label>
                      <input
                        type="text"
                        value={globalPropriedade}
                        onChange={(e) => setGlobalPropriedade(e.target.value)}
                        className="input w-full"
                        placeholder="Nome da propriedade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Solicitante
                      </label>
                      <input
                        type="text"
                        value={globalSolicitante}
                        onChange={(e) => setGlobalSolicitante(e.target.value)}
                        className="input w-full"
                        placeholder="Nome do solicitante"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateGlobalInfo}
                      className="btn btn-primary btn-sm"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingGlobalInfo(false)
                        // Resetar valores
                        if (lote?.amostras && lote.amostras.length > 0) {
                          const primeiraAmostra = lote.amostras[0]
                          setGlobalPropriedade(primeiraAmostra.propriedade || '')
                          setGlobalSolicitante(primeiraAmostra.solicitante || '')
                        }
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Propriedade</label>
                    <p className="text-gray-900">{globalPropriedade || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Solicitante</label>
                    <p className="text-gray-900">{globalSolicitante || '-'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tipos de Análise */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Tipos de Análise</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsGerarLaudoOpen(true)}
                    className="btn btn-outline btn-sm flex items-center"
                    disabled={!lote?.amostras || lote.amostras.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Gerar Laudo
                  </button>
                  <button
                    onClick={() => setIsAtualizarLoteOpen(true)}
                    className="btn btn-primary btn-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Tipos
                  </button>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  // Verificar quais tipos de análise existem nas amostras do lote
                  const tiposExistentes = {
                    rotina: false,
                    organica: false,
                    micronutrientes: false,
                    enxofre: false,
                    prem: false,
                    nitrogenio: false,
                    granulometria: false,
                  }
                  
                  // Verificar se pelo menos uma amostra tem cada tipo
                  lote.amostras?.forEach(amostra => {
                    if (amostra.rotina) tiposExistentes.rotina = true
                    if (amostra.organica) tiposExistentes.organica = true
                    if (amostra.micronutrientes) tiposExistentes.micronutrientes = true
                    if (amostra.enxofre) tiposExistentes.enxofre = true
                    if (amostra.prem) tiposExistentes.prem = true
                    if (amostra.nitrogenio) tiposExistentes.nitrogenio = true
                    if (amostra.granulometria) tiposExistentes.granulometria = true
                  })
                  
                  return (
                    <>
                      {tiposExistentes.rotina && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Rotina
                        </span>
                      )}
                      {tiposExistentes.organica && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Matéria Orgânica
                        </span>
                      )}
                      {tiposExistentes.micronutrientes && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          Micronutrientes
                        </span>
                      )}
                      {tiposExistentes.enxofre && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          Enxofre
                        </span>
                      )}
                      {tiposExistentes.prem && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
                          PREM
                        </span>
                      )}
                      {tiposExistentes.nitrogenio && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
                          Nitrogênio
                        </span>
                      )}
                      {tiposExistentes.granulometria && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          Granulométrica
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Cliente</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <Link
                      to={`/clientes/${lote.clienteId}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {lote.cliente?.nome}
                    </Link>
                  </div>
                </div>

                {lote.cliente?.cpf && (
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">CPF</p>
                      <p className="font-medium text-gray-900">{lote.cliente.cpf}</p>
                    </div>
                  </div>
                )}

                {lote.cliente?.cidade && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Cidade</p>
                      <p className="font-medium text-gray-900">{lote.cliente.cidade}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Estatísticas</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total de Amostras</span>
                  <span className="font-semibold text-gray-900">{lote.amostras?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amostras Concluídas</span>
                  <span className="font-semibold text-green-600">
                    {lote.amostras?.filter(a => a.status === 'concluida').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Em Análise</span>
                  <span className="font-semibold text-blue-600">
                    {lote.amostras?.filter(a => a.status === 'em_analise').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pendentes</span>
                  <span className="font-semibold text-yellow-600">
                    {lote.amostras?.filter(a => a.status === 'pendente').length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Valor do Lote */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Valor do Lote</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Valor Total</span>
                  <span className="font-bold text-lg text-green-600">
                    R$ {calcularValorLote().toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                {/* Informações sobre desconto */}
                {lote.desconto && lote.desconto > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-blue-900">Desconto aplicado: {lote.desconto}%</span>
                        {!isEditingDesconto && (
                          <button
                            onClick={() => setIsEditingDesconto(true)}
                            className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <Edit3 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Formulário de edição de desconto */}
                {isEditingDesconto && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Desconto (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={desconto}
                          onChange={(e) => setDesconto(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateDesconto}
                          disabled={updateLote.isLoading}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleCancelEditDesconto}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Botão para adicionar desconto (se não houver desconto) */}
                {(!lote.desconto || lote.desconto === 0) && !isEditingDesconto && (
                  <button
                    onClick={() => setIsEditingDesconto(true)}
                    className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                  >
                    + Adicionar Desconto
                  </button>
                )}
                
                <div className="text-sm text-gray-500">
                  <p>Valor calculado baseado nos tipos de análise:</p>
                  <ul className="mt-1 space-y-1">
                    {lote.rotina && <li>• Rotina: R$ 15,00 por amostra</li>}
                    {lote.organica && <li>• Matéria Orgânica: R$ 10,00 por amostra</li>}
                    {lote.micronutrientes && <li>• Micronutrientes: R$ 20,00 por amostra</li>}
                    {lote.enxofre && <li>• Enxofre: R$ 10,00 por amostra</li>}
                    {lote.prem && <li>• PREM: R$ 12,00 por amostra</li>}
                  </ul>
                  <p className="mt-2">
                    Total: {lote.amostras?.length || 0} amostra(s) × tipos selecionados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Amostras */}
      {lote.amostras && lote.amostras.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Amostras do Lote</h2>
              <button
                onClick={() => setIsAdicionarAmostraOpen(true)}
                className="btn btn-primary btn-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Amostra
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr className="table-row">
                    <th className="table-head">Código</th>
                    <th className="table-head">Identificação</th>
                    <th className="table-head">Cultura</th>
                    <th className="table-head">Localidade</th>
                    <th className="table-head">Propriedade</th>
                    <th className="table-head">Solicitante</th>
                    <th className="table-head">Status</th>
                    <th className="table-head">Ações</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {lote.amostras.map((amostra) => (
                    <tr key={amostra.id} className="table-row">
                      <td className="table-cell font-medium">{amostra.codigo}</td>
                      <td className="table-cell">{amostra.identificacao}</td>
                      <td className="table-cell">{amostra.cultura}</td>
                      <td className="table-cell">{amostra.localidade}</td>
                      <td className="table-cell">{amostra.propriedade || '-'}</td>
                      <td className="table-cell">{amostra.solicitante || '-'}</td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(amostra.status)}`}>
                          {getStatusText(amostra.status)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Link
                          to={`/amostras/${amostra.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Se não há amostras, mostrar card com opção de adicionar */}
      {(!lote.amostras || lote.amostras.length === 0) && (
        <div className="card">
          <div className="card-content text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma amostra encontrada</h3>
            <p className="text-gray-600 mb-6">Este lote ainda não possui amostras cadastradas.</p>
            <button
              onClick={() => setIsAdicionarAmostraOpen(true)}
              className="btn btn-primary flex items-center mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Amostra
            </button>
          </div>
        </div>
      )}

      {/* Modal para atualizar tipos de análise */}
      <AtualizarAmostrasLote
        isOpen={isAtualizarLoteOpen}
        onClose={() => setIsAtualizarLoteOpen(false)}
        loteId={lote?.id}
      />

      {/* Modal para adicionar amostra ao lote */}
      {lote && isAdicionarAmostraOpen && (
        <AdicionarAmostraLoteForm
          loteId={lote.id}
          onSuccess={() => {
            setIsAdicionarAmostraOpen(false)
            // Os dados serão atualizados automaticamente pelo hook useCreateAmostra
          }}
          onCancel={() => setIsAdicionarAmostraOpen(false)}
        />
      )}

      {/* Modal para gerar laudo */}
      {lote && (
        <GerarLaudoModal
          isOpen={isGerarLaudoOpen}
          onClose={() => setIsGerarLaudoOpen(false)}
          lote={lote}
          amostras={lote.amostras || []}
          resultados={resultadosData?.resultados || []}
        />
      )}
    </div>
  )
}

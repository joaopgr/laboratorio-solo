import { useState, useEffect } from 'react'
import { useCreateAmostra, useUpdateAmostra } from '../hooks/useAmostras'
import { useLotes, useCreateLote } from '../hooks/useLotes'
import { useClientes } from '../hooks/useClientes'
import { useModule } from '../contexts/ModuleContext'
import { Amostra, CreateAmostraData, Cliente } from '../../../shared/types'
import { CulturaAutocomplete } from './CulturaAutocomplete'
import { X, Plus, Search, Trash2 } from 'lucide-react'

interface AmostraFormProps {
  amostra?: Amostra
  isOpen: boolean
  onClose: () => void
}

export function AmostraForm({ amostra, isOpen, onClose }: AmostraFormProps) {
  const { modulo } = useModule()
  const [errors, setErrors] = useState<Partial<CreateAmostraData>>({})
  
  // Estados para o novo fluxo simplificado
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [clienteSearch, setClienteSearch] = useState('')
  const [showClienteForm, setShowClienteForm] = useState(false)
  const [amostras, setAmostras] = useState<CreateAmostraData[]>([])
  const [dataCompartilhada, setDataCompartilhada] = useState('')
  const [cidadeCompartilhada, setCidadeCompartilhada] = useState('')
  const [propriedadeCompartilhada, setPropriedadeCompartilhada] = useState('')
  const [solicitanteCompartilhado, setSolicitanteCompartilhado] = useState('')
  
  // Tipos de análise globais (aplicados a todas as amostras)
  const [tiposGlobais, setTiposGlobais] = useState({
    rotina: false,
    organica: false,
    micronutrientes: false,
    enxofre: false,
    prem: false,
    nitrogenio: false,
    granulometria: false,
  })

  const createAmostra = useCreateAmostra()
  const updateAmostra = useUpdateAmostra()
  const { data: lotesData } = useLotes({ limit: 100 })
  const { data: clientesData } = useClientes({ limit: 100, search: clienteSearch })
  const createLote = useCreateLote()

  const isEditing = !!amostra

  // Preencher filtros globais automaticamente para análise foliar
  useEffect(() => {
    if (isOpen && !isEditing && modulo === 'foliar') {
      setTiposGlobais({
        rotina: true,
        organica: false,
        micronutrientes: true,
        enxofre: true,
        prem: false,
        nitrogenio: true,
        granulometria: false,
      })
    } else if (isOpen && !isEditing && modulo === 'solo') {
      setTiposGlobais({
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
      })
    }
  }, [isOpen, isEditing, modulo])

  // Não precisamos mais de currentAmostra, vamos trabalhar diretamente com o array

  // useEffect para carregar dados iniciais quando abrir o formulário
  useEffect(() => {
    if (isEditing && amostra) {
      // Se estiver editando, carregar dados do cliente e lote
      const loteSelecionado = lotesData?.lotes?.find((lote: any) => lote.id === amostra.loteId)
      if (loteSelecionado) {
        setSelectedCliente(loteSelecionado.cliente || null)
      }
      
      // Carregar tipos de análise existentes
      setTiposGlobais({
        rotina: amostra.rotina,
        organica: amostra.organica,
        micronutrientes: amostra.micronutrientes,
        enxofre: amostra.enxofre,
        prem: amostra.prem,
        nitrogenio: amostra.nitrogenio || false,
        granulometria: amostra.granulometria || false,
      })

      // Carregar dados da amostra no array para edição
      setAmostras([{
        codigo: amostra.codigo,
        identificacao: amostra.identificacao,
        cultura: amostra.cultura,
        localidade: amostra.localidade || '',
        propriedade: amostra.propriedade || '',
        solicitante: amostra.solicitante || '',
        dataColeta: amostra.dataColeta || '',
        observacoes: amostra.observacoes || '',
        tipoAnalise: amostra.tipoAnalise,
        rotina: amostra.rotina,
        organica: amostra.organica,
        micronutrientes: amostra.micronutrientes,
        enxofre: amostra.enxofre,
        prem: amostra.prem,
        nitrogenio: amostra.nitrogenio || false,
        granulometria: amostra.granulometria || false,
        foliar: amostra.foliar,
        pago: amostra.pago,
        loteId: amostra.loteId,
      }])

      // Carregar dados compartilhados da amostra
      if (amostra.dataColeta) {
        setDataCompartilhada(amostra.dataColeta.split('T')[0])
      }
      setCidadeCompartilhada(amostra.localidade || '')
      setPropriedadeCompartilhada(amostra.propriedade || '')
      setSolicitanteCompartilhado(amostra.solicitante || '')
    } else if (!isEditing) {
      // Inicializar com uma amostra vazia
      if (amostras.length === 0) {
        const hoje = new Date().toISOString().split('T')[0]
        setDataCompartilhada(hoje)
        setCidadeCompartilhada('')
        setAmostras([{
          codigo: '',
          identificacao: '',
          cultura: '',
          localidade: '',
          propriedade: '',
          solicitante: '',
          dataColeta: `${hoje}T00:00:00.000Z`,
          observacoes: '',
          tipoAnalise: modulo,
          rotina: tiposGlobais.rotina,
          organica: tiposGlobais.organica,
          micronutrientes: tiposGlobais.micronutrientes,
          enxofre: tiposGlobais.enxofre,
          prem: tiposGlobais.prem,
          nitrogenio: tiposGlobais.nitrogenio,
          granulometria: tiposGlobais.granulometria,
          foliar: modulo === 'foliar',
          pago: false,
          loteId: '',
        }])
      }
    }
  }, [isEditing, amostra, lotesData, isOpen])

  // useEffect separado para inicializar amostras vazias quando não está editando
  useEffect(() => {
    if (!isEditing && isOpen) {
      setAmostras(prevAmostras => {
        if (prevAmostras.length === 0) {
          const hoje = new Date().toISOString().split('T')[0]
          setDataCompartilhada(hoje)
          setCidadeCompartilhada('')
          return [{
            codigo: '',
            identificacao: '',
            cultura: '',
            localidade: '',
            propriedade: '',
            solicitante: '',
            dataColeta: `${hoje}T00:00:00.000Z`,
            observacoes: '',
            tipoAnalise: modulo,
            rotina: tiposGlobais.rotina,
            organica: tiposGlobais.organica,
            micronutrientes: tiposGlobais.micronutrientes,
            enxofre: tiposGlobais.enxofre,
            prem: tiposGlobais.prem,
            nitrogenio: tiposGlobais.nitrogenio,
            granulometria: tiposGlobais.granulometria,
            foliar: modulo === 'foliar',
            pago: false,
            loteId: '',
          }]
        }
        return prevAmostras
      })
    }
  }, [isOpen, isEditing, modulo, tiposGlobais])

  // Atualizar solicitante quando cliente for selecionado
  useEffect(() => {
    if (selectedCliente && !isEditing) {
      setSolicitanteCompartilhado(selectedCliente.nome)
      // Atualizar solicitante em todas as amostras usando callback para evitar dependência
      setAmostras(prevAmostras => prevAmostras.map(amostra => ({
        ...amostra,
        solicitante: selectedCliente.nome
      })))
    }
  }, [selectedCliente, isEditing])

  // Atualizar primeira amostra quando tipos globais mudarem (apenas para criação)
  useEffect(() => {
    if (!isEditing) {
      setAmostras(prevAmostras => {
        if (prevAmostras.length === 0) return prevAmostras
        
        return prevAmostras.map((amostra, index) => {
          if (index === 0) {
            // Primeira amostra sempre herda os tipos globais
            return {
              ...amostra,
              rotina: tiposGlobais.rotina,
              organica: tiposGlobais.organica,
              micronutrientes: tiposGlobais.micronutrientes,
              enxofre: tiposGlobais.enxofre,
              prem: tiposGlobais.prem,
              nitrogenio: tiposGlobais.nitrogenio,
            }
          }
          return amostra
        })
      })
    }
  }, [tiposGlobais, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!selectedCliente) {
      alert('Selecione um cliente')
      return
    }

    // Validar todas as amostras
    const newErrors: Partial<CreateAmostraData> = {}
    let temErro = false
    
    for (let i = 0; i < amostras.length; i++) {
      const amostra = amostras[i]
      
      if (!amostra.codigo.trim()) {
        newErrors.codigo = 'Código é obrigatório'
        temErro = true
        break
      }
      if (!amostra.identificacao.trim()) {
        newErrors.identificacao = 'Identificação é obrigatória'
        temErro = true
        break
      }
      if (!amostra.cultura.trim()) {
        newErrors.cultura = 'Cultura é obrigatória'
        temErro = true
        break
      }
      
      // Verificar se pelo menos um tipo de análise foi selecionado
      const tiposValidos = modulo === 'foliar' 
        ? [amostra.rotina, amostra.micronutrientes, amostra.enxofre, amostra.nitrogenio]
        : [amostra.rotina, amostra.organica, amostra.micronutrientes, amostra.enxofre, amostra.prem, amostra.nitrogenio, amostra.granulometria]
      
      if (!tiposValidos.some(tipo => tipo)) {
        newErrors.observacoes = 'Selecione pelo menos um tipo de análise'
        temErro = true
        break
      }
    }

    if (temErro) {
      setErrors(newErrors)
      return
    }

    try {
      if (isEditing) {
        // Modo de edição - atualizar amostra individual
        const amostraData = amostras[0] // Pegar a primeira (e única) amostra do array
        const submitData = {
          codigo: amostraData.codigo,
          identificacao: amostraData.identificacao,
          cultura: amostraData.cultura,
          localidade: amostraData.localidade,
          propriedade: amostraData.propriedade,
          solicitante: amostraData.solicitante,
          dataColeta: amostraData.dataColeta,
          observacoes: amostraData.observacoes,
          tipoAnalise: amostraData.tipoAnalise,
          rotina: amostraData.rotina,
          organica: amostraData.organica,
          micronutrientes: amostraData.micronutrientes,
          enxofre: amostraData.enxofre,
          prem: amostraData.prem,
          nitrogenio: amostraData.nitrogenio,
          granulometria: amostraData.granulometria,
          foliar: amostraData.foliar,
          pago: amostraData.pago,
          loteId: amostraData.loteId,
        }
        await updateAmostra.mutateAsync({ id: amostra!.id, data: submitData })
      } else {
        // Modo de criação - criar lote e amostras
        const loteData = {
          codigo: '', // Será gerado automaticamente pelo backend
          dataEntrega: new Date().toISOString(),
          observacoes: '',
          status: 'pendente' as const,
          pago: false,
          tipoAnalise: modulo,
          rotina: amostras.some(a => a.rotina),
          organica: amostras.some(a => a.organica),
          micronutrientes: amostras.some(a => a.micronutrientes),
          enxofre: amostras.some(a => a.enxofre),
          prem: amostras.some(a => a.prem),
          nitrogenio: amostras.some(a => a.nitrogenio),
          granulometria: amostras.some(a => a.granulometria),
          foliar: amostras.some(a => a.foliar),
          clienteId: selectedCliente.id,
        }


        // Criar lote
        const novoLote = await createLote.mutateAsync(loteData)
        
        // Criar todas as amostras
        for (const amostraData of amostras) {
          const amostraParaEnviar: CreateAmostraData = {
            codigo: amostraData.codigo,
            identificacao: amostraData.identificacao,
            cultura: amostraData.cultura,
            tipoAnalise: amostraData.tipoAnalise,
            rotina: amostraData.rotina || false,
            organica: amostraData.organica || false,
            micronutrientes: amostraData.micronutrientes || false,
            enxofre: amostraData.enxofre || false,
            prem: amostraData.prem || false,
            nitrogenio: amostraData.nitrogenio || false,
            granulometria: amostraData.granulometria || false,
            foliar: amostraData.foliar || false,
            pago: amostraData.pago || false,
            loteId: novoLote.id,
          }
          
          // Adicionar campos opcionais apenas se não estiverem vazios
          if (amostraData.localidade && amostraData.localidade.trim()) {
            amostraParaEnviar.localidade = amostraData.localidade
          }
          if (amostraData.propriedade && amostraData.propriedade.trim()) {
            amostraParaEnviar.propriedade = amostraData.propriedade
          }
          if (amostraData.solicitante && amostraData.solicitante.trim()) {
            amostraParaEnviar.solicitante = amostraData.solicitante
          }
          if (amostraData.dataColeta && amostraData.dataColeta.trim()) {
            amostraParaEnviar.dataColeta = amostraData.dataColeta
          }
          if (amostraData.observacoes && amostraData.observacoes.trim()) {
            amostraParaEnviar.observacoes = amostraData.observacoes
          }
          
          await createAmostra.mutateAsync(amostraParaEnviar)
        }
      }

      onClose()
    } catch (error) {
      console.error('Erro ao salvar amostras:', error)
      console.error('Detalhes do erro:', error)
    }
  }

  const handleClienteSelect = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setClienteSearch('')
  }

  const handleAmostraChange = (index: number, field: keyof CreateAmostraData, value: string | boolean) => {
    // Não permitir alterar tipos inadequados para foliar
    if (modulo === 'foliar' && (field === 'organica' || field === 'prem' || field === 'granulometria')) {
      return
    }
    
    const updatedAmostras = [...amostras]
    updatedAmostras[index] = {
      ...updatedAmostras[index],
      [field]: value
    }
    setAmostras(updatedAmostras)
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAddAmostra = () => {
    const dataComDateTime = dataCompartilhada ? `${dataCompartilhada}T00:00:00.000Z` : ''
    const novaAmostra: CreateAmostraData = {
      codigo: '',
      identificacao: '',
      cultura: '',
      localidade: cidadeCompartilhada,
      propriedade: propriedadeCompartilhada,
      solicitante: solicitanteCompartilhado,
      dataColeta: dataComDateTime,
      observacoes: '',
      tipoAnalise: modulo,
      rotina: tiposGlobais.rotina,
      organica: tiposGlobais.organica,
      micronutrientes: tiposGlobais.micronutrientes,
      enxofre: tiposGlobais.enxofre,
      prem: tiposGlobais.prem,
      nitrogenio: tiposGlobais.nitrogenio,
      granulometria: tiposGlobais.granulometria,
      foliar: modulo === 'foliar',
      pago: false,
      loteId: '',
    }
    setAmostras(prev => [...prev, novaAmostra])
  }

  const handleDataCompartilhadaChange = (novaData: string) => {
    setDataCompartilhada(novaData)
    // Converter data para datetime (adicionar horário)
    const dataComDateTime = novaData ? `${novaData}T00:00:00.000Z` : ''
    // Atualizar data em todas as amostras
    const updatedAmostras = amostras.map(amostra => ({
      ...amostra,
      dataColeta: dataComDateTime
    }))
    setAmostras(updatedAmostras)
  }

  const handleCidadeCompartilhadaChange = (novaCidade: string) => {
    setCidadeCompartilhada(novaCidade)
    // Atualizar localidade em todas as amostras
    const updatedAmostras = amostras.map(amostra => ({
      ...amostra,
      localidade: novaCidade
    }))
    setAmostras(updatedAmostras)
  }

  const handlePropriedadeCompartilhadaChange = (novaPropriedade: string) => {
    setPropriedadeCompartilhada(novaPropriedade)
    // Atualizar propriedade em todas as amostras
    const updatedAmostras = amostras.map(amostra => ({
      ...amostra,
      propriedade: novaPropriedade
    }))
    setAmostras(updatedAmostras)
  }

  const handleSolicitanteCompartilhadoChange = (novoSolicitante: string) => {
    setSolicitanteCompartilhado(novoSolicitante)
    // Atualizar solicitante em todas as amostras
    const updatedAmostras = amostras.map(amostra => ({
      ...amostra,
      solicitante: novoSolicitante
    }))
    setAmostras(updatedAmostras)
  }

  const handleTiposGlobaisChange = (field: keyof typeof tiposGlobais, value: boolean) => {
    // Não permitir alterar tipos inadequados para foliar
    if (modulo === 'foliar' && (field === 'organica' || field === 'prem' || field === 'granulometria')) {
      return
    }
    
    const novosTiposGlobais = {
      ...tiposGlobais,
      [field]: value
    }
    setTiposGlobais(novosTiposGlobais)
    
    // Atualizar todas as amostras existentes com os novos tipos globais
    const updatedAmostras = amostras.map(amostra => ({
      ...amostra,
      rotina: novosTiposGlobais.rotina,
      organica: modulo === 'solo' ? novosTiposGlobais.organica : false,
      micronutrientes: novosTiposGlobais.micronutrientes,
      enxofre: novosTiposGlobais.enxofre,
      prem: modulo === 'solo' ? novosTiposGlobais.prem : false,
      nitrogenio: novosTiposGlobais.nitrogenio,
      granulometria: modulo === 'solo' ? novosTiposGlobais.granulometria : false,
    }))
    setAmostras(updatedAmostras)
  }

  const handleRemoveAmostra = (index: number) => {
    if (amostras.length > 1) {
      const updatedAmostras = amostras.filter((_, i) => i !== index)
      setAmostras(updatedAmostras)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Amostra' : 'Nova Amostra' + (amostras.length > 1 ? ` (${amostras.length} amostras)` : '')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Cabeçalho com Cliente e Data */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Seleção de Cliente */}
            <div className="lg:col-span-2 relative">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Cliente *</h3>
              <div className="relative">
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  className="input w-full pr-10 text-sm"
                  placeholder="Buscar cliente por nome ou CPF..."
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              {clienteSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {clientesData?.clientes?.map((cliente: any) => (
                    <div
                      key={cliente.id}
                      onClick={() => handleClienteSelect(cliente)}
                      className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                    >
                      <div className="font-medium text-gray-900">{cliente.nome}</div>
                      <div className="text-xs text-gray-500">{cliente.cpf}</div>
                    </div>
                  ))}
                  <div
                    onClick={() => setShowClienteForm(true)}
                    className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-blue-600 text-sm"
                  >
                    <Plus className="inline w-3 h-3 mr-1" />
                    Criar novo cliente
                  </div>
                </div>
              )}
              
              {selectedCliente && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <div className="font-medium text-gray-900">{selectedCliente.nome}</div>
                  <div className="text-xs text-gray-500">{selectedCliente.cpf}</div>
                </div>
              )}
            </div>

            {/* Data e Cidade Compartilhadas */}
            {!isEditing && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Data de Coleta (Todas)</h3>
                  <input
                    type="date"
                    value={dataCompartilhada}
                    onChange={(e) => handleDataCompartilhadaChange(e.target.value)}
                    className="input w-full text-sm"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Cidade (Todas)</h3>
                  <input
                    type="text"
                    value={cidadeCompartilhada}
                    onChange={(e) => handleCidadeCompartilhadaChange(e.target.value)}
                    className="input w-full text-sm"
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Propriedade (Todas)</h3>
                  <input
                    type="text"
                    value={propriedadeCompartilhada}
                    onChange={(e) => handlePropriedadeCompartilhadaChange(e.target.value)}
                    className="input w-full text-sm"
                    placeholder="Nome da propriedade"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Solicitante (Todas)</h3>
                  <input
                    type="text"
                    value={solicitanteCompartilhado}
                    onChange={(e) => handleSolicitanteCompartilhadoChange(e.target.value)}
                    className="input w-full text-sm"
                    placeholder="Nome do solicitante"
                  />
                </div>
              </>
            )}
          </div>

          {/* Tipos de Análise Globais */}
          {!isEditing && selectedCliente && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tipos de Análise (Aplicados a Todas as Amostras)</h3>
              <div className="grid grid-cols-6 gap-3">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tiposGlobais.rotina}
                    onChange={(e) => handleTiposGlobaisChange('rotina', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Rotina</span>
                </label>

                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tiposGlobais.micronutrientes}
                    onChange={(e) => handleTiposGlobaisChange('micronutrientes', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Micronutrientes</span>
                </label>

                {modulo === 'solo' && (
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tiposGlobais.organica}
                      onChange={(e) => handleTiposGlobaisChange('organica', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Matéria Orgânica</span>
                  </label>
                )}

                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tiposGlobais.enxofre}
                    onChange={(e) => handleTiposGlobaisChange('enxofre', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enxofre</span>
                </label>

                {modulo === 'solo' && (
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tiposGlobais.prem}
                      onChange={(e) => handleTiposGlobaisChange('prem', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>PREM</span>
                  </label>
                )}

                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tiposGlobais.nitrogenio}
                    onChange={(e) => handleTiposGlobaisChange('nitrogenio', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Nitrogênio</span>
                </label>
              </div>
              
              {modulo === 'solo' && (
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tiposGlobais.granulometria}
                      onChange={(e) => handleTiposGlobaisChange('granulometria', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Granulométrica</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Lista de Amostras */}
          {selectedCliente && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Amostras ({amostras.length})</h3>
              </div>

              {/* Lista vertical de amostras */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {amostras.map((amostra, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-800">
                        Amostra {index + 1}
                      </h4>
                      {amostras.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAmostra(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Grid compacto para dados básicos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Código *
                        </label>
                        <input
                          type="text"
                          value={amostra.codigo}
                          onChange={(e) => handleAmostraChange(index, 'codigo', e.target.value)}
                          className={`input w-full text-sm ${errors.codigo ? 'border-red-500' : ''}`}
                          placeholder="AM001-2024"
                />
                {errors.codigo && (
                  <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>
                )}
              </div>

              <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                  Identificação *
                </label>
                <input
                  type="text"
                          value={amostra.identificacao}
                          onChange={(e) => handleAmostraChange(index, 'identificacao', e.target.value)}
                          className={`input w-full text-sm ${errors.identificacao ? 'border-red-500' : ''}`}
                          placeholder="Solo - Propriedade ABC"
                />
                {errors.identificacao && (
                  <p className="text-red-500 text-xs mt-1">{errors.identificacao}</p>
                )}
              </div>

              <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                  Cultura *
                </label>
                <CulturaAutocomplete
                  value={amostra.cultura}
                  onChange={(value) => handleAmostraChange(index, 'cultura', value)}
                  placeholder="Digite a cultura"
                  className={`input w-full text-sm ${errors.cultura ? 'border-red-500' : ''}`}
                  required
                />
                {errors.cultura && (
                  <p className="text-red-500 text-xs mt-1">{errors.cultura}</p>
                )}
              </div>
              </div>


                    {/* Tipos de Análise */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Tipos de Análise *</h5>
                      <div className="grid grid-cols-5 gap-2">
                        <label className="flex items-center space-x-1 text-xs">
                <input
                  type="checkbox"
                            checked={amostra.rotina || false}
                            onChange={(e) => handleAmostraChange(index, 'rotina', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                          />
                          <span>Rotina</span>
              </label>

                        <label className="flex items-center space-x-1 text-xs">
                <input
                  type="checkbox"
                            checked={amostra.micronutrientes || false}
                            onChange={(e) => handleAmostraChange(index, 'micronutrientes', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                          />
                          <span>Micronutrientes</span>
              </label>

                        {modulo === 'solo' && (
                          <label className="flex items-center space-x-1 text-xs">
                            <input
                              type="checkbox"
                              checked={amostra.organica || false}
                              onChange={(e) => handleAmostraChange(index, 'organica', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                            />
                            <span>Matéria Orgânica</span>
                          </label>
                        )}

                        <label className="flex items-center space-x-1 text-xs">
                <input
                  type="checkbox"
                            checked={amostra.enxofre || false}
                            onChange={(e) => handleAmostraChange(index, 'enxofre', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                          />
                          <span>Enxofre</span>
              </label>

                        {modulo === 'solo' && (
                          <label className="flex items-center space-x-1 text-xs">
                            <input
                              type="checkbox"
                              checked={amostra.prem || false}
                              onChange={(e) => handleAmostraChange(index, 'prem', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                            />
                            <span>PREM</span>
                          </label>
                        )}

                        <label className="flex items-center space-x-1 text-xs">
                <input
                  type="checkbox"
                            checked={amostra.nitrogenio || false}
                            onChange={(e) => handleAmostraChange(index, 'nitrogenio', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                          />
                          <span>Nitrogênio</span>
              </label>

                        {modulo === 'solo' && (
                          <label className="flex items-center space-x-1 text-xs">
                            <input
                              type="checkbox"
                              checked={amostra.granulometria || false}
                              onChange={(e) => handleAmostraChange(index, 'granulometria', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                            />
                            <span>Granulométrica</span>
                          </label>
                        )}
            </div>
            {errors.observacoes && (
              <p className="text-red-500 text-xs mt-1">{errors.observacoes}</p>
            )}
          </div>
                  </div>
                ))}
              </div>

              {/* Botão para adicionar nova amostra */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleAddAmostra}
                  className="px-4 py-2 rounded-md text-sm bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Nova Amostra
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={createAmostra.isPending || updateAmostra.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={createAmostra.isPending || updateAmostra.isPending}
            >
              {createAmostra.isPending || updateAmostra.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                isEditing ? 'Atualizar' : `Salvar ${amostras.length > 1 ? `${amostras.length} Amostras` : 'Amostra'}`
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Criação de Cliente */}
      {showClienteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Novo Cliente</h3>
              <button
                onClick={() => setShowClienteForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Para criar um cliente, acesse a página de Clientes primeiro.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowClienteForm(false)}
                  className="btn btn-primary"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





import React, { useState, useEffect } from 'react'
import { useCreateLote } from '../hooks/useLotes'
import { useCreateAmostra } from '../hooks/useAmostras'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'
import { Plus, X, Trash2 } from 'lucide-react'
import { Cliente, CreateAmostraData } from '../../../shared/types'

interface AmostrasLoteFormProps {
  cliente: Cliente
  isOpen: boolean
  onClose: () => void
}

interface AmostraFormData extends CreateAmostraData {
  id: string
}

export function AmostrasLoteForm({ cliente, isOpen, onClose }: AmostrasLoteFormProps) {
  const [amostras, setAmostras] = useState<AmostraFormData[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const createLote = useCreateLote()
  const createAmostra = useCreateAmostra()
  const { modulo } = useModule()

  // Dados globais que serão aplicados a todas as amostras
  const [dataGlobal, setDataGlobal] = useState('')
  const [cidadeGlobal, setCidadeGlobal] = useState('')
  const [propriedadeGlobal, setPropriedadeGlobal] = useState('')
  const [solicitanteGlobal, setSolicitanteGlobal] = useState('')
  const [tiposGlobais, setTiposGlobais] = useState({
    rotina: false,
    organica: false,
    micronutrientes: false,
    enxofre: false,
    prem: false,
    nitrogenio: false,
  })

  // Limpar amostras quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setAmostras([])
      setErrors({})
      // Resetar dados globais
      const hoje = new Date().toISOString().split('T')[0]
      setDataGlobal(hoje)
      setCidadeGlobal('')
      setPropriedadeGlobal('')
      setSolicitanteGlobal('')
      setTiposGlobais({
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
      })
    } else {
      // Inicializar dados globais quando abrir
      const hoje = new Date().toISOString().split('T')[0]
      setDataGlobal(hoje)
      
      // Para análise foliar, preencher automaticamente os tipos específicos
      if (modulo === 'foliar') {
        setTiposGlobais({
          rotina: true,
          organica: false,
          micronutrientes: true,
          enxofre: true,
          prem: false,
          nitrogenio: true,
        })
      } else {
        setTiposGlobais({
          rotina: false,
          organica: false,
          micronutrientes: false,
          enxofre: false,
          prem: false,
          nitrogenio: false,
        })
      }
    }
  }, [isOpen, modulo])

  // Atualizar solicitante quando o componente abrir (cliente já está definido)
  useEffect(() => {
    if (isOpen && cliente) {
      setSolicitanteGlobal(cliente.nome)
    }
  }, [isOpen, cliente])


  const addAmostra = () => {
    const newId = (amostras.length + 1).toString()
    
    setAmostras(prev => [...prev, {
      id: newId,
      codigo: '', // Campo vazio para o usuário preencher
      identificacao: '',
      cultura: '',
      localidade: cidadeGlobal, // Aplicar cidade global
      propriedade: propriedadeGlobal, // Aplicar propriedade global
      solicitante: solicitanteGlobal, // Aplicar solicitante global
      dataColeta: dataGlobal ? `${dataGlobal}T00:00:00.000Z` : '', // Aplicar data global
      observacoes: '',
      tipoAnalise: modulo,
      rotina: tiposGlobais.rotina, // Aplicar tipos globais
      organica: tiposGlobais.organica,
      micronutrientes: tiposGlobais.micronutrientes,
      enxofre: tiposGlobais.enxofre,
      prem: tiposGlobais.prem,
      nitrogenio: tiposGlobais.nitrogenio,
      granulometria: false,
      foliar: false,
      pago: false,
      loteId: '',
    }])
  }

  const removeAmostra = (id: string) => {
    if (amostras.length > 1) {
      setAmostras(prev => prev.filter(a => a.id !== id))
    }
  }

  const updateAmostra = (id: string, field: keyof AmostraFormData, value: string | boolean) => {
    setAmostras(prev => prev.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ))
  }

  const handleTiposGlobaisChange = (tipo: keyof typeof tiposGlobais, checked: boolean) => {
    setTiposGlobais(prev => ({ ...prev, [tipo]: checked }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar se há amostras para salvar
    if (amostras.length === 0) {
      alert('Adicione pelo menos uma amostra antes de salvar')
      return
    }
    
    const newErrors: Record<string, string> = {}
    
    // Validar dados globais
    if (!dataGlobal.trim()) {
      newErrors['dataGlobal'] = 'Data de coleta é obrigatória'
    }
    if (!cidadeGlobal.trim()) {
      newErrors['cidadeGlobal'] = 'Cidade/Localidade é obrigatória'
    }
    const tiposGlobaisValidos = modulo === 'foliar' 
      ? [tiposGlobais.rotina, tiposGlobais.micronutrientes, tiposGlobais.enxofre, tiposGlobais.nitrogenio]
      : [tiposGlobais.rotina, tiposGlobais.organica, tiposGlobais.micronutrientes, tiposGlobais.enxofre, tiposGlobais.prem, tiposGlobais.nitrogenio]
    
    if (!tiposGlobaisValidos.some(tipo => tipo)) {
      newErrors['tiposGlobais'] = 'Selecione pelo menos um tipo de análise'
    }
    
    // Validar amostras
    amostras.forEach((amostra) => {
      if (!amostra.codigo.trim()) {
        newErrors[`amostra_${amostra.id}_codigo`] = 'Código é obrigatório'
      }
      if (!amostra.identificacao.trim()) {
        newErrors[`amostra_${amostra.id}_identificacao`] = 'Identificação é obrigatória'
      }
      if (!amostra.cultura.trim()) {
        newErrors[`amostra_${amostra.id}_cultura`] = 'Cultura é obrigatória'
      }
      
      // Verificar se pelo menos um tipo de análise foi selecionado
      const tiposValidos = modulo === 'foliar' 
        ? [amostra.rotina, amostra.micronutrientes, amostra.enxofre, amostra.nitrogenio]
        : [amostra.rotina, amostra.organica, amostra.micronutrientes, amostra.enxofre, amostra.prem, amostra.nitrogenio]
      
      if (!tiposValidos.some(tipo => tipo)) {
        newErrors[`amostra_${amostra.id}_tipos`] = 'Selecione pelo menos um tipo de análise'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    try {
      // Dividir amostras em lotes de 11
      const MAX_AMOSTRAS_POR_LOTE = 11
      const lotesAmostras: typeof amostras[] = []
      
      for (let i = 0; i < amostras.length; i += MAX_AMOSTRAS_POR_LOTE) {
        lotesAmostras.push(amostras.slice(i, i + MAX_AMOSTRAS_POR_LOTE))
      }
      
      // Criar um lote para cada grupo de amostras
      for (let loteIndex = 0; loteIndex < lotesAmostras.length; loteIndex++) {
        const amostrasDoLote = lotesAmostras[loteIndex]
        
        // 1. Criar o lote automaticamente
        const loteData = {
          codigo: '', // Será gerado automaticamente pelo backend
          dataEntrega: new Date().toISOString(), // Data atual em formato ISO
          observacoes: lotesAmostras.length > 1 
            ? `Lote gerado automaticamente (${loteIndex + 1}/${lotesAmostras.length})`
            : 'Lote gerado automaticamente',
          status: 'pendente' as const,
          pago: false,
          clienteId: cliente.id,
          tipoAnalise: modulo,
          // Tipos de análise - determinar baseado nas amostras deste lote
          rotina: amostrasDoLote.some(a => a.rotina),
          organica: amostrasDoLote.some(a => a.organica),
          micronutrientes: amostrasDoLote.some(a => a.micronutrientes),
          enxofre: amostrasDoLote.some(a => a.enxofre),
          prem: amostrasDoLote.some(a => a.prem),
          nitrogenio: amostrasDoLote.some(a => a.nitrogenio),
          granulometria: amostrasDoLote.some(a => a.granulometria),
          foliar: amostrasDoLote.some(a => a.foliar),
        }

        const lote = await createLote.mutateAsync(loteData)
        
        // 2. Criar todas as amostras vinculadas ao lote
        const amostrasData = amostrasDoLote.map(amostra => ({
          codigo: amostra.codigo,
          identificacao: amostra.identificacao,
          cultura: amostra.cultura,
          localidade: amostra.localidade || '',
          dataColeta: amostra.dataColeta ? new Date(amostra.dataColeta).toISOString() : undefined,
          observacoes: amostra.observacoes || '',
          tipoAnalise: modulo,
          rotina: amostra.rotina,
          organica: amostra.organica,
          micronutrientes: amostra.micronutrientes,
          enxofre: amostra.enxofre,
          prem: amostra.prem,
          nitrogenio: amostra.nitrogenio,
          granulometria: amostra.granulometria,
          foliar: amostra.foliar,
          pago: amostra.pago,
          loteId: lote.id,
        }))

        for (const amostraData of amostrasData) {
          await createAmostra.mutateAsync(amostraData)
        }
      }
      
      // Mostrar mensagem de sucesso
      if (lotesAmostras.length > 1) {
        toast.success(`${amostras.length} amostra(s) dividida(s) em ${lotesAmostras.length} lote(s) com sucesso!`)
      } else {
        toast.success(`${amostras.length} amostra(s) salva(s) com sucesso!`)
      }
      
      // 3. Limpar formulário e fechar
      setAmostras([{
        id: '1',
        codigo: '',
        identificacao: '',
        cultura: '',
        localidade: '',
        dataColeta: '',
        observacoes: '',
        tipoAnalise: modulo,
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
        foliar: false,
        pago: false,
        loteId: '',
      }])
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Erro ao salvar amostras:', error)
      console.error('Detalhes do erro:', error)
      // Mostrar erro para o usuário
      alert('Erro ao salvar amostras. Verifique o console para mais detalhes.')
    }
  }

  if (!isOpen) return null


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Nova Amostra(s) para {cliente.nome}
            </h2>
            <p className="text-sm text-gray-600">
              Adicione uma ou mais amostras. Um lote será gerado automaticamente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            
            
            {/* Dados Globais */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Dados Globais (aplicados a todas as amostras)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Coleta *
                  </label>
                  <input
                    type="date"
                    value={dataGlobal}
                    onChange={(e) => setDataGlobal(e.target.value)}
                    className={`input w-full ${errors['dataGlobal'] ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors['dataGlobal'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['dataGlobal']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade/Localidade *
                  </label>
                  <input
                    type="text"
                    value={cidadeGlobal}
                    onChange={(e) => setCidadeGlobal(e.target.value)}
                    className={`input w-full ${errors['cidadeGlobal'] ? 'border-red-500' : ''}`}
                    placeholder="Digite a cidade ou localidade"
                    required
                  />
                  {errors['cidadeGlobal'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['cidadeGlobal']}</p>
                  )}
                </div>
              </div>

              {/* Propriedade e Solicitante */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propriedade
                  </label>
                  <input
                    type="text"
                    value={propriedadeGlobal}
                    onChange={(e) => setPropriedadeGlobal(e.target.value)}
                    className="input w-full"
                    placeholder="Nome da propriedade"
                  />
                  <p className="text-xs text-gray-500 mt-1">Aplicado a todas as amostras</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Solicitante
                  </label>
                  <input
                    type="text"
                    value={solicitanteGlobal}
                    onChange={(e) => setSolicitanteGlobal(e.target.value)}
                    className="input w-full"
                    placeholder="Nome do solicitante"
                  />
                  <p className="text-xs text-gray-500 mt-1">Aplicado a todas as amostras</p>
                </div>
              </div>

              {/* Tipos de Análise Globais */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipos de Análise *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
              </div>
              {errors['tiposGlobais'] && (
                <p className="text-red-500 text-xs mt-2">{errors['tiposGlobais']}</p>
              )}
            </div>

            {/* Seção de Amostras */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Amostras ({amostras.length})
                </h3>
                <button
                  type="button"
                  onClick={addAmostra}
                  className="btn btn-outline btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Amostra
                </button>
              </div>

              {amostras.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-gray-500 mb-4">
                    <p>Nenhuma amostra adicionada ainda.</p>
                    <p className="text-sm">Clique em "Adicionar Amostra" para começar.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addAmostra}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Amostra
                  </button>
                </div>
              ) : (
              amostras.map((amostra, index) => (
              <div key={amostra.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    Amostra {index + 1}
                  </h3>
                  {amostras.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAmostra(amostra.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={amostra.codigo}
                      onChange={(e) => updateAmostra(amostra.id, 'codigo', e.target.value)}
                      className={`input w-full ${errors[`amostra_${amostra.id}_codigo`] ? 'border-red-500' : ''}`}
                      placeholder="Digite o código da amostra"
                    />
                    {errors[`amostra_${amostra.id}_codigo`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`amostra_${amostra.id}_codigo`]}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Digite o código da amostra seguindo sua sequência
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identificação *
                    </label>
                    <input
                      type="text"
                      value={amostra.identificacao}
                      onChange={(e) => updateAmostra(amostra.id, 'identificacao', e.target.value)}
                      className="input w-full"
                      placeholder="Identificação da amostra"
                    />
                    {errors[`amostra_${amostra.id}_identificacao`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`amostra_${amostra.id}_identificacao`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cultura *
                    </label>
                    <input
                      type="text"
                      value={amostra.cultura}
                      onChange={(e) => updateAmostra(amostra.id, 'cultura', e.target.value)}
                      className="input w-full"
                      placeholder="Ex: Soja, Milho"
                    />
                    {errors[`amostra_${amostra.id}_cultura`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`amostra_${amostra.id}_cultura`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localidade
                    </label>
                    <input
                      type="text"
                      value={amostra.localidade}
                      onChange={(e) => updateAmostra(amostra.id, 'localidade', e.target.value)}
                      className="input w-full bg-gray-100"
                      placeholder="Herdado dos dados globais"
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Definido nos dados globais acima
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Coleta
                    </label>
                    <input
                      type="date"
                      value={amostra.dataColeta ? amostra.dataColeta.split('T')[0] : ''}
                      className="input w-full bg-gray-100"
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Definida nos dados globais acima
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      value={amostra.observacoes}
                      onChange={(e) => updateAmostra(amostra.id, 'observacoes', e.target.value)}
                      className="input w-full"
                      placeholder="Observações adicionais"
                    />
                  </div>
                </div>

                {/* Checkboxes para tipos de análise */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Análise * (herdados dos dados globais)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { key: 'rotina', label: 'Rotina' },
                      ...(modulo === 'solo' ? [{ key: 'organica', label: 'Matéria Orgânica' }] : []),
                      { key: 'micronutrientes', label: 'Micronutrientes' },
                      { key: 'enxofre', label: 'Enxofre' },
                      ...(modulo === 'solo' ? [{ key: 'prem', label: 'PREM' }] : []),
                      { key: 'nitrogenio', label: 'Nitrogênio' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={amostra[key as keyof AmostraFormData] as boolean}
                          onChange={(e) => updateAmostra(amostra.id, key as keyof AmostraFormData, e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Você pode alterar individualmente se necessário
                  </p>
                  {errors[`amostra_${amostra.id}_tipos`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`amostra_${amostra.id}_tipos`]}</p>
                  )}
                </div>

                {/* Checkbox para pagamento */}
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={amostra.pago}
                      onChange={(e) => updateAmostra(amostra.id, 'pago', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Amostra paga</span>
                  </label>
                </div>
              </div>
              ))
            )}

            {/* Botão para adicionar nova amostra - só aparece quando há amostras */}
            {amostras.length > 0 && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={addAmostra}
                  className="btn btn-outline flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Outra Amostra
                </button>
              </div>
            )}
          </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={amostras.length === 0 || createLote.isPending || createAmostra.isPending}
            >
              {createLote.isPending || createAmostra.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                `Salvar ${amostras.length} Amostra${amostras.length > 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
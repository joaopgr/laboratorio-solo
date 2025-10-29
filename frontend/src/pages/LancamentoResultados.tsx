import React, { useState, useEffect, useMemo } from 'react'
import { useAmostras } from '../hooks/useAmostras'
import { useCreateResultadosLote } from '../hooks/useResultados'
import { useModule } from '../contexts/ModuleContext'
import { CulturaAutocomplete } from '../components/CulturaAutocomplete'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

export function LancamentoResultados() {
  const { modulo: tipoAnalise } = useModule()
  
  // Função para limpar notificações antigas
  const clearOldToasts = () => {
    toast.dismiss()
  }
  
  const [filters, setFilters] = useState({
    search: '',
    codigoInicio: '',
    codigoFim: '',
    cultura: '',
    status: '',
    tipoAnalise: tipoAnalise, // Filtrar por módulo
    limit: 1000 // Aumentar limite para incluir todas as amostras
  })
  
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  
  const [selectedAmostras, setSelectedAmostras] = useState<string[]>([])
  const [tipoResultado, setTipoResultado] = useState('')
  const [valorResultado, setValorResultado] = useState<Record<string, string>>({})
  const [diluicaoResultado, setDiluicaoResultado] = useState<Record<string, string>>({})
  const [massaResultado, setMassaResultado] = useState<Record<string, string>>({})
  const [brancoResultado, setBrancoResultado] = useState<Record<string, string>>({})
  const [alResultado, setAlResultado] = useState<Record<string, string>>({})
  const [hAlResultado, setHAlResultado] = useState<Record<string, string>>({})
  const [paramAResultado, setParamAResultado] = useState<Record<string, string>>({})
  const [paramBResultado, setParamBResultado] = useState<Record<string, string>>({})
  const [paramALote, setParamALote] = useState('')
  const [paramBLote, setParamBLote] = useState('')
  const [brancoLote, setBrancoLote] = useState('')
  const [brancoBLote, setBrancoBLote] = useState('')
  const [brancoNLote, setBrancoNLote] = useState('')
  
  // Estados para campos globais da Determinação F (módulo foliar)
  const [massaTrisR1Lote, setMassaTrisR1Lote] = useState('')
  const [massaTrisR2Lote, setMassaTrisR2Lote] = useState('')
  const [massaTrisR3Lote, setMassaTrisR3Lote] = useState('')
  const [volumeTitR1Lote, setVolumeTitR1Lote] = useState('')
  const [volumeTitR2Lote, setVolumeTitR2Lote] = useState('')
  const [volumeTitR3Lote, setVolumeTitR3Lote] = useState('')
  
  // Estados para campos granulométricos
  const [agrossaResultado, setAgrossaResultado] = useState<Record<string, string>>({})
  const [afinaResultado, setAfinaResultado] = useState<Record<string, string>>({})
  const [silteArgilaResultado, setSilteArgilaResultado] = useState<Record<string, string>>({})
  const [argilaResultado, setArgilaResultado] = useState<Record<string, string>>({})
  const [agrossaPartResultado, setAgrossaPartResultado] = useState<Record<string, string>>({})
  const [afinaPartResultado, setAfinaPartResultado] = useState<Record<string, string>>({})
  const [silteArgilaPartResultado, setSilteArgilaPartResultado] = useState<Record<string, string>>({})
  const [argilaPartResultado, setArgilaPartResultado] = useState<Record<string, string>>({})
  const [tfsaResultado, setTfsaResultado] = useState<Record<string, string>>({})
  const [mlataResultado, setMlataResultado] = useState<Record<string, string>>({})
  const [mlataSuResultado, setMlataSuResultado] = useState<Record<string, string>>({})
  const [mlataSsResultado, setMlataSsResultado] = useState<Record<string, string>>({})
  
  // Estados para campos específicos do módulo foliar
  const [massaBFoliarResultado, setMassaBFoliarResultado] = useState<Record<string, string>>({})
  const [dilBResultado, setDilBResultado] = useState<Record<string, string>>({})
  const [brancoBResultado, setBrancoBResultado] = useState<Record<string, string>>({})
  const [massaNResultado, setMassaNResultado] = useState<Record<string, string>>({})
  const [volumeNResultado, setVolumeNResultado] = useState<Record<string, string>>({})
  const [brancoNResultado, setBrancoNResultado] = useState<Record<string, string>>({})
  const [fatorFResultado, setFatorFResultado] = useState<Record<string, string>>({})
  // const [massaGeralResultado, setMassaGeralResultado] = useState<Record<string, string>>({})
  
  // Estados para campos da Determinação F
  const [massaTrisR1Resultado, setMassaTrisR1Resultado] = useState<Record<string, string>>({})
  const [massaTrisR2Resultado, setMassaTrisR2Resultado] = useState<Record<string, string>>({})
  const [massaTrisR3Resultado, setMassaTrisR3Resultado] = useState<Record<string, string>>({})
  const [volumeTitR1Resultado, setVolumeTitR1Resultado] = useState<Record<string, string>>({})
  const [volumeTitR2Resultado, setVolumeTitR2Resultado] = useState<Record<string, string>>({})
  const [volumeTitR3Resultado, setVolumeTitR3Resultado] = useState<Record<string, string>>({})
  const [dataAnalise, setDataAnalise] = useState(new Date().toISOString().split('T')[0])
  const [observacoes, setObservacoes] = useState('')
  const [amostrasSalvas, setAmostrasSalvas] = useState<Set<string>>(new Set())

  const { data: amostrasData, isLoading, refetch } = useAmostras(filters)

  // Função para calcular o Fator F baseado nos valores da Determinação F
  const calcularFatorF = (amostra: any) => {
    if (!amostra.resultados) {
      return '';
    }
    
    const determinacaoF = amostra.resultados.find((r: any) => r.tipo === 'DETERMINACAO_F');
    
    if (!determinacaoF) {
      return '';
    }
    
    const { massaTrisR1, massaTrisR2, massaTrisR3, volumeTitR1, volumeTitR2, volumeTitR3 } = determinacaoF;
    
    // Verificar se todos os valores necessários estão presentes
    if (!massaTrisR1 || !massaTrisR2 || !massaTrisR3 || !volumeTitR1 || !volumeTitR2 || !volumeTitR3) {
      return '';
    }
    
    try {
      // Cálculo do Fator F conforme especificação:
      // Fator F R1 = (Massa TRIS R1 / 0.12114) * Volume R1 * 0.1
      // Fator F R2 = (Massa TRIS R2 / 0.12114) * Volume R2 * 0.1
      // Fator F R3 = (Massa TRIS R3 / 0.12114) * Volume R3 * 0.1
      // Fator F calculado = média dos fator F R1, R2, R3
      
      const fatorFR1 = (parseFloat(massaTrisR1) / 0.12114) * parseFloat(volumeTitR1) * 0.1;
      const fatorFR2 = (parseFloat(massaTrisR2) / 0.12114) * parseFloat(volumeTitR2) * 0.1;
      const fatorFR3 = (parseFloat(massaTrisR3) / 0.12114) * parseFloat(volumeTitR3) * 0.1;
      
      const fatorFCalculado = (fatorFR1 + fatorFR2 + fatorFR3) / 3;
      
      return fatorFCalculado.toFixed(4);
    } catch (error) {
      console.error('Erro ao calcular Fator F:', error);
      return '';
    }
  };
  
  // Debug dos dados recebidos da API
  useEffect(() => {
    if (amostrasData?.amostras) {
      const amostra03 = amostrasData.amostras.find((a: any) => a.codigo === '03')
      if (amostra03) {
      }
    }
  }, [amostrasData])
  const createResultadosLote = useCreateResultadosLote()

  // Função para converter códigos automaticamente baseado no módulo
  const getCodigoReal = (codigo: string) => {
    if (tipoAnalise === 'foliar' && /^\d+$/.test(codigo)) {
      return `F${codigo}` // Converter número para F1, F2, etc.
    }
    return codigo // Manter como está para módulo solo
  }

  // Função para verificar se todas as amostras CARREGADAS já têm dados lançados
  const verificarSeJaFoiLancado = (tipo: string) => {
    if (!amostrasData?.amostras) {
      return false
    }
    
    // Verificar se TODAS as amostras atualmente carregadas têm dados lançados para este tipo
    const todasTemResultado = amostrasData.amostras.every((amostra: any) => {
      if (!amostra.resultados || amostra.resultados.length === 0) {
        return false
      }
      
      if (tipo === 'H+Al') {
        // Para H+Al, verificar se existe resultado do tipo H+Al
        return amostra.resultados.some((r: any) => r.tipo === 'H+Al')
      } else {
        // Para outros tipos, verificar se existe resultado do tipo específico
        return amostra.resultados.some((r: any) => r.tipo === tipo)
      }
    })
    
    return todasTemResultado
  }


  const tiposResultado = [
    // TODAS AS ANÁLISES
    { value: '', label: 'Todas', categoria: 'Todas', campos: [] },
    
    // ROTINA - pH, Na e H+Al apenas para solo
    ...(tipoAnalise === 'solo' ? [{ value: 'pH', label: 'pH', categoria: 'Rotina', campos: ['valor'] }] : []),
    { value: 'P', label: 'Fósforo (P)', categoria: 'Rotina', campos: ['valor', 'diluicao', 'param_a', 'param_b'] },
    ...(tipoAnalise === 'solo' ? [{ value: 'Na', label: 'Sódio (Na)', categoria: 'Rotina', campos: ['valor', 'diluicao'] }] : []),
    { value: 'K', label: 'Potássio (K)', categoria: 'Rotina', campos: ['valor', 'diluicao'] },
    ...(tipoAnalise === 'solo' ? [{ value: 'H+Al', label: 'H+Al', categoria: 'Rotina', campos: ['al', 'valor', 'branco'] }] : []),
    { value: 'Ca', label: 'Cálcio (Ca)', categoria: 'Rotina', campos: ['valor', 'diluicao'] },
    { value: 'Mg', label: 'Magnésio (Mg)', categoria: 'Rotina', campos: ['valor', 'diluicao'] },
    
    // MICRONUTRIENTES
    { value: 'Fe', label: 'Ferro (Fe)', categoria: 'Micronutrientes', campos: ['valor', 'diluicao'] },
    { value: 'Zn', label: 'Zinco (Zn)', categoria: 'Micronutrientes', campos: ['valor', 'diluicao'] },
    { value: 'Cu', label: 'Cobre (Cu)', categoria: 'Micronutrientes', campos: ['valor', 'diluicao'] },
    { value: 'Mn', label: 'Manganês (Mn)', categoria: 'Micronutrientes', campos: ['valor', 'diluicao'] },
    { value: 'B', label: 'Boro (B)', categoria: 'Micronutrientes', campos: tipoAnalise === 'foliar' ? ['massa_b_foliar', 'valor', 'dil_b', 'branco_b', 'param_a', 'param_b'] : ['valor', 'branco', 'param_a', 'param_b'] },
    
    // MATÉRIA ORGÂNICA - apenas para solo
    ...(tipoAnalise === 'solo' ? [{ value: 'MO', label: 'Matéria Orgânica', categoria: 'Matéria Orgânica', campos: ['valor', 'massa', 'branco'] }] : []),
    
    // PREM - apenas para solo
    ...(tipoAnalise === 'solo' ? [{ value: 'PREM', label: 'PREM', categoria: 'PREM', campos: ['valor', 'diluicao', 'param_a', 'param_b'] }] : []),
    
    // ENXOFRE
    { value: 'S', label: 'Enxofre', categoria: 'Enxofre', campos: tipoAnalise === 'foliar' ? ['valor', 'diluicao', 'branco', 'param_a', 'param_b'] : ['valor', 'branco', 'param_a', 'param_b'] },
    
    // NITROGÊNIO
    { value: 'N', label: 'Nitrogênio (N)', categoria: 'Nitrogênio', campos: tipoAnalise === 'foliar' ? ['massa_n', 'volume_n', 'branco_n', 'fator_f'] : ['valor', 'diluicao', 'param_a', 'param_b'] },
    
    // CAMPOS ESPECÍFICOS DO MÓDULO FOLIAR
    ...(tipoAnalise === 'foliar' ? [
      { value: 'MASSA_GERAL', label: 'Massa Geral', categoria: 'Foliar', campos: ['valor'] },
      { value: 'DETERMINACAO_F', label: 'Determinação F', categoria: 'Foliar', campos: ['massa_tris_r1', 'massa_tris_r2', 'massa_tris_r3', 'volume_tit_r1', 'volume_tit_r2', 'volume_tit_r3'] },
    ] : []),
    
    // GRANULOMÉTRICA - apenas para solo
    ...(tipoAnalise === 'solo' ? [
      { value: 'GRAN_MASSA_RECIPIENTES', label: 'Massa dos Recipientes', categoria: 'Granulométrica', campos: ['agrossa', 'afina', 'silte_argila', 'argila'] },
      { value: 'GRAN_MASSA_RECIPIENTES_PARTICULAS', label: 'Massa dos Recipientes + Partículas', categoria: 'Granulométrica', campos: ['agrossa_part', 'afina_part', 'silte_argila_part', 'argila_part', 'tfsa'] },
      { value: 'GRAN_MASSA_FATOR_F', label: 'Massa para o Fator F', categoria: 'Granulométrica', campos: ['mlata', 'mlata_su', 'mlata_ss'] },
    ] : []),
  ]

  // Filtrar tipos de resultado baseado nas amostras selecionadas
  const tiposResultadoFiltrados = useMemo(() => {
    if (selectedAmostras.length === 0) {
      return tiposResultado
    }

    // Pegar as amostras selecionadas
    const amostrasSelecionadas = amostrasData?.amostras?.filter((a: any) => selectedAmostras.includes(a.id)) || []
    
    if (amostrasSelecionadas.length === 0) {
      return tiposResultado
    }

    // Verificar quais tipos de análise as amostras selecionadas solicitam
    const tiposSolicitados = new Set<string>()
    
    amostrasSelecionadas.forEach((amostra: any) => {
      if (amostra.rotina) tiposSolicitados.add('Rotina')
      if (amostra.micronutrientes) tiposSolicitados.add('Micronutrientes')
      if (amostra.organica) tiposSolicitados.add('Matéria Orgânica')
      if (amostra.prem) tiposSolicitados.add('PREM')
      if (amostra.enxofre) tiposSolicitados.add('Enxofre')
      if (amostra.nitrogenio) tiposSolicitados.add('Nitrogênio')
      if (amostra.granulometria) tiposSolicitados.add('Granulométrica')
      
      // Para módulo foliar, sempre incluir categoria "Foliar"
      if (tipoAnalise === 'foliar') {
        tiposSolicitados.add('Foliar')
      }
    })


    // Filtrar tipos de resultado baseado nos tipos solicitados
    const filtrados = tiposResultado.filter(tipo => {
      if (tipo.value === '') return true // Sempre mostrar "Todas"
      return tiposSolicitados.has(tipo.categoria)
    })

    return filtrados
  }, [selectedAmostras, amostrasData?.amostras])

  // Função para obter os campos necessários para um tipo de análise
  const getCamposNecessarios = (tipo: string) => {
    if (!tipo) return [] // Se não há tipo selecionado, retornar array vazio
    const tipoInfo = tiposResultadoFiltrados.find(t => t.value === tipo)
    return tipoInfo?.campos || ['valor']
  }

  const handleTipoChange = (tipo: string) => {
    setTipoResultado(tipo)
    
    // Limpar notificações antigas antes de mostrar nova
    clearOldToasts()
    
    // Mostrar notificação da mudança
    const tipoInfo = tiposResultado.find(t => t.value === tipo)
    if (tipoInfo) {
      toast.success(`Tipo alterado para: ${tipoInfo.label} (${tipoInfo.categoria})`, {
        id: 'tipo-change',
        duration: 2000
      })
    }
    
    // Limpar todos os valores quando mudar o tipo
    setValorResultado({})
    setDiluicaoResultado({})
    setMassaResultado({})
    setBrancoResultado({})
    setAlResultado({})
    setHAlResultado({})
    setParamAResultado({})
    setParamBResultado({})
    
    // Limpar campos granulométricos
    setAgrossaResultado({})
    setAfinaResultado({})
    setSilteArgilaResultado({})
    setArgilaResultado({})
    setAgrossaPartResultado({})
    setAfinaPartResultado({})
    setSilteArgilaPartResultado({})
    setArgilaPartResultado({})
    setTfsaResultado({})
    setMlataResultado({})
    setMlataSuResultado({})
    setMlataSsResultado({})
    
    // Limpar campos específicos do módulo foliar
    setMassaBFoliarResultado({})
    setDilBResultado({})
    setBrancoBResultado({})
    setMassaNResultado({})
    setVolumeNResultado({})
    setBrancoNResultado({})
    setFatorFResultado({})
    setMassaTrisR1Resultado({})
    setMassaTrisR2Resultado({})
    setMassaTrisR3Resultado({})
    setVolumeTitR1Resultado({})
    setVolumeTitR2Resultado({})
    setVolumeTitR3Resultado({})
    setAmostrasSalvas(new Set())
    
    // Não remover amostras selecionadas automaticamente
    // O filtro será aplicado na exibição das amostras
    
    // Carregar valores existentes para as amostras selecionadas
    loadExistingValues(tipo)
  }

  // Função para carregar valores existentes das amostras
  const loadExistingValues = (tipo: string) => {
    if (!amostrasData?.amostras) return
    
    const newValorResultado: Record<string, string> = {}
    const newDiluicaoResultado: Record<string, string> = {}
    const newMassaResultado: Record<string, string> = {}
    const newBrancoResultado: Record<string, string> = {}
    const newAlResultado: Record<string, string> = {}
    const newHAlResultado: Record<string, string> = {}
    const newParamAResultado: Record<string, string> = {}
    const newParamBResultado: Record<string, string> = {}
    
    // Estados para campos granulométricos
    const newAgrossaResultado: Record<string, string> = {}
    const newAfinaResultado: Record<string, string> = {}
    const newSilteArgilaResultado: Record<string, string> = {}
    const newArgilaResultado: Record<string, string> = {}
    const newAgrossaPartResultado: Record<string, string> = {}
    const newAfinaPartResultado: Record<string, string> = {}
    const newSilteArgilaPartResultado: Record<string, string> = {}
    const newArgilaPartResultado: Record<string, string> = {}
    const newTfsaResultado: Record<string, string> = {}
    const newMlataResultado: Record<string, string> = {}
    const newMlataSuResultado: Record<string, string> = {}
    const newMlataSsResultado: Record<string, string> = {}
    
    // Estados para campos específicos do módulo foliar
    const newMassaBFoliarResultado: Record<string, string> = {}
    const newDilBResultado: Record<string, string> = {}
    const newBrancoBResultado: Record<string, string> = {}
    const newMassaNResultado: Record<string, string> = {}
    const newVolumeNResultado: Record<string, string> = {}
    const newBrancoNResultado: Record<string, string> = {}
    const newFatorFResultado: Record<string, string> = {}
    
    // Estados para campos da Determinação F
    const newMassaTrisR1Resultado: Record<string, string> = {}
    const newMassaTrisR2Resultado: Record<string, string> = {}
    const newMassaTrisR3Resultado: Record<string, string> = {}
    const newVolumeTitR1Resultado: Record<string, string> = {}
    const newVolumeTitR2Resultado: Record<string, string> = {}
    const newVolumeTitR3Resultado: Record<string, string> = {}
    
    amostrasData.amostras.forEach((amostra: any) => {
      if (amostra.resultados && amostra.resultados.length > 0) {
        // Para H+Al, buscar resultado único com todos os campos
        if (tipo === 'H+Al') {
          const resultadoHAl = amostra.resultados.find((r: any) => r.tipo === 'H+Al')
          
          if (resultadoHAl) {
            // Carregar campo AL
            if (resultadoHAl.al && resultadoHAl.al.trim() !== '') {
              newAlResultado[amostra.id] = resultadoHAl.al
            }
            // Carregar campo H+Al (VALOR)
            if (resultadoHAl.h_al && resultadoHAl.h_al.trim() !== '') {
              newHAlResultado[amostra.id] = resultadoHAl.h_al
            }
            // Carregar campo BRANCO
            if (resultadoHAl.branco && resultadoHAl.branco.trim() !== '') {
              newBrancoResultado[amostra.id] = resultadoHAl.branco
            }
          }
        } else {
          // Para outros tipos, buscar resultado existente para o tipo selecionado
          const resultadoExistente = amostra.resultados.find((r: any) => r.tipo === tipo)
          
          if (resultadoExistente) {
            if (resultadoExistente.valor && resultadoExistente.valor.trim() !== '') {
              newValorResultado[amostra.id] = resultadoExistente.valor
            }
            if (resultadoExistente.diluicao && resultadoExistente.diluicao.trim() !== '') {
              newDiluicaoResultado[amostra.id] = resultadoExistente.diluicao
            }
            if (resultadoExistente.massa && resultadoExistente.massa.trim() !== '') {
              newMassaResultado[amostra.id] = resultadoExistente.massa
            }
            if (resultadoExistente.branco && resultadoExistente.branco.trim() !== '') {
              newBrancoResultado[amostra.id] = resultadoExistente.branco
            }
            if (resultadoExistente.param_a && resultadoExistente.param_a.trim() !== '') {
              newParamAResultado[amostra.id] = resultadoExistente.param_a
            }
            if (resultadoExistente.param_b && resultadoExistente.param_b.trim() !== '') {
              newParamBResultado[amostra.id] = resultadoExistente.param_b
            }
            
            // Carregar campos granulométricos
            if (resultadoExistente.massaRecipienteAreiaGrossa !== undefined && resultadoExistente.massaRecipienteAreiaGrossa !== null) {
              newAgrossaResultado[amostra.id] = resultadoExistente.massaRecipienteAreiaGrossa.toString()
            }
            if (resultadoExistente.massaRecipienteAreiaFina !== undefined && resultadoExistente.massaRecipienteAreiaFina !== null) {
              newAfinaResultado[amostra.id] = resultadoExistente.massaRecipienteAreiaFina.toString()
            }
            if (resultadoExistente.massaRecipienteSilteArgila !== undefined && resultadoExistente.massaRecipienteSilteArgila !== null) {
              newSilteArgilaResultado[amostra.id] = resultadoExistente.massaRecipienteSilteArgila.toString()
            }
            if (resultadoExistente.massaRecipienteArgila !== undefined && resultadoExistente.massaRecipienteArgila !== null) {
              newArgilaResultado[amostra.id] = resultadoExistente.massaRecipienteArgila.toString()
            }
            if (resultadoExistente.massaRecipientePartAreiaGrossa !== undefined && resultadoExistente.massaRecipientePartAreiaGrossa !== null) {
              newAgrossaPartResultado[amostra.id] = resultadoExistente.massaRecipientePartAreiaGrossa.toString()
            }
            if (resultadoExistente.massaRecipientePartAreiaFina !== undefined && resultadoExistente.massaRecipientePartAreiaFina !== null) {
              newAfinaPartResultado[amostra.id] = resultadoExistente.massaRecipientePartAreiaFina.toString()
            }
            if (resultadoExistente.massaRecipientePartSilteArgila !== undefined && resultadoExistente.massaRecipientePartSilteArgila !== null) {
              newSilteArgilaPartResultado[amostra.id] = resultadoExistente.massaRecipientePartSilteArgila.toString()
            }
            if (resultadoExistente.massaRecipientePartArgila !== undefined && resultadoExistente.massaRecipientePartArgila !== null) {
              newArgilaPartResultado[amostra.id] = resultadoExistente.massaRecipientePartArgila.toString()
            }
            if (resultadoExistente.tfsa !== undefined && resultadoExistente.tfsa !== null) {
              newTfsaResultado[amostra.id] = resultadoExistente.tfsa.toString()
            }
            if (resultadoExistente.massaLata !== undefined && resultadoExistente.massaLata !== null) {
              newMlataResultado[amostra.id] = resultadoExistente.massaLata.toString()
            }
            if (resultadoExistente.massaLataSu !== undefined && resultadoExistente.massaLataSu !== null) {
              newMlataSuResultado[amostra.id] = resultadoExistente.massaLataSu.toString()
            }
            if (resultadoExistente.massaLataSs !== undefined && resultadoExistente.massaLataSs !== null) {
              newMlataSsResultado[amostra.id] = resultadoExistente.massaLataSs.toString()
            }
            
            // Carregar campos específicos do módulo foliar
            if (resultadoExistente.massaBFoliar !== undefined && resultadoExistente.massaBFoliar !== null) {
              newMassaBFoliarResultado[amostra.id] = resultadoExistente.massaBFoliar.toString()
            }
            if (resultadoExistente.diluicaoBFoliar !== undefined && resultadoExistente.diluicaoBFoliar !== null) {
              newDilBResultado[amostra.id] = resultadoExistente.diluicaoBFoliar.toString()
            }
            if (resultadoExistente.brancoBFoliar !== undefined && resultadoExistente.brancoBFoliar !== null) {
              newBrancoBResultado[amostra.id] = resultadoExistente.brancoBFoliar.toString()
            }
            if (resultadoExistente.massaN !== undefined && resultadoExistente.massaN !== null) {
              newMassaNResultado[amostra.id] = resultadoExistente.massaN.toString()
            }
            if (resultadoExistente.volumeN !== undefined && resultadoExistente.volumeN !== null) {
              newVolumeNResultado[amostra.id] = resultadoExistente.volumeN.toString()
            }
            if (resultadoExistente.brancoN !== undefined && resultadoExistente.brancoN !== null) {
              newBrancoNResultado[amostra.id] = resultadoExistente.brancoN.toString()
            }
            if (resultadoExistente.fatorF !== undefined && resultadoExistente.fatorF !== null) {
              newFatorFResultado[amostra.id] = resultadoExistente.fatorF.toString()
            }
            // if (resultadoExistente.massaGeral !== undefined && resultadoExistente.massaGeral !== null) {
            //   newMassaGeralResultado[amostra.id] = resultadoExistente.massaGeral.toString()
            // }
            
            // Carregar campos da Determinação F
            if (resultadoExistente.massaTrisR1 !== undefined && resultadoExistente.massaTrisR1 !== null) {
              newMassaTrisR1Resultado[amostra.id] = resultadoExistente.massaTrisR1.toString()
            }
            if (resultadoExistente.massaTrisR2 !== undefined && resultadoExistente.massaTrisR2 !== null) {
              newMassaTrisR2Resultado[amostra.id] = resultadoExistente.massaTrisR2.toString()
            }
            if (resultadoExistente.massaTrisR3 !== undefined && resultadoExistente.massaTrisR3 !== null) {
              newMassaTrisR3Resultado[amostra.id] = resultadoExistente.massaTrisR3.toString()
            }
            if (resultadoExistente.volumeTitR1 !== undefined && resultadoExistente.volumeTitR1 !== null) {
              newVolumeTitR1Resultado[amostra.id] = resultadoExistente.volumeTitR1.toString()
            }
            if (resultadoExistente.volumeTitR2 !== undefined && resultadoExistente.volumeTitR2 !== null) {
              newVolumeTitR2Resultado[amostra.id] = resultadoExistente.volumeTitR2.toString()
            }
            if (resultadoExistente.volumeTitR3 !== undefined && resultadoExistente.volumeTitR3 !== null) {
              newVolumeTitR3Resultado[amostra.id] = resultadoExistente.volumeTitR3.toString()
            }
          }
        }
      }
    })
    
    setValorResultado(newValorResultado)
    setDiluicaoResultado(newDiluicaoResultado)
    setMassaResultado(newMassaResultado)
    setBrancoResultado(newBrancoResultado)
    setAlResultado(newAlResultado)
    setHAlResultado(newHAlResultado)
    setParamAResultado(newParamAResultado)
    setParamBResultado(newParamBResultado)
    
    // Atualizar estados dos campos granulométricos
    setAgrossaResultado(newAgrossaResultado)
    setAfinaResultado(newAfinaResultado)
    setSilteArgilaResultado(newSilteArgilaResultado)
    setArgilaResultado(newArgilaResultado)
    setAgrossaPartResultado(newAgrossaPartResultado)
    setAfinaPartResultado(newAfinaPartResultado)
    setSilteArgilaPartResultado(newSilteArgilaPartResultado)
    setArgilaPartResultado(newArgilaPartResultado)
    setTfsaResultado(newTfsaResultado)
    setMlataResultado(newMlataResultado)
    setMlataSuResultado(newMlataSuResultado)
    setMlataSsResultado(newMlataSsResultado)
    
    // Atualizar estados dos campos específicos do módulo foliar
    setMassaBFoliarResultado(newMassaBFoliarResultado)
    setDilBResultado(newDilBResultado)
    setBrancoBResultado(newBrancoBResultado)
    setMassaNResultado(newMassaNResultado)
    setVolumeNResultado(newVolumeNResultado)
    setBrancoNResultado(newBrancoNResultado)
    setFatorFResultado(newFatorFResultado)
    
    // Atualizar estados dos campos da Determinação F
    setMassaTrisR1Resultado(newMassaTrisR1Resultado)
    setMassaTrisR2Resultado(newMassaTrisR2Resultado)
    setMassaTrisR3Resultado(newMassaTrisR3Resultado)
    setVolumeTitR1Resultado(newVolumeTitR1Resultado)
    setVolumeTitR2Resultado(newVolumeTitR2Resultado)
    setVolumeTitR3Resultado(newVolumeTitR3Resultado)
  }

  // Carregar valores existentes quando as amostras mudarem
  useEffect(() => {
    if (amostrasData?.amostras && tipoResultado) {
      loadExistingValues(tipoResultado)
    }
  }, [amostrasData?.amostras, tipoResultado])

  // Preencher valores padrão de diluição quando tipo de resultado muda
  useEffect(() => {
    if (!tipoResultado) return
    
    const diluicoesPadrao: Record<string, Record<string, string>> = {
      solo: {
        'P': '20',
        'Na': '10',
        'K': '10',
        'Ca': '1',
        'Mg': '1',
        'PREM': '102',
        'Fe': '10',
        'Cu': '10',
        'Zn': '10',
        'Mn': '10'
      },
      foliar: {
        'P': '2',
        'K': '1',
        'Ca': '1',
        'Mg': '1',
        'S': '1',
        'Fe': '1',
        'Cu': '1',
        'Zn': '1',
        'Mn': '1',
        'B': '1'
      }
    }
    
    const diluicaoPadrao = diluicoesPadrao[tipoAnalise]?.[tipoResultado]
    if (diluicaoPadrao && amostrasData?.amostras) {
      // Preencher diluição padrão para todas as amostras que solicitam este tipo
      const novaDiluicao: Record<string, string> = {}
      const novaDilB: Record<string, string> = {}
      
      amostrasData.amostras.forEach((amostra: any) => {
        // Verificar se a amostra solicita este tipo de análise
        if (amostraSolicitaAnalise(amostra, tipoResultado)) {
          novaDiluicao[amostra.id] = diluicaoPadrao
          
          // Para Boro no módulo foliar, usar campo específico
          if (tipoResultado === 'B' && tipoAnalise === 'foliar') {
            novaDilB[amostra.id] = diluicaoPadrao
          }
        }
      })
      
      if (Object.keys(novaDiluicao).length > 0) {
        setDiluicaoResultado(novaDiluicao)
      }
      
      if (Object.keys(novaDilB).length > 0) {
        setDilBResultado(novaDilB)
      }
    }
  }, [tipoResultado, amostrasData?.amostras, tipoAnalise])

  // Calcular Fator F automaticamente quando selecionar Nitrogênio
  useEffect(() => {
    if (tipoResultado === 'N' && amostrasData?.amostras) {
      const newFatorFResultado: Record<string, string> = {}
      
      amostrasData.amostras.forEach((amostra: any) => {
        const fatorFCalculado = calcularFatorF(amostra)
        if (fatorFCalculado) {
          newFatorFResultado[amostra.id] = fatorFCalculado
        }
      })
      
      setFatorFResultado(newFatorFResultado)
    }
  }, [tipoResultado, amostrasData?.amostras])

  const handleSelectAmostra = (amostraId: string) => {
    setSelectedAmostras(prev => 
      prev.includes(amostraId) 
        ? prev.filter(id => id !== amostraId)
        : [...prev, amostraId]
    )
  }

  const handleSelectAll = () => {
    // Se há um tipo de análise selecionado, filtrar apenas amostras que solicitam esse tipo
    let amostrasParaSelecionar = amostrasParaExibir
    
    if (tipoResultado && tipoResultado !== '') {
      amostrasParaSelecionar = amostrasParaExibir.filter((amostra: any) => 
        amostraSolicitaAnalise(amostra, tipoResultado)
      )
    }
    
    const amostrasVisiveis = amostrasParaSelecionar.map((a: any) => a.id)
    const todasSelecionadas = amostrasVisiveis.every((id: string) => selectedAmostras.includes(id))
    
    if (todasSelecionadas) {
      // Desmarcar todas as amostras visíveis
      setSelectedAmostras(prev => prev.filter((id: string) => !amostrasVisiveis.includes(id)))
    } else {
      // Marcar todas as amostras visíveis
      setSelectedAmostras(prev => [...new Set([...prev, ...amostrasVisiveis])])
    }
    
    // Mostrar notificação se há filtro aplicado
    if (tipoResultado && tipoResultado !== '' && amostrasParaSelecionar.length < amostrasParaExibir.length) {
      const filtradas = amostrasParaExibir.length - amostrasParaSelecionar.length
      toast.success(`${filtradas} amostra(s) não selecionada(s) (não solicitam ${tiposResultado.find(t => t.value === tipoResultado)?.label || tipoResultado})`, {
        id: 'filter-applied',
        duration: 3000
      })
    }
  }

  const handleSelectRange = () => {
    if (!filters.codigoInicio || !filters.codigoFim) {
      toast.error('Selecione o intervalo de códigos')
      return
    }

    const inicio = getCodigoReal(filters.codigoInicio)
    const fim = getCodigoReal(filters.codigoFim)
    
    // Para códigos numéricos, usar comparação numérica
    if (/^\d+$/.test(inicio) && /^\d+$/.test(fim)) {
      if (parseInt(inicio) > parseInt(fim)) {
        toast.error('Código inicial deve ser menor que o final')
        return
      }
    } else {
      // Para códigos alfanuméricos (como F1, F2), extrair números e comparar numericamente
      if (/^F\d+$/.test(inicio) && /^F\d+$/.test(fim)) {
        const inicioNum = parseInt(inicio.replace('F', ''))
        const fimNum = parseInt(fim.replace('F', ''))
        if (inicioNum > fimNum) {
          toast.error('Código inicial deve ser menor que o final')
          return
        }
      } else {
        // Para outros códigos alfanuméricos, usar comparação de strings
        if (inicio > fim) {
          toast.error('Código inicial deve ser menor que o final')
          return
        }
      }
    }

    const amostrasNoRange = amostrasData?.amostras.filter((amostra: any) => {
      const codigo = amostra.codigo
      
      // Para códigos numéricos, usar comparação numérica
      if (/^\d+$/.test(codigo) && /^\d+$/.test(inicio) && /^\d+$/.test(fim)) {
        const codigoNum = parseInt(codigo)
        const inicioNum = parseInt(inicio)
        const fimNum = parseInt(fim)
        // Incluir explicitamente amostras com zero à esquerda (01-06)
        const codigosComZero = ['01', '02', '03', '04', '05', '06']
        return (codigoNum >= inicioNum && codigoNum <= fimNum) || codigosComZero.includes(codigo)
      }
      
      // Para códigos alfanuméricos (como F1, F2), usar comparação numérica
      if (/^F\d+$/.test(codigo) && /^F\d+$/.test(inicio) && /^F\d+$/.test(fim)) {
        const codigoNum = parseInt(codigo.replace('F', ''))
        const inicioNum = parseInt(inicio.replace('F', ''))
        const fimNum = parseInt(fim.replace('F', ''))
        return codigoNum >= inicioNum && codigoNum <= fimNum
      }
      
      // Para outros códigos alfanuméricos, usar comparação de strings
      return codigo >= inicio && codigo <= fim
    }) || []

    setSelectedAmostras(amostrasNoRange.map((a: any) => a.id))
    setShowOnlySelected(true)
    toast.success(`${amostrasNoRange.length} amostras selecionadas`)
  }

  const handleValorChange = (amostraId: string, valor: string) => {
    setValorResultado(prev => ({
      ...prev,
      [amostraId]: valor
    }))
  }

  const handleDiluicaoChange = (amostraId: string, valor: string) => {
    setDiluicaoResultado(prev => ({
      ...prev,
      [amostraId]: valor
    }))
  }

  const handleMassaChange = (amostraId: string, valor: string) => {
    setMassaResultado(prev => ({
      ...prev,
      [amostraId]: valor
    }))
  }

  // Handlers para campos granulométricos
  const handleAgrossaChange = (amostraId: string, valor: string) => {
    setAgrossaResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleAfinaChange = (amostraId: string, valor: string) => {
    setAfinaResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleSilteArgilaChange = (amostraId: string, valor: string) => {
    setSilteArgilaResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleArgilaChange = (amostraId: string, valor: string) => {
    setArgilaResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleAgrossaPartChange = (amostraId: string, valor: string) => {
    setAgrossaPartResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleAfinaPartChange = (amostraId: string, valor: string) => {
    setAfinaPartResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleSilteArgilaPartChange = (amostraId: string, valor: string) => {
    setSilteArgilaPartResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleArgilaPartChange = (amostraId: string, valor: string) => {
    setArgilaPartResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleTfsaChange = (amostraId: string, valor: string) => {
    setTfsaResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleMlataChange = (amostraId: string, valor: string) => {
    setMlataResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleMlataSuChange = (amostraId: string, valor: string) => {
    setMlataSuResultado(prev => ({ ...prev, [amostraId]: valor }))
  }
  const handleMlataSsChange = (amostraId: string, valor: string) => {
    setMlataSsResultado(prev => ({ ...prev, [amostraId]: valor }))
  }

  const handleBrancoChange = (amostraId: string, valor: string) => {
    setBrancoResultado(prev => ({
      ...prev,
      [amostraId]: valor
    }))
  }

  const handleAlChange = (amostraId: string, valor: string) => {
    setAlResultado(prev => {
      const novoEstado = {
        ...prev,
        [amostraId]: valor
      }
      return novoEstado
    })
  }

  const handleHAlChange = (amostraId: string, valor: string) => {
    setHAlResultado(prev => {
      const novoEstado = {
        ...prev,
        [amostraId]: valor
      }
      return novoEstado
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number, fieldType: 'valor' | 'diluicao' | 'massa' | 'branco') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // Navegar verticalmente para o mesmo tipo de campo na próxima amostra
      const nextIndex = currentIndex + 1
      const nextInput = document.querySelector(`input[data-index="${nextIndex}"][data-field="${fieldType}"]`) as HTMLInputElement
      
      if (nextInput) {
        // Se existe o mesmo tipo de campo na próxima amostra, ir para ele
        nextInput.focus()
        nextInput.select()
      } else {
        // Se não existe próxima amostra com esse campo, ir para o próximo tipo de campo na mesma linha
        const campos = getCamposNecessarios(tipoResultado)
        const currentFieldIndex = campos.indexOf(fieldType)
        const nextField = campos[currentFieldIndex + 1]
        
        if (nextField) {
          const nextFieldInput = document.querySelector(`input[data-index="${currentIndex}"][data-field="${nextField}"]`) as HTMLInputElement
          if (nextFieldInput) {
            nextFieldInput.focus()
            nextFieldInput.select()
          }
        } else {
          // Se não há mais campos na linha, ir para o primeiro campo da próxima amostra
          const firstField = campos[0]
          const firstFieldInput = document.querySelector(`input[data-index="${nextIndex}"][data-field="${firstField}"]`) as HTMLInputElement
          if (firstFieldInput) {
            firstFieldInput.focus()
            firstFieldInput.select()
          }
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpar notificações antigas
    clearOldToasts()
    
    const amostrasValidas = selectedAmostras.filter((id: string) => amostrasParaExibir.some((a: any) => a.id === id))
    
    if (amostrasValidas.length === 0) {
      toast.error('Selecione pelo menos uma amostra que solicita este tipo de análise', {
        id: 'no-samples-error'
      })
      return
    }

    if (!tipoResultado) {
      toast.error('Selecione o tipo do resultado', {
        id: 'no-type-error'
      })
      return
    }

    // Verificar se pelo menos uma amostra tem valores preenchidos
    const campos = getCamposNecessarios(tipoResultado)
    let temAlgumValor = false
    
    for (const amostraId of amostrasValidas) {
    for (const campo of campos) {
        let valor: string | undefined
      
      switch (campo) {
        case 'valor':
            valor = valorResultado[amostraId]?.trim()
          break
        case 'diluicao':
            valor = diluicaoResultado[amostraId]?.trim()
          break
        case 'massa':
            valor = massaResultado[amostraId]?.trim()
          break
        case 'branco':
            valor = brancoResultado[amostraId]?.trim()
            break
          case 'al':
            valor = alResultado[amostraId]?.trim()
            break
          case 'h_al':
            valor = hAlResultado[amostraId]?.trim()
            break
          case 'param_a':
            valor = paramAResultado[amostraId]?.trim()
            break
          case 'param_b':
            valor = paramBResultado[amostraId]?.trim()
          break
        // Campos granulométricos
        case 'agrossa':
          valor = agrossaResultado[amostraId]?.trim()
          break
        case 'afina':
          valor = afinaResultado[amostraId]?.trim()
          break
        case 'silte_argila':
          valor = silteArgilaResultado[amostraId]?.trim()
          break
        case 'argila':
          valor = argilaResultado[amostraId]?.trim()
          break
        case 'agrossa_part':
          valor = agrossaPartResultado[amostraId]?.trim()
          break
        case 'afina_part':
          valor = afinaPartResultado[amostraId]?.trim()
          break
        case 'silte_argila_part':
          valor = silteArgilaPartResultado[amostraId]?.trim()
          break
        case 'argila_part':
          valor = argilaPartResultado[amostraId]?.trim()
          break
        case 'tfsa':
          valor = tfsaResultado[amostraId]?.trim()
          break
        case 'mlata':
          valor = mlataResultado[amostraId]?.trim()
          break
        case 'mlata_su':
          valor = mlataSuResultado[amostraId]?.trim()
          break
        case 'mlata_ss':
          valor = mlataSsResultado[amostraId]?.trim()
          break
        // Campos específicos do módulo foliar
        case 'massa_n':
          valor = massaNResultado[amostraId]?.trim()
          break
        case 'volume_n':
          valor = volumeNResultado[amostraId]?.trim()
          break
        case 'branco_n':
          valor = brancoNResultado[amostraId]?.trim()
          break
        case 'fator_f':
          valor = fatorFResultado[amostraId]?.trim()
          break
        case 'massa_tris_r1':
          valor = massaTrisR1Resultado[amostraId]?.trim()
          break
        case 'massa_tris_r2':
          valor = massaTrisR2Resultado[amostraId]?.trim()
          break
        case 'massa_tris_r3':
          valor = massaTrisR3Resultado[amostraId]?.trim()
          break
        case 'volume_tit_r1':
          valor = volumeTitR1Resultado[amostraId]?.trim()
          break
        case 'volume_tit_r2':
          valor = volumeTitR2Resultado[amostraId]?.trim()
          break
        case 'volume_tit_r3':
          valor = volumeTitR3Resultado[amostraId]?.trim()
          break
      }
      
        // Para campos A e B, aceitar qualquer valor (incluindo vazios)
        if (campo === 'param_a' || campo === 'param_b') {
          // Aceitar qualquer valor, incluindo strings vazias
          temAlgumValor = true
          break
        } else {
          // Para outros campos, validar se é um número válido
          if (valor && valor.trim() !== '' && !isNaN(parseFloat(valor.replace(',', '.')))) {
            temAlgumValor = true
            break
          }
        }
      }
      if (temAlgumValor) break
    }
    
    if (!temAlgumValor) {
      toast.error('Preencha pelo menos um valor para as amostras selecionadas', {
        id: 'no-values-error'
      })
      return
    }

    try {
      
      let resultados: any[] = []
      
      if (tipoResultado === 'H+Al') {
        // Para H+Al, criar um resultado único com todos os campos
        resultados = amostrasValidas
          .map(amostraId => {
            const valorAl = alResultado[amostraId]?.trim()
            const valorHAl = hAlResultado[amostraId]?.trim()
            const valorBranco = brancoResultado[amostraId]?.trim()
            
            
            return {
              amostraId,
              tipo: 'H+Al',
              valor: valorHAl || valorAl || valorBranco || '', // Campo "valor" deve ter algum valor válido
              al: valorAl || '',
              h_al: valorHAl || '',
              branco: valorBranco || '',
              dataAnalise: new Date(dataAnalise).toISOString(),
              observacoes: observacoes || undefined,
            }
          })
          .filter(resultado => {
            const temAl = resultado.al && resultado.al.trim() !== '' && !isNaN(parseFloat(resultado.al.replace(',', '.')))
            const temHAl = resultado.h_al && resultado.h_al.trim() !== '' && !isNaN(parseFloat(resultado.h_al.replace(',', '.')))
            const temBranco = resultado.branco && resultado.branco.trim() !== '' && !isNaN(parseFloat(resultado.branco.replace(',', '.')))
            
            
            return temAl || temHAl || temBranco
          })
      } else {
        // Para outros tipos
        resultados = amostrasValidas
          .map(amostraId => {
        const resultado: any = {
          amostraId,
          tipo: tipoResultado,
          categoria: tipoAnalise, // Adicionar categoria baseada no módulo
              valor: valorResultado[amostraId]?.trim() || undefined,
          dataAnalise: new Date(dataAnalise).toISOString(),
          observacoes: observacoes || undefined,
        }

        // Adicionar campos específicos baseado no tipo de análise
        if (campos.includes('diluicao')) {
              resultado.diluicao = diluicaoResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('massa')) {
              resultado.massa = massaResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('massa_b_foliar')) {
              resultado.massaBFoliar = massaBFoliarResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('dil_b')) {
              resultado.dilB = dilBResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('branco_b')) {
              resultado.brancoB = brancoBResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('branco')) {
              resultado.branco = brancoResultado[amostraId]?.trim() || undefined
            }
        if (campos.includes('al')) {
              resultado.al = alResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('h_al')) {
              resultado.h_al = hAlResultado[amostraId]?.trim() || undefined
        }
            if (campos.includes('param_a')) {
              resultado.param_a = paramAResultado[amostraId]?.trim() || undefined
            }
            if (campos.includes('param_b')) {
              resultado.param_b = paramBResultado[amostraId]?.trim() || undefined
        }
        
        // Campos específicos do módulo foliar
        if (campos.includes('massa_n')) {
          resultado.massaN = massaNResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('volume_n')) {
          resultado.volumeN = volumeNResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('branco_n')) {
          resultado.brancoN = brancoNResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('fator_f')) {
          resultado.fatorF = fatorFResultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('massa_tris_r1')) {
          resultado.massaTrisR1 = massaTrisR1Resultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('massa_tris_r2')) {
          resultado.massaTrisR2 = massaTrisR2Resultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('massa_tris_r3')) {
          resultado.massaTrisR3 = massaTrisR3Resultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('volume_tit_r1')) {
          resultado.volumeTitR1 = volumeTitR1Resultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('volume_tit_r2')) {
          resultado.volumeTitR2 = volumeTitR2Resultado[amostraId]?.trim() || undefined
        }
        if (campos.includes('volume_tit_r3')) {
          resultado.volumeTitR3 = volumeTitR3Resultado[amostraId]?.trim() || undefined
        }
        
        // Mapear massaGeral para MASSA_GERAL
        if (tipoResultado === 'MASSA_GERAL') {
          resultado.massaGeral = valorResultado[amostraId]?.trim() || undefined
        }
        
        // Campos granulométricos - Massa dos Recipientes
        if (campos.includes('agrossa')) {
          const valor = agrossaResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaRecipienteAreiaGrossa = numero
            }
          }
        }
        if (campos.includes('afina')) {
          const valor = afinaResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaRecipienteAreiaFina = numero
            }
          }
        }
        if (campos.includes('silte_argila')) {
          const valor = silteArgilaResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaRecipienteSilteArgila = numero
            }
          }
        }
        if (campos.includes('argila')) {
          const valor = argilaResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaRecipienteArgila = numero
            }
          }
        }
        
        // Campos granulométricos - Massa dos Recipientes + Partículas
        if (campos.includes('agrossa_part')) {
          const valor = agrossaPartResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaRecipientePartAreiaGrossa = numero
            }
          }
        }
        if (campos.includes('afina_part')) {
          const valor = afinaPartResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaRecipientePartAreiaFina = numero
            }
          }
        }
        if (campos.includes('silte_argila_part')) {
          const valor = silteArgilaPartResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaRecipientePartSilteArgila = numero
            }
          }
        }
        if (campos.includes('argila_part')) {
          const valor = argilaPartResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaRecipientePartArgila = numero
            }
          }
        }
        if (campos.includes('tfsa')) {
          const valor = tfsaResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.tfsa = numero
            }
          }
        }
        
        // Campos granulométricos - Massa para o Fator F
        if (campos.includes('mlata')) {
          const valor = mlataResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaLata = numero
            }
          }
        }
        if (campos.includes('mlata_su')) {
          const valor = mlataSuResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaLataSu = numero
            }
          }
        }
        if (campos.includes('mlata_ss')) {
          const valor = mlataSsResultado[amostraId]?.trim()
          if (valor && valor !== '') {
            const numero = parseFloat(valor.replace(',', '.'))
            if (!isNaN(numero)) {
              resultado.massaLataSs = numero
            }
          }
        }

        return resultado
      })
          .filter(resultado => {
            // Para tipos granulométricos, verificar campos granulométricos
            if (['GRAN_MASSA_RECIPIENTES', 'GRAN_MASSA_RECIPIENTES_PARTICULAS', 'GRAN_MASSA_FATOR_F'].includes(resultado.tipo)) {
              const temAgrossa = typeof resultado.massaRecipienteAreiaGrossa === 'number'
              const temAfina = typeof resultado.massaRecipienteAreiaFina === 'number'
              const temSilteArgila = typeof resultado.massaRecipienteSilteArgila === 'number'
              const temArgila = typeof resultado.massaRecipienteArgila === 'number'
              
              // Campos de partículas
              const temAgrossaPart = typeof resultado.massaRecipientePartAreiaGrossa === 'number'
              const temAfinaPart = typeof resultado.massaRecipientePartAreiaFina === 'number'
              const temSilteArgilaPart = typeof resultado.massaRecipientePartSilteArgila === 'number'
              const temArgilaPart = typeof resultado.massaRecipientePartArgila === 'number'
              const temTfsa = typeof resultado.tfsa === 'number'
              
              // Campos de fator F
              const temMlata = typeof resultado.massaLata === 'number'
              const temMlataSu = typeof resultado.massaLataSu === 'number'
              const temMlataSs = typeof resultado.massaLataSs === 'number'
              
              const hasAnyValue = temAgrossa || temAfina || temSilteArgila || temArgila ||
                     temAgrossaPart || temAfinaPart || temSilteArgilaPart || temArgilaPart || temTfsa ||
                     temMlata || temMlataSu || temMlataSs
              
              return hasAnyValue
            }
            
            // Para Determinação F, verificar campos específicos
            if (resultado.tipo === 'DETERMINACAO_F') {
              const temMassaTrisR1 = typeof resultado.massaTrisR1 === 'string' && resultado.massaTrisR1.trim() !== ''
              const temMassaTrisR2 = typeof resultado.massaTrisR2 === 'string' && resultado.massaTrisR2.trim() !== ''
              const temMassaTrisR3 = typeof resultado.massaTrisR3 === 'string' && resultado.massaTrisR3.trim() !== ''
              const temVolumeTitR1 = typeof resultado.volumeTitR1 === 'string' && resultado.volumeTitR1.trim() !== ''
              const temVolumeTitR2 = typeof resultado.volumeTitR2 === 'string' && resultado.volumeTitR2.trim() !== ''
              const temVolumeTitR3 = typeof resultado.volumeTitR3 === 'string' && resultado.volumeTitR3.trim() !== ''
              
              return temMassaTrisR1 || temMassaTrisR2 || temMassaTrisR3 || 
                     temVolumeTitR1 || temVolumeTitR2 || temVolumeTitR3
            }
            
            // Para Nitrogênio foliar, verificar campos específicos
            if (resultado.tipo === 'N' && tipoAnalise === 'foliar') {
              const temMassaN = typeof resultado.massaN === 'string' && resultado.massaN.trim() !== ''
              const temVolumeN = typeof resultado.volumeN === 'string' && resultado.volumeN.trim() !== ''
              const temBrancoN = typeof resultado.brancoN === 'string' && resultado.brancoN.trim() !== ''
              const temFatorF = typeof resultado.fatorF === 'string' && resultado.fatorF.trim() !== ''
              
              return temMassaN || temVolumeN || temBrancoN || temFatorF
            }
            
            // Para Boro foliar, verificar campos específicos
            if (resultado.tipo === 'B' && tipoAnalise === 'foliar') {
              const temMassaBFoliar = typeof resultado.massaBFoliar === 'string' && resultado.massaBFoliar.trim() !== ''
              const temValor = typeof resultado.valor === 'string' && resultado.valor.trim() !== ''
              const temDilB = typeof resultado.dilB === 'string' && resultado.dilB.trim() !== ''
              const temBrancoB = typeof resultado.brancoB === 'string' && resultado.brancoB.trim() !== ''
              const temParamA = typeof resultado.paramA === 'string' && resultado.paramA.trim() !== ''
              const temParamB = typeof resultado.paramB === 'string' && resultado.paramB.trim() !== ''
              
              return temMassaBFoliar || temValor || temDilB || temBrancoB || temParamA || temParamB
            }
            
            // Para outros tipos (pH, P, K, etc.), verificar se tem valor válido
            return resultado.valor && resultado.valor.trim() !== '' && !isNaN(parseFloat(resultado.valor.replace(',', '.')))
          })
      }

      const response = await createResultadosLote.mutateAsync({ resultados })
      
      // Marcar campos como salvos (manter valores e indicar visualmente)
      if (response && response.length > 0) {
        
        // Marcar amostras como salvas para aplicar estilo amarelinho
        const novasAmostrasSalvas = new Set(amostrasSalvas)
        amostrasValidas.forEach(amostraId => {
          novasAmostrasSalvas.add(amostraId)
        })
        setAmostrasSalvas(novasAmostrasSalvas)
        
        // Recarregar dados das amostras para mostrar valores atualizados
        await refetch()
        
      } else {
      }
      
      // Não mostrar toast aqui pois o hook já mostra
    } catch (error) {
      console.error('Erro ao criar resultados:', error)
      toast.error('Erro ao criar resultados')
    }
  }

  // Função para verificar se a amostra solicita o tipo de análise selecionado
  const amostraSolicitaAnalise = (amostra: any, tipoResultadoSelecionado: string) => {
    if (!tipoResultadoSelecionado || tipoResultadoSelecionado === '') return true // Retornar true para "Todas"
    
    const categoria = tiposResultado.find(t => t.value === tipoResultadoSelecionado)?.categoria
    
    // Verificar se a amostra específica solicita o tipo de análise
    const amostraTemAnalise = (tipo: string) => {
      // Para granulométrica, verificar apenas se a amostra específica tem
      // Para outros tipos, pode verificar no lote se não estiver na amostra
      const resultado = amostra[tipo] === true
      return resultado
    }
    
    let resultado: boolean
    switch (categoria) {
      case 'Rotina':
        resultado = amostraTemAnalise('rotina')
        break
      case 'Micronutrientes':
        resultado = amostraTemAnalise('micronutrientes')
        break
      case 'Matéria Orgânica':
        resultado = tipoAnalise === 'solo' && amostraTemAnalise('organica')
        break
      case 'PREM':
        resultado = tipoAnalise === 'solo' && amostraTemAnalise('prem')
        break
      case 'Enxofre':
        resultado = amostraTemAnalise('enxofre')
        break
      case 'Nitrogênio':
        resultado = amostraTemAnalise('nitrogenio')
        break
      case 'Granulométrica':
        // Usar o módulo atual do contexto, não o tipoAnalise
        const temGranulometria = amostraTemAnalise('granulometria')
        const moduloSolo = tipoAnalise === 'solo' // Usar o módulo atual do contexto
        resultado = moduloSolo && temGranulometria
        break
      default:
        resultado = true
    }
    return resultado
  }

  // Filtrar amostras baseado no estado showOnlySelected e ordenar por código (menor para maior)
  const amostrasParaExibir = useMemo(() => {
    const step1 = showOnlySelected 
    ? amostrasData?.amostras.filter((a: any) => selectedAmostras.includes(a.id)) || []
    : amostrasData?.amostras || []
    
    // Aplicar filtro de tipo de análise
    const step2 = step1.filter((amostra: any) => {
      // Se não há tipo selecionado, mostrar todas as amostras
      if (!tipoResultado || tipoResultado === '') {
        return true
      }
      
      // Se está mostrando apenas selecionadas, manter todas as amostras selecionadas
      // MAS ainda aplicar o filtro de tipo de análise
      if (showOnlySelected && selectedAmostras.length > 0) {
        const estaSelecionada = selectedAmostras.includes(amostra.id)
        if (!estaSelecionada) {
          return false
        }
        // Se está selecionada, aplicar o filtro de tipo
      }
      
      // SEMPRE aplicar filtro de tipo quando há um tipo selecionado
      // Isso garante que apenas amostras que solicitam o tipo sejam mostradas
      const solicita = amostraSolicitaAnalise(amostra, tipoResultado)
      return solicita
    })
    
    // Ordenar por código (menor para maior)
    const step3 = step2.sort((a: any, b: any) => {
      const codigoA = a.codigo
      const codigoB = b.codigo
      
      // Para códigos com F (foliar), extrair números e ordenar crescente
      if (/^F\d+$/.test(codigoA) && /^F\d+$/.test(codigoB)) {
        const numA = parseInt(codigoA.replace('F', ''))
        const numB = parseInt(codigoB.replace('F', ''))
        return numA - numB  // Ordem crescente para lançamento em lote
      }
      
      // Para códigos numéricos
      if (/^\d+$/.test(codigoA) && /^\d+$/.test(codigoB)) {
        return parseInt(codigoA) - parseInt(codigoB)  // Ordem crescente
      }
      
      // Para outros códigos, usar comparação de strings
      return codigoA.localeCompare(codigoB)
    })
    
    return step3
  }, [amostrasData?.amostras, showOnlySelected, selectedAmostras, tipoResultado])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lançamento de Resultados em Lote</h1>
        <p className="text-gray-600">Selecione as amostras e lance os resultados de forma eficiente</p>
      </div>

      {/* Filtros e Configuração */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filtros e Configuração</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filtros de Amostras */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Filtros de Amostras</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="input w-full text-sm"
                    placeholder="Código, identificação..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cultura
                  </label>
                  <CulturaAutocomplete
                    value={filters.cultura || ''}
                    onChange={(value) => setFilters(prev => ({ ...prev, cultura: value }))}
                    placeholder="Digite a cultura"
                    className="input w-full text-sm"
              />
            </div>

            <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                Código Inicial
              </label>
              <input
                type="number"
                value={filters.codigoInicio}
                onChange={(e) => setFilters(prev => ({ ...prev, codigoInicio: e.target.value }))}
                    className="input w-full text-sm"
                placeholder={tipoAnalise === 'foliar' ? 'Ex: 1 (será F1)' : 'Ex: 10'}
              />
            </div>

            <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                Código Final
              </label>
              <input
                type="number"
                value={filters.codigoFim}
                onChange={(e) => setFilters(prev => ({ ...prev, codigoFim: e.target.value }))}
                    className="input w-full text-sm"
                placeholder={tipoAnalise === 'foliar' ? 'Ex: 5 (será F5)' : 'Ex: 42'}
              />
            </div>
          </div>

              <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={handleSelectAll}
                  className="btn btn-outline btn-xs"
              >
                {amostrasParaExibir.length > 0 && amostrasParaExibir.every((a: any) => selectedAmostras.includes(a.id)) 
                  ? 'Desmarcar Todas' 
                  : 'Selecionar Todas'
                }
              </button>
              <button
                type="button"
                onClick={handleSelectRange}
                  className="btn btn-outline btn-xs"
              >
                Selecionar Intervalo
              </button>
              {selectedAmostras.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowOnlySelected(!showOnlySelected)}
                    className={`btn btn-xs ${showOnlySelected ? 'btn-primary' : 'btn-outline'}`}
                >
                    {showOnlySelected ? 'Mostrar Todas' : 'Apenas Selecionadas'}
                </button>
              )}
            </div>
              <div className="text-xs text-gray-500 mt-2">
              {selectedAmostras.length} de {amostrasData?.amostras.length || 0} amostras selecionadas
        </div>
      </div>

      {/* Configuração do Resultado */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Configuração do Resultado</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                Tipo de Análise *
              </label>
              <select
                value={tipoResultado}
                onChange={(e) => handleTipoChange(e.target.value)}
                    className="input w-full text-sm"
              >
                {tiposResultadoFiltrados.map(tipo => {
                  const jaFoiLancado = verificarSeJaFoiLancado(tipo.value)
                  return (
                    <option key={tipo.value} value={tipo.value}>
                      {jaFoiLancado ? '🟠 ' : ''}{tipo.label} ({tipo.categoria}){jaFoiLancado ? ' - Já lançado' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                Data da Análise
              </label>
              <input
                type="date"
                value={dataAnalise}
                onChange={(e) => setDataAnalise(e.target.value)}
                    className="input w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="input w-full text-sm"
                    placeholder="Observações adicionais..."
              />
            </div>
          </div>

              {/* Seção para definir valores A e B em lote */}
              {((['P', 'B', 'S', 'PREM'].includes(tipoResultado) && tipoAnalise === 'foliar') || 
                (['P', 'S', 'PREM', 'B'].includes(tipoResultado) && tipoAnalise === 'solo') || 
                (tipoResultado === 'N' && tipoAnalise === 'solo')) && (
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <h5 className="text-xs font-medium text-blue-900 mb-2">Parâmetros A e B em Lote</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Parâmetro A
                      </label>
                      <input
                        type="text"
                        value={paramALote}
                        onChange={(e) => setParamALote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.0000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Parâmetro B
            </label>
                      <input
                        type="text"
                        value={paramBLote}
                        onChange={(e) => setParamBLote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.0000"
                      />
                    </div>
                  </div>
                  
                  {/* Botão para aplicar parâmetros A e B em lote */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Aplicar parâmetros A e B para todas as amostras visíveis
                        const amostrasParaAplicar = selectedAmostras.length > 0 ? selectedAmostras : amostrasParaExibir.map((a: any) => a.id)
                        
                        // Aplicar parâmetros usando uma única chamada para cada estado
                        const newParamA = { ...paramAResultado }
                        const newParamB = { ...paramBResultado }
                        
                        amostrasParaAplicar.forEach((amostraId: string) => {
                          // Converter vírgula para ponto para campos numéricos
                          const valorA = paramALote.replace(',', '.')
                          const valorB = paramBLote.replace(',', '.')
                          
                          newParamA[amostraId] = valorA
                          newParamB[amostraId] = valorB
                        })
                        
                        setParamAResultado(newParamA)
                        setParamBResultado(newParamB)
                        
                        toast.success(`Parâmetros A e B aplicados para ${amostrasParaAplicar.length} amostra(s)`)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      disabled={!paramALote && !paramBLote}
                    >
                      Aplicar para Amostras
                    </button>
                  </div>
                </div>
              )}

              {/* Seção para definir valor de Branco em lote */}
              {((['H+Al', 'B', 'S'].includes(tipoResultado) && tipoAnalise === 'solo') || 
                (['S'].includes(tipoResultado) && tipoAnalise === 'foliar')) && (
                <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                  <h5 className="text-xs font-medium text-amber-900 mb-2">Branco em Lote</h5>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Valor do Branco
                      </label>
                      <input
                        type="text"
                        value={brancoLote}
                        onChange={(e) => setBrancoLote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.0000"
                      />
                    </div>
                  </div>
                  
                  {/* Botão para aplicar Branco em lote */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Aplicar Branco para todas as amostras visíveis
                        const amostrasParaAplicar = selectedAmostras.length > 0 ? selectedAmostras : amostrasParaExibir.map((a: any) => a.id)
                        
                        // Aplicar Branco usando uma única chamada para o estado
                        const newBranco = { ...brancoResultado }
                        
                        amostrasParaAplicar.forEach((amostraId: string) => {
                          // Converter vírgula para ponto para campos numéricos
                          const valorBranco = brancoLote.replace(',', '.')
                          
                          newBranco[amostraId] = valorBranco
                        })
                        
                        setBrancoResultado(newBranco)
                        
                        toast.success(`Branco aplicado para ${amostrasParaAplicar.length} amostra(s)`)
                      }}
                      className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors"
                      disabled={!brancoLote}
                    >
                      Aplicar para Amostras
                    </button>
                  </div>
                </div>
              )}

              {/* Seção para definir valor de Branco B em lote (Boro Foliar) */}
              {tipoResultado === 'B' && tipoAnalise === 'foliar' && (
                <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                  <h5 className="text-xs font-medium text-amber-900 mb-2">Branco (Boro) em Lote</h5>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Valor do Branco
                      </label>
                      <input
                        type="text"
                        value={brancoBLote}
                        onChange={(e) => setBrancoBLote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.0000"
                      />
                    </div>
                  </div>
                  
                  {/* Botão para aplicar Branco B em lote */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Aplicar Branco B para todas as amostras visíveis
                        const amostrasParaAplicar = selectedAmostras.length > 0 ? selectedAmostras : amostrasParaExibir.map((a: any) => a.id)
                        
                        // Aplicar Branco B usando uma única chamada para o estado
                        const newBrancoB = { ...brancoBResultado }
                        
                        amostrasParaAplicar.forEach((amostraId: string) => {
                          // Converter vírgula para ponto para campos numéricos
                          const valorBrancoB = brancoBLote.replace(',', '.')
                          
                          newBrancoB[amostraId] = valorBrancoB
                        })
                        
                        setBrancoBResultado(newBrancoB)
                        
                        toast.success(`Branco (Boro) aplicado para ${amostrasParaAplicar.length} amostra(s)`)
                      }}
                      className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors"
                      disabled={!brancoBLote}
                    >
                      Aplicar para Amostras
                    </button>
                  </div>
                </div>
              )}

              {/* Seção para definir valor de Branco N em lote (Nitrogênio Foliar) */}
              {tipoResultado === 'N' && tipoAnalise === 'foliar' && (
                <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                  <h5 className="text-xs font-medium text-amber-900 mb-2">Branco (Nitrogênio) em Lote</h5>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Valor do Branco
                      </label>
                      <input
                        type="text"
                        value={brancoNLote}
                        onChange={(e) => setBrancoNLote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.0000"
                      />
                    </div>
                  </div>
                  
                  {/* Botão para aplicar Branco N em lote */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Aplicar Branco N para todas as amostras visíveis
                        const amostrasParaAplicar = selectedAmostras.length > 0 ? selectedAmostras : amostrasParaExibir.map((a: any) => a.id)
                        
                        // Aplicar Branco N usando uma única chamada para o estado
                        const newBrancoN = { ...brancoNResultado }
                        
                        amostrasParaAplicar.forEach((amostraId: string) => {
                          // Converter vírgula para ponto para campos numéricos
                          const valorBrancoN = brancoNLote.replace(',', '.')
                          
                          newBrancoN[amostraId] = valorBrancoN
                        })
                        
                        setBrancoNResultado(newBrancoN)
                        
                        toast.success(`Branco (Nitrogênio) aplicado para ${amostrasParaAplicar.length} amostra(s)`)
                      }}
                      className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors"
                      disabled={!brancoNLote}
                    >
                      Aplicar para Amostras
                    </button>
                  </div>
                </div>
              )}

              {/* Seção para campos globais da Determinação F (módulo foliar) */}
              {tipoResultado === 'DETERMINACAO_F' && tipoAnalise === 'foliar' && (
                <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                  <h5 className="text-xs font-medium text-green-900 mb-2">Valores Globais da Determinação F</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Massa Tris R1
                      </label>
                      <input
                        type="text"
                        value={massaTrisR1Lote}
                        onChange={(e) => setMassaTrisR1Lote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Volume Tit R1
                      </label>
                      <input
                        type="text"
                        value={volumeTitR1Lote}
                        onChange={(e) => setVolumeTitR1Lote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Massa Tris R2
                      </label>
                      <input
                        type="text"
                        value={massaTrisR2Lote}
                        onChange={(e) => setMassaTrisR2Lote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Volume Tit R2
                      </label>
                      <input
                        type="text"
                        value={volumeTitR2Lote}
                        onChange={(e) => setVolumeTitR2Lote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Massa Tris R3
                      </label>
                      <input
                        type="text"
                        value={massaTrisR3Lote}
                        onChange={(e) => setMassaTrisR3Lote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Volume Tit R3
                      </label>
                      <input
                        type="text"
                        value={volumeTitR3Lote}
                        onChange={(e) => setVolumeTitR3Lote(e.target.value)}
                        className="input-resultado text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        if (selectedAmostras.length === 0) {
                          toast.error('Selecione pelo menos uma amostra')
                          return
                        }

                        // Aplicar valores da Determinação F usando uma única chamada para cada estado
                        const newMassaTrisR1 = { ...massaTrisR1Resultado }
                        const newMassaTrisR2 = { ...massaTrisR2Resultado }
                        const newMassaTrisR3 = { ...massaTrisR3Resultado }
                        const newVolumeTitR1 = { ...volumeTitR1Resultado }
                        const newVolumeTitR2 = { ...volumeTitR2Resultado }
                        const newVolumeTitR3 = { ...volumeTitR3Resultado }
                        
                        selectedAmostras.forEach(amostraId => {
                          // Converter vírgula para ponto para campos numéricos
                          const valorMassaR1 = massaTrisR1Lote.replace(',', '.')
                          const valorMassaR2 = massaTrisR2Lote.replace(',', '.')
                          const valorMassaR3 = massaTrisR3Lote.replace(',', '.')
                          const valorVolumeR1 = volumeTitR1Lote.replace(',', '.')
                          const valorVolumeR2 = volumeTitR2Lote.replace(',', '.')
                          const valorVolumeR3 = volumeTitR3Lote.replace(',', '.')
                          
                          newMassaTrisR1[amostraId] = valorMassaR1
                          newMassaTrisR2[amostraId] = valorMassaR2
                          newMassaTrisR3[amostraId] = valorMassaR3
                          newVolumeTitR1[amostraId] = valorVolumeR1
                          newVolumeTitR2[amostraId] = valorVolumeR2
                          newVolumeTitR3[amostraId] = valorVolumeR3
                        })
                        
                        setMassaTrisR1Resultado(newMassaTrisR1)
                        setMassaTrisR2Resultado(newMassaTrisR2)
                        setMassaTrisR3Resultado(newMassaTrisR3)
                        setVolumeTitR1Resultado(newVolumeTitR1)
                        setVolumeTitR2Resultado(newVolumeTitR2)
                        setVolumeTitR3Resultado(newVolumeTitR3)
                        
                        toast.success(`Valores da Determinação F aplicados para ${selectedAmostras.length} amostra(s)`)
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      disabled={!massaTrisR1Lote || !massaTrisR2Lote || !massaTrisR3Lote || !volumeTitR1Lote || !volumeTitR2Lote || !volumeTitR3Lote}
                    >
                      Aplicar para Amostras
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Lista de Amostras */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
          <h3 className="card-title">
            Amostras ({amostrasParaExibir.length})
            {showOnlySelected && ` - Apenas Selecionadas (${selectedAmostras.length})`}
          </h3>
            {tipoResultado && (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  <span className="font-bold">{tiposResultado.find(t => t.value === tipoResultado)?.label}</span>
                </div>
                <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  Campos: {getCamposNecessarios(tipoResultado).map(campo => {
                    switch(campo) {
                      case 'valor': return 'Valor'
                      case 'diluicao': return 'Diluição'
                      case 'massa': return 'Massa'
                      case 'branco': return 'Branco'
                      case 'al': return 'Al'
                      case 'h_al': return 'H+Al'
                      case 'param_a': return 'A'
                      case 'param_b': return 'B'
                      default: return campo
                    }
                  }).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="card-content">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando amostras...</p>
            </div>
          ) : amostrasParaExibir.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {showOnlySelected 
                  ? 'Nenhuma amostra selecionada.' 
                  : 'Nenhuma amostra encontrada com os filtros aplicados.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={amostrasParaExibir.length > 0 && amostrasParaExibir.every((a: any) => selectedAmostras.includes(a.id))}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identificação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cultura
                    </th>
                    {getCamposNecessarios(tipoResultado).length > 0 ? (
                      getCamposNecessarios(tipoResultado).map(campo => {
                        return (
                      <th key={campo} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {campo === 'valor' ? 'Valor' :
                         campo === 'diluicao' ? 'Diluição' :
                         campo === 'massa' ? 'Massa (g)' :
                           campo === 'branco' ? 'Branco' :
                           campo === 'al' ? 'Al' :
                           campo === 'h_al' ? 'H+Al' :
                           campo === 'param_a' ? 'A' :
                           campo === 'param_b' ? 'B' :
                           // Campos específicos do módulo foliar
                           campo === 'massa_b_foliar' ? 'Massa B' :
                           campo === 'dil_b' ? 'Dil B' :
                           campo === 'branco_b' ? 'Branco B' :
                           campo === 'massa_n' ? 'Massa N' :
                           campo === 'volume_n' ? 'Volume N' :
                           campo === 'branco_n' ? 'Branco N' :
                           campo === 'fator_f' ? 'Fator F' :
                           campo === 'massa_tris_r1' ? 'Massa Tris R1' :
                           campo === 'massa_tris_r2' ? 'Massa Tris R2' :
                           campo === 'massa_tris_r3' ? 'Massa Tris R3' :
                           campo === 'volume_tit_r1' ? 'Volume Tit R1' :
                           campo === 'volume_tit_r2' ? 'Volume Tit R2' :
                           campo === 'volume_tit_r3' ? 'Volume Tit R3' :
                           // Campos granulométricos
                           campo === 'agrossa' ? 'Areia Grossa' :
                           campo === 'afina' ? 'Areia Fina' :
                           campo === 'silte_argila' ? 'Silte + Argila' :
                           campo === 'argila' ? 'Argila' :
                           campo === 'agrossa_part' ? 'Agrossa + Part' :
                           campo === 'afina_part' ? 'Afina + Part' :
                           campo === 'silte_argila_part' ? 'Silte Argila + Part' :
                           campo === 'argila_part' ? 'Argila + Part' :
                           campo === 'tfsa' ? 'TFSA' :
                           campo === 'mlata' ? 'Massa Lata' :
                           campo === 'mlata_su' ? 'Massa Lata Su' :
                           campo === 'mlata_ss' ? 'Massa Lata Ss' : campo}
                        </th>
                        )
                      })
                    ) : (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="text-center text-gray-400 italic">
                          Selecione um tipo de análise para lançar resultados
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {amostrasParaExibir.map((amostra: any, index: number) => (
                    <tr key={amostra.id} className={selectedAmostras.includes(amostra.id) ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAmostras.includes(amostra.id)}
                          onChange={() => handleSelectAmostra(amostra.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {amostra.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {amostra.identificacao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {amostra.cultura}
                      </td>
                      {getCamposNecessarios(tipoResultado).length > 0 ? (
                        getCamposNecessarios(tipoResultado).map(campo => {
                        // Verificar se já existe valor para este campo
                        const temValorExistente = amostra.resultados?.some((r: any) => {
                          if (tipoResultado === 'H+Al') {
                            
                            // Para H+Al, verificar se existe resultado para Al ou H+Al
                            if (campo === 'al') {
                              return r.tipo === 'H+Al' && r.al && r.al.trim() !== ''
                            } else if (campo === 'valor') {
                              return r.tipo === 'H+Al' && r.valor && r.valor.trim() !== ''
                            } else if (campo === 'h_al') {
                              return r.tipo === 'H+Al' && r.h_al && r.h_al.trim() !== ''
                            } else if (campo === 'branco') {
                              return r.tipo === 'H+Al' && r.branco && r.branco.trim() !== ''
                            }
                          } else {
                            // Para outros tipos
                            return r.tipo === tipoResultado && 
                              ((campo === 'valor' && r.valor && r.valor.trim() !== '') ||
                               (campo === 'diluicao' && r.diluicao && r.diluicao.trim() !== '') ||
                               (campo === 'massa' && r.massa && r.massa.trim() !== '') ||
                               (campo === 'branco' && r.branco && r.branco.trim() !== '') ||
                               (campo === 'param_a' && r.param_a && r.param_a.trim() !== '') ||
                               (campo === 'param_b' && r.param_b && r.param_b.trim() !== '') ||
                               // Campos granulométricos
                               (campo === 'agrossa' && r.massaRecipienteAreiaGrossa !== undefined && r.massaRecipienteAreiaGrossa !== null) ||
                               (campo === 'afina' && r.massaRecipienteAreiaFina !== undefined && r.massaRecipienteAreiaFina !== null) ||
                               (campo === 'silte_argila' && r.massaRecipienteSilteArgila !== undefined && r.massaRecipienteSilteArgila !== null) ||
                               (campo === 'argila' && r.massaRecipienteArgila !== undefined && r.massaRecipienteArgila !== null) ||
                               (campo === 'agrossa_part' && r.massaRecipientePartAreiaGrossa !== undefined && r.massaRecipientePartAreiaGrossa !== null) ||
                               (campo === 'afina_part' && r.massaRecipientePartAreiaFina !== undefined && r.massaRecipientePartAreiaFina !== null) ||
                               (campo === 'silte_argila_part' && r.massaRecipientePartSilteArgila !== undefined && r.massaRecipientePartSilteArgila !== null) ||
                               (campo === 'argila_part' && r.massaRecipientePartArgila !== undefined && r.massaRecipientePartArgila !== null) ||
                               (campo === 'tfsa' && r.tfsa !== undefined && r.tfsa !== null) ||
                               (campo === 'mlata' && r.massaLata !== undefined && r.massaLata !== null && r.massaLata !== '') ||
                               (campo === 'mlata_su' && r.massaLataSu !== undefined && r.massaLataSu !== null && r.massaLataSu !== '') ||
                               (campo === 'mlata_ss' && r.massaLataSs !== undefined && r.massaLataSs !== null && r.massaLataSs !== '') ||
                               // Campos específicos do módulo foliar
                               (campo === 'massa_b_foliar' && r.massaBFoliar !== undefined && r.massaBFoliar !== null) ||
                               (campo === 'dil_b' && r.diluicaoBFoliar !== undefined && r.diluicaoBFoliar !== null) ||
                               (campo === 'branco_b' && r.brancoBFoliar !== undefined && r.brancoBFoliar !== null) ||
                               (campo === 'massa_n' && r.massaN !== undefined && r.massaN !== null) ||
                               (campo === 'volume_n' && r.volumeN !== undefined && r.volumeN !== null) ||
                               (campo === 'branco_n' && r.brancoN !== undefined && r.brancoN !== null) ||
                               (campo === 'fator_f' && r.fatorF !== undefined && r.fatorF !== null) ||
                               (campo === 'massa_tris_r1' && r.massaTrisR1 !== undefined && r.massaTrisR1 !== null && String(r.massaTrisR1) !== '') ||
                               (campo === 'massa_tris_r2' && r.massaTrisR2 !== undefined && r.massaTrisR2 !== null && String(r.massaTrisR2) !== '') ||
                               (campo === 'massa_tris_r3' && r.massaTrisR3 !== undefined && r.massaTrisR3 !== null && String(r.massaTrisR3) !== '') ||
                               (campo === 'volume_tit_r1' && r.volumeTitR1 !== undefined && r.volumeTitR1 !== null && String(r.volumeTitR1) !== '') ||
                               (campo === 'volume_tit_r2' && r.volumeTitR2 !== undefined && r.volumeTitR2 !== null && String(r.volumeTitR2) !== '') ||
                               (campo === 'volume_tit_r3' && r.volumeTitR3 !== undefined && r.volumeTitR3 !== null && String(r.volumeTitR3) !== ''))
                          }
                          return false
                        })
                        
                        return (
                        <td key={campo} className="px-6 py-4 whitespace-nowrap">
                          {selectedAmostras.includes(amostra.id) ? (
                              <div className="relative flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              disabled={campo === 'fator_f'}
                              value={(() => {
                                let valor = ''
                                if (campo === 'valor') {
                                  valor = tipoResultado === 'H+Al' ? hAlResultado[amostra.id] || '' : valorResultado[amostra.id] || ''
                                } else if (campo === 'diluicao') {
                                  valor = diluicaoResultado[amostra.id] || ''
                                } else if (campo === 'massa') {
                                  valor = massaResultado[amostra.id] || ''
                                } else if (campo === 'branco') {
                                  valor = brancoResultado[amostra.id] || ''
                                } else if (campo === 'al') {
                                  valor = alResultado[amostra.id] || ''
                                } else if (campo === 'h_al') {
                                  valor = hAlResultado[amostra.id] || ''
                                } else if (campo === 'param_a') {
                                  valor = paramAResultado[amostra.id] || ''
                                } else if (campo === 'param_b') {
                                  valor = paramBResultado[amostra.id] || ''
                                }
                                // Campos granulométricos
                                else if (campo === 'agrossa') {
                                  valor = agrossaResultado[amostra.id] || ''
                                } else if (campo === 'afina') {
                                  valor = afinaResultado[amostra.id] || ''
                                } else if (campo === 'silte_argila') {
                                  valor = silteArgilaResultado[amostra.id] || ''
                                } else if (campo === 'argila') {
                                  valor = argilaResultado[amostra.id] || ''
                                } else if (campo === 'agrossa_part') {
                                  valor = agrossaPartResultado[amostra.id] || ''
                                } else if (campo === 'afina_part') {
                                  valor = afinaPartResultado[amostra.id] || ''
                                } else if (campo === 'silte_argila_part') {
                                  valor = silteArgilaPartResultado[amostra.id] || ''
                                } else if (campo === 'argila_part') {
                                  valor = argilaPartResultado[amostra.id] || ''
                                } else if (campo === 'tfsa') {
                                  valor = tfsaResultado[amostra.id] || ''
                                } else if (campo === 'mlata') {
                                  valor = mlataResultado[amostra.id] || ''
                                } else if (campo === 'mlata_su') {
                                  valor = mlataSuResultado[amostra.id] || ''
                                } else if (campo === 'mlata_ss') {
                                  valor = mlataSsResultado[amostra.id] || ''
                                }
                                // Campos específicos do módulo foliar
                                else if (campo === 'massa_b_foliar') {
                                  valor = massaBFoliarResultado[amostra.id] || ''
                                } else if (campo === 'dil_b') {
                                  valor = dilBResultado[amostra.id] || ''
                                } else if (campo === 'branco_b') {
                                  valor = brancoBResultado[amostra.id] || ''
                                } else if (campo === 'massa_n') {
                                  valor = massaNResultado[amostra.id] || ''
                                } else if (campo === 'volume_n') {
                                  valor = volumeNResultado[amostra.id] || ''
                                } else if (campo === 'branco_n') {
                                  valor = brancoNResultado[amostra.id] || ''
                                } else if (campo === 'fator_f') {
                                  valor = fatorFResultado[amostra.id] || ''
                                } else if (campo === 'massa_tris_r1') {
                                  valor = massaTrisR1Resultado[amostra.id] || ''
                                } else if (campo === 'massa_tris_r2') {
                                  valor = massaTrisR2Resultado[amostra.id] || ''
                                } else if (campo === 'massa_tris_r3') {
                                  valor = massaTrisR3Resultado[amostra.id] || ''
                                } else if (campo === 'volume_tit_r1') {
                                  valor = volumeTitR1Resultado[amostra.id] || ''
                                } else if (campo === 'volume_tit_r2') {
                                  valor = volumeTitR2Resultado[amostra.id] || ''
                                } else if (campo === 'volume_tit_r3') {
                                  valor = volumeTitR3Resultado[amostra.id] || ''
                                }
                                return valor
                              })()}
                              onChange={(e) => {
                                if (campo === 'valor') {
                                  if (tipoResultado === 'H+Al') {
                                    handleHAlChange(amostra.id, e.target.value)
                                  } else {
                                    handleValorChange(amostra.id, e.target.value)
                                  }
                                } else if (campo === 'diluicao') handleDiluicaoChange(amostra.id, e.target.value)
                                else if (campo === 'massa') handleMassaChange(amostra.id, e.target.value)
                                else if (campo === 'branco') handleBrancoChange(amostra.id, e.target.value)
                                else if (campo === 'param_a') setParamAResultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'param_b') setParamBResultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                    else if (campo === 'al') handleAlChange(amostra.id, e.target.value)
                                    else if (campo === 'h_al') handleHAlChange(amostra.id, e.target.value)
                                // Campos granulométricos
                                else if (campo === 'agrossa') handleAgrossaChange(amostra.id, e.target.value)
                                else if (campo === 'afina') handleAfinaChange(amostra.id, e.target.value)
                                else if (campo === 'silte_argila') handleSilteArgilaChange(amostra.id, e.target.value)
                                else if (campo === 'argila') handleArgilaChange(amostra.id, e.target.value)
                                else if (campo === 'agrossa_part') handleAgrossaPartChange(amostra.id, e.target.value)
                                else if (campo === 'afina_part') handleAfinaPartChange(amostra.id, e.target.value)
                                else if (campo === 'silte_argila_part') handleSilteArgilaPartChange(amostra.id, e.target.value)
                                else if (campo === 'argila_part') handleArgilaPartChange(amostra.id, e.target.value)
                                else if (campo === 'tfsa') handleTfsaChange(amostra.id, e.target.value)
                                else if (campo === 'mlata') handleMlataChange(amostra.id, e.target.value)
                                else if (campo === 'mlata_su') handleMlataSuChange(amostra.id, e.target.value)
                                else if (campo === 'mlata_ss') handleMlataSsChange(amostra.id, e.target.value)
                                // Campos específicos do módulo foliar
                                else if (campo === 'massa_b_foliar') setMassaBFoliarResultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'dil_b') setDilBResultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'branco_b') setBrancoBResultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'massa_n') setMassaNResultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'volume_n') setVolumeNResultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'branco_n') setBrancoNResultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'fator_f') {
                                  // Campo fator F é calculado automaticamente - não permitir edição
                                  return
                                }
                                else if (campo === 'massa_tris_r1') setMassaTrisR1Resultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'massa_tris_r2') setMassaTrisR2Resultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'massa_tris_r3') setMassaTrisR3Resultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'volume_tit_r1') setVolumeTitR1Resultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'volume_tit_r2') setVolumeTitR2Resultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                                else if (campo === 'volume_tit_r3') setVolumeTitR3Resultado(prev => ({ ...prev, [amostra.id]: e.target.value.replace(',', '.') }))
                              }}
                              onKeyDown={(e) => handleKeyDown(e, index, campo as any)}
                              data-index={index}
                              data-field={campo}
                              className={`text-center ${
                                    campo === 'valor' || campo === 'h_al' ? 'input w-28' : 
                                    campo === 'param_a' || campo === 'param_b' ? 'input-resultado' : 
                                    // Campos granulométricos
                                    campo === 'agrossa' || campo === 'afina' || campo === 'silte_argila' || campo === 'argila' ||
                                    campo === 'agrossa_part' || campo === 'afina_part' || campo === 'silte_argila_part' || campo === 'argila_part' ||
                                    campo === 'tfsa' || campo === 'mlata' || campo === 'mlata_su' || campo === 'mlata_ss' ? 'input-resultado' :
                                    'input w-28'
                                  } ${temValorExistente ? 'bg-yellow-50 border-yellow-300' : ''}`}
                              placeholder={
                                campo === 'valor' ? '0.00' :
                                campo === 'diluicao' ? '1.0' :
                                campo === 'massa' ? '0.00' :
                                    campo === 'branco' ? '0.00' :
                                    campo === 'al' ? '0.00' :
                                    campo === 'h_al' ? '0.00' :
                                    campo === 'param_a' ? '0.0000' :
                                    campo === 'param_b' ? '0.0000' :
                                    // Campos específicos do módulo foliar
                                    campo === 'massa_b_foliar' ? '0.00' :
                                    campo === 'dil_b' ? '1.0' :
                                    campo === 'branco_b' ? '0.00' :
                                // Campos granulométricos
                                campo === 'agrossa' ? '0.0000' :
                                campo === 'afina' ? '0.0000' :
                                campo === 'silte_argila' ? '0.0000' :
                                campo === 'argila' ? '0.0000' :
                                campo === 'agrossa_part' ? '0.0000' :
                                campo === 'afina_part' ? '0.0000' :
                                campo === 'silte_argila_part' ? '0.0000' :
                                campo === 'argila_part' ? '0.0000' :
                                campo === 'mlata' ? '0.0000' :
                                campo === 'mlata_su' ? '0.0000' :
                                campo === 'mlata_ss' ? '0.0000' :
                                // Campos específicos do módulo foliar
                                campo === 'massa_n' ? '0.00' :
                                campo === 'volume_n' ? '0.00' :
                                campo === 'branco_n' ? '0.00' :
                                campo === 'fator_f' ? 'Calculado automaticamente' :
                                campo === 'massa_tris_r1' ? '0.00' :
                                campo === 'massa_tris_r2' ? '0.00' :
                                campo === 'massa_tris_r3' ? '0.00' :
                                campo === 'volume_tit_r1' ? '0.00' :
                                campo === 'volume_tit_r2' ? '0.00' :
                                campo === 'volume_tit_r3' ? '0.00' : ''
                                  }
                                  autoFocus={index === 0 && (campo === 'valor' || campo === 'al')}
                                />
                                {temValorExistente && (
                                  <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full" title="Valor já existe"></div>
                                )}
                                {campo === 'fator_f' && (
                                  <div className="text-xs text-green-600 font-medium ml-2" title="Calculado automaticamente baseado na Determinação F">
                                    ✓ Auto
                                  </div>
                                )}
                              </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        )
                      })
                    ) : (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-gray-400 italic">
                          Selecione um tipo de análise
                        </span>
                      </td>
                    )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Botão de Salvar */}
      {selectedAmostras.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={createResultadosLote.isLoading}
            className="btn btn-primary flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {createResultadosLote.isLoading ? 'Salvando...' : `Salvar ${selectedAmostras.filter((id: string) => amostrasParaExibir.some((a: any) => a.id === id)).length} Resultados`}
          </button>
        </div>
      )}
    </div>
  )
}

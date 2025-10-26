import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { useCreateResultado, useUpdateResultado, useDeleteResultado } from '../hooks/useResultados'
import { Resultado } from '../../../shared/types'
import { useModule } from '../contexts/ModuleContext'

interface ResultadoFormProps {
  amostraId: string
  resultado?: Resultado
  resultadosExistentes?: Resultado[]
  amostra?: {
    rotina: boolean
    organica: boolean
    micronutrientes: boolean
    enxofre: boolean
    prem: boolean
    nitrogenio: boolean
    granulometria: boolean
  }
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ResultadoForm({ 
  amostraId, 
  resultado, 
  resultadosExistentes = [], 
  amostra, 
  isOpen, 
  onClose, 
  onSuccess 
}: ResultadoFormProps) {
  const { modulo } = useModule()
  const [formData, setFormData] = useState({
    amostraId,
    tipo: '',
    valor: '',
    diluicao: '',
    massa: '',
    branco: '',
    al: '',
    h_al: '',
    param_a: '',
    param_b: '',
    observacoes: '',
    dataAnalise: new Date().toISOString().split('T')[0],
    // Campos granulométricos
    agrossa: '',
    afina: '',
    silte_argila: '',
    argila: '',
    agrossa_part: '',
    afina_part: '',
    silte_argila_part: '',
    argila_part: '',
    tfsa: '',
    mlata: '',
    mlata_su: '',
    mlata_ss: '',
    // Campos específicos para módulo foliar
    massaB: '',
    dilB: '',
    brancoB: '',
    massaN: '',
    volumeN: '',
    brancoN: '',
    fatorF: '',
    massaGeral: '',
    massaTrisR1: '',
    massaTrisR2: '',
    massaTrisR3: '',
    volumeTitR1: '',
    volumeTitR2: '',
    volumeTitR3: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  const [existingResultadoId, setExistingResultadoId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const createResultado = useCreateResultado()
  const updateResultado = useUpdateResultado()
  const deleteResultado = useDeleteResultado()

  // Função para calcular o Fator F baseado nos valores da Determinação F
  const calcularFatorF = () => {
    if (!resultadosExistentes) {
      return '';
    }
    
    const determinacaoF = resultadosExistentes.find(r => r.tipo === 'DETERMINACAO_F');
    
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
      
      const fatorFR1 = (massaTrisR1 / 0.12114) * volumeTitR1 * 0.1;
      const fatorFR2 = (massaTrisR2 / 0.12114) * volumeTitR2 * 0.1;
      const fatorFR3 = (massaTrisR3 / 0.12114) * volumeTitR3 * 0.1;
      
      const fatorFCalculado = (fatorFR1 + fatorFR2 + fatorFR3) / 3;
      
      return fatorFCalculado.toFixed(4);
    } catch (error) {
      console.error('Erro ao calcular Fator F:', error);
      return '';
    }
  };

  // Carregar valores existentes quando o tipo muda (para novos resultados)
  useEffect(() => {
    if (!resultado && formData.tipo && resultadosExistentes) {
      const resultadoExistente = resultadosExistentes.find(r => r.tipo === formData.tipo);
      if (resultadoExistente) {
        // Carregar todos os campos do resultado existente para permitir edição
          setFormData(prev => ({
            ...prev,
          // Campos básicos
            valor: resultadoExistente.valor || '',
            diluicao: resultadoExistente.diluicao || '',
          massa: resultadoExistente.massa || '',
            branco: resultadoExistente.branco || '',
          al: resultadoExistente.al || '',
          h_al: resultadoExistente.h_al || '',
            param_a: resultadoExistente.param_a || '',
          param_b: resultadoExistente.param_b || '',
          // Campos específicos do módulo foliar
          massaB: resultadoExistente.massaBFoliar?.toString() || '',
          dilB: resultadoExistente.diluicaoBFoliar?.toString() || '',
          brancoB: resultadoExistente.brancoBFoliar?.toString() || '',
          massaN: resultadoExistente.massaN?.toString() || '',
          volumeN: resultadoExistente.volumeN?.toString() || '',
          brancoN: resultadoExistente.brancoN?.toString() || '',
          fatorF: resultadoExistente.fatorF?.toString() || '',
          massaTrisR1: resultadoExistente.massaTrisR1?.toString() || '',
          massaTrisR2: resultadoExistente.massaTrisR2?.toString() || '',
          massaTrisR3: resultadoExistente.massaTrisR3?.toString() || '',
          volumeTitR1: resultadoExistente.volumeTitR1?.toString() || '',
          volumeTitR2: resultadoExistente.volumeTitR2?.toString() || '',
          volumeTitR3: resultadoExistente.volumeTitR3?.toString() || '',
          // Campos granulométricos
          agrossa: resultadoExistente.massaRecipienteAreiaGrossa?.toString() || '',
          afina: resultadoExistente.massaRecipienteAreiaFina?.toString() || '',
          silte_argila: resultadoExistente.massaRecipienteSilteArgila?.toString() || '',
          argila: resultadoExistente.massaRecipienteArgila?.toString() || '',
          agrossa_part: resultadoExistente.massaRecipientePartAreiaGrossa?.toString() || '',
          afina_part: resultadoExistente.massaRecipientePartAreiaFina?.toString() || '',
          silte_argila_part: resultadoExistente.massaRecipientePartSilteArgila?.toString() || '',
          argila_part: resultadoExistente.massaRecipientePartArgila?.toString() || '',
          tfsa: resultadoExistente.tfsa?.toString() || '',
          mlata: resultadoExistente.massaLata?.toString() || '',
          mlata_su: resultadoExistente.massaLataSu?.toString() || '',
          mlata_ss: resultadoExistente.massaLataSs?.toString() || ''
        }));
        
        // Definir como edição existente
        setIsEditingExisting(true);
        setExistingResultadoId(resultadoExistente.id);
      } else {
        // Se não há resultado existente, definir como novo resultado
        setIsEditingExisting(false);
        setExistingResultadoId(null);
      }
    }
  }, [formData.tipo, resultadosExistentes, resultado]);

  // Preencher valores padrão de diluição quando o tipo é selecionado
  useEffect(() => {
    if (!formData.tipo || isEditingExisting) return
    
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
    
    const diluicaoPadrao = diluicoesPadrao[modulo]?.[formData.tipo]
    if (diluicaoPadrao) {
      setFormData(prev => ({
        ...prev,
        diluicao: diluicaoPadrao,
        // Para Boro no módulo foliar, usar campo específico
        ...(formData.tipo === 'B' && modulo === 'foliar' ? { dilB: diluicaoPadrao } : {})
      }))
    }
  }, [formData.tipo, modulo, isEditingExisting])

  // Calcular Fator F automaticamente quando selecionar Nitrogênio
  useEffect(() => {
    if (formData.tipo === 'N' && resultadosExistentes) {
      const fatorFCalculado = calcularFatorF();
      if (fatorFCalculado) {
        setFormData(prev => ({
          ...prev,
          fatorF: fatorFCalculado
        }));
      }
    }
  }, [formData.tipo, resultadosExistentes]);

  // Valor calculado do Fator F para exibição
  const fatorFCalculado = useMemo(() => {
    if (formData.tipo === 'N' && resultadosExistentes) {
      return calcularFatorF();
    }
    return '';
  }, [formData.tipo, resultadosExistentes]);

  // Inicializar dados do formulário quando resultado for fornecido (modo edição direta)
  useEffect(() => {
    if (resultado) {
      // Logs de debug removidos
      
      setFormData({
        amostraId: resultado.amostraId,
        tipo: resultado.tipo,
        valor: resultado.valor,
        diluicao: resultado.diluicao || '',
        massa: resultado.massa || '',
        branco: resultado.branco || '',
        al: resultado.al || '',
        h_al: resultado.h_al || '',
        param_a: resultado.param_a || '',
        param_b: resultado.param_b || '',
        observacoes: resultado.observacoes || '',
        dataAnalise: resultado.dataAnalise ? new Date(resultado.dataAnalise).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        // Campos granulométricos
        agrossa: resultado.massaRecipienteAreiaGrossa?.toString() || '',
        afina: resultado.massaRecipienteAreiaFina?.toString() || '',
        silte_argila: resultado.massaRecipienteSilteArgila?.toString() || '',
        argila: resultado.massaRecipienteArgila?.toString() || '',
        agrossa_part: resultado.massaRecipientePartAreiaGrossa?.toString() || '',
        afina_part: resultado.massaRecipientePartAreiaFina?.toString() || '',
        silte_argila_part: resultado.massaRecipientePartSilteArgila?.toString() || '',
        argila_part: resultado.massaRecipientePartArgila?.toString() || '',
        tfsa: resultado.tfsa?.toString() || '',
        mlata: resultado.massaLata?.toString() || '',
        mlata_su: resultado.massaLataSu?.toString() || '',
        mlata_ss: resultado.massaLataSs?.toString() || '',
        // Campos específicos para módulo foliar
        massaB: resultado.massaBFoliar?.toString() || '',
        dilB: resultado.diluicaoBFoliar?.toString() || '',
        brancoB: resultado.brancoBFoliar?.toString() || '',
        massaN: resultado.massaN?.toString() || '',
        volumeN: resultado.volumeN?.toString() || '',
        brancoN: resultado.brancoN?.toString() || '',
        fatorF: resultado.fatorF?.toString() || '',
        massaTrisR1: resultado.massaTrisR1?.toString() || '',
        massaTrisR2: resultado.massaTrisR2?.toString() || '',
        massaTrisR3: resultado.massaTrisR3?.toString() || '',
        volumeTitR1: resultado.volumeTitR1?.toString() || '',
        volumeTitR2: resultado.volumeTitR2?.toString() || '',
        volumeTitR3: resultado.volumeTitR3?.toString() || '',
        massaGeral: '',
      })
      
      setIsEditingExisting(true);
      setExistingResultadoId(resultado.id);
    }
  }, [resultado]);

  // Tipos de resultado baseados no padrão do lançamento em lote e filtrados pela amostra
  const tiposResultado = useMemo(() => {
    const tipos = []
    
    // ROTINA - apenas se solicitado
    if (!amostra || amostra.rotina) {
      tipos.push(
        // pH, Na e H+Al apenas para solo
        ...(modulo === 'solo' ? [{ value: 'pH', label: 'pH', categoria: 'Rotina', campos: ['valor'] }] : []),
        { value: 'P', label: 'Fósforo (P)', categoria: 'Rotina', campos: ['valor', 'diluicao', 'param_a', 'param_b'] },
        ...(modulo === 'solo' ? [{ value: 'Na', label: 'Sódio (Na)', categoria: 'Rotina', campos: ['valor', 'diluicao'] }] : []),
        { value: 'K', label: 'Potássio (K)', categoria: 'Rotina', campos: ['valor', 'diluicao'] },
        ...(modulo === 'solo' ? [{ value: 'H+Al', label: 'H+Al', categoria: 'Rotina', campos: ['al', 'valor', 'branco'] }] : []),
        { value: 'Ca', label: 'Cálcio (Ca)', categoria: 'Rotina', campos: ['valor', 'diluicao'] },
        { value: 'Mg', label: 'Magnésio (Mg)', categoria: 'Rotina', campos: ['valor', 'diluicao'] }
      )
    }
    
    // MICRONUTRIENTES - apenas se solicitado
    if (!amostra || amostra.micronutrientes) {
      tipos.push(
        { value: 'Fe', label: 'Ferro (Fe)', categoria: 'Micronutrientes', campos: ['valor', 'diluicao'] },
        { value: 'Zn', label: 'Zinco (Zn)', categoria: 'Micronutrientes', campos: ['valor', 'diluicao'] },
        { value: 'Cu', label: 'Cobre (Cu)', categoria: 'Micronutrientes', campos: ['valor', 'diluicao'] },
        { value: 'Mn', label: 'Manganês (Mn)', categoria: 'Micronutrientes', campos: ['valor', 'diluicao'] },
        { value: 'B', label: 'Boro (B)', categoria: 'Micronutrientes', campos: modulo === 'foliar' ? ['massa_b_foliar', 'valor', 'dil_b', 'branco_b', 'param_a', 'param_b'] : ['valor', 'branco', 'param_a', 'param_b'] }
      )
    }
    
    // MATÉRIA ORGÂNICA - apenas para solo e se solicitado
    if (modulo === 'solo' && (!amostra || amostra.organica)) {
      tipos.push({ value: 'MO', label: 'Matéria Orgânica', categoria: 'Matéria Orgânica', campos: ['valor', 'massa', 'branco'] })
    }
    
    // PREM - apenas para solo e se solicitado
    if (modulo === 'solo' && (!amostra || amostra.prem)) {
      tipos.push({ value: 'PREM', label: 'PREM', categoria: 'PREM', campos: ['valor', 'diluicao', 'param_a', 'param_b'] })
    }
    
    // ENXOFRE - apenas se solicitado
    if (!amostra || amostra.enxofre) {
      tipos.push({ value: 'S', label: 'Enxofre', categoria: 'Enxofre', campos: modulo === 'foliar' ? ['valor', 'diluicao', 'branco', 'param_a', 'param_b'] : ['valor', 'branco', 'param_a', 'param_b'] })
    }
    
    // NITROGÊNIO - apenas se solicitado
    if (!amostra || amostra.nitrogenio) {
      tipos.push({ value: 'N', label: 'Nitrogênio (N)', categoria: 'Nitrogênio', campos: modulo === 'foliar' ? ['massa_n', 'volume_n', 'branco_n', 'fator_f'] : ['valor', 'diluicao', 'param_a', 'param_b'] })
    }
    
    // CAMPOS ESPECÍFICOS DO MÓDULO FOLIAR
    if (modulo === 'foliar') {
      tipos.push(
        { value: 'MASSA_GERAL', label: 'Massa Geral', categoria: 'Foliar', campos: ['valor'] },
        { value: 'DETERMINACAO_F', label: 'Determinação F', categoria: 'Foliar', campos: ['massa_tris_r1', 'massa_tris_r2', 'massa_tris_r3', 'volume_tit_r1', 'volume_tit_r2', 'volume_tit_r3'] }
      )
    }
    
    // GRANULOMÉTRICA - apenas para solo e se solicitado
    if (modulo === 'solo' && (!amostra || amostra.granulometria)) {
      tipos.push(
        { value: 'GRAN_MASSA_RECIPIENTES', label: 'Massa dos Recipientes', categoria: 'Granulométrica', campos: ['agrossa', 'afina', 'silte_argila', 'argila'] },
        { value: 'GRAN_MASSA_RECIPIENTES_PARTICULAS', label: 'Massa dos Recipientes + Partículas', categoria: 'Granulométrica', campos: ['agrossa_part', 'afina_part', 'silte_argila_part', 'argila_part', 'tfsa'] },
        { value: 'GRAN_MASSA_FATOR_F', label: 'Massa para o Fator F', categoria: 'Granulométrica', campos: ['mlata', 'mlata_su', 'mlata_ss'] }
      )
    }
    
    return tipos
  }, [modulo, amostra])

  // Função para obter os campos necessários baseado no tipo selecionado
  const getCamposNecessarios = (tipo: string) => {
    if (!tipo) return []
    const tipoInfo = tiposResultado.find(t => t.value === tipo)
    return tipoInfo?.campos || ['valor']
  }

  // Função para verificar se um resultado já foi lançado
  const isResultadoLancado = (tipo: string) => {
    return resultadosExistentes?.some(r => r.tipo === tipo) || false
  }

  // Função para obter o valor de um resultado já lançado
  const getValorLancado = (tipo: string, campo: string) => {
    const resultadoExistente = resultadosExistentes?.find(r => r.tipo === tipo)
    if (!resultadoExistente) return null

    // Mapear campos para propriedades do resultado
    switch (campo) {
      case 'valor':
        return resultadoExistente.valor
      case 'diluicao':
        return resultadoExistente.diluicao
      case 'massa':
        return resultadoExistente.massa
      case 'branco':
        return resultadoExistente.branco
      case 'al':
        return resultadoExistente.al
      case 'h_al':
        return resultadoExistente.h_al
      case 'param_a':
        return resultadoExistente.param_a
      case 'param_b':
        return resultadoExistente.param_b
      case 'massa_b_foliar':
        return resultadoExistente.massaBFoliar?.toString()
      case 'dil_b':
        return resultadoExistente.diluicaoBFoliar?.toString()
      case 'branco_b':
        return resultadoExistente.brancoBFoliar?.toString()
      case 'massa_n':
        return resultadoExistente.massaN?.toString()
      case 'volume_n':
        return resultadoExistente.volumeN?.toString()
      case 'branco_n':
        return resultadoExistente.brancoN?.toString()
      case 'fator_f':
        return resultadoExistente.fatorF?.toString()
      case 'massa_tris_r1':
        return resultadoExistente.massaTrisR1?.toString()
      case 'massa_tris_r2':
        return resultadoExistente.massaTrisR2?.toString()
      case 'massa_tris_r3':
        return resultadoExistente.massaTrisR3?.toString()
      case 'volume_tit_r1':
        return resultadoExistente.volumeTitR1?.toString()
      case 'volume_tit_r2':
        return resultadoExistente.volumeTitR2?.toString()
      case 'volume_tit_r3':
        return resultadoExistente.volumeTitR3?.toString()
      // Campos granulométricos
      case 'agrossa':
        return resultadoExistente.massaRecipienteAreiaGrossa?.toString()
      case 'afina':
        return resultadoExistente.massaRecipienteAreiaFina?.toString()
      case 'silte_argila':
        return resultadoExistente.massaRecipienteSilteArgila?.toString()
      case 'argila':
        return resultadoExistente.massaRecipienteArgila?.toString()
      case 'agrossa_part':
        return resultadoExistente.massaRecipientePartAreiaGrossa?.toString()
      case 'afina_part':
        return resultadoExistente.massaRecipientePartAreiaFina?.toString()
      case 'silte_argila_part':
        return resultadoExistente.massaRecipientePartSilteArgila?.toString()
      case 'argila_part':
        return resultadoExistente.massaRecipientePartArgila?.toString()
      case 'tfsa':
        return resultadoExistente.tfsa?.toString()
      case 'mlata':
        return resultadoExistente.massaLata?.toString()
      case 'mlata_su':
        return resultadoExistente.massaLataSu?.toString()
      case 'mlata_ss':
        return resultadoExistente.massaLataSs?.toString()
      default:
        return null
    }
  }

  // Função para obter o label de um campo
  const getCampoLabel = (campo: string) => {
    return campo === 'valor' ? 'Valor' :
           campo === 'diluicao' ? 'Diluição' :
           campo === 'massa' ? 'Massa' :
           campo === 'branco' ? 'Branco' :
           campo === 'al' ? 'Al' :
           campo === 'h_al' ? 'H+Al' :
           campo === 'param_a' ? 'Parâmetro A' :
           campo === 'param_b' ? 'Parâmetro B' :
           // Campos específicos do módulo foliar
           campo === 'massa_b_foliar' ? 'Massa B Foliar' :
           campo === 'massa_n' ? 'Massa N' :
           campo === 'volume_n' ? 'Volume N' :
           campo === 'branco_n' ? 'Branco N' :
           campo === 'fator_f' ? 'Fator F' :
           campo === 'massa_geral' ? 'Massa Geral' :
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
           campo === 'mlata_ss' ? 'Massa Lata Ss' : campo
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.tipo.trim()) {
      newErrors.tipo = 'Tipo é obrigatório'
    }

    // Validação baseada nos campos necessários para o tipo selecionado
    const camposNecessarios = getCamposNecessarios(formData.tipo)
    
    camposNecessarios.forEach(campo => {
      let valor = ''
      
      // Obter o valor do campo baseado no nome
      if (campo === 'valor') {
        valor = formData.tipo === 'H+Al' ? formData.h_al : formData.valor
      } else if (campo === 'diluicao') {
        valor = formData.diluicao
      } else if (campo === 'massa') {
        valor = formData.massa
      } else if (campo === 'branco') {
        valor = formData.branco
      } else if (campo === 'al') {
        valor = formData.al
      } else if (campo === 'h_al') {
        valor = formData.h_al
      } else if (campo === 'param_a') {
        valor = formData.param_a
      } else if (campo === 'param_b') {
        valor = formData.param_b
      } else if (campo === 'massa_b_foliar') {
        valor = formData.massaB
      } else if (campo === 'dil_b') {
        valor = formData.dilB
      } else if (campo === 'branco_b') {
        valor = formData.brancoB
      } else if (campo === 'massa_n') {
        valor = formData.massaN
      } else if (campo === 'volume_n') {
        valor = formData.volumeN
      } else if (campo === 'branco_n') {
        valor = formData.brancoN
      } else if (campo === 'fator_f') {
        valor = formData.fatorF
      } else if (campo === 'massa_geral') {
        valor = formData.massaGeral
      } else if (campo === 'massa_tris_r1') {
        valor = formData.massaTrisR1
      } else if (campo === 'massa_tris_r2') {
        valor = formData.massaTrisR2
      } else if (campo === 'massa_tris_r3') {
        valor = formData.massaTrisR3
      } else if (campo === 'volume_tit_r1') {
        valor = formData.volumeTitR1
      } else if (campo === 'volume_tit_r2') {
        valor = formData.volumeTitR2
      } else if (campo === 'volume_tit_r3') {
        valor = formData.volumeTitR3
      } else if (campo === 'agrossa') {
        valor = formData.agrossa
      } else if (campo === 'afina') {
        valor = formData.afina
      } else if (campo === 'silte_argila') {
        valor = formData.silte_argila
      } else if (campo === 'argila') {
        valor = formData.argila
      } else if (campo === 'agrossa_part') {
        valor = formData.agrossa_part
      } else if (campo === 'afina_part') {
        valor = formData.afina_part
      } else if (campo === 'silte_argila_part') {
        valor = formData.silte_argila_part
      } else if (campo === 'argila_part') {
        valor = formData.argila_part
      } else if (campo === 'tfsa') {
        valor = formData.tfsa
      } else if (campo === 'mlata') {
        valor = formData.mlata
      } else if (campo === 'mlata_su') {
        valor = formData.mlata_su
      } else if (campo === 'mlata_ss') {
        valor = formData.mlata_ss
      }
      
      if (!valor.trim()) {
        newErrors[campo] = `${getCampoLabel(campo)} é obrigatório`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Função para converter string para número
      const parseNumber = (value: string) => {
        if (!value || value.trim() === '') return undefined
        return parseFloat(value.replace(',', '.'))
      }
      
      // Função para converter data para formato ISO sem problemas de timezone
      const convertDateToISO = (dateStr: string) => {
        if (!dateStr) return undefined
        
        // Se já está no formato ISO (YYYY-MM-DD), usar diretamente
        if (dateStr.includes('-') && !dateStr.includes('/')) {
          return `${dateStr}T12:00:00.000Z` // Usar meio-dia UTC para evitar problemas de timezone
        }
        
        // Se está no formato brasileiro (DD/MM/YYYY), converter
        const [day, month, year] = dateStr.split('/')
        if (day && month && year) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00.000Z`
        }
        
        return undefined
      }

      // Base data comum para ambos os módulos
      const submitData: any = {
        amostraId: formData.amostraId,
        tipo: formData.tipo,
        categoria: modulo as 'solo' | 'foliar',
        valor: formData.valor || undefined,
        diluicao: formData.diluicao || undefined,
        massa: formData.massa || undefined,
        branco: formData.branco || undefined,
        al: formData.al || undefined,
        h_al: formData.h_al || undefined,
        param_a: formData.param_a || undefined,
        param_b: formData.param_b || undefined,
        observacoes: formData.observacoes || undefined,
        dataAnalise: convertDateToISO(formData.dataAnalise),
      }

      // Adicionar campos específicos baseado no módulo
      if (modulo === 'solo') {
        // Campos granulométricos - apenas para módulo solo
        submitData.massaRecipienteAreiaGrossa = parseNumber(formData.agrossa)
        submitData.massaRecipienteAreiaFina = parseNumber(formData.afina)
        submitData.massaRecipienteSilteArgila = parseNumber(formData.silte_argila)
        submitData.massaRecipienteArgila = parseNumber(formData.argila)
        submitData.massaRecipientePartAreiaGrossa = parseNumber(formData.agrossa_part)
        submitData.massaRecipientePartAreiaFina = parseNumber(formData.afina_part)
        submitData.massaRecipientePartSilteArgila = parseNumber(formData.silte_argila_part)
        submitData.massaRecipientePartArgila = parseNumber(formData.argila_part)
        submitData.tfsa = parseNumber(formData.tfsa)
        submitData.massaLata = parseNumber(formData.mlata)
        submitData.massaLataSu = parseNumber(formData.mlata_su)
        submitData.massaLataSs = parseNumber(formData.mlata_ss)
        
        // Para tipo MASSA_GERAL no módulo solo, incluir massaGeral
        if (formData.tipo === 'MASSA_GERAL') {
          submitData.massaGeral = parseNumber(formData.massaGeral)
        }
      } else if (modulo === 'foliar') {
        // Campos específicos do módulo foliar - apenas para módulo foliar
        submitData.massaBFoliar = parseNumber(formData.massaB)
        submitData.dilB = parseNumber(formData.dilB)
        submitData.brancoB = parseNumber(formData.brancoB)
        submitData.massaN = parseNumber(formData.massaN)
        submitData.volumeN = parseNumber(formData.volumeN)
        submitData.brancoN = parseNumber(formData.brancoN)
        submitData.fatorF = parseNumber(formData.fatorF)
        submitData.massaGeral = parseNumber(formData.massaGeral)
        submitData.massaTrisR1 = parseNumber(formData.massaTrisR1)
        submitData.massaTrisR2 = parseNumber(formData.massaTrisR2)
        submitData.massaTrisR3 = parseNumber(formData.massaTrisR3)
        submitData.volumeTitR1 = parseNumber(formData.volumeTitR1)
        submitData.volumeTitR2 = parseNumber(formData.volumeTitR2)
        submitData.volumeTitR3 = parseNumber(formData.volumeTitR3)
      }

      if (isEditingExisting && existingResultadoId) {
        await updateResultado.mutateAsync({
          id: existingResultadoId,
          data: submitData
        })
        toast.success('Resultado atualizado com sucesso!')
      } else {
        await createResultado.mutateAsync(submitData)
        toast.success('Resultado criado com sucesso!')
      }

      onSuccess?.()
      
      // Resetar formulário para permitir criar outro resultado
      setFormData({
        amostraId,
        tipo: '',
        valor: '',
        diluicao: '',
        massa: '',
        branco: '',
        al: '',
        h_al: '',
        param_a: '',
        param_b: '',
        observacoes: '',
        dataAnalise: new Date().toISOString().split('T')[0],
        // Campos granulométricos
        agrossa: '',
        afina: '',
        silte_argila: '',
        argila: '',
        agrossa_part: '',
        afina_part: '',
        silte_argila_part: '',
        argila_part: '',
        tfsa: '',
        mlata: '',
        mlata_su: '',
        mlata_ss: '',
        // Campos específicos do módulo foliar
        massaB: '',
        dilB: '',
        brancoB: '',
        massaN: '',
        volumeN: '',
        brancoN: '',
        fatorF: '',
        massaTrisR1: '',
        massaTrisR2: '',
        massaTrisR3: '',
        volumeTitR1: '',
        volumeTitR2: '',
        volumeTitR3: '',
        massaGeral: '',
      })
      
      // Resetar estado de edição
      setIsEditingExisting(false)
      setExistingResultadoId(null)
      setErrors({})
      
      // Não fechar o formulário - manter aberto para criar outro resultado
    } catch (error) {
      console.error('Erro ao salvar resultado:', error)
      toast.error('Erro ao salvar resultado')
    }
  }

  const handleDelete = async () => {
    if (!existingResultadoId) return

    try {
      await deleteResultado.mutateAsync(existingResultadoId)
      toast.success('Resultado excluído com sucesso!')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Erro ao excluir resultado:', error)
      toast.error('Erro ao excluir resultado')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
            {isEditingExisting ? 'Editar Resultado' : 'Novo Resultado'}
          </h2>
          <button
            onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
          >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
          </button>
        </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo */}
          <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tipo de Análise *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                className="input w-full text-sm"
            >
              <option value="">Selecione o tipo</option>
                {tiposResultado.map((tipo) => {
                  const jaLancado = isResultadoLancado(tipo.value)
                  return (
                    <option key={tipo.value} value={tipo.value}>
                      {jaLancado ? '🟠 ' : ''}{tipo.label} ({tipo.categoria}){jaLancado ? ' (já lançado)' : ''}
                    </option>
                  )
                })}
            </select>
              {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo}</p>}
          </div>

            {/* Campos de Análise */}
            {formData.tipo && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Campos de Análise
                  </h3>
                  {isResultadoLancado(formData.tipo) && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                      title="Remover resultado"
                    >
                      🗑️ Remover
                    </button>
                  )}
            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getCamposNecessarios(formData.tipo).map(campo => {
            const isRequired = true // Todos os campos são obrigatórios
            
            // Obter valor do campo do formData
            const getCampoValue = () => {
              if (campo === 'valor') {
                return formData.tipo === 'H+Al' ? formData.h_al : formData.valor
              } else if (campo === 'diluicao') return formData.diluicao
              else if (campo === 'massa') return formData.massa
              else if (campo === 'branco') return formData.branco
              else if (campo === 'al') return formData.al
              else if (campo === 'h_al') return formData.h_al
              else if (campo === 'param_a') return formData.param_a
              else if (campo === 'param_b') return formData.param_b
              else if (campo === 'massa_b_foliar') return formData.massaB
              else if (campo === 'dil_b') return formData.dilB
              else if (campo === 'branco_b') return formData.brancoB
              else if (campo === 'massa_n') return formData.massaN
              else if (campo === 'volume_n') return formData.volumeN
              else if (campo === 'branco_n') return formData.brancoN
              else if (campo === 'fator_f') return formData.fatorF
              else if (campo === 'massa_geral') return formData.massaGeral
              else if (campo === 'massa_tris_r1') return formData.massaTrisR1
              else if (campo === 'massa_tris_r2') return formData.massaTrisR2
              else if (campo === 'massa_tris_r3') return formData.massaTrisR3
              else if (campo === 'volume_tit_r1') return formData.volumeTitR1
              else if (campo === 'volume_tit_r2') return formData.volumeTitR2
              else if (campo === 'volume_tit_r3') return formData.volumeTitR3
              else if (campo === 'agrossa') return formData.agrossa
              else if (campo === 'afina') return formData.afina
              else if (campo === 'silte_argila') return formData.silte_argila
              else if (campo === 'argila') return formData.argila
              else if (campo === 'agrossa_part') return formData.agrossa_part
              else if (campo === 'afina_part') return formData.afina_part
              else if (campo === 'silte_argila_part') return formData.silte_argila_part
              else if (campo === 'argila_part') return formData.argila_part
              else if (campo === 'tfsa') return formData.tfsa
              else if (campo === 'mlata') return formData.mlata
              else if (campo === 'mlata_su') return formData.mlata_su
              else if (campo === 'mlata_ss') return formData.mlata_ss
              return ''
            }
            
            // Função para atualizar o valor do campo
            const handleCampoChange = (value: string) => {
              // Sempre atualizar o formData para permitir edição
              if (campo === 'valor') {
                if (formData.tipo === 'H+Al') {
                  setFormData(prev => ({ ...prev, h_al: value }))
                } else {
                  setFormData(prev => ({ ...prev, valor: value }))
                }
              } else if (campo === 'diluicao') setFormData(prev => ({ ...prev, diluicao: value }))
              else if (campo === 'massa') setFormData(prev => ({ ...prev, massa: value }))
              else if (campo === 'branco') setFormData(prev => ({ ...prev, branco: value }))
              else if (campo === 'al') setFormData(prev => ({ ...prev, al: value }))
              else if (campo === 'h_al') setFormData(prev => ({ ...prev, h_al: value }))
              else if (campo === 'param_a') setFormData(prev => ({ ...prev, param_a: value }))
              else if (campo === 'param_b') setFormData(prev => ({ ...prev, param_b: value }))
              else if (campo === 'massa_b_foliar') setFormData(prev => ({ ...prev, massaB: value }))
              else if (campo === 'dil_b') setFormData(prev => ({ ...prev, dilB: value }))
              else if (campo === 'branco_b') setFormData(prev => ({ ...prev, brancoB: value }))
              else if (campo === 'massa_n') setFormData(prev => ({ ...prev, massaN: value }))
              else if (campo === 'volume_n') setFormData(prev => ({ ...prev, volumeN: value }))
              else if (campo === 'branco_n') setFormData(prev => ({ ...prev, brancoN: value }))
              else if (campo === 'fator_f') setFormData(prev => ({ ...prev, fatorF: value }))
              else if (campo === 'massa_geral') setFormData(prev => ({ ...prev, massaGeral: value }))
              else if (campo === 'massa_tris_r1') setFormData(prev => ({ ...prev, massaTrisR1: value }))
              else if (campo === 'massa_tris_r2') setFormData(prev => ({ ...prev, massaTrisR2: value }))
              else if (campo === 'massa_tris_r3') setFormData(prev => ({ ...prev, massaTrisR3: value }))
              else if (campo === 'volume_tit_r1') setFormData(prev => ({ ...prev, volumeTitR1: value }))
              else if (campo === 'volume_tit_r2') setFormData(prev => ({ ...prev, volumeTitR2: value }))
              else if (campo === 'volume_tit_r3') setFormData(prev => ({ ...prev, volumeTitR3: value }))
              else if (campo === 'agrossa') setFormData(prev => ({ ...prev, agrossa: value }))
              else if (campo === 'afina') setFormData(prev => ({ ...prev, afina: value }))
              else if (campo === 'silte_argila') setFormData(prev => ({ ...prev, silte_argila: value }))
              else if (campo === 'argila') setFormData(prev => ({ ...prev, argila: value }))
              else if (campo === 'agrossa_part') setFormData(prev => ({ ...prev, agrossa_part: value }))
              else if (campo === 'afina_part') setFormData(prev => ({ ...prev, afina_part: value }))
              else if (campo === 'silte_argila_part') setFormData(prev => ({ ...prev, silte_argila_part: value }))
              else if (campo === 'argila_part') setFormData(prev => ({ ...prev, argila_part: value }))
              else if (campo === 'tfsa') setFormData(prev => ({ ...prev, tfsa: value }))
              else if (campo === 'mlata') setFormData(prev => ({ ...prev, mlata: value }))
              else if (campo === 'mlata_su') setFormData(prev => ({ ...prev, mlata_su: value }))
              else if (campo === 'mlata_ss') setFormData(prev => ({ ...prev, mlata_ss: value }))
            }
            
                    const valorLancado = getValorLancado(formData.tipo, campo)
                    const temValorLancado = valorLancado !== null && valorLancado !== undefined && valorLancado !== ''
                    
                    return (
                      <div key={campo}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {temValorLancado && '🟠 '}{getCampoLabel(campo)} {isRequired && '*'}
                          {campo === 'fator_f' && fatorFCalculado && (
                            <span className="text-xs text-green-600 ml-2">
                      (Calculado: {fatorFCalculado})
                    </span>
                  )}
                          {temValorLancado && (
                            <span className="text-xs text-orange-600 ml-2">
                              (Lançado: {valorLancado})
                            </span>
                          )}
                  </label>
                  <input
                          type="number"
                          step="any"
                          value={getCampoValue()}
                          onChange={(e) => handleCampoChange(e.target.value)}
                          readOnly={campo === 'fator_f'}
                          className={`input w-full text-sm ${temValorLancado ? 'border-orange-300 bg-orange-50' : ''} ${campo === 'fator_f' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder={campo === 'fator_f' ? 'Campo calculado automaticamente' : `Digite ${getCampoLabel(campo).toLowerCase()}${temValorLancado ? ` (atual: ${valorLancado})` : ''}`}
                        />
                        {errors[campo] && <p className="text-red-500 text-xs mt-1">{errors[campo]}</p>}
                </div>
                    )
                  })}
                </div>
                </div>
            )}

            {/* Informações Adicionais */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Informações Adicionais
              </h3>
              <div className="grid grid-cols-1 gap-4">
          {/* Data da Análise */}
          <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
              Data da Análise
            </label>
            <input
              type="date"
              value={formData.dataAnalise}
              onChange={(e) => setFormData(prev => ({ ...prev, dataAnalise: e.target.value }))}
                    className="input w-full text-sm"
            />
          </div>

          {/* Observações */}
          <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    className="input w-full text-sm"
              rows={3}
              placeholder="Digite observações (opcional)"
            />
                </div>
              </div>
          </div>

          {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              {isEditingExisting && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-secondary"
                >
                  Excluir
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createResultado.isLoading || updateResultado.isLoading}
              >
                {createResultado.isLoading || updateResultado.isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  isEditingExisting ? 'Atualizar' : 'Criar'
                )}
              </button>
          </div>
        </form>

        {/* Modal de confirmação de exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Exclusão</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir este resultado? Esta ação não pode ser desfeita.
              </p>
                <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                    className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                    className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

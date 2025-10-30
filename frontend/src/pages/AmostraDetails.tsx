import { useParams } from 'react-router-dom'
import { useAmostra, useUpdateAmostra } from '../hooks/useAmostras'
import { useResultadosByAmostra, useAmostraStatus, useDeleteResultado } from '../hooks/useResultados'
import { ResultadoForm } from '../components/ResultadoForm'
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Clock, Save, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { Resultado } from '../../../shared/types'
import toast from 'react-hot-toast'
import { useModule } from '../contexts/ModuleContext'

export function AmostraDetails() {
  const { id } = useParams<{ id: string }>()
  const { data: amostra, isLoading } = useAmostra(id!)
  const { data: resultadosBrutos, isLoading: isLoadingResultados } = useResultadosByAmostra(id!)
  const updateAmostra = useUpdateAmostra()
  const { modulo, setModulo } = useModule()
  
  const [isEditingTipos, setIsEditingTipos] = useState(false)
  const [tiposAnalise, setTiposAnalise] = useState({
    rotina: false,
    organica: false,
    micronutrientes: false,
    enxofre: false,
    prem: false,
    nitrogenio: false,
    granulometria: false
  })
  
  // Sincronizar módulo global com o módulo da amostra
  useEffect(() => {
    if (amostra?.tipoAnalise && amostra.tipoAnalise !== modulo) {
      setModulo(amostra.tipoAnalise as any)
    }
  }, [amostra?.tipoAnalise, modulo, setModulo])
  
  // Filtrar resultados para não mostrar Al separado quando já existe H+Al
  const resultados = useMemo(() => {
    if (!resultadosBrutos) return []
    
    // Não filtrar por módulo - mostrar todos os resultados da amostra
    let resultadosFiltrados = [...resultadosBrutos]
    
    // Log específico para Determinação F
    const determinacaoF = resultadosFiltrados.find(r => r.tipo === 'DETERMINACAO_F');
    if (determinacaoF) {
      // Determinação F encontrada
    } else {
    }
    
    const temHAl = resultadosFiltrados.some(r => r.tipo === 'H+Al')
    
    if (temHAl) {
      // Se tem H+Al, remover resultados separados de Al
      resultadosFiltrados = resultadosFiltrados.filter(r => r.tipo !== 'Al')
    }
    
    return resultadosFiltrados
  }, [resultadosBrutos])
  
  // Inicializar tipos de análise quando a amostra carregar
  useEffect(() => {
    if (amostra) {
      setTiposAnalise({
        rotina: amostra.rotina,
        organica: amostra.organica,
        micronutrientes: amostra.micronutrientes,
        enxofre: amostra.enxofre,
        prem: amostra.prem,
        nitrogenio: amostra.nitrogenio || false,
        granulometria: amostra.granulometria || false
      })
    }
  }, [amostra])
  const { data: amostraStatus } = useAmostraStatus(id!)
  const deleteResultado = useDeleteResultado()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingResultado, setEditingResultado] = useState<Resultado | undefined>()

  // Mapeamento dos tipos de análise para os tipos de resultado baseado no módulo
  const analiseToResultadoMap = useMemo(() => {
    if (modulo === 'foliar') {
      return {
        rotina: ['P', 'K', 'Ca', 'Mg'], // Removido pH, Na e H+Al para foliar
        micronutrientes: ['Fe', 'Zn', 'Cu', 'Mn', 'B'],
        organica: ['MO'],
        enxofre: ['S'],
        prem: ['PREM'],
        nitrogenio: ['N', 'MASSA_GERAL', 'DETERMINACAO_F']
      }
    } else {
      return {
        rotina: ['pH', 'P', 'Na', 'K', 'H+Al', 'Ca', 'Mg'],
        micronutrientes: ['Fe', 'Zn', 'Cu', 'Mn', 'B'],
        organica: ['MO'],
        enxofre: ['S'],
        prem: ['PREM'],
        nitrogenio: ['N', 'MASSA_GERAL', 'DETERMINACAO_F'],
        granulometria: ['GRAN_MASSA_RECIPIENTES', 'GRAN_MASSA_RECIPIENTES_PARTICULAS', 'GRAN_MASSA_FATOR_F']
      }
    }
  }, [modulo])

  // Calcular progresso da amostra
  const progressoAmostra = useMemo(() => {
    if (!amostra || !resultados) return { total: 0, completos: 0, percentual: 0 }

    const tiposNecessarios: string[] = []
    
    if (amostra.rotina) tiposNecessarios.push(...analiseToResultadoMap.rotina)
    if (amostra.micronutrientes) tiposNecessarios.push(...analiseToResultadoMap.micronutrientes)
    if (amostra.organica) tiposNecessarios.push(...analiseToResultadoMap.organica)
    if (amostra.enxofre) tiposNecessarios.push(...analiseToResultadoMap.enxofre)
    if (amostra.prem) tiposNecessarios.push(...analiseToResultadoMap.prem)
    if (amostra.nitrogenio) tiposNecessarios.push(...analiseToResultadoMap.nitrogenio)
    if (amostra.granulometria && analiseToResultadoMap.granulometria) tiposNecessarios.push(...analiseToResultadoMap.granulometria)

    // Log específico para verificar se Determinação F está nos tipos necessários

    const tiposComResultado = resultados.map(r => r.tipo)
    const completos = tiposNecessarios.filter(tipo => tiposComResultado.includes(tipo)).length
    const percentual = tiposNecessarios.length > 0 ? Math.round((completos / tiposNecessarios.length) * 100) : 0

    return {
      total: tiposNecessarios.length,
      completos,
      percentual,
      tiposNecessarios,
      tiposComResultado
    }
  }, [amostra, resultados])

  const handleDeleteResultado = async (resultadoId: string) => {
    if (confirm('Tem certeza que deseja excluir este resultado?')) {
      try {
        await deleteResultado.mutateAsync(resultadoId)
      } catch (error) {
        console.error('Erro ao deletar resultado:', error)
      }
    }
  }

  const handleSaveTiposAnalise = async () => {
    if (!amostra) return
    
    try {
      await updateAmostra.mutateAsync({
        id: amostra.id,
        data: tiposAnalise
      })
      setIsEditingTipos(false)
      toast.success('Tipos de análise atualizados com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar tipos de análise')
    }
  }

  const handleCancelEditTipos = () => {
    if (amostra) {
      setTiposAnalise({
        rotina: amostra.rotina,
        organica: amostra.organica,
        micronutrientes: amostra.micronutrientes,
        enxofre: amostra.enxofre,
        prem: amostra.prem,
        nitrogenio: amostra.nitrogenio || false,
        granulometria: amostra.granulometria || false
      })
    }
    setIsEditingTipos(false)
  }

  // Função para mapear tipos granulométricos para nomes amigáveis
  const getTipoDisplayName = (tipo: string) => {
    const tipoMap: { [key: string]: string } = {
      'GRAN_MASSA_RECIPIENTES': 'Massa dos Recipientes',
      'GRAN_MASSA_RECIPIENTES_PARTICULAS': 'Massa dos Recipientes + Partículas',
      'GRAN_MASSA_FATOR_F': 'Fator F (Umidade)',
      'pH': 'pH',
      'P': 'Fósforo (P)',
      'Na': 'Sódio (Na)',
      'K': 'Potássio (K)',
      'H+Al': 'H+Al',
      'Ca': 'Cálcio (Ca)',
      'Mg': 'Magnésio (Mg)',
      'Fe': 'Ferro (Fe)',
      'Zn': 'Zinco (Zn)',
      'Cu': 'Cobre (Cu)',
      'Mn': 'Manganês (Mn)',
      'B': 'Boro (B)',
      'MO': 'Matéria Orgânica',
      'S': 'Enxofre (S)',
      'PREM': 'PREM',
      'N': 'Nitrogênio (N)',
      'DETERMINACAO_F': 'Determinação F',
      'MASSA_GERAL': 'Massa Geral'
    }
    return tipoMap[tipo] || tipo
  }

  // Função para formatar valores granulométricos
  const getValorDisplay = (resultado: Resultado) => {
    // Para tipos granulométricos, mostrar informações específicas
    if (resultado.tipo === 'GRAN_MASSA_RECIPIENTES') {
      const campos = []
      if (resultado.massaRecipienteAreiaGrossa !== null && resultado.massaRecipienteAreiaGrossa !== undefined) {
        campos.push(`A.Grossa: ${resultado.massaRecipienteAreiaGrossa}`)
      }
      if (resultado.massaRecipienteAreiaFina !== null && resultado.massaRecipienteAreiaFina !== undefined) {
        campos.push(`A.Fina: ${resultado.massaRecipienteAreiaFina}`)
      }
      if (resultado.massaRecipienteSilteArgila !== null && resultado.massaRecipienteSilteArgila !== undefined) {
        campos.push(`Silte+Argila: ${resultado.massaRecipienteSilteArgila}`)
      }
      if (resultado.massaRecipienteArgila !== null && resultado.massaRecipienteArgila !== undefined) {
        campos.push(`Argila: ${resultado.massaRecipienteArgila}`)
      }
      return campos.length > 0 ? campos.join(', ') : '-'
    }
    
    if (resultado.tipo === 'GRAN_MASSA_RECIPIENTES_PARTICULAS') {
      const campos = []
      if (resultado.massaRecipientePartAreiaGrossa !== null && resultado.massaRecipientePartAreiaGrossa !== undefined) {
        campos.push(`A.Grossa: ${resultado.massaRecipientePartAreiaGrossa}`)
      }
      if (resultado.massaRecipientePartAreiaFina !== null && resultado.massaRecipientePartAreiaFina !== undefined) {
        campos.push(`A.Fina: ${resultado.massaRecipientePartAreiaFina}`)
      }
      if (resultado.massaRecipientePartSilteArgila !== null && resultado.massaRecipientePartSilteArgila !== undefined) {
        campos.push(`Silte+Argila: ${resultado.massaRecipientePartSilteArgila}`)
      }
      if (resultado.massaRecipientePartArgila !== null && resultado.massaRecipientePartArgila !== undefined) {
        campos.push(`Argila: ${resultado.massaRecipientePartArgila}`)
      }
      if (resultado.tfsa !== null && resultado.tfsa !== undefined) {
        campos.push(`TFSA: ${resultado.tfsa}`)
      }
      return campos.length > 0 ? campos.join(', ') : '-'
    }
    
    if (resultado.tipo === 'GRAN_MASSA_FATOR_F') {
      const campos = []
      if (resultado.massaLata !== null && resultado.massaLata !== undefined) {
        campos.push(`M.Lata: ${resultado.massaLata}`)
      }
      if (resultado.massaLataSu !== null && resultado.massaLataSu !== undefined) {
        campos.push(`M.Lata+Su: ${resultado.massaLataSu}`)
      }
      if (resultado.massaLataSs !== null && resultado.massaLataSs !== undefined) {
        campos.push(`M.Lata+Ss: ${resultado.massaLataSs}`)
      }
      return campos.length > 0 ? campos.join(', ') : '-'
    }
    
    // Para outros tipos, mostrar todos os campos relevantes
    const campos = []
    
    // Para Determinação F, não mostrar valor principal se há campos específicos
    if (resultado.tipo === 'DETERMINACAO_F') {
      // Verificar se há campos específicos preenchidos
      const temCamposEspecificos = (
        (resultado.massaTrisR1 !== null && resultado.massaTrisR1 !== undefined) ||
        (resultado.massaTrisR2 !== null && resultado.massaTrisR2 !== undefined) ||
        (resultado.massaTrisR3 !== null && resultado.massaTrisR3 !== undefined) ||
        (resultado.volumeTitR1 !== null && resultado.volumeTitR1 !== undefined) ||
        (resultado.volumeTitR2 !== null && resultado.volumeTitR2 !== undefined) ||
        (resultado.volumeTitR3 !== null && resultado.volumeTitR3 !== undefined)
      )
      
      // Só mostrar valor principal se não há campos específicos preenchidos
      if (!temCamposEspecificos && resultado.valor !== null && resultado.valor !== undefined && resultado.valor !== '') {
        campos.push(`Valor: ${resultado.valor}`)
      }
    } else {
      // Valor principal para outros tipos
      if (resultado.valor !== null && resultado.valor !== undefined && resultado.valor !== '') {
        campos.push(`Valor: ${resultado.valor}`)
      }
    }
    
    // Diluição (para tipos que têm)
    if (['P', 'Na', 'K', 'Ca', 'Mg', 'Fe', 'Zn', 'Cu', 'Mn', 'Al', 'PREM', 'N', 'S'].includes(resultado.tipo)) {
      if (resultado.diluicao !== null && resultado.diluicao !== undefined && resultado.diluicao !== '') {
        campos.push(`Diluição: ${resultado.diluicao}`)
      }
    }
    
    // Massa (para MO)
    if (resultado.tipo === 'MO' && resultado.massa !== null && resultado.massa !== undefined && resultado.massa !== '') {
      campos.push(`Massa: ${resultado.massa}`)
    }
    
    // Branco (para MO, S, B)
    if (['MO', 'S'].includes(resultado.tipo) && resultado.branco !== null && resultado.branco !== undefined && resultado.branco !== '') {
      campos.push(`Branco: ${resultado.branco}`)
    }
    
    // Branco B (para Boro no módulo foliar)
    if (resultado.tipo === 'B' && resultado.brancoBFoliar !== null && resultado.brancoBFoliar !== undefined) {
      campos.push(`Branco B: ${resultado.brancoBFoliar}`)
    }
    
    // Diluição B (para Boro no módulo foliar) - aceita dilB (prioritário) e diluicaoBFoliar
    if (resultado.tipo === 'B') {
      if (resultado.dilB !== null && resultado.dilB !== undefined) {
        campos.push(`Diluição B: ${resultado.dilB}`)
      } else if (resultado.diluicaoBFoliar !== null && resultado.diluicaoBFoliar !== undefined) {
        campos.push(`Diluição B: ${resultado.diluicaoBFoliar}`)
      }
    }
    
    // Al, H+Al e Branco (para H+Al)
    if (resultado.tipo === 'H+Al') {
      if (resultado.al !== null && resultado.al !== undefined && resultado.al !== '') {
        campos.push(`Al: ${resultado.al}`)
      }
      if (resultado.h_al !== null && resultado.h_al !== undefined && resultado.h_al !== '') {
        campos.push(`H+Al: ${resultado.h_al}`)
      }
      if (resultado.branco !== null && resultado.branco !== undefined && resultado.branco !== '') {
        campos.push(`Branco: ${resultado.branco}`)
      }
    }
    
    // Massa B (para Boro no módulo foliar)
    if (resultado.tipo === 'B' && resultado.massaBFoliar !== null && resultado.massaBFoliar !== undefined) {
      campos.push(`Massa B: ${resultado.massaBFoliar}`)
    }
    
    // Campos do Nitrogênio (para módulo foliar)
    if (resultado.tipo === 'N') {
      if (resultado.massaN !== null && resultado.massaN !== undefined) {
        campos.push(`Massa N: ${resultado.massaN}`)
      }
      if (resultado.volumeN !== null && resultado.volumeN !== undefined) {
        campos.push(`Volume N: ${resultado.volumeN}`)
      }
      if (resultado.brancoN !== null && resultado.brancoN !== undefined) {
        campos.push(`Branco N: ${resultado.brancoN}`)
      }
      if (resultado.fatorF !== null && resultado.fatorF !== undefined) {
        campos.push(`Fator F: ${resultado.fatorF}`)
      }
    }
    
    // Campos da Determinação F (para módulo foliar)
    if (resultado.tipo === 'DETERMINACAO_F') {
      const determinacaoCampos = []
      if (resultado.massaTrisR1 !== null && resultado.massaTrisR1 !== undefined) {
        determinacaoCampos.push(`Massa Tris R1: ${resultado.massaTrisR1}`)
      }
      if (resultado.massaTrisR2 !== null && resultado.massaTrisR2 !== undefined) {
        determinacaoCampos.push(`Massa Tris R2: ${resultado.massaTrisR2}`)
      }
      if (resultado.massaTrisR3 !== null && resultado.massaTrisR3 !== undefined) {
        determinacaoCampos.push(`Massa Tris R3: ${resultado.massaTrisR3}`)
      }
      if (resultado.volumeTitR1 !== null && resultado.volumeTitR1 !== undefined) {
        determinacaoCampos.push(`Volume Tit R1: ${resultado.volumeTitR1}`)
      }
      if (resultado.volumeTitR2 !== null && resultado.volumeTitR2 !== undefined) {
        determinacaoCampos.push(`Volume Tit R2: ${resultado.volumeTitR2}`)
      }
      if (resultado.volumeTitR3 !== null && resultado.volumeTitR3 !== undefined) {
        determinacaoCampos.push(`Volume Tit R3: ${resultado.volumeTitR3}`)
      }
      if (determinacaoCampos.length > 0) {
        campos.push(...determinacaoCampos)
      }
    }
    
    // Parâmetros A e B (para P, S, B, PREM, N)
    if (['P', 'S', 'B', 'PREM', 'N'].includes(resultado.tipo)) {
      if (resultado.param_a !== null && resultado.param_a !== undefined && resultado.param_a !== '') {
        campos.push(`Parâmetro A: ${resultado.param_a}`)
      } else {
      }
      if (resultado.param_b !== null && resultado.param_b !== undefined && resultado.param_b !== '') {
        campos.push(`Parâmetro B: ${resultado.param_b}`)
      } else {
      }
    }
    
    return campos.length > 0 ? campos.join(', ') : '-'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="card">
            <div className="card-content">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!amostra) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Amostra não encontrada</h2>
        <Link to="/amostras" className="btn btn-primary">
          Voltar para Amostras
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/amostras" className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{amostra.codigo}</h1>
          <p className="text-gray-600">{amostra.identificacao}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-header py-2">
            <h3 className="card-title text-sm">Informações da Amostra</h3>
          </div>
          <div className="card-content space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Código:</span>
              <span className="text-sm text-gray-900">{amostra.codigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Identificação:</span>
              <span className="text-sm text-gray-900">{amostra.identificacao}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Cultura:</span>
              <span className="text-sm text-gray-900">{amostra.cultura}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Localidade:</span>
              <span className="text-sm text-gray-900">{amostra.localidade || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Status:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                amostra.status === 'concluida' ? 'bg-green-100 text-green-800' :
                amostra.status === 'em_analise' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {amostra.status === 'concluida' ? 'Concluída' :
                 amostra.status === 'em_analise' ? 'Em Análise' :
                 'Pendente'}
              </span>
            </div>
          </div>
        </div>

        {/* Seção de Progresso */}
        <div className="card">
          <div className="card-header py-2">
            <h3 className="card-title text-sm flex items-center">
              {amostraStatus?.completa ? (
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              ) : (
                <Clock className="w-4 h-4 text-blue-500 mr-2" />
              )}
              Progresso da Análise
            </h3>
          </div>
          <div className="card-content">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">
                  {progressoAmostra.completos} de {progressoAmostra.total} concluídas
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {progressoAmostra.percentual}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    progressoAmostra.percentual === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progressoAmostra.percentual}%` }}
                ></div>
              </div>

              {progressoAmostra.total > 0 && progressoAmostra.tiposNecessarios && progressoAmostra.tiposComResultado && (
                <div className="text-xs text-gray-600">
                  <div className="grid grid-cols-2 gap-1">
                    {progressoAmostra.tiposNecessarios
                      .sort((a, b) => {
                        // Ordenar: pendentes primeiro, depois concluídas
                        const aCompleto = progressoAmostra.tiposComResultado.includes(a)
                        const bCompleto = progressoAmostra.tiposComResultado.includes(b)
                        
                        if (aCompleto && !bCompleto) return 1
                        if (!aCompleto && bCompleto) return -1
                        return 0
                      })
                      .slice(0, 6)
                      .map((tipo, index) => (
                      <div key={index} className="flex items-center">
                        {progressoAmostra.tiposComResultado.includes(tipo) ? (
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-400 mr-1" />
                        )}
                        <span className={progressoAmostra.tiposComResultado.includes(tipo) ? 'text-green-700' : 'text-gray-500'}>
                          {tipo}
                        </span>
                      </div>
                    ))}
                    {progressoAmostra.tiposNecessarios.length > 6 && (
                      <div className="text-gray-400 text-xs">
                        +{progressoAmostra.tiposNecessarios.length - 6} mais
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header py-2">
            <h3 className="card-title text-sm">Cliente</h3>
          </div>
          <div className="card-content space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Nome:</span>
              <span className="text-sm text-gray-900">{amostra.lote?.cliente?.nome || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">CPF:</span>
              <span className="text-sm text-gray-900">{amostra.lote?.cliente?.cpf || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Email:</span>
              <span className="text-sm text-gray-900">{amostra.lote?.cliente?.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Telefone:</span>
              <span className="text-sm text-gray-900">{amostra.lote?.cliente?.telefone || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tipos de Análise</h3>
        </div>
        <div className="card-content">
          {isEditingTipos ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tiposAnalise.rotina}
                    onChange={(e) => setTiposAnalise(prev => ({ ...prev, rotina: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="font-medium text-sm">Rotina</h4>
                    <p className="text-xs text-gray-500">Análise básica</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tiposAnalise.micronutrientes}
                    onChange={(e) => setTiposAnalise(prev => ({ ...prev, micronutrientes: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="font-medium text-sm">Micronutrientes</h4>
                    <p className="text-xs text-gray-500">Micronutrientes</p>
                  </div>
                </label>
                
                {modulo === 'solo' && (
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tiposAnalise.organica}
                      onChange={(e) => setTiposAnalise(prev => ({ ...prev, organica: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="font-medium text-sm">Matéria Orgânica</h4>
                      <p className="text-xs text-gray-500">M.O.</p>
                    </div>
                  </label>
                )}
                
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tiposAnalise.enxofre}
                    onChange={(e) => setTiposAnalise(prev => ({ ...prev, enxofre: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="font-medium text-sm">Enxofre</h4>
                    <p className="text-xs text-gray-500">Enxofre</p>
                  </div>
                </label>
                
                {modulo === 'solo' && (
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tiposAnalise.prem}
                      onChange={(e) => setTiposAnalise(prev => ({ ...prev, prem: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="font-medium text-sm">PREM</h4>
                      <p className="text-xs text-gray-500">PREM</p>
                    </div>
                  </label>
                )}
                
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tiposAnalise.nitrogenio}
                    onChange={(e) => setTiposAnalise(prev => ({ ...prev, nitrogenio: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="font-medium text-sm">Nitrogênio</h4>
                    <p className="text-xs text-gray-500">N</p>
                  </div>
                </label>
                
                {modulo === 'solo' && (
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tiposAnalise.granulometria}
                      onChange={(e) => setTiposAnalise(prev => ({ ...prev, granulometria: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="font-medium text-sm">Granulométrica</h4>
                      <p className="text-xs text-gray-500">Análise granulométrica</p>
                    </div>
                  </label>
                )}
              </div>
              
              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveTiposAnalise}
                  className="btn btn-primary btn-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </button>
                <button
                  onClick={handleCancelEditTipos}
                  className="btn btn-outline btn-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className={`p-4 rounded-lg border-2 ${amostra.rotina ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <h4 className="font-medium text-sm">Rotina</h4>
                  <p className="text-xs text-gray-500">Análise básica</p>
                </div>
                <div className={`p-4 rounded-lg border-2 ${amostra.micronutrientes ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <h4 className="font-medium text-sm">Micronutrientes</h4>
                  <p className="text-xs text-gray-500">Micronutrientes</p>
                </div>
                {modulo === 'solo' && (
                  <div className={`p-4 rounded-lg border-2 ${amostra.organica ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <h4 className="font-medium text-sm">Matéria Orgânica</h4>
                    <p className="text-xs text-gray-500">M.O.</p>
                  </div>
                )}
                <div className={`p-4 rounded-lg border-2 ${amostra.enxofre ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <h4 className="font-medium text-sm">Enxofre</h4>
                  <p className="text-xs text-gray-500">Enxofre</p>
                </div>
                {modulo === 'solo' && (
                  <div className={`p-4 rounded-lg border-2 ${amostra.prem ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <h4 className="font-medium text-sm">PREM</h4>
                    <p className="text-xs text-gray-500">PREM</p>
                  </div>
                )}
                <div className={`p-4 rounded-lg border-2 ${amostra.nitrogenio ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <h4 className="font-medium text-sm">Nitrogênio</h4>
                  <p className="text-xs text-gray-500">N</p>
                </div>
                {modulo === 'solo' && (
                  <div className={`p-4 rounded-lg border-2 ${amostra.granulometria ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <h4 className="font-medium text-sm">Granulométrica</h4>
                    <p className="text-xs text-gray-500">Análise granulométrica</p>
                  </div>
                )}
              </div>
              
              {/* Botão para editar tipos de análise */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsEditingTipos(true)}
                  className="btn btn-outline btn-sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Tipos de Análise
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Seção de Resultados */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Resultados da Análise</h3>
            <button
              onClick={() => {
                if (!amostra) {
                  toast.error('Amostra ainda não foi carregada')
                  return
                }
                setEditingResultado(undefined)
                setIsFormOpen(true)
              }}
              className="btn btn-primary btn-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Resultado
            </button>
          </div>
        </div>
        <div className="card-content">
          {isLoadingResultados ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando resultados...</p>
            </div>
          ) : (() => {
            return resultados && resultados.length > 0;
          })() ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    return resultados.map((resultado) => {
                      // Log específico para Determinação F
                      if (resultado.tipo === 'DETERMINACAO_F') {
                        // Determinação F encontrada
                      }
                      return (
                      <tr key={resultado.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getTipoDisplayName(resultado.tipo)}
                        </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getValorDisplay(resultado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resultado.dataAnalise ? new Date(resultado.dataAnalise).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingResultado(resultado)
                              setIsFormOpen(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResultado(resultado.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteResultado.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum resultado encontrado para esta amostra.</p>
              <button
                onClick={() => {
                  if (!amostra) {
                    toast.error('Amostra ainda não foi carregada')
                    return
                  }
                  setEditingResultado(undefined)
                  setIsFormOpen(true)
                }}
                className="btn btn-primary btn-sm mt-4"
              >
                Adicionar Primeiro Resultado
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Formulário de Resultado */}
      <ResultadoForm
        amostraId={id!}
        resultado={editingResultado}
        resultadosExistentes={resultados || []}
        amostra={amostra ? {
          rotina: amostra.rotina,
          organica: amostra.organica,
          micronutrientes: amostra.micronutrientes,
          enxofre: amostra.enxofre,
          prem: amostra.prem,
          nitrogenio: amostra.nitrogenio,
          granulometria: amostra.granulometria
        } : undefined}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingResultado(undefined)
        }}
        onSuccess={() => {
          // Os resultados serão recarregados automaticamente pelo React Query
        }}
      />
    </div>
  )
}



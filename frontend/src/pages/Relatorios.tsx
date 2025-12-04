import { useState } from 'react'
import { FileText, Download, Filter, Eye, BarChart3, Users, DollarSign, TrendingUp } from 'lucide-react'
import { useRelatorioGeral, useRelatorioCliente, useRelatorioCultura, useRelatorioFinanceiro, useRelatorioEstatisticas, useRelatorioCompleto, useSalvarRelatorio, useHistoricoRelatorios, RelatorioFilters } from '../hooks/useRelatorios'
import { exportRelatorioGeral, exportRelatorioCliente, exportRelatorioCultura, exportRelatorioFinanceiro, exportRelatorioEstatisticas, exportRelatorioCompleto } from '../utils/excelExport'
import { CulturaAutocomplete } from '../components/CulturaAutocomplete'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'

export function Relatorios() {
  const { modulo, getModuleInfo } = useModule()
  const currentModule = getModuleInfo(modulo)
  
  const [filters, setFilters] = useState<RelatorioFilters>({
    dataInicio: '',
    dataFim: '',
    localidade: '',
    cultura: '',
  })
  
  const [activeReport, setActiveReport] = useState<string | null>(null)
  const [filtersApplied, setFiltersApplied] = useState<RelatorioFilters>({})

  // Hooks para os relatórios - só habilitados quando necessário
  const relatorioGeral = useRelatorioGeral(filtersApplied, activeReport === 'geral')
  const relatorioCliente = useRelatorioCliente(filtersApplied, activeReport === 'cliente')
  const relatorioCultura = useRelatorioCultura(filtersApplied, activeReport === 'cultura')
  const relatorioFinanceiro = useRelatorioFinanceiro(filtersApplied, activeReport === 'financeiro')
  const relatorioEstatisticas = useRelatorioEstatisticas(filtersApplied, activeReport === 'estatisticas')
  const relatorioCompleto = useRelatorioCompleto(filtersApplied, activeReport === 'completo')
  const salvarRelatorio = useSalvarRelatorio()
  const historicoRelatorios = useHistoricoRelatorios()

  const handleApplyFilters = () => {
    setFiltersApplied(filters)
    toast.success('Filtros aplicados com sucesso!')
  }

  const handleClearFilters = () => {
    setFilters({
      dataInicio: '',
      dataFim: '',
      localidade: '',
      cultura: '',
    })
    setFiltersApplied({})
    setActiveReport(null)
    toast.success('Filtros limpos!')
  }

  const handleGenerateReport = (reportType: string) => {
    // Se os filtros ainda não foram aplicados, aplicar automaticamente
    if (Object.keys(filtersApplied).length === 0 || Object.values(filtersApplied).every(v => !v)) {
      setFiltersApplied(filters)
    }
    setActiveReport(reportType)
    toast.success(`Visualizando relatório ${reportType}...`)
  }

  const handleSaveReport = async (reportType: string) => {
    try {
      const relatorioData = getRelatorioData(reportType)
      if (relatorioData) {
        const nomeRelatorio = `Relatório ${reportType} - ${new Date().toLocaleDateString('pt-BR')}`
        await salvarRelatorio.mutateAsync({
          tipo: reportType,
          nome: nomeRelatorio,
          filtros: filtersApplied,
          dados: relatorioData
        })
        toast.success('Relatório salvo no histórico!')
      }
    } catch (error) {
      console.error('Erro ao salvar relatório:', error)
      toast.error('Erro ao salvar relatório')
    }
  }

  const handleExportReport = (reportType: string) => {
    try {
      const relatorioData = getRelatorioData(reportType)
      if (!relatorioData) {
        toast.error('Nenhum dado disponível para exportar')
        return
      }

      switch (reportType) {
        case 'geral':
          exportRelatorioGeral(relatorioData)
          break
        case 'cliente':
          exportRelatorioCliente(relatorioData)
          break
        case 'cultura':
          exportRelatorioCultura(relatorioData)
          break
        case 'financeiro':
          exportRelatorioFinanceiro(relatorioData)
          break
        case 'estatisticas':
          exportRelatorioEstatisticas(relatorioData)
          break
        case 'completo':
          exportRelatorioCompleto(relatorioData)
          break
        default:
          toast.error('Tipo de relatório não suportado')
          return
      }
      
      toast.success(`Relatório ${reportType} exportado com sucesso!`)
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      toast.error('Erro ao exportar relatório')
    }
  }

  const getRelatorioData = (reportType: string) => {
    switch (reportType) {
      case 'geral':
        return relatorioGeral.data
      case 'cliente':
        return relatorioCliente.data
      case 'cultura':
        return relatorioCultura.data
      case 'financeiro':
        return relatorioFinanceiro.data
      case 'estatisticas':
        return relatorioEstatisticas.data
      case 'completo':
        return relatorioCompleto.data
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios - {currentModule.nome}</h1>
          <p className="text-gray-600">Gere relatórios das análises realizadas</p>
        </div>
        <button className="btn btn-primary btn-md flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </button>
      </div>

      {/* Filters */}
      <div className="card border-emerald-300">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                className="input w-full"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                className="input w-full"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Localidade
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="Digite a localidade"
                value={filters.localidade}
                onChange={(e) => setFilters({ ...filters, localidade: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cultura
              </label>
              <CulturaAutocomplete
                value={filters.cultura || ''}
                onChange={(value) => setFilters({ ...filters, cultura: value })}
                placeholder="Digite a cultura"
                className="input w-full"
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button 
              onClick={handleApplyFilters}
              className="btn btn-primary btn-md"
            >
              Aplicar Filtros
            </button>
            <button 
              onClick={handleClearFilters}
              className="btn btn-outline btn-md"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-content">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Relatório Geral</h3>
                <p className="text-sm text-gray-600">Todas as análises do período</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateReport('geral')}
                  className="btn btn-outline btn-sm"
                  disabled={relatorioGeral.isPending && activeReport === 'geral'}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {relatorioGeral.isPending && activeReport === 'geral' ? 'Carregando...' : 'Ver'}
                </button>
                <button
                  onClick={() => handleSaveReport('geral')}
                  className="btn btn-secondary btn-sm"
                  disabled={!relatorioGeral.data}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Salvar
                </button>
                <button
                  onClick={() => handleExportReport('geral')}
                  className="btn btn-primary btn-sm"
                  disabled={!relatorioGeral.data}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-content">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Por Cliente</h3>
                <p className="text-sm text-gray-600">Análises agrupadas por cliente</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateReport('cliente')}
                  className="btn btn-outline btn-sm"
                  disabled={relatorioCliente.isPending && activeReport === 'cliente'}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {relatorioCliente.isPending && activeReport === 'cliente' ? 'Carregando...' : 'Ver'}
                </button>
                <button
                  onClick={() => handleSaveReport('cliente')}
                  className="btn btn-secondary btn-sm"
                  disabled={!relatorioCliente.data}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Salvar
                </button>
                <button
                  onClick={() => handleExportReport('cliente')}
                  className="btn btn-primary btn-sm"
                  disabled={!relatorioCliente.data}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-content">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Por Cultura</h3>
                <p className="text-sm text-gray-600">Análises agrupadas por cultura</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateReport('cultura')}
                  className="btn btn-outline btn-sm"
                  disabled={relatorioCultura.isPending && activeReport === 'cultura'}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {relatorioCultura.isPending && activeReport === 'cultura' ? 'Carregando...' : 'Ver'}
                </button>
                <button
                  onClick={() => handleSaveReport('cultura')}
                  className="btn btn-secondary btn-sm"
                  disabled={!relatorioCultura.data}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Salvar
                </button>
                <button
                  onClick={() => handleExportReport('cultura')}
                  className="btn btn-primary btn-sm"
                  disabled={!relatorioCultura.data}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-content">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Financeiro</h3>
                <p className="text-sm text-gray-600">Relatório de faturamento</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateReport('financeiro')}
                  className="btn btn-outline btn-sm"
                  disabled={relatorioFinanceiro.isPending && activeReport === 'financeiro'}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {relatorioFinanceiro.isPending && activeReport === 'financeiro' ? 'Carregando...' : 'Ver'}
                </button>
                <button
                  onClick={() => handleSaveReport('financeiro')}
                  className="btn btn-secondary btn-sm"
                  disabled={!relatorioFinanceiro.data}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Salvar
                </button>
                <button
                  onClick={() => handleExportReport('financeiro')}
                  className="btn btn-primary btn-sm"
                  disabled={!relatorioFinanceiro.data}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-content">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Estatísticas</h3>
                <p className="text-sm text-gray-600">Dados estatísticos das análises</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateReport('estatisticas')}
                  className="btn btn-outline btn-sm"
                  disabled={relatorioEstatisticas.isPending && activeReport === 'estatisticas'}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {relatorioEstatisticas.isPending && activeReport === 'estatisticas' ? 'Carregando...' : 'Ver'}
                </button>
                <button
                  onClick={() => handleSaveReport('estatisticas')}
                  className="btn btn-secondary btn-sm"
                  disabled={!relatorioEstatisticas.data}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Salvar
                </button>
                <button
                  onClick={() => handleExportReport('estatisticas')}
                  className="btn btn-primary btn-sm"
                  disabled={!relatorioEstatisticas.data}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-content">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Relatório Completo</h3>
                <p className="text-sm text-gray-600">Todas as amostras com resultados calculados</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateReport('completo')}
                  className="btn btn-outline btn-sm"
                  disabled={relatorioCompleto.isPending && activeReport === 'completo'}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {relatorioCompleto.isPending && activeReport === 'completo' ? 'Carregando...' : 'Ver'}
                </button>
                <button
                  onClick={() => handleSaveReport('completo')}
                  className="btn btn-secondary btn-sm"
                  disabled={!relatorioCompleto.data}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Salvar
                </button>
                <button
                  onClick={() => handleExportReport('completo')}
                  className="btn btn-primary btn-sm"
                  disabled={!relatorioCompleto.data}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Relatório Ativo */}
      {activeReport && (
        <div className="card border-emerald-300">
          <div className="card-header">
            <h3 className="card-title">
              Relatório {activeReport === 'geral' ? 'Geral' : 
                        activeReport === 'cliente' ? 'por Cliente' :
                        activeReport === 'cultura' ? 'por Cultura' :
                        activeReport === 'financeiro' ? 'Financeiro' :
                        activeReport === 'estatisticas' ? 'de Estatísticas' :
                        activeReport === 'completo' ? 'Completo' : activeReport}
            </h3>
          </div>
          <div className="card-content">
            {/* Verificar erros */}
            {relatorioGeral.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900">Erro no Relatório Geral</h4>
                <p className="text-red-700">{(relatorioGeral.error as any)?.message || 'Erro desconhecido'}</p>
              </div>
            )}
            
            {relatorioCliente.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900">Erro no Relatório por Cliente</h4>
                <p className="text-red-700">{(relatorioCliente.error as any)?.message || 'Erro desconhecido'}</p>
              </div>
            )}
            
            {relatorioCultura.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900">Erro no Relatório por Cultura</h4>
                <p className="text-red-700">{(relatorioCultura.error as any)?.message || 'Erro desconhecido'}</p>
              </div>
            )}

            {activeReport === 'geral' && !relatorioGeral.isPending && !relatorioGeral.data && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900">Nenhum dado encontrado</h4>
                <p className="text-yellow-700">Não há dados para exibir no relatório geral.</p>
              </div>
            )}

            {activeReport === 'geral' && relatorioGeral.isPending && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando relatório...</span>
              </div>
            )}

            {activeReport === 'geral' && relatorioGeral.data && (
              <div className="space-y-6">
                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900">Total de Lotes</h4>
                    <p className="text-2xl font-bold text-blue-600">{relatorioGeral.data.estatisticas.totalLotes}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900">Total de Amostras</h4>
                    <p className="text-2xl font-bold text-green-600">{relatorioGeral.data.estatisticas.totalAmostras}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900">Total de Resultados</h4>
                    <p className="text-2xl font-bold text-purple-600">{relatorioGeral.data.estatisticas.totalResultados}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900">Status dos Lotes</h4>
                    <div className="text-sm">
                      {relatorioGeral.data.estatisticas.statusCount && Object.entries(relatorioGeral.data.estatisticas.statusCount).map(([status, count]) => (
                        <p key={status} className="text-yellow-700">
                          {status}: {count as number}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tipos de Análise */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Tipos de Análise Solicitados</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {relatorioGeral.data.estatisticas.tiposAnalise && Object.entries(relatorioGeral.data.estatisticas.tiposAnalise).map(([tipo, count]) => (
                      <div key={tipo} className="bg-white p-3 rounded border">
                        <p className="font-medium text-gray-900 capitalize">{tipo}</p>
                        <p className="text-lg font-bold text-blue-600">{count as number}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista de Lotes */}
                <div className="bg-white border rounded-lg">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold text-gray-900">Lotes do Período</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Código</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cliente</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data Entrega</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amostras</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {relatorioGeral.data.dados.map((lote: any) => (
                          <tr key={lote.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{lote.codigo}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{lote.cliente?.nome}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {new Date(lote.dataEntrega).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{lote.amostras?.length || 0}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                lote.status === 'concluido' ? 'bg-green-100 text-green-800' :
                                lote.status === 'em_analise' ? 'bg-blue-100 text-blue-800' :
                                lote.status === 'pago' ? 'bg-purple-100 text-purple-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {lote.status === 'pendente' ? 'Pendente' :
                                 lote.status === 'em_analise' ? 'Em Análise' :
                                 lote.status === 'concluido' ? 'Concluído' : 'Pago'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'cliente' && relatorioCliente.data && (
              <div className="space-y-6">
                <div className="bg-white border rounded-lg">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold text-gray-900">Relatório por Cliente</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cliente</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Lotes</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Amostras</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {relatorioCliente.data.dados.map((clienteData: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{clienteData.cliente.nome}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{clienteData.estatisticas?.totalLotes || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{clienteData.estatisticas?.totalAmostras || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'cultura' && relatorioCultura.data && (
              <div className="space-y-6">
                <div className="bg-white border rounded-lg">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold text-gray-900">Relatório por Cultura</h4>
                    <p className="text-sm text-gray-600 mt-1">Total de culturas: {relatorioCultura.data.totalCulturas || 0} | Total de amostras: {relatorioCultura.data.totalAmostras || 0}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cultura</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Concluídas</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Pendentes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {relatorioCultura.data.culturas && Object.entries(relatorioCultura.data.culturas).map(([cultura, dados]: [string, any], index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{cultura}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{dados.total}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{dados.concluidas}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{dados.pendentes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'financeiro' && relatorioFinanceiro.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900">Total Faturado</h4>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {relatorioFinanceiro.data.estatisticas.totalFaturado?.toFixed(2).replace('.', ',') || '0,00'}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900">Total Pago</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {relatorioFinanceiro.data.estatisticas.totalPago?.toFixed(2).replace('.', ',') || '0,00'}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900">Total Pendente</h4>
                    <p className="text-2xl font-bold text-red-600">
                      R$ {relatorioFinanceiro.data.estatisticas.totalPendente?.toFixed(2).replace('.', ',') || '0,00'}
                    </p>
                  </div>
                </div>
                
                {/* Tabela de dados financeiros */}
                <div className="bg-white border rounded-lg">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold text-gray-900">Detalhamento Financeiro</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Lote</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cliente</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor Base</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Desconto</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor Final</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {relatorioFinanceiro.data.dados.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.codigo}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{item.cliente}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              R$ {item.valorBase.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {item.desconto > 0 ? `${item.desconto}%` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              R$ {item.valorFinal.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.pago 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.pago ? 'Pago' : 'Pendente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'estatisticas' && relatorioEstatisticas.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900">Total de Lotes</h4>
                    <p className="text-2xl font-bold text-blue-600">{relatorioEstatisticas.data.totais.lotes || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900">Total de Amostras</h4>
                    <p className="text-2xl font-bold text-green-600">{relatorioEstatisticas.data.totais.amostras || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900">Total de Clientes</h4>
                    <p className="text-2xl font-bold text-purple-600">{relatorioEstatisticas.data.totais.clientes || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900">Tempo Médio (dias)</h4>
                    <p className="text-2xl font-bold text-yellow-600">{relatorioEstatisticas.data.totais.resultados || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'completo' && relatorioCompleto.data && (
              <div className="space-y-6">
                <div className="bg-white border rounded-lg">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold text-gray-900">Relatório Completo</h4>
                    <p className="text-sm text-gray-600 mt-1">Total de amostras: {relatorioCompleto.data.total || 0}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cultura</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Localidade</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">pH</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">P</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Na</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">K</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ca</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mg</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Al</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">H+Al</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">SB</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">t</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CTC</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">V</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">m</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fe</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cu</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Zn</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mn</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">B</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">S</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">MO</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">PREM</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">N</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {relatorioCompleto.data.dados?.slice(0, 50).map((amostra: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.cultura || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.localidade || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.data || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.ph || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.p || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.na || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.k || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.ca || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.mg || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.al || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.h_al || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.sb || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.t || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.ctc || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.v || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.m || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.fe || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.cu || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.zn || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.mn || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.b || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.s || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.mo || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.prem || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{amostra.n || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {relatorioCompleto.data.dados && relatorioCompleto.data.dados.length > 50 && (
                    <div className="p-4 border-t text-sm text-gray-600">
                      Mostrando 50 de {relatorioCompleto.data.dados.length} amostras. Exporte o relatório para ver todas.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeReport && !relatorioGeral.data && !relatorioCliente.data && !relatorioCultura.data && !relatorioFinanceiro.data && !relatorioEstatisticas.data && !relatorioCompleto.data && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando relatório...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div className="card border-emerald-300">
        <div className="card-header">
          <h3 className="card-title">Relatórios Recentes</h3>
        </div>
        <div className="card-content">
          {historicoRelatorios.isPending ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando relatórios...</p>
            </div>
          ) : historicoRelatorios.data?.relatorios?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum relatório gerado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historicoRelatorios.data?.relatorios?.map((relatorio: any) => (
                <div key={relatorio.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">{relatorio.nome}</h4>
                      <p className="text-sm text-gray-600">
                        Gerado em {new Date(relatorio.createdAt).toLocaleDateString('pt-BR')} às {new Date(relatorio.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setActiveReport(relatorio.tipo)
                        toast.success('Relatório carregado!')
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </button>
                    <button 
                      onClick={() => handleExportReport(relatorio.tipo)}
                      className="btn btn-primary btn-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
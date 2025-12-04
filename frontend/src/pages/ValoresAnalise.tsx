import { useState } from 'react';
import { useValoresAnalise, useUpdateValorAnalise } from '../hooks/useValoresAnalise';
import toast from 'react-hot-toast';
import { DollarSign, Save, Loader2 } from 'lucide-react';

const TIPOS_ANALISE = {
  solo: [
    { key: 'rotina', label: 'Rotina', descricao: 'Análise de rotina' },
    { key: 'organica', label: 'Matéria Orgânica', descricao: 'Análise de matéria orgânica' },
    { key: 'micronutrientes', label: 'Micronutrientes', descricao: 'Análise de micronutrientes' },
    { key: 'prem', label: 'PREM', descricao: 'Análise PREM' },
    { key: 'enxofre', label: 'Enxofre', descricao: 'Análise de enxofre' },
    { key: 'nitrogenio', label: 'Nitrogênio', descricao: 'Análise de nitrogênio' },
    { key: 'granulometria', label: 'Granulometria', descricao: 'Análise granulométrica' },
  ],
  foliar: [
    { key: 'rotina', label: 'Rotina', descricao: 'Análise de rotina' },
    { key: 'organica', label: 'Matéria Orgânica', descricao: 'Análise de matéria orgânica' },
    { key: 'micronutrientes', label: 'Micronutrientes', descricao: 'Análise de micronutrientes' },
    { key: 'prem', label: 'PREM', descricao: 'Análise PREM' },
    { key: 'enxofre', label: 'Enxofre', descricao: 'Análise de enxofre' },
    { key: 'nitrogenio', label: 'Nitrogênio', descricao: 'Análise de nitrogênio' },
    { key: 'granulometria', label: 'Granulometria', descricao: 'Análise granulométrica' },
  ],
};

export function ValoresAnalise() {
  const [moduloSelecionado, setModuloSelecionado] = useState<'solo' | 'foliar'>('solo');
  const [valoresEditados, setValoresEditados] = useState<Record<string, number>>({});
  
  const { data: valoresData, isLoading } = useValoresAnalise();
  const updateValor = useUpdateValorAnalise();

  const valores: Record<string, number> = valoresData?.[moduloSelecionado] || {};
  const tiposAnalise = TIPOS_ANALISE[moduloSelecionado];

  const handleValorChange = (tipo: string, novoValor: string) => {
    const valor = parseFloat(novoValor);
    if (isNaN(valor) || valor < 0) return;
    
    setValoresEditados(prev => ({
      ...prev,
      [tipo]: valor
    }));
  };

  const handleSalvar = async (tipo: string) => {
    const novoValor = valoresEditados[tipo];
    if (novoValor === undefined) return;

    try {
      await updateValor.mutateAsync({
        modulo: moduloSelecionado,
        tipo,
        valor: novoValor
      });
      
      // Remover do estado de edição
      setValoresEditados(prev => {
        const novo = { ...prev };
        delete novo[tipo];
        return novo;
      });
      
      toast.success(`Valor de ${TIPOS_ANALISE[moduloSelecionado].find(t => t.key === tipo)?.label} atualizado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao atualizar valor');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            Valores de Análise
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie os valores dos tipos de análise por módulo
          </p>
        </div>
      </div>

      {/* Seletor de Módulo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setModuloSelecionado('solo');
              setValoresEditados({});
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              moduloSelecionado === 'solo'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Solo
          </button>
          <button
            onClick={() => {
              setModuloSelecionado('foliar');
              setValoresEditados({});
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              moduloSelecionado === 'foliar'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Foliar
          </button>
        </div>
      </div>

      {/* Tabela de Valores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Tipo de Análise
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Descrição
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Valor Atual (R$)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Novo Valor (R$)
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tiposAnalise.map((tipo) => {
                const valorAtual = valores[tipo.key] || 0;
                const valorEditado = valoresEditados[tipo.key];
                const valorExibido = valorEditado !== undefined ? valorEditado : valorAtual;
                const foiEditado = valorEditado !== undefined && valorEditado !== valorAtual;
                const isSaving = updateValor.isPending;

                return (
                  <tr key={tipo.key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{tipo.label}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{tipo.descricao}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        R$ {valorAtual.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorExibido}
                        onChange={(e) => handleValorChange(tipo.key, e.target.value)}
                        className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          foiEditado ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {foiEditado ? (
                          <button
                            onClick={() => handleSalvar(tipo.key)}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Salvar
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">Sem alterações</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> As alterações nos valores serão refletidas imediatamente em todo o sistema, 
          incluindo cálculos de lotes, relatórios financeiros e geração de laudos.
        </p>
      </div>
    </div>
  );
}


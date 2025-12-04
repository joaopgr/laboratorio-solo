import { useState } from 'react';
import { useValoresAnalise, useUpdateValorAnalise } from '../hooks/useValoresAnalise';
import toast from 'react-hot-toast';
import { Edit2, Save, X, Loader2 } from 'lucide-react';

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
    { key: 'micronutrientes', label: 'Micronutrientes', descricao: 'Análise de micronutrientes' },
    { key: 'enxofre', label: 'Enxofre', descricao: 'Análise de enxofre' },
    { key: 'nitrogenio', label: 'Nitrogênio', descricao: 'Análise de nitrogênio' },
  ],
};

export function ValoresAnalise() {
  const [moduloSelecionado, setModuloSelecionado] = useState<'solo' | 'foliar'>('solo');
  const [editandoTipo, setEditandoTipo] = useState<string | null>(null);
  const [valorEditado, setValorEditado] = useState<string>('');
  
  const { data: valoresData, isLoading } = useValoresAnalise();
  const updateValor = useUpdateValorAnalise();

  const valores: Record<string, number> = valoresData?.[moduloSelecionado] || {};
  const tiposAnalise = TIPOS_ANALISE[moduloSelecionado];

  const handleIniciarEdicao = (tipo: string) => {
    const valorAtual = valores[tipo] || 0;
    setEditandoTipo(tipo);
    setValorEditado(valorAtual.toString());
  };

  const handleCancelarEdicao = () => {
    setEditandoTipo(null);
    setValorEditado('');
  };

  const handleSalvar = async (tipo: string) => {
    const novoValor = parseFloat(valorEditado);
    if (isNaN(novoValor) || novoValor < 0) {
      toast.error('Valor inválido');
      return;
    }

    try {
      await updateValor.mutateAsync({
        modulo: moduloSelecionado,
        tipo,
        valor: novoValor
      });
      
      setEditandoTipo(null);
      setValorEditado('');
      
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Valores de Análise</h1>
          <p className="text-gray-600">Gerencie os valores dos tipos de análise por módulo</p>
        </div>
      </div>

      {/* Seletor de Módulo */}
      <div className="card border-emerald-300">
        <div className="card-header">
          <h3 className="card-title">Módulo</h3>
        </div>
        <div className="card-content">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setModuloSelecionado('solo');
                setEditandoTipo(null);
                setValorEditado('');
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all text-base ${
                moduloSelecionado === 'solo'
                  ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => {
                setModuloSelecionado('foliar');
                setEditandoTipo(null);
                setValorEditado('');
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all text-base ${
                moduloSelecionado === 'foliar'
                  ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Foliar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Valores */}
      <div className="card border-emerald-300">
        <div className="card-header">
          <h3 className="card-title">Valores - {moduloSelecionado === 'solo' ? 'Solo' : 'Foliar'}</h3>
        </div>
        <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Análise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor (R$)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Editar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tiposAnalise.map((tipo) => {
                  const valorAtual = valores[tipo.key] || 0;
                  const estaEditando = editandoTipo === tipo.key;
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
                        {estaEditando ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={valorEditado}
                              onChange={(e) => setValorEditado(e.target.value)}
                              className="w-32 px-3 py-2 border border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50"
                              placeholder="0.00"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSalvar(tipo.key)}
                              disabled={isSaving}
                              className="btn btn-primary btn-sm"
                              title="Salvar"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelarEdicao}
                              disabled={isSaving}
                              className="btn btn-outline btn-sm"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            R$ {valorAtual.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {!estaEditando && (
                            <button
                              onClick={() => handleIniciarEdicao(tipo.key)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Editar valor"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
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
      </div>

      {/* Aviso */}
      <div className="card border-emerald-300">
        <div className="card-content">
          <p className="text-sm text-gray-700">
            <strong>Nota:</strong> As alterações nos valores serão refletidas imediatamente em todo o sistema, 
            incluindo cálculos de lotes, relatórios financeiros e geração de laudos. Todas as alterações são registradas na aba "Registro de Atividades".
          </p>
        </div>
      </div>
    </div>
  );
}

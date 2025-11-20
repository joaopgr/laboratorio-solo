import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock,
  Calendar,
  User,
  Flag,
  AlertCircle} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAtividades, useDeleteAtividade, useUpdateAtividadeStatus, AtividadeFilters, Atividade } from '../hooks/useAtividades';
import AtividadeForm from '../components/AtividadeForm';

const PRIORIDADE_COLORS = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800'
};

const PRIORIDADE_ICONS = {
  baixa: Flag,
  media: Flag,
  alta: AlertCircle,
  urgente: AlertCircle
};

const STATUS_COLORS = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-100 text-gray-800'
};

const TIPO_COLORS = {
  tarefa: 'bg-purple-100 text-purple-800',
  aviso: 'bg-orange-100 text-orange-800',
  lembrete: 'bg-blue-100 text-blue-800'
};

export default function Atividades() {
  // Toggle simples para bloquear/desbloquear a página no futuro
  // const BLOQUEAR_PAGINA = true // DESABILITADO TEMPORARIAMENTE - Para reativar, descomente esta linha

  const [showForm, setShowForm] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<'recebidas' | 'criadas'>('recebidas');
  
  // Garantir que filters.modo sempre esteja sincronizado com modoVisualizacao
  const [filters, setFilters] = useState<AtividadeFilters>({
    page: 1,
    limit: 50,
    search: '',
    status: '',
    prioridade: '',
    tipo: '',
    modo: 'recebidas' // Inicializar com o mesmo valor de modoVisualizacao
  });

  const { data: atividadesData, isLoading, error } = useAtividades(filters);
  const deleteAtividade = useDeleteAtividade();
  const updateStatus = useUpdateAtividadeStatus();

  const atividades = atividadesData?.data || [];
  const pagination = atividadesData?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key: keyof AtividadeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || '', page: 1 }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta atividade?')) {
      try {
        await deleteAtividade.mutateAsync(id);
        toast.success('Atividade excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir atividade');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const isOverdue = (prazo: string | undefined) => {
    if (!prazo) return false;
    return new Date(prazo) < new Date();
  };

  const atividadesFiltradas = useMemo(() => {
    return atividades.filter(() => {
      return true; // Todos os filtros são aplicados no backend
    });
  }, [atividades]);

  // Atualizar filtros quando modo de visualização mudar
  // Garantir sincronização imediata na montagem e quando o modo mudar
  useEffect(() => {
    setFilters(prev => {
      // Sempre atualizar se o modo for diferente para garantir sincronização
      if (prev.modo !== modoVisualizacao) {
        return { ...prev, modo: modoVisualizacao, page: 1 };
      }
      return prev;
    });
  }, [modoVisualizacao]);

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
          <p className="text-gray-600">Gerencie tarefas, avisos e lembretes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Atividade
        </button>
      </div>

      {/* Tabs de visualização */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setModoVisualizacao('recebidas')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              modoVisualizacao === 'recebidas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Recebidas
          </button>
          <button
            onClick={() => setModoVisualizacao('criadas')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              modoVisualizacao === 'criadas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Criadas
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {modoVisualizacao === 'recebidas' 
            ? 'Atividades designadas para você como responsável'
            : 'Atividades que você criou e deseja supervisionar'}
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Erro ao carregar atividades: {(error as any).message || 'Erro desconhecido'}
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar atividades..."
                value={filters.search}
                onChange={handleSearch}
                className="input pl-10 w-full"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>

            <select
              value={filters.prioridade}
              onChange={(e) => handleFilterChange('prioridade', e.target.value)}
              className="input"
            >
              <option value="">Todas as prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>

            <select
              value={filters.tipo}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
              className="input"
            >
              <option value="">Todos os tipos</option>
              <option value="tarefa">Tarefa</option>
              <option value="aviso">Aviso</option>
              <option value="lembrete">Lembrete</option>
            </select>

            <button
              onClick={() => setFilters({ page: 1, limit: 50, search: '', status: '', prioridade: '', tipo: '' })}
              className="btn btn-outline btn-md"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Atividades */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {atividadesFiltradas.map((atividade: any) => {
            const PrioridadeIcon = PRIORIDADE_ICONS[atividade.prioridade as keyof typeof PRIORIDADE_ICONS];
            const isOverdueActivity = isOverdue(atividade.prazo) && atividade.status !== 'concluida';

            // Definir cor da borda baseada no status
            const getStatusBorderColor = (status: string) => {
              switch (status) {
                case 'concluida':
                  return 'border-l-4 border-green-500';
                case 'em_andamento':
                  return 'border-l-4 border-blue-500';
                case 'pendente':
                  return 'border-l-4 border-yellow-500';
                case 'cancelada':
                  return 'border-l-4 border-gray-400';
                default:
                  return 'border-l-4 border-yellow-500';
              }
            };

            return (
              <div
                key={atividade.id}
                className={`card ${getStatusBorderColor(atividade.status || 'pendente')} ${
                  isOverdueActivity ? 'border-red-300 bg-red-50' : ''
                }`}
              >
                <div className="card-content">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{atividade.titulo}</h3>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${TIPO_COLORS[atividade.tipo as keyof typeof TIPO_COLORS]}`}>
                        {atividade.tipo}
                      </span>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${PRIORIDADE_COLORS[atividade.prioridade as keyof typeof PRIORIDADE_COLORS]}`}>
                        <PrioridadeIcon className="w-3 h-3" />
                        {atividade.prioridade}
                      </span>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[(atividade.status || 'pendente') as keyof typeof STATUS_COLORS]}`}>
                        {atividade.status ? atividade.status.replace('_', ' ') : 'Pendente'}
                      </span>
                      </div>

                      {atividade.descricao && (
                        <p className="text-gray-600 mb-3">{atividade.descricao}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {atividade.responsavel && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {atividade.responsavel}
                          </div>
                        )}
                        
                        {atividade.prazo && (
                          <div className={`flex items-center gap-1 ${isOverdueActivity ? 'text-red-600 font-medium' : ''}`}>
                            <Calendar className="w-4 h-4" />
                            {formatDate(atividade.prazo)}
                            {isOverdueActivity && <span className="text-red-600">(Vencida)</span>}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Criada em {formatDateTime(atividade.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <select
                        value={atividade.status}
                        onChange={(e) => handleStatusChange(atividade.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluida">Concluída</option>
                        <option value="cancelada">Cancelada</option>
                      </select>

                      <button
                        onClick={() => setEditingAtividade(atividade)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(atividade.id)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {atividadesFiltradas.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <CheckCircle className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-gray-600">Crie uma nova atividade para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* Paginação */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
            disabled={pagination.page <= 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Página {pagination.page} de {pagination.pages}
          </span>
          
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal de Formulário */}
      {(showForm || editingAtividade) && (
        <AtividadeForm
          atividade={editingAtividade}
          onClose={() => {
            setShowForm(false);
            setEditingAtividade(null);
          }}
        />
      )}
      {/* Overlay de bloqueio temporário (FASE 2) - DESABILITADO TEMPORARIAMENTE */}
      {/* Para reativar, descomente o bloco abaixo e a constante BLOQUEAR_PAGINA acima */}
      {/* {BLOQUEAR_PAGINA && (
        <div
          className="absolute inset-0 z-[9999] bg-white/95 flex items-center justify-center p-6"
          style={{ backdropFilter: 'blur(1px)' }}
        >
          <div className="text-center max-w-xl">
            <h2 className="text-2xl font-bold text-gray-900">Em breve</h2>
            <p className="text-gray-600 mt-2">
              Esta área será implementada na FASE 2 de desenvolvimento.
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from 'react';
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
  const [showForm, setShowForm] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null);
  const [filters, setFilters] = useState<AtividadeFilters>({
    page: 1,
    limit: 50,
    search: '',
    status: '',
    prioridade: '',
    tipo: ''
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

  return (
    <>
      {/* Placeholder temporário - FASE 2 */}
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Em breve</h1>
          <p className="text-gray-600 mt-2">Esta área será implementada na FASE 2 de desenvolvimento.</p>
        </div>
      </div>

      {/*
        CONTEÚDO ORIGINAL DA PÁGINA ATIVIDADES (DESABILITADO TEMPORARIAMENTE)
        Para reativar, remova este comentário e o bloco de placeholder acima.

        <div className="p-6"> ... conteúdo original completo ... </div>
      */}
    </>
  );
}
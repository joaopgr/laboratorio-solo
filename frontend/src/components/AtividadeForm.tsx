import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Calendar, User, XCircle} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCreateAtividade, useUpdateAtividade, Atividade, CreateAtividadeData, UpdateAtividadeData } from '../hooks/useAtividades';
import { useUsuarios } from '../hooks/useUsuarios';

interface AtividadeFormProps {
  atividade?: Atividade | null;
  onClose: () => void;
}

// Função para remover acentos e normalizar texto para busca
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export default function AtividadeForm({ atividade, onClose }: AtividadeFormProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'tarefa' as 'tarefa' | 'aviso' | 'lembrete',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    responsavel: '',
    prazo: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchResponsavel, setSearchResponsavel] = useState('');
  const [showResponsavelDropdown, setShowResponsavelDropdown] = useState(false);
  const [responsaveisSelecionados, setResponsaveisSelecionados] = useState<string[]>([]);

  const { data: usuariosData, error: usuariosError, isLoading: usuariosLoading } = useUsuarios();
  const usuarios = Array.isArray(usuariosData) ? usuariosData : [];
  
  // Log para debug
  useEffect(() => {
    if (usuariosError) {
      console.error('❌ Erro ao carregar usuários no AtividadeForm:', usuariosError);
    }
    if (usuarios.length > 0) {
      console.log('✅ Usuários disponíveis no AtividadeForm:', usuarios.length);
    } else if (!usuariosLoading && usuarios.length === 0) {
      console.warn('⚠️ Nenhum usuário carregado no AtividadeForm');
    }
  }, [usuarios, usuariosError, usuariosLoading]);

  const createAtividade = useCreateAtividade();
  const updateAtividade = useUpdateAtividade();

  const isEditing = !!atividade;

  // Filtrar usuários baseado na busca
  const usuariosFiltrados = useMemo(() => {
    if (!searchResponsavel.trim()) {
      return usuarios;
    }
    const searchNormalized = normalizeText(searchResponsavel);
    return usuarios.filter(usuario => 
      normalizeText(usuario.nome).includes(searchNormalized)
    );
  }, [usuarios, searchResponsavel]);

  useEffect(() => {
    if (atividade) {
      const responsaveis = atividade.responsavel ? atividade.responsavel.split(',').map(r => r.trim()) : [];
      setFormData({
        titulo: atividade.titulo,
        descricao: atividade.descricao || '',
        tipo: atividade.tipo,
        prioridade: atividade.prioridade,
        responsavel: atividade.responsavel || '',
        prazo: atividade.prazo ? new Date(atividade.prazo).toISOString().slice(0, 10) : ''
      });
      setResponsaveisSelecionados(responsaveis);
    }
  }, [atividade]);

  // Atualizar formData.responsavel quando responsaveisSelecionados mudar
  useEffect(() => {
    if (responsaveisSelecionados.length > 0) {
      setFormData(prev => ({ ...prev, responsavel: responsaveisSelecionados.join(', ') }));
    } else {
      setFormData(prev => ({ ...prev, responsavel: '' }));
    }
  }, [responsaveisSelecionados]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.responsavel-dropdown-container')) {
        setShowResponsavelDropdown(false);
      }
    };

    if (showResponsavelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showResponsavelDropdown]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const data = {
        ...formData,
        prazo: formData.prazo || undefined
      };

      if (isEditing) {
        const response = await updateAtividade.mutateAsync({
          id: atividade!.id,
          data: data as UpdateAtividadeData
        });
        console.log('Response da atualização:', response);
        toast.success('Atividade atualizada com sucesso!');
      } else {
        const response = await createAtividade.mutateAsync(data as CreateAtividadeData);
        console.log('Response da criação:', response);
        toast.success('Atividade criada com sucesso!');
      }

      // Aguardar um pouco antes de fechar para garantir que as queries foram invalidadas
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      toast.error('Erro ao salvar atividade');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectResponsavel = (nome: string) => {
    if (nome === 'Geral') {
      // Se selecionar Geral, limpar outros e deixar só Geral
      setResponsaveisSelecionados(['Geral']);
    } else {
      // Remover Geral se existir e adicionar o novo nome
      const novosResponsaveis = responsaveisSelecionados.filter(r => r !== 'Geral');
      if (!novosResponsaveis.includes(nome)) {
        setResponsaveisSelecionados([...novosResponsaveis, nome]);
      }
    }
    setSearchResponsavel('');
    setShowResponsavelDropdown(false);
  };

  const handleRemoveResponsavel = (nome: string) => {
    setResponsaveisSelecionados(prev => prev.filter(r => r !== nome));
  };

  const prioridadeOptions = [
    { value: 'baixa', label: 'Baixa', color: 'text-gray-600' },
    { value: 'media', label: 'Média', color: 'text-blue-600' },
    { value: 'alta', label: 'Alta', color: 'text-orange-600' },
    { value: 'urgente', label: 'Urgente', color: 'text-red-600' }
  ];

  const tipoOptions = [
    { value: 'tarefa', label: 'Tarefa', icon: '📋' },
    { value: 'aviso', label: 'Aviso', icon: '⚠️' },
    { value: 'lembrete', label: 'Lembrete', icon: '🔔' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Atividade' : 'Nova Atividade'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.titulo ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Digite o título da atividade"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva os detalhes da atividade (opcional)"
            />
          </div>

          {/* Tipo e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tipoOptions.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.icon} {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => handleInputChange('prioridade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {prioridadeOptions.map((prioridade) => (
                  <option key={prioridade.value} value={prioridade.value}>
                    {prioridade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsável */}
          <div className="relative responsavel-dropdown-container">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Responsável
            </label>
            
            {/* Tags dos responsáveis selecionados */}
            {responsaveisSelecionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {responsaveisSelecionados.map((nome) => (
                  <span
                    key={nome}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {nome}
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsavel(nome)}
                      className="hover:text-blue-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input de busca */}
            <div className="relative">
              <input
                type="text"
                value={searchResponsavel}
                onChange={(e) => {
                  setSearchResponsavel(e.target.value);
                  setShowResponsavelDropdown(true);
                }}
                onFocus={() => setShowResponsavelDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite para buscar usuário (ex: 'fel' para Felipe) ou 'Geral'"
              />
              
              {/* Dropdown de sugestões */}
              {showResponsavelDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* Opção Geral */}
                  {normalizeText('Geral').includes(normalizeText(searchResponsavel)) && (
                    <button
                      type="button"
                      onClick={() => handleSelectResponsavel('Geral')}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-blue-600">Geral</span>
                      <span className="text-xs text-gray-500">(Todos os usuários)</span>
                    </button>
                  )}
                  
                  {/* Lista de usuários */}
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map((usuario) => (
                      <button
                        key={usuario.id}
                        type="button"
                        onClick={() => handleSelectResponsavel(usuario.nome)}
                        disabled={responsaveisSelecionados.includes(usuario.nome)}
                        className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                          responsaveisSelecionados.includes(usuario.nome) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{usuario.nome}</span>
                        {responsaveisSelecionados.includes(usuario.nome) && (
                          <span className="text-xs text-gray-500 ml-auto">(já selecionado)</span>
                        )}
                      </button>
                    ))
                  ) : searchResponsavel.trim() ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Nenhum usuário encontrado
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            
            {/* Instrução */}
            <p className="mt-1 text-xs text-gray-500">
              Selecione um ou mais responsáveis. Use "Geral" para que todos vejam a atividade.
            </p>
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Prazo
            </label>
            <input
              type="date"
              value={formData.prazo}
              onChange={(e) => handleInputChange('prazo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createAtividade.isPending || updateAtividade.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {createAtividade.isPending || updateAtividade.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
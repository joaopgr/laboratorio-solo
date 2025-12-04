import { useState } from 'react';
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario, Usuario, CreateUsuarioData, UpdateUsuarioData } from '../hooks/useUsuarios';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  admin: 'Administrador',
  funcionario: 'Funcionário',
  estagiario: 'Estagiário',
  recepcao: 'Recepção',
  visitante: 'Visitante'
};

export function ControleUsuarios() {
  const [searchInput, setSearchInput] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const { data: usuarios, isLoading } = useUsuarios();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();

  // Filtrar usuários por busca
  const usuariosArray = Array.isArray(usuarios) ? usuarios : [];
  const filteredUsuarios = usuariosArray.filter((usuario: Usuario) => {
    const search = searchInput.toLowerCase();
    return (
      usuario.nome.toLowerCase().includes(search) ||
      usuario.email.toLowerCase().includes(search) ||
      ROLE_LABELS[usuario.role].toLowerCase().includes(search)
    );
  });

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCreateUsuario = () => {
    setEditingUsuario(null);
    setIsFormOpen(true);
  };

  const handleEditUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setIsFormOpen(true);
  };

  const handleDeleteUsuario = async (usuario: Usuario) => {
    if (window.confirm(`Tem certeza que deseja deletar o usuário "${usuario.nome}"?`)) {
      try {
        await deleteUsuario.mutateAsync(usuario.id);
        toast.success('Usuário deletado com sucesso!');
      } catch (error: any) {
        toast.error(error?.response?.data?.error || 'Erro ao deletar usuário');
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUsuario(null);
  };

  const handleSubmitForm = async (formData: CreateUsuarioData | UpdateUsuarioData) => {
    try {
      if (editingUsuario) {
        await updateUsuario.mutateAsync({ id: editingUsuario.id, data: formData });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await createUsuario.mutateAsync(formData as CreateUsuarioData);
        toast.success('Usuário criado com sucesso!');
      }
      handleCloseForm();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Usuários</h1>
          <p className="text-gray-600">Gerencie usuários, senhas e permissões do sistema</p>
        </div>
        <button
          onClick={handleCreateUsuario}
          className="btn btn-primary btn-md flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Busca */}
      <div className="card border-emerald-300">
        <div className="card-header">
          <h3 className="card-title">Buscar Usuário</h3>
        </div>
        <div className="card-content">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou cargo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="card border-emerald-300">
        <div className="card-header">
          <h3 className="card-title">Lista de Usuários</h3>
        </div>
        <div className="card-content p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Senha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {usuario.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-700">
                          {visiblePasswords[usuario.id] ? usuario.senha : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(usuario.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title={visiblePasswords[usuario.id] ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {visiblePasswords[usuario.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : usuario.role === 'funcionario'
                          ? 'bg-blue-100 text-blue-800'
                          : usuario.role === 'estagiario'
                          ? 'bg-green-100 text-green-800'
                          : usuario.role === 'recepcao'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ROLE_LABELS[usuario.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUsuario(usuario)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUsuario(usuario)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar usuário"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulário */}
      {isFormOpen && (
        <UsuarioForm
          usuario={editingUsuario}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
        />
      )}
    </div>
  );
}

// Componente de formulário
interface UsuarioFormProps {
  usuario: Usuario | null;
  onClose: () => void;
  onSubmit: (data: CreateUsuarioData | UpdateUsuarioData) => void;
}

function UsuarioForm({ usuario, onClose, onSubmit }: UsuarioFormProps) {
  const [formData, setFormData] = useState<CreateUsuarioData>({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    senha: usuario?.senha || '',
    role: usuario?.role || 'funcionario',
    ativo: usuario?.ativo !== undefined ? usuario.ativo : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome || !formData.email || !formData.senha) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {usuario ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <input
              type="text"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              minLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              <option value="funcionario">Funcionário</option>
              <option value="estagiario">Estagiário</option>
              <option value="recepcao">Recepção</option>
              <option value="visitante">Visitante</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="ativo" className="ml-2 text-sm font-medium text-gray-700">
              Usuário ativo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {usuario ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


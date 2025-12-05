import { useState, useEffect } from 'react'
import { useCreateCliente, useUpdateCliente } from '../hooks/useClientes'
import { Cliente, CreateClienteData } from '../../../shared/types'
import { X } from 'lucide-react'

interface ClienteFormProps {
  cliente?: Cliente
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  onCancel?: () => void
  asModal?: boolean
}

export function ClienteForm({ cliente, isOpen, onClose, onSuccess, onCancel, asModal = true }: ClienteFormProps) {
  const [formData, setFormData] = useState<CreateClienteData>({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: '',
  })

  const [errors, setErrors] = useState<Partial<CreateClienteData>>({})

  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()

  const isEditing = !!cliente

  // Atualizar formulário quando cliente mudar
  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || '',
        cpf: cliente.cpf || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
      })
    } else {
      // Limpar formulário para novo cliente
      setFormData({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        cidade: '',
        estado: '',
      })
    }
    setErrors({})
  }, [cliente])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    const newErrors: Partial<CreateClienteData> = {}
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }
    
    if (!formData.cidade?.trim()) {
      newErrors.cidade = 'Cidade é obrigatória'
    }
    
    if (!formData.estado?.trim()) {
      newErrors.estado = 'UF é obrigatório'
    }
    
    // Validação obrigatória do CPF
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf)) {
      newErrors.cpf = 'CPF deve estar no formato 000.000.000-00'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Limpar campos vazios antes de enviar
      const dataToSend = {
        ...formData,
        email: formData.email?.trim() || '',
        cpf: formData.cpf?.trim() || '',
        telefone: formData.telefone?.trim() || ''
      }

      if (isEditing) {
        await updateCliente.mutateAsync({
          id: cliente.id,
          data: dataToSend
        })
      } else {
        await createCliente.mutateAsync(dataToSend)
      }
      
      if (!isEditing) {
        setFormData({
          nome: '',
          cpf: '',
          email: '',
          telefone: '',
          cidade: '',
          estado: '',
        })
      }
      setErrors({})
      
      if (onSuccess) {
        onSuccess()
      } else if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
    }
  }

  const handleChange = (field: keyof CreateClienteData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }


  if (asModal && !isOpen) return null

  const formContent = (
    <>
      {asModal && (
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onCancel || onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                className={`input w-full ${errors.nome ? 'border-red-500' : ''}`}
                placeholder="Nome completo"
              />
              {errors.nome && (
                <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                className={`input w-full ${errors.cpf ? 'border-red-500' : ''}`}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {errors.cpf && (
                <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                className="input w-full"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                className={`input w-full ${errors.cidade ? 'border-red-500' : ''}`}
                placeholder="Cidade"
              />
              {errors.cidade && (
                <p className="text-red-500 text-xs mt-1">{errors.cidade}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UF *
              </label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                className={`input w-full ${errors.estado ? 'border-red-500' : ''}`}
                placeholder="UF"
                maxLength={2}
              />
              {errors.estado && (
                <p className="text-red-500 text-xs mt-1">{errors.estado}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel || onClose}
              className="btn btn-secondary"
              disabled={createCliente.isPending || updateCliente.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createCliente.isPending || updateCliente.isPending}
            >
              {createCliente.isPending || updateCliente.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                isEditing ? 'Atualizar' : 'Criar'
              )}
            </button>
          </div>
        </form>
    </>
  )

  if (asModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {formContent}
        </div>
      </div>
    )
  }

  return formContent
}



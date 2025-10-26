import { useParams } from 'react-router-dom'
import { useCliente } from '../hooks/useClientes'
import { ArrowLeft, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ClienteLotes } from '../components/ClienteLotes'
import { useState } from 'react'
import { ClienteForm } from '../components/ClienteForm'

export function ClienteDetails() {
  const { id } = useParams<{ id: string }>()
  const { data: cliente, isLoading } = useCliente(id!)
  const [isEditing, setIsEditing] = useState(false)

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

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cliente não encontrado</h2>
        <Link to="/clientes" className="btn btn-primary">
          Voltar para Clientes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clientes" className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cliente.nome}</h1>
            <p className="text-gray-600">Detalhes do cliente</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-outline flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Informações Pessoais</h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">CPF</label>
              <p className="text-gray-900">{cliente.cpf}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{cliente.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Telefone</label>
              <p className="text-gray-900">{cliente.telefone || '-'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Localização</h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Cidade</label>
              <p className="text-gray-900">{cliente.cidade || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <p className="text-gray-900">{cliente.estado || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lotes de Amostras */}
      <ClienteLotes cliente={cliente} />

      {/* Modal de Edição */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Cliente</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ClienteForm
              cliente={cliente}
              asModal={false}
              onSuccess={() => {
                setIsEditing(false)
                // A página será atualizada automaticamente pelo React Query
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}



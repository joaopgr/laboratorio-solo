import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, User, Users } from 'lucide-react'

const funcionarioSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

const clienteSchema = z.object({
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 11, 'CPF deve ter 11 dígitos'),
})

type FuncionarioLoginData = z.infer<typeof funcionarioSchema>
type ClienteLoginData = z.infer<typeof clienteSchema>

export function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'funcionario' | 'cliente'>('funcionario')
  const { loginFuncionario, loginCliente, loading, user } = useAuth()
  const navigate = useNavigate()

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'cliente') {
        navigate('/cliente', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, loading, navigate])

  const {
    register: registerFuncionario,
    handleSubmit: handleSubmitFuncionario,
    formState: { errors: errorsFuncionario },
  } = useForm<FuncionarioLoginData>({
    resolver: zodResolver(funcionarioSchema),
  })

  const {
    register: registerCliente,
    handleSubmit: handleSubmitCliente,
    formState: { errors: errorsCliente },
  } = useForm<ClienteLoginData>({
    resolver: zodResolver(clienteSchema),
  })

  const onSubmitFuncionario = async (data: FuncionarioLoginData) => {
    try {
      await loginFuncionario(data.email, data.senha)
      navigate('/dashboard')
    } catch (error) {
      // handled in context
    }
  }

  const onSubmitCliente = async (data: ClienteLoginData) => {
    try {
      await loginCliente(data.cpf)
      navigate('/cliente')
    } catch (error) {
      // handled in context
    }
  }

  const isFuncionario = mode === 'funcionario'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">CCAE</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Laboratório de Análises de Solo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Escolha como deseja acessar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('funcionario')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition ${
              isFuncionario
                ? 'bg-primary-600 text-white border-primary-600 shadow-lg'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sou funcionário</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('cliente')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition ${
              !isFuncionario
                ? 'bg-primary-600 text-white border-primary-600 shadow-lg'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Sou cliente</span>
          </button>
        </div>

        {isFuncionario ? (
          <form className="space-y-6" onSubmit={handleSubmitFuncionario(onSubmitFuncionario)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  {...registerFuncionario('email')}
                  type="email"
                  autoComplete="email"
                  className="mt-1 input w-full"
                  placeholder="seu@email.com"
                />
                {errorsFuncionario.email && (
                  <p className="mt-1 text-sm text-red-600">{errorsFuncionario.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="mt-1 relative">
                  <input
                    {...registerFuncionario('senha')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input w-full pr-10"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errorsFuncionario.senha && (
                  <p className="mt-1 text-sm text-red-600">{errorsFuncionario.senha.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar como funcionário
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmitCliente(onSubmitCliente)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <input
                  {...registerCliente('cpf')}
                  type="text"
                  inputMode="numeric"
                  className="mt-1 input w-full"
                  placeholder="000.000.000-00"
                />
                {errorsCliente.cpf && (
                  <p className="mt-1 text-sm text-red-600">{errorsCliente.cpf.message}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Utilize seu CPF como login e senha. Após o acesso inicial, será possível atualizar a senha futuramente.
                </p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar como cliente
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

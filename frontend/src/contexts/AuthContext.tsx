import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Usuario } from '../../../shared/types'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: Usuario | null
  token: string | null
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setToken(storedToken)
        // Simular um usuário para teste
        setUser({
          id: '1',
          nome: 'Usuário Teste',
          email: 'teste@laboratorio.com',
          role: 'admin',
          ativo: true,
          createdAt: new Date().toISOString()
        })
      } else {
        // Se não há token, criar um usuário padrão para teste
        setUser({
          id: '1',
          nome: 'Usuário Teste',
          email: 'teste@laboratorio.com',
          role: 'admin',
          ativo: true,
          createdAt: new Date().toISOString()
        })
        localStorage.setItem('token', 'test-token')
        setToken('test-token')
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, _senha: string) => {
    try {
      setLoading(true)
      
      // Simular login para teste (remover quando o backend estiver funcionando)
      const mockToken = 'mock-token-' + Date.now()
      const mockUser = {
        id: '1',
        nome: 'Usuário Teste',
        email: email,
        role: 'admin' as const,
        ativo: true,
        createdAt: new Date().toISOString()
      }
      
      localStorage.setItem('token', mockToken)
      setToken(mockToken)
      setUser(mockUser)
      
      api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`
      
      toast.success('Login realizado com sucesso!')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    toast.success('Logout realizado com sucesso!')
  }

  const value = {
    user,
    token,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}



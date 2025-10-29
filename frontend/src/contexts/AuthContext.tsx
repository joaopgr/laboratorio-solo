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
        try {
          setToken(storedToken)
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
          
          // Buscar dados do usuário autenticado
          const response = await api.get('/auth/me')
          setUser(response.data)
        } catch (error) {
          // Token inválido, limpar e forçar login
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          delete api.defaults.headers.common['Authorization']
        }
      } else {
        // Sem token, não definir usuário (força login)
        setUser(null)
        setToken(null)
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, senha: string) => {
    try {
      setLoading(true)
      
      // Fazer login real via API
      const response = await api.post('/auth/login', { email, senha })
      const { token, usuario } = response.data
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser({
        ...usuario,
        ativo: true,
        createdAt: new Date().toISOString()
      })
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
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



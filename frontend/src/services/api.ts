import axios from 'axios'

// Garantir que a URL está definida
// Se estiver em produção no Vercel, usar a URL do backend
const isProduction = import.meta.env.MODE === 'production'
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProduction ? 'https://laboratorio-solo-backend.vercel.app/api' : '/api')

console.log('API Base URL:', API_BASE_URL)

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})


// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      const currentPath = window.location.pathname
      // Só redirecionar se não estiver já na página de login
      // Isso evita loops infinitos quando validando token inválido na página de login
      if (currentPath !== '/login') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)



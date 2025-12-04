import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ModuleProvider } from './contexts/ModuleContext'
import { ValoresAnaliseProvider } from './contexts/ValoresAnaliseContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Clientes } from './pages/Clientes'
import { ClienteDetails } from './pages/ClienteDetails'
import { Amostras } from './pages/Amostras'
import { AmostraDetails } from './pages/AmostraDetails'
import { Lotes } from './pages/Lotes'
import { LoteDetails } from './pages/LoteDetails'
import { Resultados } from './pages/Resultados'
import { ResultadoDetails } from './pages/ResultadoDetails'
import { ResultadosCalculados } from './pages/ResultadosCalculados'
import { Relatorios } from './pages/Relatorios'
import { LancamentoResultados } from './pages/LancamentoResultados'
import Atividades from './pages/Atividades'
import { Logs } from './pages/Logs'
import { ClientePortal } from './pages/ClientePortal'
import { ControleUsuarios } from './pages/ControleUsuarios'
import { ValoresAnalise } from './pages/ValoresAnalise'

function App() {
  return (
    <AuthProvider>
      <ModuleProvider>
        <ValoresAnaliseProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/cliente"
            element={
              <ProtectedRoute allowedRoles={['cliente']} redirectTo="/login">
                <ClientePortal />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['admin', 'funcionario', 'estagiario', 'recepcao', 'visitante']} redirectTo="/cliente">
              <Layout />
            </ProtectedRoute>
          }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Rotas principais */}
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetails />} />
          <Route path="amostras" element={<Amostras />} />
          <Route path="amostras/:id" element={<AmostraDetails />} />
          <Route path="lotes" element={<Lotes />} />
          <Route path="lotes/:id" element={<LoteDetails />} />
          <Route path="resultados" element={<Resultados />} />
          <Route path="resultados/:id" element={<ResultadoDetails />} />
          <Route path="resultados-calculados" element={<ResultadosCalculados />} />
          <Route path="lancamento-resultados" element={<LancamentoResultados />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="atividades" element={<Atividades />} />
          <Route path="logs" element={<Logs />} />
          <Route path="controle-usuarios" element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/dashboard">
              <ControleUsuarios />
            </ProtectedRoute>
          } />
          <Route path="valores-analise" element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/dashboard">
              <ValoresAnalise />
            </ProtectedRoute>
          } />
          </Route>
        </Routes>
        </ValoresAnaliseProvider>
      </ModuleProvider>
    </AuthProvider>
  )
}

export default App



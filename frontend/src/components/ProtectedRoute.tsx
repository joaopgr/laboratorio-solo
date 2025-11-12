import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AuthRole } from '../../../shared/types'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: AuthRole[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role as AuthRole)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}



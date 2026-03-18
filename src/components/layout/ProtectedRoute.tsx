import { memo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../ui/Spinner'
import type { UserRole } from '../../types/user'

interface ProtectedRouteProps {
  children:      React.ReactNode
  allowedRoles?: UserRole[]
}

const ProtectedRoute = memo<ProtectedRouteProps>(({ children, allowedRoles }) => {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
})

ProtectedRoute.displayName = 'ProtectedRoute'
export default ProtectedRoute

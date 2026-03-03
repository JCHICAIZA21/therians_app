import { Navigate } from 'react-router-dom';
import { useAuthStore } from './auth.store';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'PARTNER' | 'ADMIN';
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

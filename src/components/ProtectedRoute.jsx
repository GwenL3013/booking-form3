import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function UserRoute({ children }) {
  const { user, isUser } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isUser()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
} 
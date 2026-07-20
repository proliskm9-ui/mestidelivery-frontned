import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import FullPageLoader from '../../components/UI/FullPageLoader';

/** Admin-only guard — redirects to /admin/login */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader variant="generic" />;

  if (!user || role !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import FullPageLoader from '../../components/UI/FullPageLoader';

/** Customer-only guard — redirects guests to /login */
export function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading, needsProfileCompletion } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader variant="generic" />;

  if (!user || needsProfileCompletion) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && role !== 'customer') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

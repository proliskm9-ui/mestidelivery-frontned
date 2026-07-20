import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import FullPageLoader from '../../components/UI/FullPageLoader';

/** Partner-only guard — redirects to /partner/login */
export function PartnerRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader variant="generic" />;

  const partnerId = profile && 'partnerId' in profile ? profile.partnerId : '';

  if (!user || role !== 'partner' || !partnerId) {
    return <Navigate to="/partner/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

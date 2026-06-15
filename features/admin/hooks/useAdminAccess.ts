import { useAuth } from '../../../packages/shared/src/auth/AuthContext';

export function useAdminAccess() {
  const { profile, loading, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && profile?.role === 'admin';

  return {
    isAdmin,
    loading,
    profile,
  };
}
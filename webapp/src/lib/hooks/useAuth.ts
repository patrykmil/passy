import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/lib/stores/userStore';
import { userApi } from '@/lib/api';

export function useAuthInit() {
  const { isAuthenticated, setUser, clearUser } = useUserStore();

  const {
    data: currentUser,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: userApi.getCurrentUser,
    enabled: !isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else if (error && !isAuthenticated) {
      clearUser();
    }
  }, [currentUser, error, isAuthenticated, setUser, clearUser]);

  return {
    isLoading: !isAuthenticated && isLoading,
    isAuthenticated,
    user: useUserStore((state) => state.user),
  };
}

import { useUserStore } from '@/lib/stores/userStore';

export function useEncryption() {
  const { user, isAuthenticated, symetricKey } = useUserStore();

  const needsReauth = isAuthenticated && user && !symetricKey;
  const hasSymetricKey = !!symetricKey;

  return {
    symetricKey,
    hasSymetricKey,
    needsReauth,
  };
}

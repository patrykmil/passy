import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserPublic } from '@/lib/types';
import { authApi } from '@/lib/api';

interface UserState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  symetricKey: string | null;
  privateKey: string | null;
  setUser: (user: UserPublic, symetricKey?: string, privateKey?: string) => void;
  updateUser: (user: UserPublic) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
  setSymetricKey: (key: string) => void;
  setPrivateKey: (key: string) => void;
}

const appStorage = {
  getItem: (name: string) => {
    const userStorage = localStorage.getItem(name);
    const userData = userStorage ? JSON.parse(userStorage) : null;

    const symetricKey = sessionStorage.getItem(`${name}-symetric-key`);
    const privateKey = sessionStorage.getItem(`${name}-private-key`);

    if (userData) {
      userData.state = {
        ...userData.state,
        symetricKey: symetricKey || null,
        privateKey: privateKey || null,
      };
    }

    return JSON.stringify(userData);
  },
  setItem: (name: string, value: string) => {
    const data = JSON.parse(value);

    const symetricKey = data.state?.symetricKey;
    const privateKey = data.state?.privateKey;

    if (symetricKey) {
      sessionStorage.setItem(`${name}-symetric-key`, symetricKey);
    } else {
      sessionStorage.removeItem(`${name}-symetric-key`);
    }

    if (privateKey) {
      sessionStorage.setItem(`${name}-private-key`, privateKey);
    } else {
      sessionStorage.removeItem(`${name}-private-key`);
    }

    if (data.state) {
      delete data.state.symetricKey;
      delete data.state.privateKey;
    }

    localStorage.setItem(name, JSON.stringify(data));
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(`${name}-symetric-key`);
    sessionStorage.removeItem(`${name}-private-key`);
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      symetricKey: null,
      privateKey: null,

      setUser: (user: UserPublic, symetricKey?: string, privateKey?: string) => {
        set({
          user,
          isAuthenticated: true,
          symetricKey: symetricKey || null,
          privateKey: privateKey || null,
        });
      },

      updateUser: (user: UserPublic) => {
        set({ user });
      },

      setSymetricKey: (key: string) => {
        set({ symetricKey: key });
      },

      setPrivateKey: (key: string) => {
        set({ privateKey: key });
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          symetricKey: null,
          privateKey: null,
        });
      },

      logout: async () => {
        try {
          await authApi.logout();

          set({
            user: null,
            isAuthenticated: false,
            symetricKey: null,
            privateKey: null,
          });
        } catch (error) {
          console.error('Logout failed:', error);
          set({
            user: null,
            isAuthenticated: false,
            symetricKey: null,
            privateKey: null,
          });
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => appStorage),
    }
  )
);

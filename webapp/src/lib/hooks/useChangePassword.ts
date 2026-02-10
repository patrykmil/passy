import { authApi, credentialsApi } from '@/lib/api';
import { decryptPassword, deriveKey, encryptPassword } from '@/lib/crypto';
import { useUserStore } from '@/lib/stores/userStore';
import type { ApiError, CredentialPublic } from '@/lib/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface UseChangePasswordReturn {
  changePasswordMutation: ReturnType<
    typeof useMutation<
      void,
      ApiError,
      {
        oldPassword: string;
        newPassword: string;
        encryptedPrivateKey?: string;
      }
    >
  >;
  isSuccess: boolean;
  setIsSuccess: (value: boolean) => void;
  privateKey: string | null;
  user: { username: string } | null;
}

async function reEncryptPersonalCredential(
  cred: CredentialPublic,
  oldKey: string,
  newKey: string
): Promise<{ id: number; password: string } | null> {
  try {
    const decrypted = await decryptPassword(cred.password, oldKey);
    const reEncrypted = await encryptPassword(decrypted, newKey);
    return { id: cred.id, password: reEncrypted };
  } catch (err) {
    console.error(`Failed to re-encrypt credential ${cred.id}:`, err);
    return null;
  }
}

async function reEncryptPersonalCredentials(
  oldKey: string,
  newKey: string
): Promise<void> {
  const allCredentials = await credentialsApi.getMyCredentials();
  const personalCredentials = allCredentials.filter((c) => !c.team_id);

  const results = await Promise.all(
    personalCredentials.map((cred) => reEncryptPersonalCredential(cred, oldKey, newKey))
  );

  const credentialsToUpdate = results.filter(
    (result): result is { id: number; password: string } => result !== null
  );

  if (credentialsToUpdate.length > 0) {
    await credentialsApi.updateCredentialBatch(
      credentialsToUpdate.map((c) => ({ id: c.id, password: c.password }))
    );
  }
}

export function useChangePassword(): UseChangePasswordReturn {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const privateKey = useUserStore((state) => state.privateKey);
  const user = useUserStore((state) => state.user);

  const changePasswordMutation = useMutation<
    void,
    ApiError,
    {
      oldPassword: string;
      newPassword: string;
      encryptedPrivateKey?: string;
    }
  >({
    mutationFn: ({ oldPassword, newPassword, encryptedPrivateKey }) =>
      authApi.changePassword(oldPassword, newPassword, encryptedPrivateKey),
    onSuccess: async (_, { oldPassword, newPassword }) => {
      const oldSymetricKey = deriveKey(oldPassword, user!.username);
      const newSymetricKey = deriveKey(newPassword, user!.username);

      useUserStore.setState({ symetricKey: newSymetricKey });

      try {
        await reEncryptPersonalCredentials(oldSymetricKey, newSymetricKey);
      } catch (err: any) {
        console.error(
          'Failed to fetch or update credentials after password change:',
          err
        );
      }

      setIsSuccess(true);

      setTimeout(() => {
        navigate(-1);
      }, 1000);
    },
    onError: (error: ApiError) => {
      console.error('Changing password failed:', error);
    },
  });

  return { changePasswordMutation, isSuccess, setIsSuccess, privateKey, user };
}

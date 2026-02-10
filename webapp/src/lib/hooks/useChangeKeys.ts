import { authApi, credentialsApi } from '@/lib/api';
import { decryptTeamPassword, encryptTeamPassword } from '@/lib/crypto';
import { useUserStore } from '@/lib/stores/userStore';
import { ApiError } from '@/lib/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

export interface UseChangeKeysReturn {
  changeKeysMutation: ReturnType<
    typeof useMutation<
      void,
      ApiError,
      {
        publicKey: string;
        encryptedPrivateKey: string;
        privateKey: string;
      }
    >
  >;
  isSuccess: boolean;
  setIsSuccess: (value: boolean) => void;
}

export function useChangeKeys(): UseChangeKeysReturn {
  const [isSuccess, setIsSuccess] = useState(false);
  const oldPrivateKey = useUserStore((state) => state.privateKey);

  const changeKeysMutation = useMutation<
    void,
    ApiError,
    {
      publicKey: string;
      encryptedPrivateKey: string;
      privateKey: string;
    }
  >({
    mutationFn: ({ publicKey, encryptedPrivateKey }) =>
      authApi.changeKeys(publicKey, encryptedPrivateKey),
    onSuccess: async (_, { privateKey, publicKey }) => {
      useUserStore.setState({ privateKey: privateKey });

      if (!oldPrivateKey) {
        console.error(
          'Old private key is not available. Cannot re-encrypt credentials.'
        );
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
        }, 1000);
        return;
      }

      try {
        const allCredentials = await credentialsApi.getMyCredentials();
        const teamCredentials = allCredentials.filter((c) => c.team_id);

        const credentialsToUpdate: Array<{ id: number; password: string }> = [];

        for (const cred of teamCredentials) {
          try {
            const decrypted = decryptTeamPassword(cred.password, oldPrivateKey);
            const reEncrypted = encryptTeamPassword(decrypted, publicKey);
            credentialsToUpdate.push({ id: cred.id, password: reEncrypted });
          } catch (err) {
            console.error(
              `Failed to re-encrypt credential ${cred.id}:`,
              err instanceof Error ? err.message : String(err)
            );
          }
        }

        if (credentialsToUpdate.length > 0) {
          await credentialsApi.updateCredentialBatch(
            credentialsToUpdate.map((c) => ({ id: c.id, password: c.password }))
          );
        }
      } catch (err: any) {
        console.error('Failed to fetch or update credentials after key change:', err);
      }

      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
      }, 1000);
    },
    onError: (error: ApiError) => {
      console.error('Changing keys failed:', error);
    },
  });

  return { changeKeysMutation, isSuccess, setIsSuccess };
}

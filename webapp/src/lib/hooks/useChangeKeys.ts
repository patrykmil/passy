import { authApi, credentialsApi } from '@/lib/api';
import { decryptTeamPassword, encryptTeamPassword } from '@/lib/crypto';
import { useUserStore } from '@/lib/stores/userStore';
import type { ApiError, CredentialPublic } from '@/lib/types';
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

function reEncryptTeamCredential(
  cred: CredentialPublic,
  oldPrivateKey: string,
  newPublicKey: string
): { id: number; password: string } | null {
  try {
    const decrypted = decryptTeamPassword(cred.password, oldPrivateKey);
    const reEncrypted = encryptTeamPassword(decrypted, newPublicKey);
    return { id: cred.id, password: reEncrypted };
  } catch (err) {
    console.error(
      `Failed to re-encrypt credential ${cred.id}:`,
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}

async function reEncryptTeamCredentials(
  oldPrivateKey: string,
  newPublicKey: string
): Promise<void> {
  const allCredentials = await credentialsApi.getMyCredentials();
  const teamCredentials = allCredentials.filter((c) => c.team_id);

  const credentialsToUpdate = teamCredentials
    .map((cred) => reEncryptTeamCredential(cred, oldPrivateKey, newPublicKey))
    .filter((result): result is { id: number; password: string } => result !== null);

  if (credentialsToUpdate.length > 0) {
    await credentialsApi.updateCredentialBatch(
      credentialsToUpdate.map((c) => ({ id: c.id, password: c.password }))
    );
  }
}

function flashSuccess(setIsSuccess: (value: boolean) => void, duration = 1000): void {
  setIsSuccess(true);
  setTimeout(() => {
    setIsSuccess(false);
  }, duration);
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
        flashSuccess(setIsSuccess);
        return;
      }

      try {
        await reEncryptTeamCredentials(oldPrivateKey, publicKey);
      } catch (err: any) {
        console.error('Failed to fetch or update credentials after key change:', err);
      }

      flashSuccess(setIsSuccess);
    },
    onError: (error: ApiError) => {
      console.error('Changing keys failed:', error);
    },
  });

  return { changeKeysMutation, isSuccess, setIsSuccess };
}

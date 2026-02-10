import { useState } from 'react';
import { credentialsApi, userApi } from '@/lib/api';
import { useUserStore } from '@/lib/stores/userStore';
import { decryptTeamPassword, encryptTeamPassword } from '@/lib/crypto';
import type { CredentialPublic } from '@/lib/types';

async function shareCredentialWithUser(
  credential: CredentialPublic,
  privateKey: string,
  newUserPublicKey: string,
  teamId: number,
  newUserId: number
): Promise<void> {
  const decryptedPassword = decryptTeamPassword(credential.password, privateKey);
  const reencryptedPassword = encryptTeamPassword(decryptedPassword, newUserPublicKey);

  await credentialsApi.createCredential({
    record_name: credential.record_name,
    url: credential.url,
    login: credential.login,
    password: reencryptedPassword,
    team_id: teamId,
    user_id: newUserId,
    group: credential.group,
  });
}

async function fetchNewUserPublicKey(newUserId: number): Promise<string> {
  const newUser = await userApi.getUserById(newUserId);
  if (!newUser.public_key) {
    throw new Error(`No public key found for user ${newUser.username}`);
  }
  return newUser.public_key;
}

async function getTeamCredentials(teamId: number): Promise<CredentialPublic[]> {
  const allCredentials = await credentialsApi.getMyCredentials();
  return allCredentials.filter((cred) => cred.team_id === teamId);
}

export function useTeamAdminAcceptUser() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { symetricKey, privateKey } = useUserStore();

  const handleAcceptUserToTeam = async (teamId: number, newUserId: number) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!symetricKey || !privateKey) {
        throw new Error('Encryption keys not available. Please log in again.');
      }

      const newUserPublicKey = await fetchNewUserPublicKey(newUserId);
      const teamCredentials = await getTeamCredentials(teamId);

      if (teamCredentials.length === 0) {
        setIsProcessing(false);
        return true;
      }

      for (const credential of teamCredentials) {
        try {
          await shareCredentialWithUser(
            credential,
            privateKey,
            newUserPublicKey,
            teamId,
            newUserId
          );
        } catch (credError: any) {
          console.error(`Failed to re-encrypt credential ${credential.id}:`, credError);
          throw new Error(
            `Failed to share credential "${credential.record_name}": ${credError.message}`
          );
        }
      }

      setIsProcessing(false);
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to process user acceptance';
      setError(errorMsg);
      setIsProcessing(false);
      throw err;
    }
  };

  return {
    isProcessing,
    error,
    handleAcceptUserToTeam,
  };
}

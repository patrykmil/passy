import { useState } from 'react';
import { credentialsApi, userApi } from '@/lib/api';
import { useUserStore } from '@/lib/stores/userStore';
import { decryptTeamPassword, encryptTeamPassword } from '@/lib/crypto';

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

      const newUser = await userApi.getUserById(newUserId);
      if (!newUser.public_key) {
        throw new Error(`No public key found for user ${newUser.username}`);
      }

      const allCredentials = await credentialsApi.getMyCredentials();
      const teamCredentials = allCredentials.filter((cred) => cred.team_id === teamId);

      if (teamCredentials.length === 0) {
        setIsProcessing(false);
        return true;
      }

      for (const credential of teamCredentials) {
        try {
          const decryptedPassword = decryptTeamPassword(
            credential.password,
            privateKey
          );

          const reencryptedPassword = encryptTeamPassword(
            decryptedPassword,
            newUser.public_key
          );

          await credentialsApi.createCredential({
            record_name: credential.record_name,
            url: credential.url,
            login: credential.login,
            password: reencryptedPassword,
            team_id: teamId,
            user_id: newUserId,
            group: credential.group,
          });
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

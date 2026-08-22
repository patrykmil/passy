import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { credentialsApi } from '@/lib/api';
import { useFormValidation } from '@/lib/hooks/useFormValidation';
import { useUserStore } from '@/lib/stores/userStore';
import { encryptPassword, encryptTeamPassword } from '@/lib/crypto';
import {
  buildCredentialData,
  collectTeamMemberIds,
  credentialSchema,
  getMemberPublicKey,
  initialCredentialValues,
} from '@/lib/credentialForm';
import type { CredentialPublic, ApiError } from '@/lib/types';

const generateGroupToken = (size: number): string =>
  [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

async function createTeamCredentials(
  values: { record_name: string; url?: string; login: string; password: string },
  teamId: number,
  memberIds: Set<number>
): Promise<void> {
  const groupToken = generateGroupToken(24);

  const credentialDataList = [];
  for (const memberId of memberIds) {
    const publicKey = await getMemberPublicKey(memberId);
    credentialDataList.push(
      buildCredentialData(values, encryptTeamPassword(values.password, publicKey), {
        team_id: teamId,
        user_id: memberId,
        group: groupToken,
      })
    );
  }

  await credentialsApi.createCredentialBatch(credentialDataList);
}

export function useAddCredential() {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, symetricKey } = useUserStore();

  const form = useFormValidation({
    schema: credentialSchema,
    initialValues: initialCredentialValues,
  });

  const adminTeams = user?.admin_teams || [];

  const createMutation = useMutation<
    CredentialPublic,
    ApiError,
    Parameters<typeof credentialsApi.createCredential>[0]
  >({
    mutationFn: credentialsApi.createCredential,
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/credentials');
      }, 1000);
    },
    onError: (error: ApiError) => {
      console.error('Failed to create credential:', error);
      form.setError(
        'record_name',
        error.detail || 'Failed to create credential. Please try again.'
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.validate()) return;

    if (!symetricKey) {
      form.setError('password', 'Encryption key not available. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const teamId = form.values.team_id;

      if (!teamId) {
        const encryptedPassword = await encryptPassword(
          form.values.password,
          symetricKey
        );
        createMutation.mutate(buildCredentialData(form.values, encryptedPassword));
        return;
      }

      const team = user?.admin_teams.find((t) => t.id === teamId);
      if (!team) {
        form.setError('password', 'Team not found or you are not an admin.');
        setIsSubmitting(false);
        return;
      }

      const memberIds = await collectTeamMemberIds(teamId);
      if (memberIds.size === 0) {
        form.setError('password', 'No team members found.');
        setIsSubmitting(false);
        return;
      }

      await createTeamCredentials(form.values, teamId, memberIds);

      setIsSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        navigate('/credentials');
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create credential:', error);
      form.setError(
        'password',
        error.message || 'Failed to create credential. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const handleTeamChange = (teamId?: number) => {
    form.setValue('team_id', teamId);
  };

  const goToCredentials = () => {
    navigate('/credentials');
  };

  return {
    form,
    adminTeams,
    isSuccess,
    isSubmitting: isSubmitting || createMutation.isPending,
    handleSubmit,
    handleTeamChange,
    goToCredentials,
  };
}

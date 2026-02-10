import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { credentialsApi, teamsApi, userApi } from '@/lib/api';
import { useFormValidation } from '@/lib/hooks/useFormValidation';
import { useUserStore } from '@/lib/stores/userStore';
import { encryptPassword, encryptTeamPassword } from '@/lib/crypto';
import type { CredentialCreate, CredentialPublic, ApiError } from '@/lib/types';

const credentialSchema = z.object({
  record_name: z.string().min(1, 'Record name is required'),
  url: z
    .string()
    .optional()
    .refine((val) => !val || z.url().safeParse(val).success, {
      message: 'Please enter a valid URL',
    }),
  login: z.string().min(1, 'Login is required'),
  password: z.string().min(1, 'Password is required'),
  team_id: z.number().optional(),
});

const generateGroupToken = (size: number): string =>
  [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

export function useAddCredential() {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, symetricKey } = useUserStore();

  const form = useFormValidation({
    schema: credentialSchema,
    initialValues: {
      record_name: '',
      url: '',
      login: '',
      password: '',
      team_id: undefined,
    },
  });

  const adminTeams = user?.admin_teams || [];

  const createMutation = useMutation<CredentialPublic, ApiError, CredentialCreate>({
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

    if (!form.validate()) {
      return;
    }

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

        const credentialData: CredentialCreate = {
          record_name: form.values.record_name,
          url:
            form.values.url && form.values.url.trim() !== ''
              ? form.values.url
              : undefined,
          login: form.values.login,
          password: encryptedPassword,
          team_id: undefined,
        };

        createMutation.mutate(credentialData);
        return;
      }

      const team = user?.admin_teams.find((t) => t.id === teamId);
      if (!team) {
        form.setError('password', 'Team not found or you are not an admin.');
        setIsSubmitting(false);
        return;
      }

      const teamDetails = await teamsApi.getMyTeams();
      const teamDetail = teamDetails.find((t) => t.id === teamId);
      if (!teamDetail) {
        form.setError('password', 'Failed to fetch team details.');
        setIsSubmitting(false);
        return;
      }

      const memberIds = new Set<number>();
      teamDetail.members.forEach((m) => {
        if (m.id) memberIds.add(m.id);
      });
      teamDetail.admins.forEach((a) => {
        if (a.id) memberIds.add(a.id);
      });

      if (memberIds.size === 0) {
        form.setError('password', 'No team members found.');
        setIsSubmitting(false);
        return;
      }

      const groupToken = generateGroupToken(24);

      for (const memberId of memberIds) {
        try {
          const memberUser = await userApi.getUserById(memberId);
          if (!memberUser.public_key) {
            throw new Error(`No public key found for user ${memberUser.username}`);
          }

          const encryptedPassword = encryptTeamPassword(
            form.values.password,
            memberUser.public_key
          );

          const credentialData: CredentialCreate = {
            record_name: form.values.record_name,
            url:
              form.values.url && form.values.url.trim() !== ''
                ? form.values.url
                : undefined,
            login: form.values.login,
            password: encryptedPassword,
            team_id: teamId,
            user_id: memberId,
            group: groupToken,
          };

          await credentialsApi.createCredential(credentialData);
        } catch (error: any) {
          console.error(`Failed to create credential for team member:`, error);
          form.setError(
            'password',
            `Failed to encrypt credential for team member: ${error.message}`
          );
          setIsSubmitting(false);
          return;
        }
      }
      setIsSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        navigate('/credentials');
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create team credential:', error);
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

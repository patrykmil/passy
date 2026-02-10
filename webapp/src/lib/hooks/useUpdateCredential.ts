import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { credentialsApi, teamsApi, userApi } from '@/lib/api';
import { useFormValidation } from '@/lib/hooks/useFormValidation';
import { useUserStore } from '@/lib/stores/userStore';
import {
  encryptPassword,
  encryptTeamPassword,
  decryptPassword,
  decryptTeamPassword,
} from '@/lib/crypto';
import type { CredentialPublic, CredentialUpdate, ApiError } from '@/lib/types';

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

export function useUpdateCredential() {
  const navigate = useNavigate();
  const { id, group } = useParams<{ id?: string; group?: string }>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, symetricKey, privateKey } = useUserStore();

  const isGroupUpdate = !!group;
  const credentialId = id ? parseInt(id, 10) : null;

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

  useEffect(() => {
    const loadCredential = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (isGroupUpdate && group) {
          const credentials = await credentialsApi.getCredentialByGroup(group);

          if (credentials.length === 0) {
            setError('No credentials found for this group');
            return;
          }

          let myCredential: CredentialPublic | null = null;
          for (const cred of credentials) {
            if (cred.user_id === user?.id) {
              myCredential = cred;
              break;
            }
          }

          if (!myCredential) {
            setError('No credential found for the current user in this group');
            return;
          }

          let decryptedPassword = myCredential.password;

          if (myCredential.team_id && privateKey) {
            decryptedPassword = decryptTeamPassword(myCredential.password, privateKey);
          } else if (!myCredential.team_id && symetricKey) {
            decryptedPassword = await decryptPassword(
              myCredential.password,
              symetricKey
            );
          }

          form.setValue('record_name', myCredential.record_name || '');
          form.setValue('url', myCredential.url || '');
          form.setValue('login', myCredential.login || '');
          form.setValue('password', decryptedPassword);
          if (myCredential.team_id) {
            form.setValue('team_id', myCredential.team_id);
          }
        } else if (credentialId) {
          const credential = await credentialsApi.getCredentialById(credentialId);
          let decryptedPassword = credential.password;

          if (credential.team_id && privateKey) {
            decryptedPassword = decryptTeamPassword(credential.password, privateKey);
          } else if (!credential.team_id && symetricKey) {
            decryptedPassword = await decryptPassword(credential.password, symetricKey);
          }

          form.setValue('record_name', credential.record_name || '');
          form.setValue('url', credential.url || '');
          form.setValue('login', credential.login || '');
          form.setValue('password', decryptedPassword);
          if (credential.team_id) {
            form.setValue('team_id', credential.team_id);
          }
        } else {
          setError('Invalid credential ID or group');
        }
      } catch (err: any) {
        console.error('Failed to load credential:', err);
        setError(err.detail || 'Failed to load credential');
      } finally {
        setIsLoading(false);
      }
    };

    loadCredential();
  }, [id, group]);

  const updateMutation = useMutation<CredentialPublic, ApiError, CredentialUpdate>({
    mutationFn: (data) => {
      if (isGroupUpdate && group) {
        return credentialsApi.updateCredentialGroup(group, data);
      } else if (credentialId) {
        return credentialsApi.updateCredentialOne(credentialId, data);
      }
      return Promise.reject(new Error('Invalid credential ID or group'));
    },
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/credentials');
      }, 1000);
    },
    onError: (error: ApiError) => {
      console.error('Failed to update credential:', error);
      form.setError(
        'record_name',
        error.detail || 'Failed to update credential. Please try again.'
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

      if (!window.location.href.includes('update-group')) {
        const encryptedPassword = !teamId
          ? await encryptPassword(form.values.password, symetricKey)
          : encryptTeamPassword(form.values.password, privateKey!);

        const credentialData: CredentialUpdate = {
          record_name: form.values.record_name,
          url:
            form.values.url && form.values.url.trim() !== ''
              ? form.values.url
              : undefined,
          login: form.values.login,
          password: encryptedPassword,
        };

        updateMutation.mutate(credentialData);
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

          const credentialData: CredentialUpdate = {
            record_name: form.values.record_name,
            url:
              form.values.url && form.values.url.trim() !== ''
                ? form.values.url
                : undefined,
            login: form.values.login,
            password: encryptedPassword,
            // team_id: teamId,
            user_id: memberId,
          };

          if (isGroupUpdate && group) {
            await credentialsApi.updateCredentialGroup(group, credentialData);
          } else if (credentialId) {
            await credentialsApi.updateCredentialOne(credentialId, credentialData);
          }
        } catch (error: any) {
          console.error(`Failed to update credential for team member:`, error);
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
      console.error('Failed to update team credential:', error);
      form.setError(
        'password',
        error.message || 'Failed to update credential. Please try again.'
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
    isSubmitting: isSubmitting || updateMutation.isPending,
    isLoading,
    error,
    isGroupUpdate,
    handleSubmit,
    handleTeamChange,
    goToCredentials,
  };
}

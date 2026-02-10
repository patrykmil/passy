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

function buildCredentialData(
  values: { record_name: string; url?: string; login: string },
  encryptedPassword: string,
  extra?: Partial<CredentialCreate>
): CredentialCreate {
  return {
    record_name: values.record_name,
    url: values.url && values.url.trim() !== '' ? values.url : undefined,
    login: values.login,
    password: encryptedPassword,
    ...extra,
  };
}

async function collectTeamMemberIds(teamId: number): Promise<Set<number>> {
  const teamDetails = await teamsApi.getMyTeams();
  const teamDetail = teamDetails.find((t) => t.id === teamId);
  if (!teamDetail) {
    throw new Error('Failed to fetch team details.');
  }

  const memberIds = new Set<number>();
  teamDetail.members.forEach((m) => {
    if (m.id) memberIds.add(m.id);
  });
  teamDetail.admins.forEach((a) => {
    if (a.id) memberIds.add(a.id);
  });
  return memberIds;
}

async function createPersonalCredential(
  values: { record_name: string; url?: string; login: string; password: string },
  symetricKey: string
): Promise<CredentialCreate> {
  const encryptedPassword = await encryptPassword(values.password, symetricKey);
  return buildCredentialData(values, encryptedPassword, { team_id: undefined });
}

async function encryptAndCreateForMember(
  memberId: number,
  values: { record_name: string; url?: string; login: string; password: string },
  teamId: number,
  groupToken: string
): Promise<void> {
  const memberUser = await userApi.getUserById(memberId);
  if (!memberUser.public_key) {
    throw new Error(`No public key found for user ${memberUser.username}`);
  }

  const encryptedPassword = encryptTeamPassword(values.password, memberUser.public_key);
  const credentialData = buildCredentialData(values, encryptedPassword, {
    team_id: teamId,
    user_id: memberId,
    group: groupToken,
  });

  await credentialsApi.createCredential(credentialData);
}

async function createTeamCredentials(
  values: { record_name: string; url?: string; login: string; password: string },
  teamId: number,
  memberIds: Set<number>
): Promise<void> {
  const groupToken = generateGroupToken(24);

  for (const memberId of memberIds) {
    await encryptAndCreateForMember(memberId, values, teamId, groupToken);
  }
}

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

    if (!form.validate()) return;

    if (!symetricKey) {
      form.setError('password', 'Encryption key not available. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const teamId = form.values.team_id;

      if (!teamId) {
        const credentialData = await createPersonalCredential(form.values, symetricKey);
        createMutation.mutate(credentialData);
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

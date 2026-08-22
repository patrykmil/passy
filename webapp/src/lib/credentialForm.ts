import { z } from 'zod';
import { teamsApi, userApi } from '@/lib/api';
import type { CredentialCreate } from '@/lib/types';

export const credentialSchema = z.object({
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

export type CredentialFormValues = {
  record_name: string;
  url?: string;
  login: string;
  password: string;
  team_id?: number;
};

export const initialCredentialValues: CredentialFormValues = {
  record_name: '',
  url: '',
  login: '',
  password: '',
  team_id: undefined,
};

export function buildCredentialData(
  values: CredentialFormValues,
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

export async function collectTeamMemberIds(teamId: number): Promise<Set<number>> {
  const teamDetails = await teamsApi.getMyTeams();
  const teamDetail = teamDetails.find((t) => t.id === teamId);
  if (!teamDetail) throw new Error('Failed to fetch team details.');

  const memberIds = new Set<number>();
  [...teamDetail.members, ...teamDetail.admins].forEach((m) => {
    if (m.id) memberIds.add(m.id);
  });
  return memberIds;
}

export async function getMemberPublicKey(memberId: number): Promise<string> {
  const memberUser = await userApi.getUserById(memberId);
  if (!memberUser.public_key) {
    throw new Error(`No public key found for user ${memberUser.username}`);
  }
  return memberUser.public_key;
}

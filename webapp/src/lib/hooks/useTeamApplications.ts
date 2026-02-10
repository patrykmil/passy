import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api';
import { useTeamAdminAcceptUser } from '@/lib/hooks/useTeamAdminAcceptUser';
import type { TeamApplicationAction } from '@/lib/types';

export function useTeamApplications(teamId?: number) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { handleAcceptUserToTeam } = useTeamAdminAcceptUser();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['teamApplications', teamId],
    queryFn: () =>
      teamId ? teamsApi.getTeamApplications(teamId) : Promise.resolve([]),
    enabled: !!teamId,
  });

  const respondMutation = useMutation({
    mutationFn: async ({
      userId,
      action,
    }: {
      userId: number;
      action: TeamApplicationAction;
    }) => {
      if (!teamId) throw new Error('Team ID is required');

      if (action.action === 'accept') {
        await handleAcceptUserToTeam(teamId, userId);
      }

      return teamsApi.respondToApplication(teamId, userId, action);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamApplications', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.detail || 'Failed to respond to application');
    },
  });

  const respondToApplication = async (
    userId: number,
    action: TeamApplicationAction
  ) => {
    if (!teamId) return;

    respondMutation.mutate({ userId, action });
  };

  return {
    applications,
    isLoading,
    isResponding: respondMutation.isPending,
    error,
    respondToApplication,
  };
}

export function useMyApplications() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: teamsApi.getMyApplications,
  });

  return {
    applications,
    isLoading,
  };
}

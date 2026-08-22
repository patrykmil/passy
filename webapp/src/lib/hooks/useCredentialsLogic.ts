import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { credentialsApi, teamsApi } from '@/lib/api';
import type { CredentialPublic } from '@/lib/types';

function filterBySearch(
  credentials: CredentialPublic[],
  query: string
): CredentialPublic[] {
  const q = query.trim().toLowerCase();
  if (!q) return credentials;

  return credentials.filter((c) =>
    `${c.record_name || ''} ${c.url || ''} ${c.login || ''}`.toLowerCase().includes(q)
  );
}

function groupByOwnership(credentials: CredentialPublic[]) {
  const personal: CredentialPublic[] = [];
  const teams: Record<number, CredentialPublic[]> = {};

  for (const credential of credentials) {
    if (credential.team_id) {
      if (!teams[credential.team_id]) {
        teams[credential.team_id] = [];
      }
      teams[credential.team_id].push(credential);
    } else {
      personal.push(credential);
    }
  }

  return { personal, teams };
}

export function useCredentialsLogic(isAuthenticated: boolean) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const queryClient = useQueryClient();

  const {
    data: credentials,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['credentials'],
    queryFn: credentialsApi.getMyCredentials,
    enabled: isAuthenticated,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getMyTeams,
    enabled: isAuthenticated,
  });

  const deleteOneMutation = useMutation({
    mutationFn: credentialsApi.deleteCredentialOne,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
    onError: (error) => {
      console.error('Failed to delete credential:', error);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: credentialsApi.deleteCredentialGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
    onError: (error) => {
      console.error('Failed to delete credentials:', error);
    },
  });

  const filteredCredentials = useMemo(
    () => filterBySearch(credentials || [], searchQuery),
    [credentials, searchQuery]
  );

  const groupedCredentials = useMemo(
    () => groupByOwnership(filteredCredentials),
    [filteredCredentials]
  );

  const teamsWithCredentials = useMemo(() => {
    if (!teams) return [];

    return teams
      .filter(
        (team) =>
          groupedCredentials.teams[team.id!] &&
          groupedCredentials.teams[team.id!].length > 0
      )
      .map((team) => ({
        ...team,
        credentials: groupedCredentials.teams[team.id!] || [],
      }));
  }, [teams, groupedCredentials.teams]);

  const handleDeleteOne = async (id: number) => {
    deleteOneMutation.mutate(id);
  };

  const handleDeleteGroup = async (group: string) => {
    deleteGroupMutation.mutate(group);
  };

  const scrollToSection = (sectionId: string) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return {
    credentials,
    teams,
    searchQuery,
    setSearchQuery,
    filteredCredentials,
    groupedCredentials,
    teamsWithCredentials,
    error,
    isLoading,
    handleDeleteOne,
    handleDeleteGroup,
    scrollToSection,
    isDeletingOne: deleteOneMutation.isPending,
    isDeletingGroup: deleteGroupMutation.isPending,
  };
}

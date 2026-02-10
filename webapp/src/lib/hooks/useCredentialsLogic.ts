import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { credentialsApi, teamsApi } from '@/lib/api';
import { useScrollToElement } from '@/lib/hooks/useScrollToElement';
import type { CredentialPublic } from '@/lib/types';

export function useCredentialsLogic(isAuthenticated: boolean) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const scrollToElement = useScrollToElement();
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

  const fuzzySearch = (query: string, text: string): number => {
    if (!query) return 1;
    if (!text) return 0;

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    if (textLower.includes(queryLower)) {
      const index = textLower.indexOf(queryLower);
      return 1 - (index / textLower.length) * 0.5;
    }

    let queryIndex = 0;
    let score = 0;

    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
        score += 1;
      }
    }

    const matchRatio = queryIndex / queryLower.length;
    return queryIndex === queryLower.length ? matchRatio * 0.7 : 0;
  };

  const filteredCredentials = useMemo(() => {
    if (!credentials) return [];

    if (!searchQuery.trim()) {
      return credentials;
    }

    return credentials
      .map((credential) => {
        const nameScore = fuzzySearch(searchQuery, credential.record_name || '');
        const urlScore = fuzzySearch(searchQuery, credential.url || '');
        const loginScore = fuzzySearch(searchQuery, credential.login || '');

        const totalScore = nameScore * 0.5 + urlScore * 0.3 + loginScore * 0.2;

        return { ...credential, searchScore: totalScore };
      })
      .filter((credential) => credential.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore);
  }, [credentials, searchQuery]);

  const groupedCredentials = useMemo(() => {
    if (!filteredCredentials) return { personal: [], teams: {} };

    const personal: CredentialPublic[] = [];
    const teamGroups: Record<number, CredentialPublic[]> = {};

    filteredCredentials.forEach((credential) => {
      if (credential.team_id) {
        if (!teamGroups[credential.team_id]) {
          teamGroups[credential.team_id] = [];
        }
        teamGroups[credential.team_id].push(credential);
      } else {
        personal.push(credential);
      }
    });

    return { personal, teams: teamGroups };
  }, [filteredCredentials]);

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
    scrollToElement(sectionId);
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

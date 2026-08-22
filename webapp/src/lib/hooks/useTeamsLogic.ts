import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api';

export function useTeamsLogic() {
  const {
    data: teams = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teams', 'my-teams'],
    queryFn: teamsApi.getMyTeams,
  });

  const scrollToTeam = (teamId: number) => {
    document
      .getElementById(`team-${teamId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return {
    teams,
    isLoading,
    error,
    scrollToTeam,
    refetch,
  };
}

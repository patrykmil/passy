import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api';
import { useScrollToElement } from '@/lib/hooks/useScrollToElement';

export function useTeamsLogic() {
  const scrollToElement = useScrollToElement();

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
    scrollToElement(`team-${teamId}`);
  };

  return {
    teams,
    isLoading,
    error,
    scrollToTeam,
    refetch,
  };
}

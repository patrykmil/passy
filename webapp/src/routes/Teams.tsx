import { useState } from 'react';
import { TeamCard } from '@/components/teams/TeamCard';
import { TeamsSidebar } from '@/components/teams/TeamsSidebar';
import { TeamApplications } from '@/components/teams/TeamApplications';
import { MyApplications } from '@/components/teams/MyApplications';
import { PageLayout } from '@/components/layout/PageLayout';
import { LoadingState } from '@/components/state/LoadingState';
import { ErrorState } from '@/components/state/ErrorState';
import { EmptyState } from '@/components/state/EmptyState';
import { Button } from '@/components/ui/button';
import { useTeamsLogic } from '@/lib/hooks/useTeamsLogic';
import {
  useTeamApplications,
  useMyApplications,
} from '@/lib/hooks/useTeamApplications';
import { useUserStore } from '@/lib/stores/userStore';
import type { TeamDetailed } from '@/lib/types';

interface TeamSelectorButtonsProps {
  teams: TeamDetailed[];
  selectedTeamId: number | undefined;
  onSelect: (teamId: number | undefined) => void;
}

function TeamSelectorButtons({
  teams,
  selectedTeamId,
  onSelect,
}: TeamSelectorButtonsProps) {
  const teamsWithAwaiting = teams.filter(
    (team) => team.awaiting && team.awaiting.length > 0
  );

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Select Team to Manage:</label>
      <div className="flex flex-wrap gap-2">
        {teamsWithAwaiting.map((team) => (
          <Button
            key={team.id}
            variant={selectedTeamId === team.id ? 'default' : 'outline'}
            onClick={() => {
              team.id !== selectedTeamId ? onSelect(team.id) : onSelect(undefined);
            }}
            size="sm"
          >
            {team.name} ({team.awaiting?.length})
          </Button>
        ))}
      </div>
    </div>
  );
}

interface ApplicationsPanelProps {
  selectedTeamId: number | undefined;
  applications: any[];
  isLoading: boolean;
  isResponding: boolean;
  error: string | null;
  onRespond: (applicationId: number, accept: boolean) => void;
}

function ApplicationsPanel({
  selectedTeamId,
  applications,
  isLoading,
  isResponding,
  error,
  onRespond,
}: ApplicationsPanelProps) {
  if (!selectedTeamId) return null;

  if (isLoading) return <LoadingState message="Loading applications..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <TeamApplications
      applications={applications}
      onRespond={onRespond}
      isLoading={isResponding}
    />
  );
}

export default function Teams() {
  const { teams, isLoading, error, scrollToTeam, refetch } = useTeamsLogic();
  const { applications: myApplications, isLoading: myAppsLoading } =
    useMyApplications();
  const { user } = useUserStore();
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined);
  const {
    applications,
    isLoading: appsLoading,
    isResponding,
    respondToApplication,
    error: appsError,
  } = useTeamApplications(selectedTeamId);

  const adminTeams = teams.filter((team) =>
    team.admins?.some((admin) => admin.id === user?.id)
  );
  const isAdmin = adminTeams.length > 0;

  const hasAwaitingTeams = adminTeams.some(
    (team) => team.awaiting && team.awaiting.length > 0
  );

  if (isLoading) {
    return (
      <PageLayout>
        <LoadingState message="Loading teams..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <ErrorState message="Failed to load teams" />
      </PageLayout>
    );
  }

  const sidebar = <TeamsSidebar teams={teams} onTeamClick={scrollToTeam} />;

  return (
    <PageLayout sidebar={sidebar}>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold ">My Teams</h1>
            <div className="flex gap-4">
              <Button asChild>
                <a href="/teams/create">Create Team</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/apply">Apply to Team</a>
              </Button>
            </div>
          </div>

          {myApplications.length > 0 && (
            <div>
              {myAppsLoading ? (
                <LoadingState message="Loading applications..." />
              ) : (
                <MyApplications applications={myApplications} />
              )}
            </div>
          )}

          {isAdmin && hasAwaitingTeams && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold  mb-6">Manage Team Applications</h2>
              <div className="space-y-4">
                <TeamSelectorButtons
                  teams={adminTeams}
                  selectedTeamId={selectedTeamId}
                  onSelect={setSelectedTeamId}
                />

                <ApplicationsPanel
                  selectedTeamId={selectedTeamId}
                  applications={applications}
                  isLoading={appsLoading}
                  isResponding={isResponding}
                  error={appsError}
                  onRespond={respondToApplication}
                />
              </div>
            </div>
          )}

          {teams.length === 0 ? (
            <EmptyState searchQuery="" onClearSearch={() => {}} />
          ) : (
            <div className="space-y-6">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} onTeamUpdate={() => refetch()} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

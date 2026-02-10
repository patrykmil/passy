import { LogOut, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TeamDetailed } from '@/lib/types';
import { useUserStore } from '@/lib/stores/userStore';
import { teamsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function UserAvatar({
  username,
  variant,
}: {
  username: string;
  variant: 'admin' | 'member';
}) {
  const bgClass =
    variant === 'admin'
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted-foreground/20 text-muted-foreground';

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${bgClass}`}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
}

function AdminRow({ username }: { username: string }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-primary/10 rounded-lg">
      <UserAvatar username={username} variant="admin" />
      <div>
        <div className="font-medium text-foreground">{username}</div>
        <div className="text-sm text-primary">Administrator</div>
      </div>
    </div>
  );
}

function MemberRow({
  username,
  memberId,
  isAdmin,
  onKick,
  isKicking,
}: {
  username: string;
  memberId: number;
  isAdmin: boolean;
  onKick: (memberId: number) => void;
  isKicking: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-2 bg-muted rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <UserAvatar username={username} variant="member" />
        <div>
          <div className="font-medium text-foreground">{username}</div>
          <div className="text-sm text-muted-foreground">Member</div>
        </div>
      </div>
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onKick(memberId)}
          disabled={isKicking}
          className="text-destructive hover:text-destructive"
          title="Remove member"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface TeamCardProps {
  team: TeamDetailed;
  onTeamUpdate?: () => void;
}

export function TeamCard({ team, onTeamUpdate }: TeamCardProps) {
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isUserAdmin = user?.admin_teams.some((t) => t.id === team.id);

  const quitTeamMutation = useMutation({
    mutationFn: teamsApi.quitTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onTeamUpdate?.();
    },
    onError: (error) => {
      console.error('Failed to quit team:', error);
      alert('Failed to quit team. Please try again.');
    },
  });

  const kickUserMutation = useMutation({
    mutationFn: teamsApi.kickUserFromTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onTeamUpdate?.();
    },
    onError: (error) => {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    },
  });

  const handleTeamQuit = async () => {
    if (!window.confirm('Are you sure you want to quit this team?')) {
      return;
    }

    quitTeamMutation.mutate(team.id);
  };

  const handleTeamKick = async (memberId: number) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    kickUserMutation.mutate({
      user_id: memberId,
      team_id: team.id,
    });
  };

  return (
    <Card id={`team-${team.id}`} className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{team.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Code: {team.code}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTeamQuit}
              disabled={quitTeamMutation.isPending}
              className="text-destructive hover:text-destructive"
              title="Quit team"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              Admins
              <Badge variant="default" className="text-xs">
                {team.admins.length}
              </Badge>
            </h3>
            {team.admins.length > 0 ? (
              <div className="space-y-2">
                {team.admins.map((admin) => (
                  <AdminRow key={admin.id} username={admin.username} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No admins found</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              Members
              <Badge variant="secondary" className="text-xs">
                {team.members.length}
              </Badge>
            </h3>
            {team.members.length > 0 ? (
              <div className="space-y-2">
                {team.members.map((member) => (
                  <MemberRow
                    key={member.id}
                    username={member.username}
                    memberId={member.id!}
                    isAdmin={!!isUserAdmin}
                    onKick={handleTeamKick}
                    isKicking={kickUserMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                {team.admins.length > 0
                  ? "No regular members or you don't have permission to view them"
                  : 'No members found'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

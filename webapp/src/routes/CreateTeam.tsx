import { ReauthenticationPrompt } from '@/components/auth/ReauthenticationPrompt';
import { PageLayout } from '@/components/layout/PageLayout';
import { SuccessMessage } from '@/components/state/SuccessMessage';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { teamsApi } from '@/lib/api';
import type { TeamDetailed, TeamPublic } from '@/lib/types';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEncryption } from '@/lib/hooks/useEncryption';
import { useUserStore } from '@/lib/stores/userStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function CreateTeam() {
  const { teamName } = useParams<{ teamName: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState(teamName || '');
  const [error, setError] = useState<string | null>(null);
  const { needsReauth } = useEncryption();
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, updateUser } = useUserStore();
  const queryClient = useQueryClient();

  const createTeamMutation = useMutation({
    mutationFn: teamsApi.createTeam,
    onSuccess: (createdTeam: TeamDetailed) => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['teams'] });

      if (user) {
        const newTeam: TeamPublic = {
          id: createdTeam.id,
          code: createdTeam.code,
          name: createdTeam.name,
        };
        const updatedUser = {
          ...user,
          admin_teams: [...user.admin_teams, newTeam],
        };
        updateUser(updatedUser);
      }

      setTimeout(() => {
        navigate('/teams');
      }, 1000);
    },
    onError: (err: any) => {
      setError(err.detail || 'Failed to create team');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a team name');
      return;
    }

    if (needsReauth) {
      return <ReauthenticationPrompt />;
    }

    setError(null);

    createTeamMutation.mutate({ name: name.trim(), admin_id: user?.id ? user.id : 0 });
  };

  return (
    <PageLayout>
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Team</CardTitle>
            <CardDescription>Enter team name</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <SuccessMessage
                message="Team created successfully!"
                description="Redirecting to teams page..."
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="teamName" className="text-sm font-medium">
                    Team Name
                  </label>
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="Enter team name"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    disabled={createTeamMutation.isPending}
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={createTeamMutation.isPending}
                    className="flex-1"
                  >
                    {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/teams')}
                    disabled={createTeamMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

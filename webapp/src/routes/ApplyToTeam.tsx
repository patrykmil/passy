import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { PageLayout } from '@/components/layout/PageLayout';
import { SuccessMessage } from '@/components/state/SuccessMessage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ApplyToTeam() {
  const { teamCode } = useParams<{ teamCode: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState(teamCode || '');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: teamsApi.applyToTeam,
    onSuccess: (result) => {
      if (result.error) {
        setError(result.error);
      } else if (result.message) {
        setSuccessMessage(result.message);
        queryClient.invalidateQueries({ queryKey: ['myApplications'] });
        setTimeout(() => {
          navigate('/teams');
        }, 1000);
      }
    },
    onError: (err: any) => {
      setError(err.detail || 'Failed to apply to team');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a team code');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    applyMutation.mutate(code);
  };

  return (
    <PageLayout>
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Apply to Team</CardTitle>
            <CardDescription>
              Enter the team code to apply for membership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="teamCode" className="text-sm font-medium">
                  Team Code
                </label>
                <Input
                  id="teamCode"
                  type="text"
                  placeholder="Enter team code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={applyMutation.isPending}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
                  {error}
                </div>
              )}

              {successMessage && <SuccessMessage message={successMessage} />}

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="flex-1"
                >
                  {applyMutation.isPending ? 'Applying...' : 'Apply to Team'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/teams')}
                  disabled={applyMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

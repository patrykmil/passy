import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { useUserStore } from '@/lib/stores/userStore';
import { deriveKey, decryptPrivateKey } from '@/lib/crypto';
import type { UserPublic, ApiError } from '@/lib/types';

export function ReauthenticationPrompt() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, setUser } = useUserStore();

  const reauthMutation = useMutation<
    UserPublic,
    ApiError,
    { username: string; password: string }
  >({
    mutationFn: authApi.login,
    onSuccess: async (userData, variables) => {
      const symetricKey = deriveKey(variables.password, variables.username);

      let privateKey: string | undefined;
      if (userData.encrypted_private_key) {
        try {
          privateKey = await decryptPrivateKey(
            userData.encrypted_private_key,
            symetricKey
          );
        } catch (error) {
          console.error('Failed to decrypt private key:', error);
        }
      }

      setUser(userData, symetricKey, privateKey);
      setPassword('');
      setError('');
    },
    onError: (err: ApiError) => {
      setError(err.detail || 'Authentication failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.username) {
      setError('User information not available. Please log in again.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    reauthMutation.mutate({
      username: user.username,
      password: password,
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Re-authentication Required</CardTitle>
          </div>
          <CardDescription>
            For security, your encryption key is not stored. Please enter your password
            to decrypt your credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reauth-email">Email</Label>
                <Input
                  id="reauth-email"
                  type="email"
                  value={user?.username || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reauth-password">Password</Label>
                <Input
                  id="reauth-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={reauthMutation.isPending}
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={reauthMutation.isPending}>
                {reauthMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Unlock'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

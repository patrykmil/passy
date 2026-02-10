import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useFormValidation } from '@/lib/hooks/useFormValidation';
import { useUserStore } from '@/lib/stores/userStore';
import { deriveKey, decryptPrivateKey } from '@/lib/crypto';
import type { UserPublic } from '@/lib/types';

const loginSchema = z.object({
  username: z.email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const form = useFormValidation({
    schema: loginSchema,
    initialValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation<
    UserPublic,
    ApiError,
    { username: string; password: string }
  >({
    mutationFn: authApi.login,
    onSuccess: async (user, variables) => {
      const symetricKey = deriveKey(variables.password, variables.username);

      let privateKey: string | undefined;
      if (user.encrypted_private_key) {
        try {
          privateKey = await decryptPrivateKey(user.encrypted_private_key, symetricKey);
        } catch (error) {
          console.error('Failed to decrypt private key:', error);
        }
      }

      setUser(user, symetricKey, privateKey);
      navigate('/');
    },
    onError: (error: ApiError) => {
      console.error('Login failed:', error);
      form.setError('username', error.detail || 'Login failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.validate()) {
      return;
    }

    loginMutation.mutate({
      username: form.values.username,
      password: form.values.password,
    });
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="Enter your email"
                  value={form.values.username}
                  onChange={form.handleInputChange('username')}
                  aria-invalid={!!form.errors.username}
                  aria-describedby={form.errors.username ? 'username-error' : undefined}
                  required
                />
                {form.errors.username && (
                  <p id="username-error" className="text-sm text-destructive">
                    {form.errors.username}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.values.password}
                  onChange={form.handleInputChange('password')}
                  aria-invalid={!!form.errors.password}
                  aria-describedby={form.errors.password ? 'password-error' : undefined}
                  required
                />
                {form.errors.password && (
                  <p id="password-error" className="text-sm text-destructive">
                    {form.errors.password}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-sm">
        Don't have an account? Try to{' '}
        <a href="/register" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </div>
  );
}

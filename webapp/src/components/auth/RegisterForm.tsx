import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userApi } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useFormValidation } from '@/lib/hooks/useFormValidation';
import { generateKeyPair, encryptPrivateKey, deriveKey } from '@/lib/crypto';
import type { UserCreate, UserPublic } from '@/lib/types';

const registerSchema = z
  .object({
    username: z.email(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(72, 'Password must be less than 72 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ['confirmPassword'],
  });

export function RegisterForm({ className, ...props }: React.ComponentProps<'div'>) {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useFormValidation({
    schema: registerSchema,
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useMutation<UserPublic, ApiError, UserCreate>({
    mutationFn: userApi.register,
    onSuccess: (_) => {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    },
    onError: (error: ApiError) => {
      console.error('Registration failed:', error);
      if (error.status === 400 && error.detail === 'Username already exists') {
        form.setError('username', 'Username already exists');
      } else {
        form.setError(
          'username',
          error.detail || 'Registration failed. Please try again.'
        );
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.validate()) {
      return;
    }

    const { publicKey, privateKey } = generateKeyPair();

    const symetricKey = deriveKey(form.values.password, form.values.username);

    const encryptedPrivateKey = await encryptPrivateKey(privateKey, symetricKey);

    registerMutation.mutate({
      username: form.values.username,
      password: form.values.password,
      public_key: publicKey,
      encrypted_private_key: encryptedPrivateKey,
    });
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="text-green-600 text-lg font-medium mb-2">
                Account created!
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </div>
          ) : (
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
                    aria-describedby={
                      form.errors.username ? 'username-error' : undefined
                    }
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
                    aria-describedby={
                      form.errors.password ? 'password-error' : 'password-help'
                    }
                    required
                  />
                  {form.errors.password ? (
                    <p id="password-error" className="text-sm text-destructive">
                      {form.errors.password}
                    </p>
                  ) : (
                    <p id="password-help" className="text-sm text-muted-foreground"></p>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={form.values.confirmPassword}
                    onChange={form.handleInputChange('confirmPassword')}
                    aria-invalid={!!form.errors.confirmPassword}
                    aria-describedby={
                      form.errors.confirmPassword ? 'confirmPassword-error' : undefined
                    }
                    required
                  />
                  {form.errors.confirmPassword && (
                    <p id="confirmPassword-error" className="text-sm text-destructive">
                      {form.errors.confirmPassword}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Register'
                    )}
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account? Try to{' '}
                <a href="/login" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

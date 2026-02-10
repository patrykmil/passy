import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deriveKey, encryptPrivateKey, generateKeyPair } from '@/lib/crypto';
import { useChangeKeys } from '@/lib/hooks/useChangeKeys';
import { useChangePassword } from '@/lib/hooks/useChangePassword';
import { useFormValidation } from '@/lib/hooks/useFormValidation';
import { useUserStore } from '@/lib/stores/userStore';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Separator } from '@/components/ui/separator';

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old newPassword is required'),
    newPassword: z
      .string()
      .min(6, 'newPassword must be at least 6 characters')
      .max(72, 'newPassword must be less than 72 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "newPasswords don't match",
    path: ['confirmPassword'],
  });

export function ChangeSecurityInfoForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { changePasswordMutation, isSuccess, privateKey, user } = useChangePassword();
  const { changeKeysMutation, isSuccess: isKeysSuccess } = useChangeKeys();
  const symetricKey = useUserStore((state) => state.symetricKey);

  const form = useFormValidation({
    schema: changePasswordSchema,
    initialValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleRefreshKeys = async () => {
    const { publicKey, privateKey: newPrivateKey } = generateKeyPair();
    const encryptedPrivateKey = await encryptPrivateKey(newPrivateKey, symetricKey!);

    changeKeysMutation.mutate({
      publicKey,
      encryptedPrivateKey,
      privateKey: newPrivateKey,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.validate()) {
      return;
    }

    if (!privateKey || !user) {
      form.setError('oldPassword', 'User information not available. Please try again.');
      return;
    }

    const symetricKey = deriveKey(form.values.newPassword, user.username);
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, symetricKey);

    changePasswordMutation.mutate({
      oldPassword: form.values.oldPassword,
      newPassword: form.values.newPassword,
      encryptedPrivateKey: encryptedPrivateKey,
    });

    if (changePasswordMutation.isError) {
      const error = changePasswordMutation.error;
      form.setError(
        'oldPassword',
        error.detail || 'Change password failed. Please try again.'
      );
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Update security information</CardTitle>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="text-green-600 text-lg font-medium mb-2">
                Password has been changed!
              </div>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 p-3">
              <div className="flex flex-col gap-3">
                {isKeysSuccess ? (
                  <div className="text-center py-3">
                    <p className="text-sm text-green-600 font-medium">
                      Keys refreshed successfully!
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={handleRefreshKeys}
                    disabled={changeKeysMutation.isPending}
                  >
                    {changeKeysMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing keys...
                      </>
                    ) : (
                      'Refresh asymmetric keys'
                    )}
                  </Button>
                )}
              </div>
              <Separator />
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="oldPassword">Old Password</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      placeholder="Enter old password"
                      value={form.values.oldPassword}
                      onChange={form.handleInputChange('oldPassword')}
                      aria-invalid={!!form.errors.oldPassword}
                      aria-describedby={
                        form.errors.oldPassword ? 'oldPassword-error' : undefined
                      }
                      required
                    />
                    {form.errors.oldPassword && (
                      <p id="oldPassword-error" className="text-sm text-destructive">
                        {form.errors.oldPassword}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="newPassword">New Password</Label>
                    </div>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={form.values.newPassword}
                      onChange={form.handleInputChange('newPassword')}
                      aria-invalid={!!form.errors.newPassword}
                      aria-describedby={
                        form.errors.newPassword
                          ? 'newPassword-error'
                          : 'newPassword-help'
                      }
                      required
                    />
                    {form.errors.newPassword && (
                      <p id="newPassword-error" className="text-sm text-destructive">
                        {form.errors.newPassword}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new Password"
                      value={form.values.confirmPassword}
                      onChange={form.handleInputChange('confirmPassword')}
                      aria-invalid={!!form.errors.confirmPassword}
                      aria-describedby={
                        form.errors.confirmPassword
                          ? 'confirmPassword-error'
                          : undefined
                      }
                      required
                    />
                    {form.errors.confirmPassword && (
                      <p
                        id="confirmPassword-error"
                        className="text-sm text-destructive"
                      >
                        {form.errors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing password...
                        </>
                      ) : (
                        'Change password'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

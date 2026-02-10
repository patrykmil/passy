import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Key, Eye, EyeOff } from 'lucide-react';
import { TeamSelector } from '@/components/teams/TeamSelector';
import type { TeamPublic } from '@/lib/types';
import { useState } from 'react';

interface CredentialFormProps {
  values: {
    record_name: string;
    url?: string;
    login: string;
    password: string;
    team_id?: number;
  };
  errors: Record<string, string>;
  adminTeams: TeamPublic[];
  isSubmitting: boolean;
  onInputChange: (
    field: 'record_name' | 'url' | 'login' | 'password' | 'team_id'
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTeamChange: (teamId?: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isUpdate?: boolean;
}

export function CredentialForm({
  values,
  errors,
  adminTeams,
  isSubmitting,
  onInputChange,
  onTeamChange,
  onSubmit,
  onCancel,
  isUpdate = false,
}: CredentialFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const generatePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const syntheticEvent = {
      target: { value: password },
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange('password')(syntheticEvent);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-3">
          <Label htmlFor="record_name">Record Name *</Label>
          <Input
            id="record_name"
            type="text"
            placeholder="e.g., My Gmail Account"
            value={values.record_name}
            onChange={onInputChange('record_name')}
            aria-invalid={!!errors.record_name}
            aria-describedby={errors.record_name ? 'record_name-error' : undefined}
            required
          />
          {errors.record_name && (
            <p id="record_name-error" className="text-sm text-destructive">
              {errors.record_name}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <Label htmlFor="url">Website URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="e.g., https://gmail.com"
            value={values.url || ''}
            onChange={onInputChange('url')}
            aria-invalid={!!errors.url}
            aria-describedby={errors.url ? 'url-error' : undefined}
          />
          {errors.url && (
            <p id="url-error" className="text-sm text-destructive">
              {errors.url}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <Label htmlFor="login">Login/Username *</Label>
          <Input
            id="login"
            type="text"
            placeholder="Enter your login or username"
            value={values.login}
            onChange={onInputChange('login')}
            aria-invalid={!!errors.login}
            aria-describedby={errors.login ? 'login-error' : undefined}
            required
          />
          {errors.login && (
            <p id="login-error" className="text-sm text-destructive">
              {errors.login}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <Label htmlFor="password">Password *</Label>
          <div className="flex gap-2">
            <Input
              id="password"
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="Enter your password"
              value={values.password}
              onChange={onInputChange('password')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              required
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={togglePasswordVisibility}
            >
              {isPasswordVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={generatePassword}
              title="Generate random password"
            >
              <Key className="h-4 w-4" />
            </Button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        {!isUpdate && (
          <TeamSelector
            value={values.team_id}
            teams={adminTeams}
            onChange={onTeamChange}
          />
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUpdate ? 'Updating credential...' : 'Creating credential...'}
              </>
            ) : isUpdate ? (
              'Update Credential'
            ) : (
              'Create Credential'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CredentialForm } from '@/components/credentials/CredentialForm';
import { SuccessMessage } from '@/components/state/SuccessMessage';
import { LoadingState } from '@/components/state/LoadingState';
import { ErrorState } from '@/components/state/ErrorState';
import { ReauthenticationPrompt } from '@/components/auth/ReauthenticationPrompt';
import { useUpdateCredential } from '@/lib/hooks/useUpdateCredential';
import { useEncryption } from '@/lib/hooks/useEncryption';

export default function UpdateCredential() {
  const { needsReauth } = useEncryption();
  const {
    form,
    adminTeams,
    isSuccess,
    isSubmitting,
    isLoading,
    error,
    isGroupUpdate,
    handleSubmit,
    handleTeamChange,
    goToCredentials,
  } = useUpdateCredential();

  if (needsReauth) {
    return <ReauthenticationPrompt />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={goToCredentials}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {isGroupUpdate ? 'Update Credentials Group' : 'Update Credential'}
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Credential Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState message="Loading credential..." />
              ) : error ? (
                <ErrorState message={error} />
              ) : isSuccess ? (
                <SuccessMessage
                  message="Credential updated successfully!"
                  description="Redirecting to credentials page..."
                />
              ) : (
                <CredentialForm
                  values={form.values}
                  errors={form.errors}
                  adminTeams={adminTeams}
                  isSubmitting={isSubmitting}
                  onInputChange={form.handleInputChange}
                  onTeamChange={handleTeamChange}
                  onSubmit={handleSubmit}
                  onCancel={goToCredentials}
                  isUpdate={true}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

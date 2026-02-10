import { Navigate } from 'react-router-dom';
import { Plus, Users, User, type LucideIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { CredentialCard } from '@/components/credentials/CredentialCard';
import { CredentialsSidebar } from '@/components/credentials/CredentialsSidebar';
import { SearchBar } from '@/components/layout/SearchBar';
import { EmptyState } from '@/components/state/EmptyState';
import { ReauthenticationPrompt } from '@/components/auth/ReauthenticationPrompt';
import { useUserStore } from '@/lib/stores/userStore';
import { useCredentialsLogic } from '@/lib/hooks/useCredentialsLogic';
import { useEncryption } from '@/lib/hooks/useEncryption';
import type { CredentialPublic } from '@/lib/types';

interface CredentialSectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  credentials: CredentialPublic[];
  searchQuery: string;
  onDeleteOne: (id: number) => Promise<void>;
  onDeleteGroup: (group: string) => Promise<void>;
}

function CredentialSection({
  id,
  icon: Icon,
  title,
  credentials,
  searchQuery,
  onDeleteOne,
  onDeleteGroup,
}: CredentialSectionProps) {
  if (credentials.length === 0) return null;

  return (
    <div id={id}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          ({credentials.length} items)
        </span>
      </div>
      <div className="grid gap-4">
        {credentials.map((credential) => (
          <CredentialCard
            key={credential.id}
            credential={credential}
            searchQuery={searchQuery}
            onDeleteOne={onDeleteOne}
            onDeleteGroup={onDeleteGroup}
          />
        ))}
      </div>
    </div>
  );
}

const Credentials = () => {
  const { isAuthenticated } = useUserStore();
  const { needsReauth } = useEncryption();

  const {
    searchQuery,
    setSearchQuery,
    filteredCredentials,
    groupedCredentials,
    teamsWithCredentials,
    error,
    isLoading,
    handleDeleteOne,
    handleDeleteGroup,
    scrollToSection,
  } = useCredentialsLogic(isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (needsReauth) {
    return <ReauthenticationPrompt />;
  }

  if (isLoading)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          <h1 className="text-center">Loading credentials...</h1>
        </main>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          <h1 className="text-center text-destructive">Error loading credentials</h1>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-3.8rem)] bg-background">
        <CredentialsSidebar
          searchQuery={searchQuery}
          groupedCredentials={groupedCredentials}
          teamsWithCredentials={teamsWithCredentials}
          onScrollToSection={scrollToSection}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">My Credentials</h1>
              <Button asChild>
                <a href="/credentials/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credential
                </a>
              </Button>
            </div>

            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              resultsCount={filteredCredentials.length}
            />

            <div className="space-y-8">
              <CredentialSection
                id="personal-credentials"
                icon={User}
                title="Personal Credentials"
                credentials={groupedCredentials.personal}
                searchQuery={searchQuery}
                onDeleteOne={handleDeleteOne}
                onDeleteGroup={handleDeleteGroup}
              />

              {teamsWithCredentials.map((team) => (
                <CredentialSection
                  key={team.id}
                  id={`team-${team.id}`}
                  icon={Users}
                  title={team.name}
                  credentials={team.credentials}
                  searchQuery={searchQuery}
                  onDeleteOne={handleDeleteOne}
                  onDeleteGroup={handleDeleteGroup}
                />
              ))}

              {groupedCredentials.personal.length === 0 &&
                teamsWithCredentials.length === 0 && (
                  <EmptyState
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery('')}
                  />
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credentials;

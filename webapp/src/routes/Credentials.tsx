import { Navigate } from 'react-router-dom';
import { Plus, Users, User } from 'lucide-react';
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

        {/* Main Content */}
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

            {/* Search Bar */}
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              resultsCount={filteredCredentials.length}
            />

            <div className="space-y-8">
              {/* Personal Credentials Section */}
              {groupedCredentials.personal.length > 0 && (
                <div id="personal-credentials">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Personal Credentials</h2>
                    <span className="text-sm text-muted-foreground">
                      ({groupedCredentials.personal.length} items)
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {groupedCredentials.personal.map((credential) => (
                      <CredentialCard
                        key={credential.id}
                        credential={credential}
                        searchQuery={searchQuery}
                        onDeleteOne={handleDeleteOne}
                        onDeleteGroup={handleDeleteGroup}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Team Credentials Sections */}
              {teamsWithCredentials.map((team) => (
                <div key={team.id} id={`team-${team.id}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">{team.name}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({team.credentials.length} items)
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {team.credentials.map((credential) => (
                      <CredentialCard
                        key={credential.id}
                        credential={credential}
                        searchQuery={searchQuery}
                        onDeleteOne={handleDeleteOne}
                        onDeleteGroup={handleDeleteGroup}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Empty State */}
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

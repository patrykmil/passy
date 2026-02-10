import { Users, User } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarButton } from '@/components/layout/SidebarButton';
import type { CredentialPublic, TeamPublic } from '@/lib/types';

interface CredentialsSidebarProps {
  searchQuery: string;
  groupedCredentials: {
    personal: CredentialPublic[];
    teams: Record<number, CredentialPublic[]>;
  };
  teamsWithCredentials: Array<TeamPublic & { credentials: CredentialPublic[] }>;
  onScrollToSection: (sectionId: string) => void;
}

export function CredentialsSidebar({
  searchQuery,
  groupedCredentials,
  teamsWithCredentials,
  onScrollToSection,
}: CredentialsSidebarProps) {
  const searchInfo = searchQuery ? `Search: "${searchQuery}"` : undefined;
  const hasNoResults =
    searchQuery &&
    groupedCredentials.personal.length === 0 &&
    teamsWithCredentials.length === 0;

  return (
    <Sidebar title="My Credentials" searchInfo={searchInfo}>
      {/* Personal Credentials */}
      {groupedCredentials.personal.length > 0 && (
        <SidebarButton
          icon={<User className="h-4 w-4" />}
          count={groupedCredentials.personal.length}
          onClick={() => onScrollToSection('personal-credentials')}
        >
          Personal
        </SidebarButton>
      )}

      {/* Team Credentials */}
      {teamsWithCredentials.map((team) => (
        <SidebarButton
          key={team.id}
          icon={<Users className="h-4 w-4" />}
          count={team.credentials.length}
          onClick={() => onScrollToSection(`team-${team.id}`)}
        >
          {team.name}
        </SidebarButton>
      ))}

      {/* No results message */}
      {hasNoResults && (
        <div className="px-2 py-1 text-xs text-muted-foreground">No matches found</div>
      )}
    </Sidebar>
  );
}

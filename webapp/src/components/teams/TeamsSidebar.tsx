import { Users } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarButton } from '@/components/layout/SidebarButton';
import type { TeamDetailed } from '@/lib/types';

interface TeamsSidebarProps {
  teams: TeamDetailed[];
  onTeamClick: (teamId: number) => void;
}

export function TeamsSidebar({ teams, onTeamClick }: TeamsSidebarProps) {
  return (
    <Sidebar title="My Teams">
      {teams.map((team) => (
        <SidebarButton
          key={team.id}
          icon={<Users className="h-4 w-4" />}
          onClick={() => onTeamClick(team.id!)}
        >
          <div className="flex items-center gap-2 w-full">
            <span className="truncate flex-1">{team.name}</span>
          </div>
        </SidebarButton>
      ))}
    </Sidebar>
  );
}

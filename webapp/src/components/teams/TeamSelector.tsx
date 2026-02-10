import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TeamPublic } from '@/lib/types';

interface TeamSelectorProps {
  value?: number;
  teams: TeamPublic[];
  onChange: (teamId?: number) => void;
}

export function TeamSelector({ value, teams, onChange }: TeamSelectorProps) {
  const handleChange = (teamId: string) => {
    const id = teamId === 'personal' ? undefined : parseInt(teamId);
    onChange(id);
  };

  return (
    <div className="grid gap-3">
      <Label htmlFor="team_id">Team (Optional)</Label>
      <Select value={value?.toString() || 'personal'} onValueChange={handleChange}>
        <SelectTrigger className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
          <SelectValue placeholder="Personal (No team)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="personal">Personal (No team)</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id!.toString()}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

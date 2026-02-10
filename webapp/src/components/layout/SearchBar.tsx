import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount: number;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  resultsCount,
}: SearchBarProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search credentials by name, URL, or login..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {searchQuery && (
        <p className="text-sm text-muted-foreground mt-2">
          Found {resultsCount} credential{resultsCount !== 1 ? 's' : ''} matching "
          {searchQuery}"
        </p>
      )}
    </div>
  );
}

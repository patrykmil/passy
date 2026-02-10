import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
}

export function EmptyState({ searchQuery, onClearSearch }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {searchQuery ? (
        <>
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No credentials found matching "{searchQuery}"
          </p>
          <Button variant="outline" onClick={onClearSearch} className="mb-4">
            Clear search
          </Button>
          <br />
          <Button asChild>
            <a href="/credentials/add">
              <Plus className="h-4 w-4 mr-2" />
              Add new credential
            </a>
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground mb-4">Nothing found</p>
        </>
      )}
    </div>
  );
}

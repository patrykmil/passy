import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

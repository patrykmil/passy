interface ErrorStateProps {
  message?: string;
}

export function ErrorState({ message = 'An error occurred' }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center h-64 text-destructive">
      <div className="text-center">
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please try refreshing the page
        </p>
      </div>
    </div>
  );
}

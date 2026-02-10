interface SuccessMessageProps {
  message: string;
  description?: string;
}

export function SuccessMessage({ message, description }: SuccessMessageProps) {
  return (
    <div className="text-center py-6">
      <div className="text-green-600 dark:text-green-400 text-lg font-medium mb-2">
        {message}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface SidebarButtonProps {
  icon: ReactNode;
  children: ReactNode;
  count?: number;
  isActive?: boolean;
  onClick: () => void;
}

export function SidebarButton({
  icon,
  children,
  count,
  isActive = false,
  onClick,
}: SidebarButtonProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      className="w-full justify-start mb-1"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 w-full">
        {icon}
        <span className="truncate flex-1">{children}</span>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
      </div>
    </Button>
  );
}

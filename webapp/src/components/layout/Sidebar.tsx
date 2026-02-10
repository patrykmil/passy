import type { ReactNode } from 'react';

interface SidebarProps {
  title: string;
  children: ReactNode;
  searchInfo?: string;
}

export function Sidebar({ title, children, searchInfo }: SidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <nav className="p-2">
        <div className="space-y-1">
          {searchInfo && (
            <div className="px-2 py-1 text-xs text-muted-foreground">{searchInfo}</div>
          )}
          {children}
        </div>
      </nav>
    </div>
  );
}

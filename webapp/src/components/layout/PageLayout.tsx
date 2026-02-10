import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';

interface PageLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function PageLayout({ children, sidebar }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {sidebar ? (
        <div className="flex h-[calc(100vh-3.8rem)] bg-background">
          {sidebar}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      ) : (
        <main className="container mx-auto py-6">{children}</main>
      )}
    </div>
  );
}

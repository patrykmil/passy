import { useUserStore } from '@/lib/stores/userStore';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { LogOut, RotateCcwKey, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, isAuthenticated, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block ml-4">Passy</span>
          </a>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a
              href="/credentials"
              className="transition-colors hover:text-foreground/80"
            >
              Credentials
            </a>
            <a href="/teams" className="transition-colors hover:text-foreground/80">
              Teams
            </a>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{user.username}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 px-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/update-security')}
            className="h-8 px-2"
          >
            <RotateCcwKey className="h-4 w-4" />
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

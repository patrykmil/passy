import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAuthInit } from '@/lib/hooks/useAuth';

function App() {
  const { isLoading, isAuthenticated, user } = useAuthInit();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Checking authentication status</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Passy</h1>
          <p className="text-muted-foreground mb-6">Please log in to continue</p>
          <div className="space-x-4">
            <Button asChild>
              <a href="/login">Login</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/register">Register</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground mb-6">What would you like to do?</p>
          <div className="space-x-4">
            <Button asChild>
              <a href="/credentials">My Credentials</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/credentials/add">Add Credential</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/teams">My Teams</a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import { Navigate, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/lib/stores/userStore';
import { ChangeSecurityInfoForm } from '@/components/auth/ChangeSecurityInfoForm';
import { ReauthenticationPrompt } from '@/components/auth/ReauthenticationPrompt';
import { useEncryption } from '@/lib/hooks/useEncryption';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';

function ChangeSecurityInfo() {
  const { isAuthenticated } = useUserStore();
  const { needsReauth } = useEncryption();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (needsReauth) {
    return <ReauthenticationPrompt />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Update security information</h1>
          </div>
          <div className="flex w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
              <ChangeSecurityInfoForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChangeSecurityInfo;

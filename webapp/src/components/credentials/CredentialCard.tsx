import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Bomb,
  ChevronsUp,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CredentialPublic } from '@/lib/types';
import { useUserStore } from '@/lib/stores/userStore';
import { decryptPassword, decryptTeamPassword } from '@/lib/crypto';

interface CredentialCardProps {
  credential: CredentialPublic;
  searchQuery: string;
  onDeleteOne: (id: number) => Promise<void>;
  onDeleteGroup: (group: string) => Promise<void>;
}

export function CredentialCard({
  credential,
  searchQuery,
  onDeleteOne,
  onDeleteGroup,
}: CredentialCardProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState('');
  const { symetricKey, privateKey, user } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!credential.password) {
      setDecryptedPassword('');
      return;
    }

    const decryptAsync = async () => {
      try {
        if (!credential.team_id) {
          if (!symetricKey) {
            setDecryptedPassword('');
            return;
          }
          const decrypted = await decryptPassword(credential.password, symetricKey);
          setDecryptedPassword(decrypted);
        } else {
          if (!privateKey) {
            setDecryptedPassword('');
            return;
          }
          const decrypted = decryptTeamPassword(credential.password, privateKey);
          setDecryptedPassword(decrypted);
        }
      } catch (error) {
        console.warn(
          `Failed to decrypt credential ${credential.id}:`,
          error instanceof Error ? error.message : String(error)
        );
        setDecryptedPassword('');
      }
    };

    decryptAsync();
  }, [credential.password, credential.id, credential.team_id, symetricKey, privateKey]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${type} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDeleteOne = async () => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      await onDeleteOne(credential.id);
    }
  };

  const handleDeleteGroup = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this credential for all team members?'
      )
    ) {
      if (!credential.group) return;
      await onDeleteGroup(credential.group);
    }
  };

  const handleUpdate = (isGroup: boolean, id: number | string) => {
    if (isGroup) {
      navigate(`/credentials/update-group/${id}`);
    } else {
      navigate(`/credentials/update/${id}`);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);

    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <mark className="bg-yellow-200 dark:bg-yellow-900">
          {text.substring(index, index + query.length)}
        </mark>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              {highlightMatch(credential.record_name || 'Untitled', searchQuery)}
            </CardTitle>
          </div>
          <div>
            {!credential.team_id && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteOne}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUpdate(false, credential.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </>
            )}

            {user?.admin_teams.some((team) => team.id === credential.team_id) && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteGroup}
                  className="text-destructive hover:text-destructive"
                >
                  <Bomb className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUpdate(true, credential.group!)}
                  className="text-destructive hover:text-destructive"
                >
                  <ChevronsUp className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {credential.url && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <a
              href={credential.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {highlightMatch(credential.url, searchQuery)}
            </a>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {credential.login && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Login
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
                    {highlightMatch(credential.login, searchQuery)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credential.login!, 'Login')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {credential.password && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Password
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
                    {isPasswordVisible ? decryptedPassword : '••••••••••••••'}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePasswordVisibility}
                  >
                    {isPasswordVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(decryptedPassword, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

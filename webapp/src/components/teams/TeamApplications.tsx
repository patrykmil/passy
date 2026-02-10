import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TeamApplicationResponse, TeamApplicationAction } from '@/lib/types';

interface TeamApplicationsProps {
  applications: TeamApplicationResponse[];
  onRespond: (userId: number, action: TeamApplicationAction) => Promise<void>;
  isLoading?: boolean;
}

export function TeamApplications({
  applications,
  onRespond,
  isLoading,
}: TeamApplicationsProps) {
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member');

  const handleAccept = async (userId: number) => {
    setRespondingTo(userId);
    try {
      await onRespond(userId, { action: 'accept', role: selectedRole });
    } finally {
      setRespondingTo(null);
      setSelectedRole('member');
    }
  };

  const handleDecline = async (userId: number) => {
    setRespondingTo(userId);
    try {
      await onRespond(userId, { action: 'decline' });
    } finally {
      setRespondingTo(null);
    }
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No pending applications
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Applications</h3>
      {applications.map((application) => (
        <Card key={application.application_id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{application.username}</CardTitle>
                <CardDescription>Wants to join {application.team_name}</CardDescription>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedRole}
                onValueChange={(value: 'member' | 'admin') => setSelectedRole(value)}
                disabled={respondingTo === application.user_id || isLoading}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => handleAccept(application.user_id)}
                disabled={respondingTo === application.user_id || isLoading}
                size="sm"
              >
                {respondingTo === application.user_id ? 'Processing...' : 'Accept'}
              </Button>

              <Button
                onClick={() => handleDecline(application.user_id)}
                disabled={respondingTo === application.user_id || isLoading}
                size="sm"
                variant="destructive"
              >
                {respondingTo === application.user_id ? 'Processing...' : 'Decline'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

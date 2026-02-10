import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PendingApplication } from '@/lib/types';

interface MyApplicationsProps {
  applications: PendingApplication[];
}

export function MyApplications({ applications }: MyApplicationsProps) {
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
      <h3 className="text-lg font-semibold">My Pending Applications</h3>
      {applications.map((application) => (
        <Card key={application.team_id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{application.team_name}</CardTitle>
                <CardDescription>Team Code: {application.team_code}</CardDescription>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your application is awaiting approval from team administrators.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

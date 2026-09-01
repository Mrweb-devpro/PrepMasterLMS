import { User, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, getProfile } from "@/lib/session";

export default async function ProfilePage() {
  const user = await getUser();
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your account and registration details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Full name</p>
              <p className="font-medium">{profile?.full_name ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

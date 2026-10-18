import { Link, useNavigate } from "@tanstack/react-router";
import { Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Card, PageHeader } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { KV } from "@/features/admin/components/parts";
import { NameFields } from "@/features/auth/components/fields";
import { heardLabel } from "@/features/auth/constants/options";
import { useSession } from "@/features/auth/session";
import { AvatarEditor } from "@/features/auth/components/AvatarEditor";
import { formatDate } from "@/lib/mock-api";
import { useSwUser } from "../hooks/useSwUser";

export function SettingsPage() {
  const user = useSwUser();
  const { update, signOut } = useSession();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [names, setNames] = useState({ firstName: user.firstName, lastName: user.lastName });

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6 [&>*]:min-w-0">
      <PageHeader title="Settings" subtitle="Your account details and preferences." />

      <Card>
        <h2 className="mb-4 text-sm font-semibold">Avatar</h2>
        <AvatarEditor />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Profile</p>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
        {editing ? (
          <>
            <NameFields value={names} onChange={(p) => setNames((n) => ({ ...n, ...p }))} />
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setNames({ firstName: user.firstName, lastName: user.lastName });
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={async () => {
                  if (!names.firstName?.trim() || !names.lastName?.trim()) {
                    toast.error("Names can't be empty");
                    return;
                  }
                  setSaving(true);
                  try {
                    await update({
                      firstName: names.firstName.trim(),
                      lastName: names.lastName.trim(),
                    });
                    toast.success("Profile updated");
                    setEditing(false);
                  } catch {
                    // The session provider has already shown the save error.
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "Saving changes..." : "Save changes"}
              </Button>
            </div>
          </>
        ) : (
          <div className="divide-y divide-border">
            <KV k="First name" v={user.firstName} />
            <KV k="Last name" v={user.lastName} />
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-2 text-sm font-semibold">Account</p>
        <div className="divide-y divide-border">
          <KV k="Email" v={user.email} />
          <KV k="Signed up with" v={user.provider === "google" ? "Google" : "Email & password"} />
          <KV k="I am a" v={user.userType === "freelancer" ? "Freelancer" : "Student"} />
          {user.faculty && <KV k="Faculty" v={user.faculty} />}
          {user.course && <KV k="Department" v={user.course} />}
          {user.level && <KV k="Level" v={user.level} />}
          <KV k="Heard about us" v={heardLabel(user.heard)} />
          <KV k="Member since" v={formatDate(user.joinedAt)} />
        </div>
        {user.userType !== "freelancer" && (
          <div className="mt-4 flex flex-col gap-3 rounded-md border border-warning/30 bg-warning-bg p-3 text-sm sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="min-w-0">
                To change your faculty, department or level, update your student details on the
                PrepMaster dashboard.
              </p>
            </div>
            <Button size="sm" variant="outline" className="w-full shrink-0 sm:w-auto" asChild>
              <Link to="/account">Go to PrepMaster</Link>
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold">Appearance</p>
        <ThemeToggle />
      </Card>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">PrepMaster study app</p>
          <p className="text-sm text-text-muted">Same account — notes, past questions and CBTs.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/">Open PrepMaster</Link>
        </Button>
      </Card>

      <Button
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={async () => {
          if (!(await confirm({ title: "Sign out?", confirmLabel: "Sign out" }))) return;
          signOut();
          toast("Signed out");
          navigate({ to: "/login" });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}

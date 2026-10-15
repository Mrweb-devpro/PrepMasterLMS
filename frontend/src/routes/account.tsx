import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, LogOut, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { StudentShell } from "@/components/prep/StudentShell";
import { Card, PageHeader, StatusPill } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { StudyFields, type ProfileDraft } from "@/features/auth/components/fields";
import { useSession } from "@/features/auth/session";
import { AccountModerationCard } from "@/features/auth/components/AccountModerationCard";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTransactions } from "@/features/payments/useTransactions";
import { LIVE } from "@/lib/api/config";
import { formatNaira } from "@/lib/mock-data";
import { usePrep } from "@/lib/prep-store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — PrepMaster" },
      { name: "description", content: "Manage your profile, notifications and payment history." },
      { property: "og:title", content: "Account — PrepMaster" },
      {
        property: "og:description",
        content: "Manage your profile, notifications and payment history.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { signOut } = useSession();
  const navigate = useNavigate();
  const prep = usePrep();
  const tx = useTransactions("mine");
  const mine = LIVE ? tx : tx.filter((t) => t.student === prep.name);

  return (
    <StudentShell>
      <PageHeader title="Account" subtitle="Your profile, preferences and receipts." />

      {!prep.emailVerified && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning-bg p-4">
          <MailWarning className="size-5 text-warning" />
          <p className="flex-1 text-sm">
            Please verify your email to receive exam reminders and receipts.
          </p>
          <Button
            size="sm"
            onClick={() => {
              prep.verifyEmail();
              toast.success("Email verified");
            }}
          >
            Verify now
          </Button>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] [&>*]:min-w-0">
        <Card className="h-fit text-center">
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-ink-gradient font-display text-2xl font-semibold text-ink-foreground">
            {prep.initials}
          </span>
          <p className="mt-4 font-display text-lg font-semibold">{prep.name}</p>
          <p className="flex items-center justify-center gap-1 text-sm text-text-secondary">
            {prep.email}
            {prep.emailVerified && <BadgeCheck className="size-4 text-primary" />}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-left">
            <div className="rounded-md bg-surface-subtle p-3">
              <p className="font-display text-xl font-semibold">{prep.ownedFileIds.length}</p>
              <p className="text-xs text-text-muted">Files</p>
            </div>
            <div className="rounded-md bg-surface-subtle p-3">
              <p className="font-display text-xl font-semibold">{prep.ownedCbtIds.length}</p>
              <p className="text-xs text-text-muted">CBTs</p>
            </div>
          </div>
          <Button
            variant="destructive"
            className="mt-5 w-full font-medium"
            onClick={() => {
              signOut();
              toast.success("Signed out successfully");
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </Card>

        <div className="min-w-0 space-y-6">
          <ProfileCard />
          <AccountModerationCard />

          <Card>
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Choose light, dark, or match your device.
            </p>
            <ThemeToggle withLabels className="mt-4" />
          </Card>

          {/* Notifications: hidden for MVP — kept for later in-app notifications. */}
          <Card className="hidden">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="mt-3 divide-y divide-border">
              {Object.entries(prep.notifications).map(([key, on]) => (
                <label key={key} className="flex items-center justify-between py-3 text-sm">
                  {key}
                  <Switch checked={on} onCheckedChange={() => prep.toggleNotification(key)} />
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-0">
            <h2 className="px-5 pt-5 text-lg font-semibold">Payment history</h2>
            <div className="mt-3 divide-y divide-border">
              {mine.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.item}</span>
                    <span className="text-xs text-text-muted">{t.date}</span>
                  </span>
                  <span className="font-medium">{formatNaira(t.amount)}</span>
                  <StatusPill
                    tone={
                      t.status === "verified"
                        ? "success"
                        : t.status === "failed"
                          ? "error"
                          : "warning"
                    }
                  >
                    {t.status}
                  </StatusPill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </StudentShell>
  );
}

function ProfileCard() {
  const { user, update } = useSession();
  const [d, setD] = useState<ProfileDraft>(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    faculty: user?.faculty ?? "",
    course: user?.course ?? "",
    level: user?.level ?? "",
  }));
  const patch = (p: ProfileDraft) => setD((x) => ({ ...x, ...p }));
  const [editing, setEditing] = useState(false);
  const reset = () =>
    setD({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      faculty: user?.faculty ?? "",
      course: user?.course ?? "",
      level: user?.level ?? "",
    });
  const levelLabel = (l?: string) => (!l ? "—" : l === "Postgraduate" ? l : `${l} level`);
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Profile</h2>
        {!editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {!editing ? (
        <dl className="mt-3 divide-y divide-border text-sm">
          {[
            ["Name", `${user?.firstName ?? ""} ${user?.lastName ?? ""}`],
            ["Email", user?.email ?? ""],
            ["Faculty", user?.faculty || "—"],
            ["Department", user?.course || "—"],
            ["Level", levelLabel(user?.level)],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between">
              <dt className="text-text-muted">{k}</dt>
              <dd className="min-w-0 break-words font-medium sm:text-right">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!d.firstName?.trim() || !d.lastName?.trim()) {
            toast.error("Enter your names");
            return;
          }
          if (!d.faculty || !d.course || !d.level)
          {
            toast.error("Choose your faculty, department and level");
            return;
          }
          update({
            firstName: d.firstName.trim(),
            lastName: d.lastName.trim(),
            faculty: d.faculty,
            course: d.course,
            level: d.level,
          });
          toast.success("Profile saved");
          setEditing(false);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>First name</Label>
            <Input value={d.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Last name</Label>
            <Input value={d.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
        </div>
        <StudyFields value={d} onChange={patch} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="submit">Save changes</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset();
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
      )}
    </Card>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, LogOut, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { StudentShell } from "@/components/prep/StudentShell";
import { Card, PageHeader, StatusPill } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatNaira, transactions } from "@/lib/mock-data";
import { usePrep } from "@/lib/prep-store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — PrepMaster" },
      { name: "description", content: "Manage your profile, notifications and payment history." },
      { property: "og:title", content: "Account — PrepMaster" },
      { property: "og:description", content: "Manage your profile, notifications and payment history." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const prep = usePrep();
  const mine = transactions.filter((t) => t.student === prep.name);

  return (
    <StudentShell>
      <PageHeader title="Account" subtitle="Your profile, preferences and receipts." />

      {!prep.emailVerified && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning-bg p-4">
          <MailWarning className="size-5 text-warning" />
          <p className="flex-1 text-sm">Please verify your email to receive exam reminders and receipts.</p>
          <Button size="sm" onClick={() => { prep.verifyEmail(); toast.success("Email verified"); }}>Verify now</Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit text-center">
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-ink-gradient font-display text-2xl font-semibold text-ink-foreground">{prep.initials}</span>
          <p className="mt-4 font-display text-lg font-semibold">{prep.name}</p>
          <p className="flex items-center justify-center gap-1 text-sm text-text-secondary">
            {prep.email}{prep.emailVerified && <BadgeCheck className="size-4 text-primary" />}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-left">
            <div className="rounded-md bg-surface-subtle p-3"><p className="font-display text-xl font-semibold">{prep.ownedFileIds.length}</p><p className="text-xs text-text-muted">Files</p></div>
            <div className="rounded-md bg-surface-subtle p-3"><p className="font-display text-xl font-semibold">{prep.ownedCbtIds.length}</p><p className="text-xs text-text-muted">CBTs</p></div>
          </div>
          <Button variant="outline" className="mt-5 w-full" asChild><Link to="/login"><LogOut className="size-4" />Sign out</Link></Button>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold">Profile</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); toast.success("Profile saved"); }}>
              <div className="space-y-1.5"><Label>Full name</Label><Input defaultValue={prep.name} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={prep.email} /></div>
              <div className="space-y-1.5"><Label>Department</Label><Input defaultValue="Medicine & Surgery" /></div>
              <div className="space-y-1.5"><Label>Level</Label><Input defaultValue="100 Level" /></div>
              <div className="sm:col-span-2"><Button type="submit">Save changes</Button></div>
            </form>
          </Card>

          <Card>
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
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{t.item}</span><span className="text-xs text-text-muted">{t.date}</span></span>
                  <span className="font-medium">{formatNaira(t.amount)}</span>
                  <StatusPill tone={t.status === "verified" ? "success" : t.status === "failed" ? "error" : "warning"}>{t.status}</StatusPill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </StudentShell>
  );
}

import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata = {
  title: "Dashboard | Prepmaster",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  const isAdminUser = profile?.role === "admin";

  return (
    <DashboardShell trackType={profile?.tracks?.type} isAdmin={isAdminUser}>
      {children}
    </DashboardShell>
  );
}

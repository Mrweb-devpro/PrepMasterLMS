import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { AdminShell } from "@/components/admin/shell";

export const metadata = {
  title: "Admin | Prepmaster",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard");

  return <AdminShell>{children}</AdminShell>;
}

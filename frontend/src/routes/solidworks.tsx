import { createFileRoute, Outlet } from "@tanstack/react-router";
import { parseHeard } from "@/features/auth/constants/options";
import { useSolidworksGuard } from "@/features/auth/hooks/useGuards";
import { SwShell } from "@/features/solidworks/components/SwShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks")({
  validateSearch: (s: Record<string, unknown>): { heard?: string } => {
    const heard = parseHeard(s["heard"]);
    return heard ? { heard } : {};
  },
  head: () =>
    pageHead("SolidWorks", "Practise SolidWorks with MrPrepMaster: tasks, submissions and grades.", "SolidWorks"),
  component: SolidworksLayout,
});

function SolidworksLayout() {
  const { heard } = Route.useSearch();
  const ready = useSolidworksGuard(heard);
  if (!ready) return null;
  return (
    <SwShell>
      <Outlet />
    </SwShell>
  );
}

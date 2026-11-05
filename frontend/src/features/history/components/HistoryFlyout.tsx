import { useNavigate } from "@tanstack/react-router";
import { Clock3, FileText, History, MonitorCheck, Search, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession } from "@/features/auth/session";
import { useCatalog } from "@/features/catalog/useCatalog";
import { usePrep } from "@/lib/prep-store";
import { cn } from "@/lib/utils";
import { type HistoryEntry, useActivityHistory } from "../history.store";

type Filter = "all" | "cbt" | "document";

const relativeTime = (value: string) => {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const timeGroup = (value: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  const days = Math.floor((today.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Older / Past 7 Days";
};

function iconFor(kind: HistoryEntry["kind"]) {
  if (kind === "document") return FileText;
  if (kind === "competition") return Trophy;
  return MonitorCheck;
}

function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { user } = useSession();
  const prep = usePrep();
  const { getCbt, getCourse } = useCatalog();
  const navigate = useNavigate();
  const { entries: savedEntries, removedIds, clearedAt, remove, clear } = useActivityHistory(user?.id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const hydratedAttempts = useMemo<HistoryEntry[]>(() => {
    const submitted = prep.attempts.map((attempt) => {
      const cbt = getCbt(attempt.cbtId);
      const course = cbt ? getCourse(cbt.courseSlug) : undefined;
      const score = attempt.correct !== null && attempt.total > 0 ? `${attempt.correct}/${attempt.total} · ${Math.round((attempt.correct / attempt.total) * 100)}%` : "Results pending";
      return {
        id: `cbt:${attempt.cbtId}`,
        targetId: attempt.cbtId,
        kind: "cbt" as const,
        title: cbt?.title ?? "CBT attempt",
        subtitle: course?.code ?? "CBT",
        detail: score,
        timestamp: attempt.submittedAt,
        course: course?.code,
        route: { attemptId: attempt.id, cbtId: attempt.cbtId },
      };
    });
    const active = prep.unfinishedAttempts.map((attempt) => {
      const cbt = getCbt(attempt.cbtId);
      const course = cbt ? getCourse(cbt.courseSlug) : undefined;
      return {
        id: `cbt:${attempt.cbtId}`,
        targetId: attempt.cbtId,
        kind: "cbt" as const,
        title: cbt?.title ?? "CBT in progress",
        subtitle: course?.code ?? "CBT",
        detail: "In progress",
        timestamp: attempt.lastOpened,
        course: course?.code,
        route: { cbtId: attempt.cbtId },
      };
    });
    return [...submitted, ...active];
  }, [getCbt, getCourse, prep.attempts, prep.unfinishedAttempts]);

  const entries = useMemo(() => {
    const byId = new Map<string, HistoryEntry>();
    for (const item of [...savedEntries, ...hydratedAttempts]) {
      if (removedIds.includes(item.id)) continue;
      if (clearedAt && new Date(item.timestamp).getTime() <= new Date(clearedAt).getTime()) continue;
      const existing = byId.get(item.id);
      if (!existing || new Date(item.timestamp).getTime() > new Date(existing.timestamp).getTime()) byId.set(item.id, item);
    }
    const needle = query.trim().toLowerCase();
    return [...byId.values()]
      .filter((item) => filter === "all" || item.kind === filter)
      .filter((item) => !needle || [item.title, item.subtitle, item.detail, item.course].filter(Boolean).join(" ").toLowerCase().includes(needle))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [clearedAt, filter, hydratedAttempts, query, removedIds, savedEntries]);

  const grouped = entries.reduce<Record<string, HistoryEntry[]>>((groups, item) => {
    const group = timeGroup(item.timestamp);
    (groups[group] ??= []).push(item);
    return groups;
  }, {});

  const open = (item: HistoryEntry) => {
    onClose();
    if (item.kind === "document" && item.route?.course && item.route.category && item.route.subfolder) {
      navigate({ to: "/drive/$course/$category/$subfolder", params: { course: item.route.course, category: item.route.category, subfolder: item.route.subfolder } });
      return;
    }
    if (item.route?.attemptId) {
      navigate({ to: "/attempts/$attemptId", params: { attemptId: item.route.attemptId } });
      return;
    }
    if (item.route?.cbtId) navigate({ to: "/attempt/$cbtId", params: { cbtId: item.route.cbtId } });
  };

  return <div className="flex h-full min-h-0 flex-col">
    <div className="shrink-0 border-b border-border px-4 pb-3 pt-4 sm:px-5">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary-soft text-primary"><History className="size-4" /></div>
        <h2 className="font-display text-lg font-semibold text-foreground">History</h2>
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-2xs font-medium text-text-secondary">{entries.length}</span>
        <Button variant="ghost" size="sm" className="ml-auto text-xs" disabled={entries.length === 0} onClick={() => setConfirmClear(true)}>Clear</Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label="Close history"><X className="size-4" /></Button>
      </div>
      <div className="relative mt-3"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search history…" className="h-9 bg-surface pl-9 text-sm" /></div>
      <div className="mt-3 flex w-fit rounded-lg border border-border bg-surface-subtle p-1">
        {([ ["all", "All"], ["cbt", "CBT Drills"], ["document", "Documents"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", filter === value ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-foreground")}>{label}</button>)}
      </div>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3">
      {entries.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center"><Clock3 className="size-8 text-text-muted" /><p className="mt-3 font-medium text-foreground">{query ? `No history found matching “${query}”` : "No recent activity yet"}</p><p className="mt-1 text-sm text-text-secondary">{query ? "Try a different search." : "Your opened files and test attempts will show up here."}</p></div> : Object.entries(grouped).map(([group, items]) => <section key={group}><p className="sticky top-0 z-10 bg-popover px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-text-muted">{group}</p>{items.map((item) => {
        const Icon = iconFor(item.kind);
        return <div key={item.id} className="group flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-surface-hover"><button type="button" onClick={() => open(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-primary"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{item.title}</span><span className="mt-0.5 block truncate text-xs text-text-secondary">{item.subtitle}{item.detail ? ` · ${item.detail}` : ""}</span></span><span className="shrink-0 text-2xs text-text-muted">{relativeTime(item.timestamp)}</span></button><button type="button" onClick={() => remove(item.id)} aria-label={`Remove ${item.title} from history`} className="hidden size-7 shrink-0 items-center justify-center rounded-sm text-text-muted hover:bg-surface hover:text-foreground group-hover:flex focus:flex"><X className="size-3.5" /></button></div>;
      })}</section>) }
    </div>
    <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Clear history?</AlertDialogTitle><AlertDialogDescription>This removes your recent activity list from this browser.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { clear(); setConfirmClear(false); }}>Clear history</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

export function HistoryFlyout() {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "h") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const trigger = <Button variant="ghost" size="icon" className="size-9 text-text-secondary hover:text-foreground" aria-label="History (Ctrl + H)" title="History (Ctrl + H)"><History className="size-4" /></Button>;
  if (mobile) {
    return <><Button variant="ghost" size="icon" className="size-9 text-text-secondary hover:text-foreground" aria-label="History (Ctrl + H)" title="History (Ctrl + H)" onClick={() => setOpen(true)}><History className="size-4" /></Button><Drawer open={open} onOpenChange={setOpen}><DrawerContent className="max-h-[85dvh] p-0"><DrawerTitle className="sr-only">History</DrawerTitle><div className="min-h-0 overflow-hidden"><HistoryPanel onClose={() => setOpen(false)} /></div></DrawerContent></Drawer></>;
  }
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild>{trigger}</PopoverTrigger><PopoverContent align="end" className="h-[min(38rem,calc(100dvh-5rem))] w-[26rem] max-w-[calc(100vw-2rem)] overflow-hidden p-0"><HistoryPanel onClose={() => setOpen(false)} /></PopoverContent></Popover>;
}

import { cn } from "@/lib/utils";

export type DepartmentFilterMode = "mine" | "all";

export function DepartmentFilter({
  userDepartment,
  mode,
  onModeChange,
}: {
  userDepartment?: string;
  mode: DepartmentFilterMode;
  onModeChange: (mode: DepartmentFilterMode) => void;
}) {
  return (
    <div className="mb-4 inline-flex w-fit max-w-full flex-wrap gap-1 rounded-md border border-border bg-surface p-1 shadow-sm">
      {userDepartment && (
        <button
          type="button"
          onClick={() => onModeChange("mine")}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "mine" ? "bg-ink text-ink-foreground" : "text-text-secondary hover:text-foreground",
          )}
        >
          My department
        </button>
      )}
      <button
        type="button"
        onClick={() => onModeChange("all")}
        className={cn(
          "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
          mode === "all" ? "bg-ink text-ink-foreground" : "text-text-secondary hover:text-foreground",
        )}
      >
        All courses
      </button>
    </div>
  );
}

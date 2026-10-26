import { cn } from "@/lib/utils";

export type DepartmentFilterMode = "mine" | "all";

export function DepartmentFilter({
  userDepartment,
  mode,
  onModeChange,
  className,
}: {
  userDepartment?: string | undefined;
  mode: DepartmentFilterMode;
  onModeChange: (mode: DepartmentFilterMode) => void;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex w-fit max-w-full flex-wrap gap-1 rounded-md border border-border bg-surface p-1 shadow-sm", className)}>
      {userDepartment && (
        <button
          type="button"
          onClick={() => onModeChange("mine")}
          className={cn(
            "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
            mode === "mine" ? "bg-primary-active text-primary-foreground shadow-sm" : "text-text-secondary hover:text-foreground",
          )}
        >
          My department
        </button>
      )}
      <button
        type="button"
        onClick={() => onModeChange("all")}
        className={cn(
          "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
          mode === "all" ? "bg-primary-active text-primary-foreground shadow-sm" : "text-text-secondary hover:text-foreground",
        )}
      >
        All courses
      </button>
    </div>
  );
}

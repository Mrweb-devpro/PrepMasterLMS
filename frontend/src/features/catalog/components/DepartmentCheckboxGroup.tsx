import { Check } from "lucide-react";
import { FACULTIES } from "@/features/auth/constants/options";
import { cn } from "@/lib/utils";

export function DepartmentCheckboxGroup({
  value,
  onChange,
}: {
  value: string[];
  onChange: (departments: string[]) => void;
}) {
  const toggle = (department: string) =>
    onChange(value.includes(department) ? value.filter((item) => item !== department) : [...value, department]);

  return (
    <div>
      <p className="text-sm font-medium text-foreground">Departments</p>
      <p className="mt-1 text-xs text-text-muted">Choose the departments this course serves, or keep it open to everyone.</p>
      <button
        type="button"
        aria-pressed={value.length === 0}
        onClick={() => onChange([])}
        className={cn(
          "mt-3 flex min-h-9 w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
          value.length === 0
            ? "border-primary bg-primary-soft text-primary"
            : "border-border bg-surface hover:border-border-strong hover:bg-surface-subtle",
        )}
      >
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-sm border",
            value.length === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
          )}
        >
          {value.length === 0 && <Check className="size-3" />}
        </span>
        <span>All departments (general elective)</span>
      </button>
      <div className="mt-4 space-y-4">
        {Object.entries(FACULTIES).map(([faculty, departments]) => (
          <div key={faculty}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{faculty}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {departments.map((department) => {
                const selected = value.includes(department);
                return (
                  <button
                    key={department}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(department)}
                    className={cn(
                      "flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface hover:border-border-strong hover:bg-surface-subtle",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
                      )}
                    >
                      {selected && <Check className="size-3" />}
                    </span>
                    <span>{department}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

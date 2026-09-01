import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
  return (
    <label className={cn("relative flex items-center", disabled && "opacity-50")}>
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded border border-input bg-background shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
      <Check
        className={cn(
          "pointer-events-none absolute left-[2px] top-[2px] h-3 w-3 text-primary opacity-0 peer-checked:opacity-100"
        )}
      />
    </label>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };

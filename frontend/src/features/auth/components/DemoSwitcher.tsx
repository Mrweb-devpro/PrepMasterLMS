import { useNavigate } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LIVE } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { PERSONAS, type PersonaKey } from "../constants/personas";
import { useSession } from "../session";

const HOME: Record<PersonaKey, string> = {
  guest: "/login",
  student: "/",
  swStudent: "/solidworks",
  freelancer: "/solidworks",
  google: "/",
  admin: "/admin",
};

/** Floating "Viewing as…" menu for testing each user type. Prototype only. */
export function DemoSwitcher() {
  const { user, hydrated, switchPersona } = useSession();
  const navigate = useNavigate();
  if (!hydrated || LIVE) return null;

  const current =
    (Object.keys(PERSONAS) as PersonaKey[]).find(
      (k) =>
        PERSONAS[k].profile?.id === user?.id &&
        PERSONAS[k].profile?.swRegistered === user?.swRegistered,
    ) ?? (user ? null : "guest");

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-xs font-medium shadow-md hover:bg-surface-hover">
          <FlaskConical className="size-3.5 text-primary" />
          {current ? PERSONAS[current].label : user ? `${user.firstName} (edited)` : "Signed out"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-2xs uppercase tracking-wider text-text-muted">
            Demo: view as
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(PERSONAS) as PersonaKey[]).map((k) => (
            <DropdownMenuItem
              key={k}
              onClick={() => {
                switchPersona(k);
                toast(`Now viewing as ${PERSONAS[k].label}`);
                navigate({ to: HOME[k] });
              }}
              className={cn("flex-col items-start gap-0", current === k && "bg-surface-hover")}
            >
              <span className="text-sm">{PERSONAS[k].label}</span>
              <span className="text-2xs text-text-muted">{PERSONAS[k].hint}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

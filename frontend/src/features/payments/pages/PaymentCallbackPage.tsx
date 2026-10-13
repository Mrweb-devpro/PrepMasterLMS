import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session";
import { catalogKey } from "@/features/catalog/useCatalog";
import { LIVE } from "@/lib/api/config";
import { formatNaira } from "@/lib/mock-data";
import { paymentsApi, type PaymentStatus } from "../payments.api";

type View = { kind: "checking" } | { kind: "done"; p: PaymentStatus } | { kind: "error"; message: string };

/** Paystack sends the student here after paying (?reference=...). */
export function PaymentCallbackPage({ reference }: { reference?: string }) {
  const { hydrated, user } = useSession();
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ kind: "checking" });

  const check = useCallback(async () => {
    if (!reference) return setView({ kind: "error", message: "No payment reference was found." });
    setView({ kind: "checking" });
    try {
      const p = await paymentsApi.verify(reference);
      setView({ kind: "done", p });
      if (p.status === "success") await qc.invalidateQueries({ queryKey: catalogKey });
    } catch (e) {
      setView({ kind: "error", message: (e as Error).message });
    }
  }, [reference, qc]);

  useEffect(() => {
    if (LIVE && hydrated && user) void check();
  }, [hydrated, user, check]);

  if (!LIVE)
    return <Shell icon={<CheckCircle2 className="size-8 text-success" />} title="Nothing to check" text="Payments are simulated in the demo." />;
  if (hydrated && !user)
    return <Shell icon={<XCircle className="size-8 text-error" />} title="Please sign in" text="Sign in to see your payment." action={<Button asChild><Link to="/login">Sign in</Link></Button>} />;
  if (view.kind === "checking")
    return <Shell icon={<Loader2 className="size-8 animate-spin text-primary" />} title="Confirming your payment…" text="This takes a few seconds." />;
  if (view.kind === "error")
    return <Shell icon={<XCircle className="size-8 text-error" />} title="We couldn't check this payment" text={view.message} action={<Button onClick={check}>Try again</Button>} />;

  const { p } = view;
  const back = paymentsApi.returnPath();
  if (p.status === "success")
    return (
      <Shell
        icon={<CheckCircle2 className="size-8 text-success" />}
        title="Payment successful"
        text={`${p.item_title} (${formatNaira(p.amount_kobo / 100)}) is now unlocked.`}
        action={
          <>
            <Button asChild variant="outline"><Link to="/library">My library</Link></Button>
            <Button asChild><a href={back}>Continue</a></Button>
          </>
        }
      />
    );
  if (p.status === "failed")
    return (
      <Shell
        icon={<XCircle className="size-8 text-error" />}
        title="Payment failed"
        text="No money was taken for this item. You can try again."
        action={<Button asChild><a href={back}>Go back</a></Button>}
      />
    );
  return (
    <Shell
      icon={<Clock3 className="size-8 text-warning" />}
      title="Payment not finished yet"
      text="If you completed it, wait a moment and check again."
      action={
        <>
          <Button asChild variant="outline"><a href={back}>Go back</a></Button>
          <Button onClick={check}>Check again</Button>
        </>
      }
    />
  );
}

function Shell({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-md">
        <div className="flex justify-center">{icon}</div>
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{text}</p>
        {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

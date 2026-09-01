"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initializePackagePayment } from "@/app/actions/payments";

export function BuyPackageButton({
  packageId,
  premium,
}: {
  packageId: string;
  premium: boolean;
}) {
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = searchParams.get("pay");
  const notice =
    pay === "success"
      ? "Payment successful! You now have premium access."
      : pay === "failed"
        ? "Payment was not completed. Try again."
        : pay === "not_configured"
          ? "Payments are not configured yet."
          : pay === "error"
            ? "Something went wrong. Try again."
            : null;

  async function handleBuy() {
    setBusy(true);
    setError(null);
    const res = await initializePackagePayment(packageId);
    if (res.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    if (res.authorization_url) {
      window.location.assign(res.authorization_url);
      return;
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      {notice && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            pay === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-500/20"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        className="w-full"
        onClick={handleBuy}
        disabled={busy || premium}
        variant={premium ? "outline" : "default"}
      >
        {premium ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Active
          </>
        ) : busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        {premium ? "" : "Buy package"}
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initializeExamPayment } from "@/app/actions/payments";

export function UnlockExamButton({
  examId,
  price,
}: {
  examId: string;
  price: number | null;
}) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = searchParams.get("pay");
  const notice =
    pay === "success"
      ? "Payment successful. Your exam is now unlocked."
      : pay === "failed"
        ? "Payment was not completed. Try again."
        : pay === "not_configured"
          ? "Payments are not configured yet."
          : pay === "error"
            ? "Something went wrong with the payment. Try again."
            : null;

  async function handleUnlock() {
    setLoading(true);
    setError(null);
    const result = await initializeExamPayment(examId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result.authorization_url) {
      window.location.assign(result.authorization_url);
      return;
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
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
      <Button size="lg" className="w-full" onClick={handleUnlock} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : price ? (
          <Lock className="mr-2 h-4 w-4" />
        ) : (
          <LockOpen className="mr-2 h-4 w-4" />
        )}
        {price ? `Unlock for ₦${price.toLocaleString()}` : "Unlock this exam"}
      </Button>
    </div>
  );
}

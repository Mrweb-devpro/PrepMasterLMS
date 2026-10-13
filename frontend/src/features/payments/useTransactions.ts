import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { LIVE } from "@/lib/api/config";
import { transactions as mockTransactions } from "@/lib/mock-data";
import { paymentsApi, type Transaction } from "./payments.api";

/** "mine" = the signed-in student's payments, "all" = every payment (admin). */
export function useTransactions(scope: "mine" | "all"): Transaction[] {
  const { user } = useSession();
  const q = useQuery({
    queryKey: ["payments", scope, user?.id ?? "anon"],
    queryFn: scope === "all" ? paymentsApi.all : paymentsApi.mine,
    enabled: LIVE && Boolean(user),
  });
  return LIVE ? (q.data ?? []) : mockTransactions;
}

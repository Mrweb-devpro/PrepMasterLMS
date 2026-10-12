import { db } from "../lib/supabase.js";

/** True when the item is free or the student has a successful payment for it. */
export async function hasAccess(userId: string, itemType: "material" | "cbt", itemId: string, priceKobo: number) {
  if (priceKobo === 0) return true;
  const { count } = await db
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .eq("status", "success");
  return (count ?? 0) > 0;
}

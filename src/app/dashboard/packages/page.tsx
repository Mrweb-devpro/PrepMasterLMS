import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, CreditCard, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";
import { hasPremiumSubscription } from "@/lib/access";
import { BuyPackageButton } from "./buy-package-button";

export default async function PackagesPage() {
  const supabase = await createClient();
  const user = await getUser();
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true });

  const premium = user ? await hasPremiumSubscription(user.id) : false;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Crown className="h-7 w-7 text-amber-500" />
          Go Premium
        </h1>
        <p className="mt-1 text-muted-foreground">
          Unlock premium CBTs and mock exams with a subscription package.
        </p>
        {premium && (
          <Badge className="mt-3" variant="default">
            You have an active premium subscription
          </Badge>
        )}
      </div>

      {packages && packages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-6">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {p.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                )}
                <p className="mt-4 text-3xl font-bold text-primary">
                  ₦{Number(p.price).toLocaleString()}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    All premium CBTs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Mock exams & past papers
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Explanations & re-attempts
                  </li>
                </ul>
                <div className="mt-6">
                  <BuyPackageButton packageId={p.id} premium={premium} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              No subscription packages are available right now.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

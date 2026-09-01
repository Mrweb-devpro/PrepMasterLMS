import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AddPackageDialog } from "./add-package";
import { PackageControls } from "./package-controls";

export default async function PackagesPage() {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .order("price", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Packages</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Subscription plans that unlock premium content.
          </p>
        </div>
        <div className="shrink-0">
          <AddPackageDialog />
        </div>
      </div>

      {packages && packages.length > 0 ? (
        <div className="space-y-3">
          {packages.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{p.name}</p>
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {p.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    )}
                    <p className="mt-1 text-lg font-bold text-primary">
                      ₦{Number(p.price).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <PackageControls pkg={p} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No packages yet.</p>
            <div className="mt-4">
              <AddPackageDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add package
                </Button>
              </AddPackageDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

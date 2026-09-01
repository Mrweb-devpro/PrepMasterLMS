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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
          <p className="mt-1 text-muted-foreground">
            Subscription plans that unlock premium content.
          </p>
        </div>
        <AddPackageDialog />
      </div>

      {packages && packages.length > 0 ? (
        <div className="space-y-3">
          {packages.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
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
                <PackageControls pkg={p} />
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

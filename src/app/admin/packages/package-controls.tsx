"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditPackageDialog } from "./add-package";
import { togglePackage, deletePackage } from "../actions";

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
};

export function PackageControls({ pkg }: { pkg: PackageRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"toggle" | "delete" | null>(null);

  return (
    <div className="flex items-center gap-1">
      <EditPackageDialog pkg={pkg} />
      <Button
        variant="ghost"
        size="icon"
        title={pkg.is_active ? "Deactivate" : "Activate"}
        disabled={busy !== null}
        onClick={async () => {
          setBusy("toggle");
          await togglePackage(pkg.id, !pkg.is_active);
          setBusy(null);
          router.refresh();
        }}
      >
        {busy === "toggle" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Power className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        title="Delete"
        disabled={busy !== null}
        onClick={async () => {
          if (!confirm(`Delete package "${pkg.name}"? This cannot be undone.`)) return;
          setBusy("delete");
          await deletePackage(pkg.id);
          setBusy(null);
          router.refresh();
        }}
      >
        {busy === "delete" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

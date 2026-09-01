"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePastPaper } from "../actions";

export function DeletePastPaperButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await deletePastPaper(id);
        setBusy(false);
        router.refresh();
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}

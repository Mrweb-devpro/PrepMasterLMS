"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditMaterialDialog } from "./material-form";
import { deleteMaterial } from "../actions";

type MaterialRow = {
  id: string;
  title: string;
  file_url: string;
  is_premium: boolean;
};

export function MaterialControls({
  material,
  subjects,
  courses,
}: {
  material: MaterialRow;
  subjects: { id: string; name: string }[];
  courses: { id: string; name: string; code: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <EditMaterialDialog material={material} subjects={subjects} courses={courses} />
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        disabled={busy}
        onClick={async () => {
          if (!confirm(`Delete "${material.title}"? This cannot be undone.`)) return;
          setBusy(true);
          await deleteMaterial(material.id);
          setBusy(false);
          router.refresh();
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}

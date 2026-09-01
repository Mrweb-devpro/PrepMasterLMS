"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDepartment, deleteDepartment, toggleFaculty } from "../actions";

export function AddDepartment({ facultyId }: { facultyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await createDepartment(facultyId, name);
    setBusy(false);
    if ("error" in res) {
      setError(res.error ?? "Failed");
      return;
    }
    setOpen(false);
    setName("");
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Department
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add department</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="e.g. Mechanical Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy || !name.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ToggleFacultyButton({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      title={isActive ? "Deactivate" : "Activate"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await toggleFaculty(id, !isActive);
        setBusy(false);
        router.refresh();
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
    </Button>
  );
}

export function DeleteDepartmentButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-destructive"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await deleteDepartment(id);
        setBusy(false);
        router.refresh();
      }}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </Button>
  );
}

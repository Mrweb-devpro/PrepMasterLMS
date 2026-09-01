"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPackage, updatePackage } from "../actions";

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

function PackageForm({
  initial,
  onSubmit,
  busy,
}: {
  initial?: PackageRow;
  onSubmit: (data: { name: string; description: string | null; price: number }) => void;
  busy: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          placeholder="e.g. Premium Monthly"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="What does this package include?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Price (NGN)</Label>
        <Input
          type="number"
          min={0}
          placeholder="e.g. 5000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          onClick={() =>
            onSubmit({
              name,
              description: description.trim() ? description.trim() : null,
              price: Number(price) || 0,
            })
          }
          disabled={busy || !name.trim()}
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          {initial ? "Save" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export function AddPackageDialog({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(data: { name: string; description: string | null; price: number }) {
    setBusy(true);
    setError(null);
    const res = await createPackage(data);
    setBusy(false);
    if ("error" in res) {
      setError(res.error ?? "Failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {children ?? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add package
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add package</DialogTitle>
          </DialogHeader>
          <PackageForm onSubmit={submit} busy={busy} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditPackageDialog({ pkg }: { pkg: PackageRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(data: { name: string; description: string | null; price: number }) {
    setBusy(true);
    setError(null);
    const res = await updatePackage(pkg.id, data);
    setBusy(false);
    if ("error" in res) {
      setError(res.error ?? "Failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit package</DialogTitle>
          </DialogHeader>
          <PackageForm initial={pkg} onSubmit={submit} busy={busy} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}

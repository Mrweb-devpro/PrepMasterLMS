import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type CategorySlug, type Course, type DriveFile } from "@/lib/mock-data";
import { api, toKobo } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import { updateMockMaterial, useRefreshCatalog } from "@/features/catalog/useCatalog";

export function EditMaterialDialog({
  open,
  onOpenChange,
  file,
  course,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile;
  course: Course;
  onSuccess?: () => void;
}) {
  const refreshCatalog = useRefreshCatalog();
  const [title, setTitle] = useState(file.name);
  const [category, setCategory] = useState<CategorySlug>(file.category);
  const [subfolder, setSubfolder] = useState(file.subfolderSlug);
  const [paid, setPaid] = useState(file.paid);
  const [price, setPrice] = useState(file.price ?? 0);
  const [saving, setSaving] = useState(false);
  const subfolders = useMemo(() => course.subfolders[category] ?? [], [category, course.subfolders]);

  useEffect(() => {
    if (!open) return;
    setTitle(file.name);
    setCategory(file.category);
    setSubfolder(file.subfolderSlug);
    setPaid(file.paid);
    setPrice(file.price ?? 0);
  }, [file, open]);

  const save = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error("Enter a file name");
      return;
    }
    const priceKobo = paid ? toKobo(Math.max(0, price)) : 0;
    setSaving(true);
    try {
      if (LIVE) {
        await api.patch(`/materials/${file.id}`, { title: cleanTitle, category, subfolder, priceKobo });
      } else {
        updateMockMaterial(file.id, {
          name: cleanTitle,
          category,
          subfolderSlug: subfolder,
          paid: priceKobo > 0,
          ...(priceKobo > 0 ? { price: priceKobo / 100 } : {}),
        });
      }
      await refreshCatalog();
      onSuccess?.();
      toast.success("Material updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't update material", { description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit material details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="material-title">File name</Label>
            <Input id="material-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="material-category">Category</Label>
            <select
              id="material-category"
              value={category}
              onChange={(event) => {
                const nextCategory = event.target.value as CategorySlug;
                setCategory(nextCategory);
                setSubfolder(course.subfolders[nextCategory]?.[0]?.slug ?? "");
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="material-subfolder">Subfolder</Label>
            <select
              id="material-subfolder"
              value={subfolder}
              onChange={(event) => setSubfolder(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {subfolders.length === 0 && <option value="">No subfolder</option>}
              {subfolders.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Access type</legend>
            <div className="flex gap-4 text-sm text-text-secondary">
              <label className="flex items-center gap-2"><input type="radio" checked={!paid} onChange={() => setPaid(false)} /> Free</label>
              <label className="flex items-center gap-2"><input type="radio" checked={paid} onChange={() => setPaid(true)} /> Paid</label>
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="material-price">Price in naira</Label>
            <Input
              id="material-price"
              type="number"
              min={0}
              disabled={!paid}
              value={price}
              onChange={(event) => setPrice(Math.max(0, Number(event.target.value)))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

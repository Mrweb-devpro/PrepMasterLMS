import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRefreshCatalog } from "@/features/catalog/useCatalog";
import { api, toKobo, uploadToSignedUrl } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import type { CategorySlug, Course, FileType } from "@/lib/mock-data";

function typeOf(name: string): FileType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["ppt", "pptx"].includes(ext)) return "slides";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  return "pdf";
}

/** Admin upload: file goes straight to storage, then its details are saved. */
export function UploadMaterialDialog({
  open,
  onOpenChange,
  course,
  category,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  course: Course;
  category: CategorySlug;
}) {
  const refresh = useRefreshCatalog();
  const subs = course.subfolders[category] ?? [];
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState(subs[0]?.slug ?? "");
  const [price, setPrice] = useState(0);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!file) return toast.error("Choose a file");
    if (!LIVE || !course.id) {
      toast.info("Uploads work once the server is connected.");
      return onOpenChange(false);
    }
    setBusy(true);
    try {
      const contentType = file.type || "application/octet-stream";
      const { key, uploadUrl } = await api.post<{ key: string; uploadUrl: string }>(
        `/courses/${course.id}/uploads`,
        { fileName: file.name, contentType },
      );
      await uploadToSignedUrl(uploadUrl, file);
      await api.post(`/courses/${course.id}/materials`, {
        category,
        subfolder: folder,
        title: title.trim() || file.name,
        fileType: typeOf(file.name),
        r2Key: key,
        sizeBytes: file.size,
        priceKobo: toKobo(price),
      });
      await refresh();
      toast.success("File uploaded", { description: title || file.name });
      setFile(null);
      setTitle("");
      setPrice(0);
      onOpenChange(false);
    } catch (e) {
      toast.error("Upload failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a file</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label>Name shown to students</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={file?.name ?? "Week 1 notes"} />
          </div>
          <div className="space-y-1.5">
            <Label>Folder</Label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {subs.length === 0 && <option value="">No folder</option>}
              {subs.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Price in naira (0 = free)</Label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={save}>
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

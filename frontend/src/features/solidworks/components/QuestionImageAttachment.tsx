import { ImageIcon, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function QuestionImageAttachment({ imageUrl, onZoom }: { imageUrl: string; onZoom: (url: string) => void }) {
  return (
    <div className="pt-1">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
        <ImageIcon className="size-3.5" /> Attached screenshot
      </p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onZoom(imageUrl);
        }}
        className="group relative inline-block cursor-zoom-in overflow-hidden rounded-lg border border-border bg-surface-subtle transition-all hover:border-primary/50 hover:shadow-md"
      >
        <img
          src={imageUrl}
          alt="Question attachment"
          className="h-28 w-44 object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center gap-1 bg-foreground/30 text-xs font-medium text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="size-3.5" /> Click to expand
        </span>
      </button>
    </div>
  );
}

export function QuestionImageLightbox({ imageUrl, onOpenChange }: { imageUrl: string | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(imageUrl)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-4xl flex-col items-center justify-center overflow-hidden border-border/20 bg-foreground/95 p-2 backdrop-blur-md">
        <DialogTitle className="sr-only">Enlarged question screenshot</DialogTitle>
        <div className="relative max-h-[85vh] max-w-full overflow-auto p-1">
          <img
            src={imageUrl ?? ""}
            alt="Enlarged screenshot"
            className="max-h-[80vh] w-auto max-w-full rounded-md object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

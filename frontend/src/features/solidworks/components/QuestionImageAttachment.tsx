import { Maximize2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function QuestionImageAttachment({ imageUrl, onZoom }: { imageUrl: string; onZoom: (url: string) => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onZoom(imageUrl);
      }}
      className="group relative h-20 w-20 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted transition-all hover:border-primary/50 hover:shadow-md sm:h-24 sm:w-24"
    >
      <img
        src={imageUrl}
        alt="Question attachment"
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-foreground/25 opacity-0 transition-colors group-hover:bg-foreground/35 group-hover:opacity-100">
        <span className="flex items-center gap-1 rounded-full bg-background px-2 py-1 text-2xs font-semibold text-foreground shadow-lg">
          <Maximize2 className="size-3" /> Expand
        </span>
      </span>
    </button>
  );
}

export function QuestionImageLightbox({ imageUrl, onOpenChange }: { imageUrl: string | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(imageUrl)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-4xl flex-col items-center justify-center overflow-hidden border-zinc-800 bg-black/95 p-2 text-white backdrop-blur-md [&>button:last-child]:hidden sm:p-4">
        <DialogTitle className="sr-only">Enlarged question screenshot</DialogTitle>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close image preview"
          className="absolute right-3 top-3 z-50 flex size-9 items-center justify-center rounded-full bg-red-600 text-white shadow-xl ring-2 ring-white/90 transition-all hover:bg-red-700 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-400"
        >
          <X className="size-5 stroke-[2.5]" />
        </button>
        {imageUrl && (
          <div className="flex max-h-[82vh] items-center justify-center overflow-hidden rounded">
            <img src={imageUrl} alt="Enlarged screenshot" className="max-h-[80vh] w-auto max-w-full rounded object-contain" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

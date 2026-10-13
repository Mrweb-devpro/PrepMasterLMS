import { Download, ExternalLink, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isPublicUrl, officeViewerUrl, viewModeFor } from "../utils/viewer";

export interface ViewableFile {
  name: string;
  url?: string;
  mime?: string;
}

/** Renders a file inside the app: PDF, Word/PowerPoint/Excel, images and video. */
export function FileFrame({ file }: { file: ViewableFile }) {
  const mode = viewModeFor(file.name, file.mime);
  const { url } = file;

  if (!url)
    return <Unavailable text="This is a sample entry — there's no real file attached yet." />;
  if (mode === "pdf")
    return (
      <iframe
        title={file.name}
        src={url}
        className="h-full w-full rounded-md border border-border bg-surface"
      />
    );
  if (mode === "image")
    return (
      <img
        src={url}
        alt={file.name}
        className="mx-auto max-h-full max-w-full rounded-md object-contain"
      />
    );
  if (mode === "video")
    return <video src={url} controls className="mx-auto max-h-full max-w-full rounded-md" />;
  if (mode === "office") {
    return isPublicUrl(url) ? (
      <iframe
        title={file.name}
        src={officeViewerUrl(url)}
        className="h-full w-full rounded-md border border-border bg-surface"
      />
    ) : (
      <Unavailable
        text="Word and PowerPoint files can only be previewed once they're uploaded. Download to open it."
        url={url}
        name={file.name}
      />
    );
  }
  return (
    <Unavailable
      text="This file type can't be shown in the browser (e.g. SolidWorks parts). Download it to open in SolidWorks."
      url={url}
      name={file.name}
    />
  );
}

function Unavailable({ text, url, name }: { text: string; url?: string; name?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-strong bg-surface-subtle p-8 text-center">
      <FileQuestion className="size-8 text-text-muted" />
      <p className="max-w-sm text-sm text-text-secondary">{text}</p>
      {url && (
        <Button asChild size="sm" variant="outline">
          <a href={url} download={name}>
            <Download className="size-4" /> Download
          </a>
        </Button>
      )}
    </div>
  );
}

export function FileViewerDialog({
  file,
  onClose,
}: {
  file: ViewableFile | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={file !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-3 p-4 sm:p-5">
        <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0 pr-8">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base">{file?.name}</DialogTitle>
            <DialogDescription className="sr-only">File preview</DialogDescription>
          </div>
          {file?.url && (
            <Button asChild size="sm" variant="ghost" className="shrink-0">
              <a href={file.url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Open in new tab
              </a>
            </Button>
          )}
        </DialogHeader>
        <div className="min-h-0 flex-1">{file && <FileFrame file={file} />}</div>
      </DialogContent>
    </Dialog>
  );
}

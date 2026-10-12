export type ViewMode = "pdf" | "office" | "image" | "video" | "unsupported";

const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

export function viewModeFor(name: string, mime?: string): ViewMode {
  const e = ext(name);
  if (e === "pdf" || mime === "application/pdf") return "pdf";
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(e)) return "office";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(e) || mime?.startsWith("image/"))
    return "image";
  if (["mp4", "webm", "mov"].includes(e) || mime?.startsWith("video/")) return "video";
  return "unsupported";
}

/** Microsoft's free viewer — only works for files reachable at a public https link. */
export const officeViewerUrl = (url: string) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

export const isPublicUrl = (url?: string) => !!url && /^https:\/\//.test(url);

/** Sample files so Drive items open in the prototype. Real files will come from storage links. */
export const SAMPLE_FILES = {
  pdf: {
    url: "/samples/sample-notes.pdf",
    ext: "pdf",
  },
  doc: { url: "https://calibre-ebook.com/downloads/demos/demo.docx", ext: "docx" },
  slides: {
    url: "https://scholar.harvard.edu/files/torman_personal/files/samplepptx.pptx",
    ext: "pptx",
  },
  video: {
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    ext: "mp4",
  },
  image: {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg",
    ext: "jpg",
  },
} as const;

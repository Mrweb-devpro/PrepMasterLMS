import type { ViewableFile } from "@/features/files/components/FileViewer";
import { SAMPLE_FILES } from "@/features/files/utils/viewer";
import { api } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import type { DriveFile } from "@/lib/mock-data";

const EXT = { pdf: "pdf", doc: "docx", slides: "pptx", video: "mp4", image: "jpg" } as const;
const withExt = (file: DriveFile) =>
  /\.\w+$/.test(file.name) ? file.name : `${file.name}.${EXT[file.type]}`;

/** Dummy mode: a sample file per type. */
export function toViewable(file: DriveFile): ViewableFile {
  return { name: withExt(file), url: SAMPLE_FILES[file.type].url };
}

/** LIVE: asks the server for a short-lived link (paid files must be owned). */
export async function loadViewable(file: DriveFile): Promise<ViewableFile> {
  if (!LIVE) return toViewable(file);
  const { url } = await api.get<{ url: string }>(`/materials/${file.id}/download`);
  return { name: withExt(file), url };
}

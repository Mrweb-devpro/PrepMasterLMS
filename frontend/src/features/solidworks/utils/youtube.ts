export function youtubeId(url?: string) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

export const youtubeThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id: string) => `https://www.youtube.com/embed/${id}`;

/** Uploaded thumbnail wins; otherwise use the video's own preview image. */
export function taskThumb(t: { thumbnailUrl?: string; videoUrl?: string }) {
  if (t.thumbnailUrl) return t.thumbnailUrl;
  const id = youtubeId(t.videoUrl);
  return id ? youtubeThumb(id) : undefined;
}

/** Builds the standard per-page head tags. */
export const pageHead = (title: string, description: string) => ({
  meta: [
    { title: `${title} — PrepMaster` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — PrepMaster` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});

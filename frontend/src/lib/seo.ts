/** Builds the standard per-page head tags. */
export const pageHead = (title: string, description: string, brand = "PrepMaster") => ({
  meta: [
    { title: `${title} | ${brand}` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | ${brand}` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});

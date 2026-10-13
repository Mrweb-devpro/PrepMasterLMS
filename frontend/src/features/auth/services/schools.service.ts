// Live world universities list (public, ~10k entries). Fetched once and cached by TanStack Query.
const SOURCE =
  "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";

export interface School {
  name: string;
  country: string;
}

export async function fetchWorldSchools(): Promise<School[]> {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error("Could not load the schools list");
  const rows = (await res.json()) as { name: string; country: string }[];
  const seen = new Set<string>();
  const out: School[] = [];
  for (const r of rows) {
    const k = `${r.name}|${r.country}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name: r.name, country: r.country });
  }
  // Nigerian schools first, then alphabetical.
  return out.sort(
    (a, b) =>
      Number(b.country === "Nigeria") - Number(a.country === "Nigeria") ||
      a.name.localeCompare(b.name),
  );
}

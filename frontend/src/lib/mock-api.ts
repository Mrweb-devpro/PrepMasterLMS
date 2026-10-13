// Simulated network helpers for the dummy-data services.
// When the real API is wired up, only the services change — hooks and pages stay the same.

export const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const nowIso = () => new Date().toISOString();

export const clone = <T>(v: T): T => structuredClone(v);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 ** 2
      ? `${(n / 1024).toFixed(0)} KB`
      : `${(n / 1024 ** 2).toFixed(1)} MB`;

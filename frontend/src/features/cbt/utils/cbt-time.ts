/** Converts an instant to the local value expected by a datetime-local input. */
export function localDateTime(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Formats a CBT timestamp with a concise, student-friendly 24-hour date and time. */
export function formatSmartCbtDate(dateStr?: string | null): string {
  if (!dateStr) return "Anytime";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Anytime";

  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return `Today, ${time}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();
  if (isTomorrow) return `Tomorrow, ${time}`;

  const prefix = `${date.toLocaleDateString([], { weekday: "short" })}, ${date.getDate()} ${date.toLocaleDateString([], { month: "short" })}`;
  return date.getFullYear() === now.getFullYear()
    ? `${prefix}, ${time}`
    : `${prefix} ${date.getFullYear()}, ${time}`;
}

/** Formats a closing timestamp compactly when it falls on the current day. */
export function formatEndTimeOnly(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : formatSmartCbtDate(dateStr);
}

/** Formats a non-negative duration as MM:SS. */
export function formatSecondsCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

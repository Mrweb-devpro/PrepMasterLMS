/** C++ language mark used throughout the C++ Web Book experience. */
export function CppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z" className="fill-primary" />
      <path d="M21.4 17.2a7.3 7.3 0 1 0 0 13.6" className="stroke-primary-foreground" strokeWidth="3.1" strokeLinecap="round" />
      <path d="M29.4 19.4h8M33.4 15.4v8M29.4 29h8M33.4 25v8" className="stroke-primary-foreground" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

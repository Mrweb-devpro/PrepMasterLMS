import { cn } from "@/lib/utils";

interface NotFoundIllustrationProps {
  className?: string;
}

/** A theme-aware adaptation of the supplied “page eaten” illustration. */
export function NotFoundIllustration({ className }: NotFoundIllustrationProps) {
  return (
    <svg
      viewBox="0 0 645 750"
      role="img"
      aria-label="A creature holding a torn page"
      className={cn("h-auto w-full max-w-[150px] drop-shadow-sm sm:max-w-[170px]", className)}
    >
      <path
        d="M39 648s67 48 87 48l14-6 16 1 4 12 25 5-9 9 29 7 17-11 6 7 20-7 5 11 24-9 16 6s3 17 17 19c14 1 34 11 34 11l45-19 5-9 16 4 41-23c-12-4-13-10-13-10l-8 2c-16-4-4-18-4-18 9-14 2-12 2-12l-13 4-7-11-17 6 4-7-6-3 1-7c6-6-4-11-4-11s-26 8-17-6c9-14 1-20 1-20l-63-20-7 10c-23-6-16 13-16 13-16 1-10 10-10 10-19-2-14 9-14 9l-15-4c-12-3-3-5-3-5 9-1-3-5-3-5s4-16-7-11c-12 5-21 11-21 11L39 648Z"
        className="fill-surface-subtle"
      />
      <path
        d="M43 642s67 48 87 48l14-6 16 1 4 12 25 5-9 9 29 7 17-11 6 7 20-7 5 11 24-9 16 6s3 17 17 19c14 1 34 11 34 11l45-19 5-9 16 4 41-23c-12-4-13-10-13-10l-8 2c-16-4-4-18-4-18 9-14 2-12 2-12l-13 4-7-11-17 6 4-7-6-3 1-7c6-6-4-11-4-11s-26 8-17-6c9-14 1-20 1-20l-63-20-7 10c-23-6-16 13-16 13-16 1-10 10-10 10-19-2-14 9-14 9l-15-4c-12-3-3-5-3-5 9-1-3-5-3-5s4-16-7-11c-12 5-21 11-21 11L43 642Z"
        className="fill-card stroke-border"
        strokeWidth="2"
      />
      <path
        d="M522 481s54-13 48-66l10 3v-20s20 33 20 46c0 13 9 106-94 88l16-51Z"
        className="fill-primary"
      />
      <path
        d="m230 39-14 1h-22c-15-4-21-1-21-1l7 4c-13 1-17 7-17 7h12c-16 4-19 15-19 15-3 11-31 37-31 37-58 47 13 111 13 111s9 27 6 31c-3 4 36 10 40-20 4-30 13-93 13-100s19-51 19-51"
        className="fill-primary"
      />
      <path
        d="m404 39 14 1h22c15-4 21-1 21-1l-7 4c13 1 17 7 17 7h-12c16 4 19 15 19 15 3 11 31 37 31 37 58 47-13 111-13 111s-9 27-6 31c3 4-36 10-40-20-4-30-13-93-13-100s-19-51-19-51"
        className="fill-primary"
      />
      <path
        d="M519 531c-3 14-16 24-16 24-6 36-30 20-30 20-1 6-29 3-29 3l-4-6v17c0 13-17 9-17 9-4 13-30 6-30 6-10 9-30 0-30 0-26-1-29-23-29-23l4-37-26 1c-29 25-58 3-58 3s-5 25-8 38c-3 13-42 9-42 9-9 9-28-2-28-2-15 6-25-8-25-8-21-20 18-52 18-52v-74c-16-66 7-187 7-187 2-6 5-10 9-13 9-7 21-8 21-8s194-17 223-14c5 1 10 4 13 9 15 23 14 80 14 80 29 13 36 76 36 76 66 23 27 114 24 128Z"
        className="fill-primary"
      />
      <path
        d="M409 32S308-45 216 39c0 0-63 158-39 195s96 69 96 69 46 10 89 0 90-79 90-79 1-180-43-192Z"
        className="fill-primary"
      />
      <path
        d="M348 91c6 14 19 24 34 28m-110-29c-3 8-8 14-13 20-6 5-12 9-18 11"
        className="stroke-foreground"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="382" cy="156" r="26" className="fill-card" />
      <circle cx="380" cy="154" r="20" className="fill-foreground" />
      <circle cx="385" cy="143" r="4" className="fill-card" />
      <circle cx="255" cy="157" r="26" className="fill-card" />
      <circle cx="253" cy="156" r="20" className="fill-foreground" />
      <circle cx="258" cy="145" r="4" className="fill-card" />
      <path
        d="M313 252s-46-14-34-41c11-27 47-17 47-17s31 5 22 28c-7 17-18 24-35 30Z"
        className="fill-foreground"
      />
      <path d="m295 213 13 11 13-11h-26Z" className="fill-card" />
      <ellipse cx="323" cy="226" rx="4" ry="3" className="fill-card" />
      <path
        d="M257 548c28-58 0-110 0-110m81 106c-2-36 12-100 12-101"
        className="stroke-foreground"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="m126 636 85-28 93 33-86 35-92-40Zm164-33 5-5 63 23-3 4-66-22Zm-91 82-6 2 69 23 3-4-66-21Z"
        className="fill-surface-subtle"
      />
    </svg>
  );
}

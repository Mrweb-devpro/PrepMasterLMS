import { Check, ChevronsUpDown, Info, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/features/admin/components/parts";
import { cn } from "@/lib/utils";
import { FACULTIES, FACULTY_NAMES, HEARD_OPTIONS, LEVELS } from "../constants/options";
import { useSchools } from "../hooks/useSchools";
import type { Gender, Profile } from "../types";
import { looksLikeStudentEmail } from "../utils/profile";

export type ProfileDraft = Partial<Profile> & { password?: string };
type Change = (patch: ProfileDraft) => void;

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  hint,
  disabled,
}: {
  label: string;
  value?: string | undefined;
  onChange: (v: string) => void;
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label} {...(hint ? { hint } : {})}>
      <Select value={value ?? ""} onValueChange={onChange} disabled={!!disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function SchoolPicker({
  value,
  onChange,
}: {
  value?: string | undefined;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data, isLoading, isError, refetch } = useSchools(open);

  const results = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    return (
      s
        ? data.filter(
            (x) => x.name.toLowerCase().includes(s) || x.country.toLowerCase().includes(s),
          )
        : data
    ).slice(0, 60);
  }, [data, q]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <Field label="School / institution">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm"
          >
            <span className={cn("truncate", !value && "text-text-muted")}>
              {value || "Search any school in the world"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-text-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] min-w-72 p-0">
          <div className="border-b border-border p-2">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type a school or country…"
            />
          </div>
          <div className="scrollbar-thin max-h-64 overflow-y-auto p-1">
            {isLoading && (
              <p className="flex items-center gap-2 px-2 py-3 text-sm text-text-muted">
                <Loader2 className="size-4 animate-spin" /> Loading schools…
              </p>
            )}
            {isError && (
              <button
                type="button"
                onClick={() => refetch()}
                className="w-full px-2 py-3 text-left text-sm text-destructive"
              >
                Couldn't load the list. Tap to retry.
              </button>
            )}
            {results.map((s) => (
              <button
                type="button"
                key={`${s.name}-${s.country}`}
                onClick={() => pick(s.name)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-surface-hover"
              >
                <Check
                  className={cn(
                    "size-3.5 shrink-0",
                    value === s.name ? "text-primary" : "opacity-0",
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="shrink-0 text-2xs text-text-muted">{s.country}</span>
              </button>
            ))}
            {data && q.trim() && (
              <button
                type="button"
                onClick={() => pick(q.trim())}
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-primary hover:bg-surface-hover"
              >
                Use “{q.trim()}”
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export function NameFields({ value, onChange }: { value: ProfileDraft; onChange: Change }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="First name">
        <Input
          value={value.firstName ?? ""}
          onChange={(e) => onChange({ firstName: e.target.value })}
          placeholder="Ada"
        />
      </Field>
      <Field label="Last name">
        <Input
          value={value.lastName ?? ""}
          onChange={(e) => onChange({ lastName: e.target.value })}
          placeholder="Obi"
        />
      </Field>
    </div>
  );
}

export function DobField({ value, onChange }: { value: ProfileDraft; onChange: Change }) {
  return (
    <Field label="Date of birth (optional)">
      <Input
        type="date"
        value={value.dob ?? ""}
        onChange={(e) => onChange({ dob: e.target.value })}
      />
    </Field>
  );
}

export function StudyFields({ value, onChange }: { value: ProfileDraft; onChange: Change }) {
  const courses = value.faculty ? (FACULTIES[value.faculty] ?? []) : [];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Faculty"
          value={value.faculty}
          options={FACULTY_NAMES}
          onChange={(faculty) => onChange({ faculty, course: "" })}
        />
        <SelectField
          label="Department"
          value={value.course}
          options={courses}
          disabled={!value.faculty}
          placeholder={value.faculty ? "Select…" : "Pick a faculty first"}
          onChange={(course) => onChange({ course })}
        />
      </div>
      <SelectField
        label="Level"
        value={value.level}
        options={LEVELS.map((l) => ({ value: l, label: l === "Postgraduate" ? l : `${l} level` }))}
        onChange={(level) => onChange({ level })}
      />
    </div>
  );
}

export function GenderField({
  value,
  onChange,
}: {
  value?: Gender | undefined;
  onChange: (gender: Gender) => void;
}) {
  return (
    <SelectField
      label="Gender (optional)"
      value={value}
      options={[
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
        { value: "prefer_not_to_say", label: "Prefer not to say" },
      ]}
      placeholder="Select your gender"
      onChange={(gender) => onChange(gender as Gender)}
    />
  );
}

export function HeardField({
  value,
  onChange,
}: {
  value?: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {HEARD_OPTIONS.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-10 rounded-md border px-3 text-sm transition-all",
            value === o.value
              ? "border-primary bg-primary-soft font-medium text-primary ring-1 ring-primary"
              : "border-border bg-surface hover:border-border-strong",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmailPasswordFields({
  value,
  onChange,
}: {
  value: ProfileDraft;
  onChange: Change;
}) {
  const email = value.email ?? "";
  return (
    <div className="space-y-4">
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="you@school.edu.ng"
        />
      </Field>
      {!looksLikeStudentEmail(email) && (
        <p className="flex gap-2 rounded-md bg-primary-soft px-3 py-2 text-xs text-primary">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Tip: use your student email if you have one — it helps us confirm you're a student.
        </p>
      )}
      <Field label="Password" hint="At least 8 characters">
        <Input
          type="password"
          value={value.password ?? ""}
          onChange={(e) => onChange({ password: e.target.value })}
          placeholder="••••••••"
        />
      </Field>
    </div>
  );
}

export function GoogleButton({
  onClick,
  label = "Continue with Google",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-surface text-sm font-medium transition-colors hover:bg-surface-hover"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
        />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
        <path
          fill="#EA4335"
          d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
        />
      </svg>
      {label}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-2xs uppercase tracking-wider text-text-muted">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

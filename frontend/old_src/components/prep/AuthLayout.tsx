import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-gradient p-12 text-ink-foreground lg:flex lg:flex-col">
        <div className="dot-grid absolute inset-0 opacity-50" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary"><GraduationCap className="size-5" /></span>
          <span className="font-display text-lg font-semibold">PrepMaster</span>
        </Link>
        <div className="relative mt-auto">
          <h2 className="max-w-md text-[44px] font-semibold leading-[1.05]">Every note, past question and mock exam — in one place.</h2>
          <p className="mt-4 max-w-sm text-ink-muted">Join thousands of students preparing smarter with timed CBTs and organised course drives.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-text-secondary">{footer}</p>
        </div>
      </div>
    </div>
  );
}

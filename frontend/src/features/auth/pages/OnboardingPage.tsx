import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/prep/AuthLayout";
import {
  DobField,
  HeardField,
  NameFields,
  StudyFields,
  type ProfileDraft,
} from "../components/fields";
import { StepCard } from "../components/StepCard";
import { useSession } from "../session";
import { isMainProfileComplete } from "../utils/profile";
import { checks } from "../utils/validate";
import { generateAvatarUrl } from "../utils/avatar";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { cn } from "@/lib/utils";

type StepKey = "names" | "study" | "gender" | "heard";

/**
 * "Finish setting up your account" — required before the main dashboard.
 * Only asks what's missing (e.g. after Google sign-up, or a SolidWorks-only freelancer).
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const { hydrated, user, update, signOut } = useSession();
  const [draft, setDraft] = useState<ProfileDraft>({});
  const [i, setI] = useState(0);
  const [saving, setSaving] = useState(false);

  // Decide steps once, from what the user had when they arrived.
  const steps = useMemo<StepKey[]>(() => {
    if (!user) return [];
    const s: StepKey[] = [];
    if (!user.firstName || !user.lastName) s.push("names");
    if (!user.faculty || !user.course || !user.level) s.push("study");
    if (!user.gender) s.push("gender");
    if (!user.heard) s.push("heard");
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (isMainProfileComplete(user) && steps.length === 0)
      navigate({ to: "/", replace: true });
  }, [hydrated, user, steps.length, navigate]);

  useEffect(() => {
    if (user) setDraft({ ...user });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!hydrated || !user || steps.length === 0) return null;

  const patch = (p: ProfileDraft) => setDraft((d) => ({ ...d, ...p }));
  const key = steps[i];
  const last = i === steps.length - 1;

  const advance = (check?: (d: ProfileDraft) => string | null) => async () => {
    if (saving) return;
    const err = check?.(draft);
    if (err) {
      toast.error(err);
      return;
    }
    if (!last) {
      setI(i + 1);
      return;
    }
    const { password: _pw, ...profile } = draft;
    setSaving(true);
    try {
      await update(profile);
      toast.success("You're all set", { description: "Your account setup is complete." });
      await navigate({ to: "/" });
    } catch {
      // The session provider has already shown the save error.
    } finally {
      setSaving(false);
    }
  };

  const common = {
    step: i,
    total: steps.length,
    ...(i > 0 ? { onBack: () => setI(i - 1) } : {}),
    nextLabel: last ? "Finish setup" : "Continue",
    busy: saving,
  };

  return (
    <AuthLayout
      heroTitle="Almost there."
      heroText="A few details and your dashboard is ready. You can't skip this — it helps us show you the right materials."
      footer={
        <button
          className="text-text-muted hover:text-foreground"
          onClick={() => {
            signOut();
            navigate({ to: "/login" });
          }}
        >
          Not you? Sign out
        </button>
      }
    >
      <p className="mb-5 rounded-md border border-border bg-surface-subtle px-3 py-2 text-xs text-text-secondary">
        Signed in as <span className="font-medium text-foreground">{user.email}</span>. Finish
        setting up your account to continue.
      </p>
      {key === "names" && (
        <StepCard {...common} title="About you" onNext={advance(checks.names)}>
          <NameFields value={draft} onChange={patch} />
          <DobField value={draft} onChange={patch} />
        </StepCard>
      )}
      {key === "study" && (
        <StepCard
          {...common}
          title="Your studies"
          subtitle="PrepMaster is organised by faculty and department."
          onNext={advance(checks.study)}
        >
          <StudyFields value={draft} onChange={patch} />
        </StepCard>
      )}
      {key === "heard" && (
        <StepCard
          {...common}
          title="Where did you hear about us?"
          subtitle="Optional."
          onNext={advance()}
          aside={
            <Button type="button" variant="ghost" onClick={advance()} disabled={saving}>
              Skip
            </Button>
          }
        >
          <HeardField value={draft.heard} onChange={(heard) => patch({ heard })} />
        </StepCard>
      )}
      {key === "gender" && (
        <StepCard {...common} title="Choose your avatar" subtitle="Select your gender to get started. You can shuffle your avatar later in Settings."
          onNext={advance((value) => value.gender ? null : "Please select Male or Female")}>
          <div className="grid grid-cols-2 gap-3">
            {(["male", "female"] as const).map((gender) => (
              <button key={gender} type="button" aria-pressed={draft.gender === gender} disabled={saving}
                onClick={() => patch({ gender, avatarUrl: generateAvatarUrl(gender) })}
                className={cn("rounded-lg border p-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  draft.gender === gender ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-hover")}>
                {gender === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2" aria-live="polite">
            <ProfileAvatar user={draft} size="lg" />
            <p className="text-xs text-text-muted">{draft.gender ? "Your new avatar" : "Your avatar will appear here"}</p>
            <a href="https://www.dicebear.com/styles/adventurer/" target="_blank" rel="noreferrer" className="text-2xs text-text-muted underline">
              Adventurer by Lisa Wischofsky · CC BY 4.0 · Customized with DiceBear
            </a>
          </div>
        </StepCard>
      )}
    </AuthLayout>
  );
}

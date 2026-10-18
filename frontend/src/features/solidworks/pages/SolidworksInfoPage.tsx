import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  ClipboardList,
  MessageCircleQuestion,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session";
import { fullName } from "@/features/auth/utils/profile";
import bracket from "@/assets/sw-task-bracket.jpg";
import { useRegisterSw } from "../hooks/mutations";

const POINTS = [
  {
    icon: ClipboardList,
    title: "A task with every video",
    text: "Each MrPrepMaster video ends with a drawing task.",
  },
  {
    icon: Upload,
    title: "Submit your files",
    text: "Upload your SolidWorks part plus its mass and volume.",
  },
  {
    icon: CheckCircle2,
    title: "Get graded",
    text: "See your score, verdict and remarks from the instructor.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Ask questions",
    text: "Stuck? Ask and get a reply right in the app.",
  },
];

/** Shown inside the student dashboard: explains SolidWorks and lets the student join in one click. */
export function SolidworksInfoPage() {
  const { user, update } = useSession();
  const register = useRegisterSw();
  if (!user) return null;
  const joined = user.swRegistered;

  return (
    <>
      <PageHeader
        title="SolidWorks with MrPrepMaster"
        subtitle="Practise CAD with real feedback — using your PrepMaster account."
      />
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <img
          src={bracket}
          alt="SolidWorks bracket model"
          width={1280}
          height={720}
          className="aspect-[21/9] w-full object-cover"
        />
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div key={p.title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                <p.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-sm text-text-muted">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-6">
          <p className="text-sm text-text-secondary">
            {joined
              ? "You're registered. Your SolidWorks dashboard is ready."
              : "Free to join. No new account needed."}
          </p>
          {joined ? (
            <Button asChild size="lg">
              <Link to="/solidworks">
                <Box className="size-4" /> Open SolidWorks dashboard{" "}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={register.isPending}
              onClick={() =>
                register.mutate(
                  {
                    userId: user.id,
                    name: fullName(user),
                    email: user.email,
                    userType: user.userType ?? "student",
                    heard: "prepmaster-app",
                  },
                  { onSuccess: () => void update({ swRegistered: true }).catch(() => undefined) },
                )
              }
            >
              Register for SolidWorks
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

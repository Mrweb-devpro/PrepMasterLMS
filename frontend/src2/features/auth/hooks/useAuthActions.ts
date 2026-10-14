import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "../services/auth.service";
import { useSession } from "../session";
import type { ProfileDraft } from "../components/fields";
import type { Profile } from "../types";

const onError = (e: Error) => toast.error(e.message || "Something went wrong");

export function useAuthActions() {
  const { signIn } = useSession();
  const done = (p: Profile) => signIn(p);

  const emailSignIn = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.signInWithEmail(email, password),
    onSuccess: (p) => {
      done(p);
      toast.success(`Welcome back, ${p.firstName}`);
    },
    onError,
  });

  const google = useMutation({
    mutationFn: () => authService.signInWithGoogle(),
    onSuccess: (p) => {
      done(p);
      toast.success("Signed in with Google");
    },
    onError,
  });

  const emailSignUp = useMutation({
    mutationFn: (d: ProfileDraft) => authService.signUpWithEmail(d),
    onError,
  });

  return { emailSignIn, google, emailSignUp };
}

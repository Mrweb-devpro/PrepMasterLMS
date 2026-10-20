import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flushSync } from "react-dom";
import { LIVE } from "@/lib/api/config";
import { PERSONAS } from "../constants/personas";
import { toast } from "sonner";
import { authService } from "../services/auth.service";
import { useSession } from "../session";
import type { ProfileDraft } from "../components/fields";
import type { Profile } from "../types";

const onError = (e: Error) => toast.error(e.message || "Something went wrong");

export function useAuthActions(options?: { onEmailSignInError?: (error: Error, email: string) => void }) {
  const { signIn, user } = useSession();
  const queryClient = useQueryClient();
  const done = (p: Profile) => signIn(p);

  const emailSignIn = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.signInWithEmail(email, password),
    onSuccess: (p) => {
      done(p);
      toast.success(`Welcome back, ${p.firstName}`);
    },
    onError: (error: Error, variables) => {
      if (options?.onEmailSignInError) options.onEmailSignInError(error, variables.email);
      else onError(error);
    },
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

  const resetPassword = useMutation({
    mutationFn: (email: string) => authService.resetPassword(email),
    onError,
  });

  const resendVerification = useMutation({
    mutationFn: (email: string) => authService.resendVerification(email),
    onSuccess: () => toast.success("Verification email resent! Please check your inbox and spam folder."),
    onError,
  });

  const updatePassword = useMutation({
    mutationFn: (password: string) => authService.updatePassword(password),
    onError,
  });

  const refreshSession = useMutation({
    mutationFn: async () => {
      const queryKey = ["auth", "session"] as const;
      await queryClient.invalidateQueries({ queryKey });
      const profile = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => LIVE ? authService.currentUser() : Promise.resolve(user ?? PERSONAS.student.profile),
        staleTime: 0,
      });
      if (!profile) throw new Error("Your session has expired. Please open a new recovery link.");
      return profile;
    },
    // Route guards must see the restored profile before navigation starts.
    onSuccess: (profile) => flushSync(() => signIn(profile)),
    onError,
    throwOnError: false,
  });

  return { emailSignIn, google, emailSignUp, resetPassword, updatePassword, refreshSession, resendVerification };
}

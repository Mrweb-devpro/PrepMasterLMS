// Auth service. Uses the real sign-in when the backend is configured (LIVE),
// otherwise the dummy personas. Pages and hooks don't know the difference.
import { api } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import { supabase } from "@/lib/api/supabase";
import { delay, nowIso, uid } from "@/lib/mock-api";
import { PERSONAS } from "../constants/personas";
import type { ProfileDraft } from "../components/fields";
import type { Profile } from "../types";
import { toProfile, toProfilePatch, type MeResponse } from "./profile.mapper";

const base = (d: ProfileDraft, provider: Profile["provider"]): Profile => ({
  id: uid("usr"),
  firstName: d.firstName?.trim() ?? "",
  lastName: d.lastName?.trim() ?? "",
  email: d.email?.trim() ?? "",
  role: "student",
  provider,
  emailVerified: provider === "google",
  swRegistered: false,
  joinedAt: nowIso(),
  ...(d.faculty ? { faculty: d.faculty } : {}),
  ...(d.course ? { course: d.course } : {}),
  ...(d.level ? { level: d.level } : {}),
  ...(d.dob ? { dob: d.dob } : {}),
  ...(d.heard ? { heard: d.heard } : {}),
  ...(d.userType ? { userType: d.userType } : {}),
});

/** Credentials from the last sign-up, used once the email link has been clicked. */
let pending: { email: string; password: string } | null = null;

export const authService = {
  async checkEmailAvailable(email: string): Promise<boolean> {
    const clean = email.trim().toLowerCase();
    if (!clean) return false;
    if (LIVE) {
      const result = await api.post<{ available: boolean }>("/auth/check-email", { email: clean });
      return result.available;
    }
    await delay(400);
    const mockTaken = ["admin@prepmaster.app", "david@unilag.edu.ng", "student@prepmaster.app"];
    return !mockTaken.includes(clean);
  },

  async updateProfile(patch: Partial<Profile>): Promise<void> {
    if (!LIVE) return;
    const body = toProfilePatch(patch);
    if (Object.keys(body).length) await api.patch("/me", body);
  },
  /** Loads the signed-in user's profile from the API (null when signed out). */
  async currentUser(): Promise<Profile | null> {
    const { data } = await supabase().auth.getSession();
    if (!data.session) return null;
    const me = await api.get<MeResponse>("/me");
    return toProfile(me, Boolean(data.session.user.email_confirmed_at));
  },

  async signInWithEmail(email: string, password: string): Promise<Profile> {
    if (LIVE) {
      const { error } = await supabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      const p = await this.currentUser();
      if (!p) throw new Error("Couldn't sign you in. Try again.");
      return p;
    }
    await delay(500);
    if (password.length < 1) throw new Error("Enter your password");
    // Demo: any email containing "admin" signs in as the admin.
    if (/admin/i.test(email)) return { ...PERSONAS.admin.profile, email };
    const known = Object.values(PERSONAS).find((p) => p.profile?.email === email)?.profile;
    return known ?? { ...PERSONAS.student.profile, email };
  },

  async resetPassword(email: string): Promise<void> {
    if (LIVE) {
      const { error } = await supabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
      return;
    }
    await delay(500);
  },

  async updatePassword(password: string): Promise<void> {
    if (LIVE) {
      const { error } = await supabase().auth.updateUser({ password });
      if (error) throw new Error(error.message);
      return;
    }
    await delay(500);
  },

  /** Google gives us name + email only; the rest is collected afterwards. */
  async signInWithGoogle(): Promise<Profile> {
    if (LIVE) {
      const { error } = await supabase().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw new Error(error.message);
      // The browser now leaves for Google; the session is picked up on return.
      return new Promise<Profile>(() => {});
    }
    await delay(600);
    return { ...PERSONAS.google.profile, id: uid("usr"), joinedAt: nowIso() };
  },

  async signUpWithEmail(d: ProfileDraft): Promise<Profile> {
    if (LIVE) {
      const email = d.email?.trim() ?? "";
      const password = d.password ?? "";
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          // Copied into the profile by the database trigger.
          data: {
            first_name: d.firstName?.trim() ?? "",
            last_name: d.lastName?.trim() ?? "",
            faculty: d.faculty ?? null,
            department: d.course ?? null,
            level: d.level ?? null,
            dob: d.dob ?? null,
            heard: d.heard ?? null,
            user_type: d.userType ?? null,
          },
        },
      });
      if (error) throw new Error(error.message);
      pending = { email, password };
      return { ...base(d, "email"), id: data.user?.id ?? uid("usr") };
    }
    await delay(600);
    return base(d, "email");
  },

  /**
   * "I've verified my email": signs in with the sign-up details. Returns null in
   * the dummy mode (the caller keeps its own profile).
   */
  async completeVerification(): Promise<Profile | null> {
    if (!LIVE) return null;
    if (!pending) throw new Error("Please sign in with your email and password.");
    const { error } = await supabase().auth.signInWithPassword(pending);
    if (error) {
      throw new Error(
        /confirm/i.test(error.message)
          ? "Your email isn't verified yet. Open the link we sent, then try again."
          : error.message,
      );
    }
    pending = null;
    return this.currentUser();
  },

  async resendVerification(email: string) {
    if (!LIVE) return;
    const { error } = await supabase().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw new Error(error.message);
  },

  async signOut() {
    if (LIVE) await supabase().auth.signOut();
  },
};

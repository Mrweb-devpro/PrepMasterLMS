import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import { supabase } from "@/lib/api/supabase";
import { DEFAULT_PERSONA, PERSONAS, type PersonaKey } from "./constants/personas";
import { authService } from "./services/auth.service";
import { toProfilePatch } from "./services/profile.mapper";
import type { Profile } from "./types";

const KEY = "prepmaster-session";

interface SessionState {
  /** false until the session has been read in the browser — guards wait for this. */
  hydrated: boolean;
  user: Profile | null;
  signIn: (p: Profile) => void;
  signOut: () => void;
  update: (patch: Partial<Profile>) => void;
  switchPersona: (k: PersonaKey) => void;
}

// Kept on globalThis so hot reloads reuse one context instead of orphaning consumers.
const g = globalThis as { __prepSessionCtx?: React.Context<SessionState | null> };
const Ctx = (g.__prepSessionCtx ??= createContext<SessionState | null>(null));

/**
 * The signed-in user. LIVE: real sign-in + profile from the API.
 * Otherwise: a simulated session with demo personas.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);

  // Load the session once in the browser.
  useEffect(() => {
    if (!LIVE) {
      const raw = localStorage.getItem(KEY);
      if (raw === null) setUser(PERSONAS[DEFAULT_PERSONA].profile);
      else setUser(raw === "null" ? null : (JSON.parse(raw) as Profile));
      setHydrated(true);
      return;
    }
    const load = () =>
      authService
        .currentUser()
        .then(setUser)
        .catch((e: Error) => {
          // A profile request must never invalidate a password recovery session.
          if (window.location.pathname.includes("reset-password")) return;
          // e.g. suspended account or API down: sign out with a clear message.
          toast.error(e.message);
          void authService.signOut();
          setUser(null);
        })
        .finally(() => setHydrated(true));
    if (window.location.pathname.includes("reset-password")) setHydrated(true);
    else void load();
    const { data } = supabase().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") return;
      if (event === "SIGNED_OUT") setUser(null);
      if (window.location.pathname.includes("reset-password")) return;
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void load();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!LIVE && hydrated) localStorage.setItem(KEY, JSON.stringify(user));
  }, [user, hydrated]);

  const signIn = useCallback((p: Profile) => setUser(p), []);
  const signOut = useCallback(() => {
    setUser(null);
    void authService.signOut();
  }, []);
  const update = useCallback((patch: Partial<Profile>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
    if (!LIVE) return;
    const body = toProfilePatch(patch);
    if (Object.keys(body).length === 0) return;
    api.patch("/me", body).catch((e: Error) => toast.error("Couldn't save your profile", { description: e.message }));
  }, []);
  const switchPersona = useCallback((k: PersonaKey) => setUser(PERSONAS[k].profile), []);

  const value = useMemo(
    () => ({ hydrated, user, signIn, signOut, update, switchPersona }),
    [hydrated, user, signIn, signOut, update, switchPersona],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

import { useSession } from "@/features/auth/session";
import { fullName } from "@/features/auth/utils/profile";

/** Signed-in user inside /solidworks (the layout guard guarantees one exists). */
export function useSwUser() {
  const { user } = useSession();
  if (!user) throw new Error("useSwUser used outside the SolidWorks guard");
  return { ...user, name: fullName(user) };
}

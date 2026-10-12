import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "../session";
import { isMainProfileComplete } from "../utils/profile";

/**
 * Client-side gates for the simulated session. Each returns `ready` once the
 * user is allowed to see the page; until then the page renders nothing.
 */
export function useMainAppGuard() {
  const { hydrated, user } = useSession();
  const navigate = useNavigate();
  const status = !hydrated
    ? "wait"
    : !user
      ? "login"
      : !isMainProfileComplete(user)
        ? "onboarding"
        : "ok";

  useEffect(() => {
    if (status === "login") navigate({ to: "/login", replace: true });
    if (status === "onboarding") navigate({ to: "/onboarding", replace: true });
  }, [status, navigate]);

  return status === "ok";
}

export function useAdminGuard() {
  const { hydrated, user } = useSession();
  const navigate = useNavigate();
  const status = !hydrated ? "wait" : !user ? "login" : user.role !== "admin" ? "denied" : "ok";

  useEffect(() => {
    if (status === "login") navigate({ to: "/login", replace: true });
    if (status === "denied") navigate({ to: "/", replace: true });
  }, [status, navigate]);

  return status === "ok";
}

export function useSolidworksGuard(heard?: string) {
  const { hydrated, user } = useSession();
  const navigate = useNavigate();
  const status = !hydrated ? "wait" : !user || !user.swRegistered ? "register" : "ok";

  useEffect(() => {
    if (status === "register")
      navigate({ to: "/solidworks/register", search: heard ? { heard } : {}, replace: true });
  }, [status, navigate, heard]);

  return status === "ok";
}

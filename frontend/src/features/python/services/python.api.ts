import { LIVE } from "@/lib/api/config";
import { api } from "@/lib/api/client";

const MOCK_WAITLIST_KEY = "python_waitlist_joined";

export interface PythonWaitlistStatus {
  joined: boolean;
}

export interface PythonWaitlistJoinResult {
  success: true;
  alreadyJoined: boolean;
  message: string;
}

/** Saves a student's early-access request, or uses browser storage in demo mode. */
export async function joinPythonWaitlist(): Promise<PythonWaitlistJoinResult> {
  if (LIVE) return api.post<PythonWaitlistJoinResult>("/python/waitlist");

  const alreadyJoined = typeof window !== "undefined" && localStorage.getItem(MOCK_WAITLIST_KEY) === "true";
  if (typeof window !== "undefined") localStorage.setItem(MOCK_WAITLIST_KEY, "true");
  return {
    success: true,
    alreadyJoined,
    message: alreadyJoined ? "Already on waitlist" : "Added to waitlist",
  };
}

/** Reads a student's waitlist state from the API or browser storage in demo mode. */
export async function getPythonWaitlistStatus(): Promise<PythonWaitlistStatus> {
  if (LIVE) return api.get<PythonWaitlistStatus>("/python/waitlist/status");
  return {
    joined: typeof window !== "undefined" && localStorage.getItem(MOCK_WAITLIST_KEY) === "true",
  };
}

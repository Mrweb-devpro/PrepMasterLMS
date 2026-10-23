import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import {
  getPythonWaitlistStatus,
  joinPythonWaitlist,
  type PythonWaitlistStatus,
} from "../services/python.api";

const waitlistKey = (userId?: string) => ["python", "waitlist", userId ?? "anon"] as const;

/** Keeps the Python Web Book waitlist button in sync with the signed-in student's status. */
export function usePythonWaitlist() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: waitlistKey(user?.id),
    queryFn: getPythonWaitlistStatus,
    enabled: Boolean(user),
    staleTime: Infinity,
  });
  const join = useMutation({
    mutationFn: joinPythonWaitlist,
    onSuccess: async () => {
      queryClient.setQueryData<PythonWaitlistStatus>(waitlistKey(user?.id), { joined: true });
      await queryClient.invalidateQueries({ queryKey: waitlistKey(user?.id) });
    },
  });

  return { joined: status.data?.joined === true, status, join };
}

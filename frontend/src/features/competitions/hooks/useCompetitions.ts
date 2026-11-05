import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { createCompetition, enterCompetitionArena, fetchArenaState, fetchCompetitionQuestionBank, fetchCompetitions, registerForCompetition, submitCompetitionArena, type CreateCompetitionInput } from "../services/competitions.api";

export const competitionsKey = ["competitions"] as const;

export function useCompetitions() {
  const { user } = useSession();
  return useQuery({ queryKey: [...competitionsKey, user?.id, user?.level, user?.role], queryFn: fetchCompetitions, staleTime: 30_000, refetchInterval: 15_000, enabled: !!user });
}

export function useRegisterForCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerForCompetition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: competitionsKey }),
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompetitionInput) => createCompetition(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: competitionsKey }),
  });
}

export function useCompetitionQuestionBank(cbtId?: string, enabled = true) {
  return useQuery({
    queryKey: ["competition-question-bank", cbtId],
    queryFn: () => fetchCompetitionQuestionBank(cbtId!),
    enabled: enabled && Boolean(cbtId),
  });
}

export const arenaKey = (id: string, userId?: string) => [...competitionsKey, "arena", id, userId] as const;

export function useCompetitionArena(competitionId: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: arenaKey(competitionId, user?.id), enabled: !!user,
    queryFn: () => fetchArenaState(competitionId, user!.id), retry: false,
    refetchInterval: (query) => ["completed", "cancelled"].includes(query.state.data?.competition.status ?? "") ? false : 4_000,
  });
}

export function useArenaQuestions(competitionId: string, enabled: boolean) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["competition-questions", competitionId, user?.id], enabled: enabled && !!user,
    queryFn: () => enterCompetitionArena(competitionId, user!.id),
    retry: false, staleTime: Infinity, gcTime: 0, refetchOnWindowFocus: false,
  });
}

export function useSubmitCompetition(competitionId: string) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitCompetitionArena(competitionId, user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: competitionsKey }),
  });
}

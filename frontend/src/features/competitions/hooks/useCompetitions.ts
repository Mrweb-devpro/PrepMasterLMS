import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { visibleForLevel } from "../utils/visibility";
import { createCompetition, enterCompetitionArena, fetchCompetitionQuestionBank, fetchCompetitions, registerForCompetition, saveCompetitionAnswer, submitCompetitionArena, type CreateCompetitionInput } from "../services/competitions.api";

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

export function useCompetitionArena(competitionId: string) {
  const { user } = useSession();
  return useQuery({ queryKey: [...competitionsKey, "arena", competitionId, user?.id, user?.level], enabled: !!user, retry: false, queryFn: async () => {
    const competitions = await fetchCompetitions();
    const competition = competitions.find((item) => item.id === competitionId);
    if (!competition || !visibleForLevel(competition, user)) throw new Error("This competition is unavailable for your level.");
    return enterCompetitionArena(competitionId);
  }, refetchInterval: 4_000 });
}

export function useCompetitionAnswer(competitionId: string) {
  return useMutation({ mutationFn: ({ questionId, selectedIndex }: { questionId: string; selectedIndex: number }) => saveCompetitionAnswer(competitionId, questionId, selectedIndex) });
}

export function useSubmitCompetition(competitionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitCompetitionArena(competitionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...competitionsKey, "arena", competitionId] }),
  });
}

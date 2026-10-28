import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCompetition, enterCompetitionArena, fetchCompetitions, registerForCompetition, saveCompetitionAnswer, submitCompetitionArena, type CreateCompetitionInput } from "../services/competitions.api";

export const competitionsKey = ["competitions"] as const;

export function useCompetitions() {
  return useQuery({ queryKey: competitionsKey, queryFn: fetchCompetitions, staleTime: 30_000 });
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

export function useCompetitionArena(competitionId: string) {
  return useQuery({ queryKey: [...competitionsKey, "arena", competitionId], queryFn: () => enterCompetitionArena(competitionId), refetchInterval: 4_000 });
}

export function useCompetitionAnswer(competitionId: string) {
  return useMutation({ mutationFn: ({ questionId, selectedIndex }: { questionId: string; selectedIndex: number }) => saveCompetitionAnswer(competitionId, questionId, selectedIndex) });
}

export function useSubmitCompetition(competitionId: string) {
  return useMutation({ mutationFn: () => submitCompetitionArena(competitionId) });
}

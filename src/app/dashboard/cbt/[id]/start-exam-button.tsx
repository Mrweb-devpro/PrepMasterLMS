"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startExam } from "./actions";

export function StartExamButton({
  examId,
  durationMinutes,
  userId,
}: {
  examId: string;
  durationMinutes: number;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    const result = await startExam(examId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push(`/dashboard/cbt/${examId}/attempt/${result.attemptId}`);
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button size="lg" className="w-full" onClick={handleStart} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Play className="mr-2 h-4 w-4" />
        )}
        Start {durationMinutes}-minute exam
      </Button>
    </div>
  );
}

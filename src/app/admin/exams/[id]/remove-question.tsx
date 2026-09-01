"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeQuestionFromExam } from "../../actions";

export function RemoveQuestionButton({
  examId,
  questionId,
}: {
  examId: string;
  questionId: string;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      disabled={removing}
      onClick={async () => {
        setRemoving(true);
        await removeQuestionFromExam(examId, questionId);
        setRemoving(false);
        router.refresh();
      }}
    >
      {removing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeQuestionFromBank } from "../../actions";

export function RemoveQuestionButton({
  bankId,
  questionId,
}: {
  bankId: string;
  questionId: string;
}) {
  const [removing, setRemoving] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      disabled={removing}
      onClick={async () => {
        setRemoving(true);
        await removeQuestionFromBank(bankId, questionId);
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

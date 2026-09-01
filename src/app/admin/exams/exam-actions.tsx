"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Play,
  Pause,
  Square,
  Trash2,
  Pencil,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateExamStatus, deleteExam } from "../actions";

type Exam = {
  id: string;
  title: string;
  status: string;
};

const STATUS_ACTIONS: { status: string; label: string; icon: typeof Play }[] = [
  { status: "draft", label: "Set draft", icon: Pencil },
  { status: "scheduled", label: "Schedule", icon: Pencil },
  { status: "live", label: "Publish (live)", icon: Play },
  { status: "paused", label: "Pause", icon: Pause },
  { status: "ended", label: "End", icon: Square },
];

export function ExamActions({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function changeStatus(status: string) {
    setBusy(status);
    await updateExamStatus(exam.id, status);
    setBusy(null);
    router.refresh();
  }

  async function doDelete() {
    setDeleting(true);
    await deleteExam(exam.id);
    setDeleting(false);
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>{exam.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/exams/${exam.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Manage questions
            </Link>
          </DropdownMenuItem>
          {STATUS_ACTIONS.filter((a) => a.status !== exam.status).map((a) => (
            <DropdownMenuItem
              key={a.status}
              disabled={busy !== null}
              onSelect={async (e) => {
                e.preventDefault();
                await changeStatus(a.status);
              }}
            >
              {busy === a.status ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <a.icon className="mr-2 h-4 w-4" />
              )}
              {a.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              setConfirmDelete(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete exam
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete exam?</DialogTitle>
            <DialogDescription>
              This permanently deletes <strong>{exam.title}</strong> and all its
              questions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleting}>
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

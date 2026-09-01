"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileRole } from "../actions";

export function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(role);

  return (
    <div className="flex items-center gap-2">
      {busy && <Loader2 className="h-3 w-3 animate-spin" />}
      <Select
        value={value}
        onValueChange={async (v) => {
          setValue(v);
          setBusy(true);
          await updateProfileRole(userId, v);
          setBusy(false);
          router.refresh();
        }}
      >
        <SelectTrigger className="h-8 w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="student">Student</SelectItem>
          <SelectItem value="teacher">Teacher</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

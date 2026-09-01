"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleSubject } from "../actions";

export function SubjectToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [checked, setChecked] = useState(isActive);
  return (
    <Switch
      checked={checked}
      onCheckedChange={async (v) => {
        setChecked(v);
        await toggleSubject(id, v);
      }}
    />
  );
}

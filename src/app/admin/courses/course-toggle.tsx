"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleCourse } from "../actions";

export function CourseToggle({
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
        await toggleCourse(id, v);
      }}
    />
  );
}

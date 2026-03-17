"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";

export function TogglePreview() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-text-tertiary text-xs">interactive</span>
      <div className="flex flex-wrap items-center gap-8">
        <Toggle checked={checked} onChange={setChecked} label="roast mode" />
        <Toggle checked={true} label="always on" />
        <Toggle checked={false} label="always off" />
      </div>
    </div>
  );
}

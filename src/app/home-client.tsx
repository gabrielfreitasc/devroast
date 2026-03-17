"use client";

import { useState } from "react";
import { CodeEditorRoot, CodeEditorHeader, CodeEditorInput } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

const SAMPLE_CODE = `function calculateTotal(items) {
  var total = 0;
  var i = 0;
  for (i; i < items.length; i++) {
    if (items[i].active == true) {
      total = total + items[i].price;
    }
  }
  if (total > 100) {
    total = total - total * 0.1;
  }
  return total;
}
module.exports = calculateTotal;`;

export function HomeClient() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [roastMode, setRoastMode] = useState(true);

  return (
    <>
      {/* Code Editor */}
      <CodeEditorRoot className="w-[780px] h-[360px]">
        <CodeEditorHeader filename="calculateTotal.js" />
        <CodeEditorInput code={code} onChange={setCode} />
      </CodeEditorRoot>

      {/* Actions Bar */}
      <div className="flex items-center justify-between w-[780px]">
        <div className="flex items-center gap-3">
          <Toggle checked={roastMode} onChange={setRoastMode} />
          <span className="text-text-primary text-sm">roast mode</span>
          <span className="text-text-tertiary text-sm">// maximum sarcasm enabled</span>
        </div>
        <Button variant="primary" size="lg">$ roast_my_code</Button>
      </div>
    </>
  );
}

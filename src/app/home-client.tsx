"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { CodeEditorRoot, CodeEditorHeader, CodeEditorInput, MAX_CODE_LENGTH } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { LANGUAGE_MAP } from "@/lib/languages";
import { detectLanguage } from "@/lib/detect-language";
import { highlight } from "@/lib/shiki-client";

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
  const router = useRouter();
  const trpc = useTRPC();

  const [code, setCode] = useState(SAMPLE_CODE);
  const [roastMode, setRoastMode] = useState(true);
  const [language, setLanguage] = useState("javascript");
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState("");

  const filename = `paste${LANGUAGE_MAP[language]?.extension ?? ".js"}`;

  useEffect(() => {
    let cancelled = false;
    highlight(code, language).then((html) => {
      if (!cancelled) setHighlightedHtml(html);
    });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const { mutate: createRoast, isPending } = useMutation(
    trpc.roast.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
    }),
  );

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const { lang, confidence } = detectLanguage(text);
    if (confidence >= 5) {
      setLanguage(lang);
      setIsAutoDetected(true);
    }
  }

  function handleLanguageChange(lang: string, isAuto: boolean) {
    setLanguage(lang);
    setIsAutoDetected(isAuto);
  }

  function handleSubmit() {
    if (code.length > MAX_CODE_LENGTH || isPending) return;
    createRoast({
      code,
      language,
      lineCount: code.split("\n").length,
      roastMode,
    });
  }

  return (
    <>
      {/* Code Editor */}
      <CodeEditorRoot className="w-[780px] min-h-[360px] max-h-[560px]">
        <CodeEditorHeader
          filename={filename}
          language={language}
          isAutoDetected={isAutoDetected}
          onLanguageChange={handleLanguageChange}
        />
        <CodeEditorInput
          code={code}
          onChange={setCode}
          onPaste={handlePaste}
          highlightedHtml={highlightedHtml}
        />
      </CodeEditorRoot>

      {/* Actions Bar */}
      <div className="flex items-center justify-between w-[780px]">
        <div className="flex items-center gap-3">
          <Toggle checked={roastMode} onChange={setRoastMode} />
          <span className="text-text-primary text-sm">roast mode</span>
          <span className="text-text-tertiary text-sm">// maximum sarcasm enabled</span>
        </div>
        <Button
          variant="primary"
          size="lg"
          disabled={code.length > MAX_CODE_LENGTH || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "$ processing..." : "$ roast_my_code"}
        </Button>
      </div>
    </>
  );
}

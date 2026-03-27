"use client";

import { type ComponentProps } from "react";
import { tv } from "tailwind-variants";
import { LanguageSelector } from "@/components/ui/language-selector";

const codeEditorRoot = tv({
  base: "flex flex-col bg-bg-surface border border-border-primary rounded-lg overflow-y-auto",
});

export function CodeEditorRoot({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={codeEditorRoot({ className })} {...props}>
      {children}
    </div>
  );
}

type CodeEditorHeaderProps = {
  filename?: string;
  className?: string;
  language?: string;
  isAutoDetected?: boolean;
  onLanguageChange?: (lang: string, isAuto: boolean) => void;
};

export function CodeEditorHeader({
  filename = "paste.js",
  className,
  language,
  isAutoDetected = false,
  onLanguageChange,
}: CodeEditorHeaderProps) {
  return (
    <div
      className={tv({
        base: "flex items-center gap-2 h-10 px-4 bg-bg-elevated border-b border-border-primary shrink-0 sticky top-0 z-10",
      })({ className })}
    >
      <span className="w-3 h-3 rounded-full bg-accent-red" />
      <span className="w-3 h-3 rounded-full bg-accent-amber" />
      <span className="w-3 h-3 rounded-full bg-accent-green" />
      <span className="ml-2 text-text-secondary text-xs">{filename}</span>
      <div className="flex-1" />
      {language && onLanguageChange && (
        <LanguageSelector
          language={language}
          isAutoDetected={isAutoDetected}
          onLanguageChange={onLanguageChange}
        />
      )}
    </div>
  );
}

export const MAX_CODE_LENGTH = 2_000;

type CodeEditorInputProps = {
  code: string;
  onChange?: (value: string) => void;
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
  highlightedHtml?: string;
  className?: string;
};

export function CodeEditorInput({
  code,
  onChange,
  onPaste,
  highlightedHtml,
  className,
}: CodeEditorInputProps) {
  const lineCount = code.split("\n").length;
  const charCount = code.length;
  const isOverLimit = charCount > MAX_CODE_LENGTH;

  const contentHeight = `${lineCount * 24 + 24}px`; // 24px per line (leading-6) + 24px padding

  return (
    <div className={tv({ base: "flex flex-col" })({ className })}>
      {/* Line numbers */}
      <div
        className="flex flex-col items-end w-12 px-3 bg-bg-input shrink-0 select-none pt-3"
        style={{ minHeight: contentHeight }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i + 1} className="text-text-tertiary text-xs leading-6">
            {i + 1}
          </span>
        ))}
      </div>

      {/* Editor area: overlay + textarea stacked */}
      <div className="relative flex-1" style={{ minHeight: contentHeight }}>
        {/* Shiki highlight overlay */}
        {highlightedHtml && (
          <div
            className={[
              "absolute inset-0 pointer-events-none",
              "text-sm leading-6 font-mono p-3",
              "[&_pre]:m-0 [&_pre]:p-0 [&_pre]:bg-transparent! [&_pre]:leading-6 [&_pre]:text-sm [&_pre]:font-mono",
              "[&_code]:leading-6 [&_code]:text-sm [&_code]:font-mono",
            ].join(" ")}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}

        {/* Textarea */}
        <textarea
          className="absolute inset-0 w-full h-full bg-transparent text-sm leading-6 resize-none outline-none p-3 font-mono overflow-hidden"
          style={{ color: highlightedHtml ? "transparent" : undefined, caretColor: "white" }}
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          onPaste={onPaste}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* Char counter */}
      <div className="flex justify-end px-3 py-1.5 shrink-0">
        <span className={tv({ base: "text-xs font-mono tabular-nums", variants: { over: { true: "text-accent-red", false: "text-text-tertiary" } } })({ over: isOverLimit })}>
          {charCount.toLocaleString("en-US")} / {MAX_CODE_LENGTH.toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
}

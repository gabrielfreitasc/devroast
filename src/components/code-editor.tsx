"use client";

import { type ComponentProps, useRef } from "react";
import { tv } from "tailwind-variants";
import { LanguageSelector } from "@/components/ui/language-selector";

const codeEditorRoot = tv({
  base: "flex flex-col bg-bg-surface border border-border-primary rounded-lg overflow-hidden",
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
        base: "flex items-center gap-2 h-10 px-4 bg-bg-elevated border-b border-border-primary shrink-0",
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  function syncScroll() {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  return (
    <div className={tv({ base: "flex flex-1 overflow-hidden" })({ className })}>
      {/* Line numbers */}
      <div className="flex flex-col items-end w-12 py-3 px-3 bg-bg-input shrink-0 select-none overflow-hidden">
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i + 1} className="text-text-tertiary text-xs leading-6">
            {i + 1}
          </span>
        ))}
      </div>

      {/* Editor area: overlay + textarea stacked */}
      <div className="relative flex-1 overflow-hidden">
        {/* Shiki highlight overlay */}
        {highlightedHtml && (
          <div
            ref={overlayRef}
            className={[
              "absolute inset-0 overflow-auto pointer-events-none",
              "text-sm leading-6 font-mono p-3",
              "[&_pre]:m-0 [&_pre]:p-0 [&_pre]:bg-transparent! [&_pre]:leading-6 [&_pre]:text-sm [&_pre]:font-mono",
              "[&_code]:leading-6 [&_code]:text-sm [&_code]:font-mono",
            ].join(" ")}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full bg-transparent text-sm leading-6 resize-none outline-none p-3 font-mono"
          style={{ color: highlightedHtml ? "transparent" : undefined, caretColor: "white" }}
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          onPaste={onPaste}
          onScroll={syncScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}

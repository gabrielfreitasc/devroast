"use client";

import { type ComponentProps } from "react";
import { tv } from "tailwind-variants";

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
};

export function CodeEditorHeader({ filename = "paste_code_here.js", className }: CodeEditorHeaderProps) {
  return (
    <div className={tv({ base: "flex items-center gap-2 h-10 px-4 bg-bg-elevated border-b border-border-primary shrink-0" })({ className })}>
      <span className="w-3 h-3 rounded-full bg-accent-red" />
      <span className="w-3 h-3 rounded-full bg-accent-amber" />
      <span className="w-3 h-3 rounded-full bg-accent-green" />
      <span className="ml-2 text-text-secondary text-xs">{filename}</span>
    </div>
  );
}

type CodeEditorInputProps = {
  code: string;
  onChange?: (value: string) => void;
  className?: string;
};

export function CodeEditorInput({ code, onChange, className }: CodeEditorInputProps) {
  const lineCount = code.split("\n").length;

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

      {/* Textarea */}
      <textarea
        className="flex-1 bg-transparent text-text-primary text-sm leading-6 resize-none outline-none p-3 font-sans"
        value={code}
        onChange={(e) => onChange?.(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}

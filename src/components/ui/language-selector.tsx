"use client";

import { Popover } from "@base-ui-components/react/popover";
import { tv } from "tailwind-variants";
import { LANGUAGE_META } from "@/lib/languages";

const trigger = tv({
  base: [
    "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono",
    "bg-bg-input border border-border-primary text-text-secondary",
    "hover:border-border-focus hover:text-text-primary",
    "transition-colors duration-150 cursor-pointer select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
  ],
});

const popup = tv({
  base: [
    "z-50 min-w-[160px] rounded-lg border border-border-primary bg-bg-elevated",
    "shadow-lg py-1 overflow-hidden",
    "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
    "transition-opacity duration-150",
  ],
});

const item = tv({
  base: [
    "flex items-center gap-2 px-3 py-1.5 text-xs font-mono",
    "text-text-secondary cursor-pointer select-none",
    "hover:bg-bg-input hover:text-text-primary",
    "transition-colors duration-100",
  ],
  variants: {
    active: {
      true: "text-text-primary bg-bg-input",
    },
    special: {
      true: "text-text-tertiary italic border-b border-border-primary mb-1 pb-2",
    },
  },
});

type LanguageSelectorProps = {
  language: string;
  isAutoDetected: boolean;
  onLanguageChange: (lang: string, isAuto: boolean) => void;
};

export function LanguageSelector({
  language,
  isAutoDetected,
  onLanguageChange,
}: LanguageSelectorProps) {
  const currentMeta = LANGUAGE_META.find((l) => l.shikiId === language);
  const label = currentMeta?.label ?? language;

  return (
    <Popover.Root>
      <Popover.Trigger className={trigger()}>
        {isAutoDetected && <span className="text-accent-green">✦</span>}
        <span>{label}</span>
        <span className="opacity-50">▾</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6}>
          <Popover.Popup className={popup()}>
            {/* Auto-detect option */}
            <Popover.Close
              className={item({ special: true })}
              onClick={() => onLanguageChange(language, true)}
            >
              ✦ auto-detect
            </Popover.Close>
            {LANGUAGE_META.map((lang) => (
              <Popover.Close
                key={lang.shikiId}
                className={item({ active: lang.shikiId === language && !isAutoDetected })}
                onClick={() => onLanguageChange(lang.shikiId, false)}
              >
                {lang.label}
                <span className="ml-auto opacity-40">{lang.extension}</span>
              </Popover.Close>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

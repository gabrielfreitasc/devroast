"use client";

import { Collapsible } from "@base-ui-components/react/collapsible";
import { LeaderboardRowScore } from "@/components/leaderboard-row";

type Props = {
  rank: number;
  score: number;
  language: string;
  lineCount: number;
  codeHtml: string;
  isLast: boolean;
};

export function LeaderboardCollapsibleRow({
  rank,
  score,
  language,
  lineCount,
  codeHtml,
  isLast,
}: Props) {
  const expandable = lineCount > 3;

  return (
    <Collapsible.Root className={`group ${isLast ? "" : "border-b border-border-primary"}`}>
      {/* Row header */}
      <div className="flex items-center justify-between px-5 py-3 bg-bg-elevated border-b border-border-primary">
        <div className="flex items-center gap-4">
          <span className="text-text-tertiary text-sm w-6 shrink-0">#{rank}</span>
          <LeaderboardRowScore score={score} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-tertiary text-xs">{language}</span>
          <span className="text-border-primary text-xs">·</span>
          <span className="text-text-tertiary text-xs">{lineCount} lines</span>
        </div>
      </div>

      {/* Code block — always visible, clipped to 3 lines when collapsible */}
      <div className="relative">
        <div
          className={
            expandable
              ? /* ~3 lines: 3×1.5rem line-height + 2rem vertical padding */
                "max-h-[calc(3*1.5rem+2rem)] overflow-hidden group-data-[open]:max-h-none"
              : ""
          }
        >
          <div
            className="[&_pre]:p-4 [&_pre]:bg-transparent! [&_code]:text-xs [&_pre]:leading-6"
            dangerouslySetInnerHTML={{ __html: codeHtml }}
          />
        </div>

        {/* Gradient fade — only visible when collapsed and expandable */}
        {expandable && (
          <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-bg-surface to-transparent pointer-events-none group-data-[open]:hidden" />
        )}
      </div>

      {/* Show more / less trigger */}
      {expandable && (
        <Collapsible.Trigger className="flex w-full items-center justify-center py-2 text-text-tertiary text-xs hover:text-text-secondary transition-colors cursor-pointer border-t border-border-primary">
          <span className="group-data-[open]:hidden">show more ↓</span>
          <span className="hidden group-data-[open]:inline">show less ↑</span>
        </Collapsible.Trigger>
      )}
    </Collapsible.Root>
  );
}

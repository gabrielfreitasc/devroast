import { codeToHtml } from "shiki";
import type { BundledLanguage } from "shiki";
import { unstable_cacheLife as cacheLife } from "next/cache";
import { caller } from "@/trpc/server";
import { LeaderboardCollapsibleRow } from "@/components/leaderboard-collapsible-row";

export async function FullLeaderboard() {
  "use cache";
  cacheLife("hours");
  const { rows, total } = await caller.leaderboard.top20();

  const rowsWithHtml = await Promise.all(
    rows.map(async (row) => {
      const lang = row.language === "other" ? "plaintext" : row.language as BundledLanguage;
      const codeHtml = await codeToHtml(row.code, {
        lang,
        theme: "vesper",
      });
      return { ...row, codeHtml };
    }),
  );

  return (
    <>
      <div className="rounded-lg border border-border-primary overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-3 bg-bg-elevated border-b border-border-primary">
          <div className="flex items-center gap-4">
            <span className="w-6 text-text-tertiary text-xs">#</span>
            <span className="text-text-tertiary text-xs">score</span>
          </div>
          <span className="text-text-tertiary text-xs">lang · lines</span>
        </div>

        {rowsWithHtml.map((row, i) => (
          <LeaderboardCollapsibleRow
            key={row.id}
            rank={row.rank}
            score={row.score}
            language={row.language}
            lineCount={row.lineCount}
            codeHtml={row.codeHtml}
            isLast={i === rowsWithHtml.length - 1}
          />
        ))}
      </div>

      <span className="text-text-tertiary text-xs">
        showing top {rows.length} of {total.toLocaleString("en-US")}
      </span>
    </>
  );
}

export function FullLeaderboardSkeleton() {
  return (
    <>
      <div className="rounded-lg border border-border-primary overflow-hidden animate-pulse">
        <div className="flex items-center justify-between px-5 py-3 bg-bg-elevated border-b border-border-primary">
          <div className="flex items-center gap-4">
            <span className="w-6 text-text-tertiary text-xs">#</span>
            <span className="text-text-tertiary text-xs">score</span>
          </div>
          <span className="text-text-tertiary text-xs">lang · lines</span>
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-border-primary last:border-0">
            <div className="flex items-center gap-4">
              <div className="w-6 h-4 bg-bg-elevated rounded" />
              <div className="w-12 h-4 bg-bg-elevated rounded" />
            </div>
            <div className="w-28 h-4 bg-bg-elevated rounded" />
          </div>
        ))}
      </div>

      <div className="w-40 h-3 bg-bg-elevated rounded animate-pulse" />
    </>
  );
}

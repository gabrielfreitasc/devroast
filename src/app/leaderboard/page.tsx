import type { Metadata } from "next";
import { CodeBlockCode } from "@/components/ui/code-block";
import type { BundledLanguage } from "shiki";

export const metadata: Metadata = {
  title: "Shame Leaderboard · DevRoast",
  description:
    "The most roasted code on the internet. Hall of shame for the worst code submissions.",
};

type LeaderboardEntry = {
  rank: number;
  score: number;
  language: BundledLanguage;
  lines: number;
  code: string;
};

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    rank: 1,
    score: 1.2,
    language: "javascript",
    lines: 3,
    code: `eval(atob(userCode))
document.write(res.fetchData)
// trust me it works`,
  },
  {
    rank: 2,
    score: 1.8,
    language: "javascript",
    lines: 3,
    code: `var a = new Array()
a[0] = fetch('http://haha.pega')
// delet this`,
  },
  {
    rank: 3,
    score: 2.1,
    language: "sql",
    lines: 2,
    code: `SELECT * FROM users WHERE 1=1
-- lol, add auth later`,
  },
  {
    rank: 4,
    score: 2.3,
    language: "dart",
    lines: 3,
    code: `catch {} (e) {
  // ignore it
}`,
  },
  {
    rank: 5,
    score: 2.6,
    language: "javascript",
    lines: 3,
    code: `const arr = require('lodash')
  .set(data[0] - val)
  .solution(() => Math.random())`,
  },
];

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6) return "text-accent-amber";
  return "text-accent-green";
}

export default async function LeaderboardPage() {
  return (
    <main className="max-w-[1440px] mx-auto px-20 py-10">
      {/* Page header */}
      <div className="flex flex-col gap-4 mb-12">
        <div className="flex items-center gap-3">
          <span className="text-accent-green font-bold text-3xl">&gt;</span>
          <h1 className="text-text-primary font-bold text-3xl">
            shame_leaderboard
          </h1>
        </div>
        <p className="text-text-tertiary text-sm">
          // the most roasted code on the internet
        </p>
        <p className="text-text-tertiary text-xs">
          2,847 submissions · avg score: 4.2/10
        </p>
      </div>

      {/* Leaderboard table */}
      <div className="flex flex-col gap-0 border border-border-primary rounded-lg overflow-hidden">
        {LEADERBOARD_DATA.map((entry, index) => (
          <div
            key={entry.rank}
            className={`flex flex-col ${index < LEADERBOARD_DATA.length - 1 ? "border-b border-border-primary" : ""}`}
          >
            {/* Row header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-primary bg-bg-elevated">
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary text-sm w-6">
                  #{entry.rank}
                </span>
                <span className="text-text-tertiary text-xs">score</span>
                <span
                  className={`text-sm font-bold ${getScoreColor(entry.score)}`}
                >
                  {entry.score}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary text-xs">
                  {entry.language}
                </span>
                <span className="text-border-primary text-xs">·</span>
                <span className="text-text-tertiary text-xs">
                  {entry.lines} lines
                </span>
              </div>
            </div>

            {/* Code preview */}
            <CodeBlockCode
              code={entry.code}
              lang={entry.language}
              className="bg-bg-surface [&_pre]:py-4 [&_pre]:px-5 [&_pre]:text-xs"
            />
          </div>
        ))}
      </div>

      <p className="text-text-tertiary text-xs mt-4">
        showing top {LEADERBOARD_DATA.length} of 2,847
      </p>
    </main>
  );
}

import { HomeClient } from "./home-client";
import {
  LeaderboardRowRoot,
  LeaderboardRowRank,
  LeaderboardRowScore,
  LeaderboardRowCode,
  LeaderboardRowLanguage,
} from "@/components/leaderboard-row";
import { Button } from "@/components/ui/button";

const LEADERBOARD_DATA = [
  { rank: 1, score: 1.2, codePreview: "eval(userInput + '= process')", language: "javascript" },
  { rank: 2, score: 1.8, codePreview: "SELECT * FROM users WHERE 1=1", language: "sql" },
  { rank: 3, score: 2.1, codePreview: "goto start; // who needs loops", language: "basic" },
];

export default function Home() {
  return (
    <main className="max-w-[1440px] mx-auto px-10 pt-20 pb-10 flex flex-col items-center gap-8">

      {/* Hero */}
      <div className="flex flex-col gap-3 w-[960px]">
        <div className="flex items-center gap-3">
          <span className="text-accent-green text-4xl font-bold">$</span>
          <span className="text-text-primary text-4xl font-bold">paste your code. get roasted.</span>
        </div>
        <p className="text-text-secondary font-serif text-base">
          // our ai will ruthlessly judge your code quality, style, and life choices
        </p>
      </div>

      {/* Editor + Actions (client) */}
      <HomeClient />

      {/* Stats */}
      <p className="text-text-tertiary text-sm w-[780px]">
        2,847 codes roasted · avg score: 4.2/10
      </p>

      {/* Leaderboard Preview */}
      <div className="flex flex-col gap-4 pt-10 w-[960px]">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <span className="text-text-primary text-lg font-semibold">// shame_leaderboard</span>
          <Button variant="link" size="sm">view_all</Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border-primary overflow-hidden">
          {/* Table header */}
          <div className="flex items-center px-4 py-3 bg-bg-elevated border-b border-border-primary">
            <span className="w-[60px] text-text-tertiary text-xs">#</span>
            <span className="w-[80px] text-text-tertiary text-xs">score</span>
            <span className="flex-1 text-text-tertiary text-xs">code</span>
            <span className="w-[100px] text-text-tertiary text-xs text-right">lang</span>
          </div>

          {/* Rows */}
          {LEADERBOARD_DATA.map((row) => (
            <LeaderboardRowRoot key={row.rank}>
              <LeaderboardRowRank>#{row.rank}</LeaderboardRowRank>
              <LeaderboardRowScore score={row.score} />
              <LeaderboardRowCode>{row.codePreview}</LeaderboardRowCode>
              <LeaderboardRowLanguage>{row.language}</LeaderboardRowLanguage>
            </LeaderboardRowRoot>
          ))}
        </div>

        <span className="text-text-tertiary text-xs">showing top 3 of 2,847</span>
      </div>

    </main>
  );
}

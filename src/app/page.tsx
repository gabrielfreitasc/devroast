import { Suspense } from "react";
import { HomeClient } from "./home-client";
import { Button } from "@/components/ui/button";
import { StatsDisplay } from "@/components/stats-display";
import { ShameLeaderboard, ShameLeaderboardSkeleton } from "@/components/shame-leaderboard";

export default function Home() {
  return (
    <>
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
      <StatsDisplay />

      {/* Leaderboard Preview */}
      <div className="flex flex-col gap-4 pt-10 w-[960px]">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <span className="text-text-primary text-lg font-semibold">// shame_leaderboard</span>
          <Button variant="link" size="sm">view_all</Button>
        </div>

        <Suspense fallback={<ShameLeaderboardSkeleton />}>
          <ShameLeaderboard />
        </Suspense>
      </div>

    </main>
    </>
  );
}

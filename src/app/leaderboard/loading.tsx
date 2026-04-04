import { FullLeaderboardSkeleton } from "@/components/full-leaderboard";

export default function LeaderboardLoading() {
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
      </div>

      {/* Leaderboard table skeleton */}
      <div className="flex flex-col gap-4">
        <FullLeaderboardSkeleton />
      </div>
    </main>
  );
}

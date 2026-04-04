import { createTRPCRouter } from "../init";
import { statsRouter } from "./stats";
import { leaderboardRouter } from "./leaderboard";
import { roastRouter } from "./roast";

export const appRouter = createTRPCRouter({
  stats: statsRouter,
  leaderboard: leaderboardRouter,
  roast: roastRouter,
});

export type AppRouter = typeof appRouter;

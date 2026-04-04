import { createTRPCRouter } from "../init";
import { statsRouter } from "./stats";
import { leaderboardRouter } from "./leaderboard";

export const appRouter = createTRPCRouter({
  stats: statsRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;

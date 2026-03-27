import { avg, count } from "drizzle-orm";
import { baseProcedure, createTRPCRouter } from "../init";
import { roasts } from "@/db/schema";

export const statsRouter = createTRPCRouter({
  global: baseProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({
        count: count(),
        avgScore: avg(roasts.score),
      })
      .from(roasts);

    return {
      count: result?.count ?? 0,
      avgScore: result?.avgScore ? Number(result.avgScore) : 0,
    };
  }),
});

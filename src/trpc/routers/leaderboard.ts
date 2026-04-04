import { asc, count } from "drizzle-orm";
import { baseProcedure, createTRPCRouter } from "../init";
import { roasts } from "@/db/schema";

export const leaderboardRouter = createTRPCRouter({
  top3: baseProcedure.query(async ({ ctx }) => {
    const [top, total] = await Promise.all([
      ctx.db
        .select({
          id: roasts.id,
          score: roasts.score,
          code: roasts.code,
          language: roasts.language,
          lineCount: roasts.lineCount,
        })
        .from(roasts)
        .orderBy(asc(roasts.score))
        .limit(3),
      ctx.db.select({ count: count() }).from(roasts),
    ]);

    return {
      rows: top.map((r, i) => ({
        rank: i + 1,
        id: r.id,
        score: Number(r.score),
        code: r.code,
        language: r.language,
        lineCount: r.lineCount,
      })),
      total: total[0]?.count ?? 0,
    };
  }),
});

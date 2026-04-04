import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { baseProcedure, createTRPCRouter } from "../init";
import { roasts, analysisIssues, suggestedFixes } from "@/db/schema";
import { buildPrompt } from "@/lib/prompts";
import { generateDiff } from "@/lib/diff";

const DB_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "go",
  "rust",
  "java",
  "cpp",
  "c",
  "php",
  "ruby",
] as const;

function toDbLanguage(lang: string): (typeof DB_LANGUAGES)[number] | "other" {
  return (DB_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as (typeof DB_LANGUAGES)[number])
    : "other";
}

const roastAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  verdict: z.enum([
    "needs_serious_help",
    "getting_there",
    "surprisingly_decent",
    "actually_good",
    "clean_code",
  ]),
  roastQuote: z.string(),
  analysisIssues: z.array(
    z.object({
      severity: z.enum(["critical", "warning", "good"]),
      title: z.string(),
      description: z.string(),
      sortOrder: z.number().int(),
    }),
  ),
  suggestedFix: z.object({
    fixedCode: z.string(),
  }),
});

export const roastRouter = createTRPCRouter({
  create: baseProcedure
    .input(
      z.object({
        code: z.string().min(1).max(2000),
        language: z.string(),
        roastMode: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lineCount = input.code.split("\n").length;

      const { system, user } = buildPrompt({
        code: input.code,
        language: input.language,
        roastMode: input.roastMode,
      });

      const { object: analysis } = await generateObject({
        model: anthropic("claude-haiku-4-5-20251001"),
        system,
        prompt: user,
        schema: roastAnalysisSchema,
      });

      const diff = generateDiff(input.code, analysis.suggestedFix.fixedCode);

      const roastId = await ctx.db.transaction(async (tx) => {
        const [roast] = await tx
          .insert(roasts)
          .values({
            code: input.code,
            language: toDbLanguage(input.language),
            lineCount,
            roastMode: input.roastMode,
            score: analysis.score.toFixed(1),
            verdict: analysis.verdict as
              | "needs_serious_help"
              | "getting_there"
              | "surprisingly_decent"
              | "actually_good"
              | "clean_code",
            roastQuote: analysis.roastQuote,
          })
          .returning({ id: roasts.id });

        if (!roast) throw new Error("Failed to insert roast");

        if (analysis.analysisIssues.length > 0) {
          await tx.insert(analysisIssues).values(
            analysis.analysisIssues.map((issue) => ({
              roastId: roast.id,
              severity: issue.severity as "critical" | "warning" | "good",
              title: issue.title,
              description: issue.description,
              sortOrder: issue.sortOrder,
            })),
          );
        }

        await tx.insert(suggestedFixes).values({
          roastId: roast.id,
          originalCode: input.code,
          fixedCode: analysis.suggestedFix.fixedCode,
          diff,
        });

        return roast.id;
      });

      return { id: roastId };
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [roast] = await ctx.db
        .select()
        .from(roasts)
        .where(eq(roasts.id, input.id))
        .limit(1);

      if (!roast) return null;

      const issues = await ctx.db
        .select()
        .from(analysisIssues)
        .where(eq(analysisIssues.roastId, input.id))
        .orderBy(asc(analysisIssues.sortOrder));

      const [fix] = await ctx.db
        .select()
        .from(suggestedFixes)
        .where(eq(suggestedFixes.roastId, input.id))
        .limit(1);

      return {
        id: roast.id,
        code: roast.code,
        language: roast.language,
        lineCount: roast.lineCount,
        score: Number(roast.score),
        verdict: roast.verdict,
        roastQuote: roast.roastQuote,
        analysisIssues: issues.map((issue) => ({
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          sortOrder: issue.sortOrder,
        })),
        suggestedFix: fix
          ? {
              fixedCode: fix.fixedCode,
              diff: fix.diff,
            }
          : null,
      };
    }),
});

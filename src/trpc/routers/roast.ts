import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { baseProcedure, createTRPCRouter } from "../init";
import { roasts, analysisIssues, suggestedFixes } from "@/db/schema";
import { openai } from "@/lib/openai";
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

const roastAnalysisSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    verdict: {
      type: "string",
      enum: [
        "needs_serious_help",
        "getting_there",
        "surprisingly_decent",
        "actually_good",
        "clean_code",
      ],
    },
    roastQuote: { type: "string" },
    analysisIssues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["critical", "warning", "good"] },
          title: { type: "string" },
          description: { type: "string" },
          sortOrder: { type: "integer" },
        },
        required: ["severity", "title", "description", "sortOrder"],
        additionalProperties: false,
      },
    },
    suggestedFix: {
      type: "object",
      properties: {
        fixedCode: { type: "string" },
      },
      required: ["fixedCode"],
      additionalProperties: false,
    },
  },
  required: [
    "score",
    "verdict",
    "roastQuote",
    "analysisIssues",
    "suggestedFix",
  ],
  additionalProperties: false,
} as const;

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

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "roast_analysis",
            strict: true,
            schema: roastAnalysisSchema,
          },
        },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty response from OpenAI");

      let analysis: {
        score: number;
        verdict: string;
        roastQuote: string;
        analysisIssues: {
          severity: string;
          title: string;
          description: string;
          sortOrder: number;
        }[];
        suggestedFix: { fixedCode: string };
      };

      try {
        analysis = JSON.parse(raw);
      } catch {
        throw new Error("Failed to parse OpenAI response");
      }

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

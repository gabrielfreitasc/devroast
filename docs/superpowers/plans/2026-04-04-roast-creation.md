# Roast Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to submit code on the homepage, have it analyzed by OpenAI GPT-4o-mini, persist to DB, and redirect to `/roast/[id]` with real results.

**Architecture:** A tRPC `roast.create` mutation accepts code + language + roastMode, calls OpenAI with structured output, saves to three DB tables (`roasts`, `analysis_issues`, `suggested_fixes`), and returns the new roast ID. The result page at `/roast/[id]` fetches the real data via `caller.roast.getById`.

**Tech Stack:** Next.js 15 App Router, tRPC v11, Drizzle ORM (PostgreSQL), OpenAI SDK (`openai` npm package), Zod v4, `gpt-4o-mini` model.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/openai.ts` | Create | Singleton OpenAI client |
| `src/lib/diff.ts` | Create | Line-by-line diff generator |
| `src/lib/prompts.ts` | Create | Prompt builder (normal + roast mode) |
| `src/trpc/routers/roast.ts` | Create | `create` mutation + `getById` query |
| `src/trpc/routers/_app.ts` | Modify | Wire `roastRouter` |
| `src/app/home-client.tsx` | Modify | Add mutation, loading state, redirect |
| `src/app/roast/[id]/page.tsx` | Modify | Replace static data with DB fetch |

---

### Task 1: Install OpenAI SDK and create the client singleton

**Files:**
- Create: `src/lib/openai.ts`

- [ ] **Step 1: Install the OpenAI SDK**

```bash
npm install openai
```

Expected: `openai` appears in `package.json` dependencies.

- [ ] **Step 2: Create `src/lib/openai.ts`**

```ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `src/lib/openai.ts`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/openai.ts
git commit -m "feat: add OpenAI client singleton"
```

---

### Task 2: Create the diff generator

**Files:**
- Create: `src/lib/diff.ts`

The diff stores each line with a `+`, `-`, or ` ` (space) prefix. The result page parses this back into `{ type: "added"|"removed"|"context", code: string }[]`.

- [ ] **Step 1: Create `src/lib/diff.ts`**

```ts
/**
 * Generates a unified-style line diff between two code strings.
 * Each output line is prefixed with:
 *   "+" for lines added in fixedCode
 *   "-" for lines removed from original
 *   " " (space) for unchanged context lines
 */
export function generateDiff(original: string, fixedCode: string): string {
  const originalLines = original.split("\n");
  const fixedLines = fixedCode.split("\n");
  const m = originalLines.length;
  const n = fixedLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalLines[i - 1] === fixedLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff lines
  const result: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1] === fixedLines[j - 1]) {
      result.unshift(` ${originalLines[i - 1]}`);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift(`+${fixedLines[j - 1]}`);
      j--;
    } else {
      result.unshift(`-${originalLines[i - 1]}`);
      i--;
    }
  }

  return result.join("\n");
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/diff.ts
git commit -m "feat: add line-by-line diff generator"
```

---

### Task 3: Create the prompt builder

**Files:**
- Create: `src/lib/prompts.ts`

The system prompt instructs the model to return JSON matching the structured output schema. When `roastMode` is true, the tone is sarcastic and merciless.

- [ ] **Step 1: Create `src/lib/prompts.ts`**

```ts
type PromptInput = {
  code: string;
  language: string;
  roastMode: boolean;
};

type PromptResult = {
  system: string;
  user: string;
};

export function buildPrompt({ code, language, roastMode }: PromptInput): PromptResult {
  const tone = roastMode
    ? "You are a brutally sarcastic senior engineer who roasts code with dark humor and zero mercy. Be witty, cutting, and painfully accurate. The developer should feel the burn."
    : "You are a precise, direct senior engineer who gives clear, actionable code reviews. Be concise and technical without being harsh.";

  const system = `${tone}

You analyze code and return structured JSON with the following fields:
- score: number from 0.0 to 10.0 (one decimal place). 0 = unreadable disaster, 10 = clean exemplary code.
- verdict: one of "needs_serious_help" | "getting_there" | "surprisingly_decent" | "actually_good" | "clean_code"
- roastQuote: a single punchy one-liner that summarizes your verdict. ${roastMode ? "Make it sarcastic and memorable." : "Keep it direct and accurate."}
- analysisIssues: array of 3 to 5 issues found in the code. Each has:
  - severity: "critical" | "warning" | "good"
  - title: short label (3-6 words)
  - description: one or two sentences explaining the issue and what to do instead
  - sortOrder: integer starting at 0, ordered from most critical to least
- suggestedFix: object with:
  - fixedCode: the corrected version of the submitted code, preserving the same language and intent

Return only valid JSON. No markdown fences, no explanations outside the JSON.`;

  const user = `Language: ${language}

\`\`\`${language}
${code}
\`\`\``;

  return { system, user };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/prompts.ts
git commit -m "feat: add roast prompt builder with normal and roast modes"
```

---

### Task 4: Create the roast tRPC router

**Files:**
- Create: `src/trpc/routers/roast.ts`

This router has two procedures:
- `create` mutation: calls OpenAI, saves to DB, returns `{ id }`
- `getById` query: fetches full roast data for the result page

**Important schema note:** The DB `language` column uses an enum with values: `javascript`, `typescript`, `python`, `go`, `rust`, `java`, `cpp`, `c`, `php`, `ruby`, `other`. Languages outside this list (e.g. `csharp`, `kotlin`, `swift`, `jsx`, `tsx`, `html`, `css`, `sql`, `bash`, `json`, `yaml`) must be mapped to `"other"` before inserting.

- [ ] **Step 1: Create `src/trpc/routers/roast.ts`**

```ts
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
        lineCount: z.number().int().min(1),
        roastMode: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { system, user } = buildPrompt({
        code: input.code,
        language: input.language,
        roastMode: input.roastMode,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
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

      const analysis = JSON.parse(raw) as {
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

      // Insert roast
      const [roast] = await ctx.db
        .insert(roasts)
        .values({
          code: input.code,
          language: toDbLanguage(input.language),
          lineCount: input.lineCount,
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

      // Insert analysis issues
      if (analysis.analysisIssues.length > 0) {
        await ctx.db.insert(analysisIssues).values(
          analysis.analysisIssues.map((issue) => ({
            roastId: roast.id,
            severity: issue.severity as "critical" | "warning" | "good",
            title: issue.title,
            description: issue.description,
            sortOrder: issue.sortOrder,
          })),
        );
      }

      // Generate diff and insert suggested fix
      const diff = generateDiff(input.code, analysis.suggestedFix.fixedCode);
      await ctx.db.insert(suggestedFixes).values({
        roastId: roast.id,
        originalCode: input.code,
        fixedCode: analysis.suggestedFix.fixedCode,
        diff,
      });

      return { id: roast.id };
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/trpc/routers/roast.ts
git commit -m "feat: add roast tRPC router with create mutation and getById query"
```

---

### Task 5: Wire roastRouter into the app router

**Files:**
- Modify: `src/trpc/routers/_app.ts`

- [ ] **Step 1: Update `src/trpc/routers/_app.ts`**

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/trpc/routers/_app.ts
git commit -m "feat: wire roastRouter into appRouter"
```

---

### Task 6: Update HomeClient with mutation, loading state, and redirect

**Files:**
- Modify: `src/app/home-client.tsx`

The button should be disabled and show `$ processing...` while the mutation is pending. On success, redirect to `/roast/[id]`. On error, the button returns to normal (silent fail per spec).

- [ ] **Step 1: Update `src/app/home-client.tsx`**

Replace the entire file content:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { CodeEditorRoot, CodeEditorHeader, CodeEditorInput, MAX_CODE_LENGTH } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { LANGUAGE_MAP } from "@/lib/languages";
import { detectLanguage } from "@/lib/detect-language";
import { highlight } from "@/lib/shiki-client";

const SAMPLE_CODE = `function calculateTotal(items) {
  var total = 0;
  var i = 0;
  for (i; i < items.length; i++) {
    if (items[i].active == true) {
      total = total + items[i].price;
    }
  }
  if (total > 100) {
    total = total - total * 0.1;
  }
  return total;
}
module.exports = calculateTotal;`;

export function HomeClient() {
  const router = useRouter();
  const trpc = useTRPC();

  const [code, setCode] = useState(SAMPLE_CODE);
  const [roastMode, setRoastMode] = useState(true);
  const [language, setLanguage] = useState("javascript");
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState("");

  const filename = `paste${LANGUAGE_MAP[language]?.extension ?? ".js"}`;

  useEffect(() => {
    let cancelled = false;
    highlight(code, language).then((html) => {
      if (!cancelled) setHighlightedHtml(html);
    });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const { mutate: createRoast, isPending } = useMutation(
    trpc.roast.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
    }),
  );

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const { lang, confidence } = detectLanguage(text);
    if (confidence >= 5) {
      setLanguage(lang);
      setIsAutoDetected(true);
    }
  }

  function handleLanguageChange(lang: string, isAuto: boolean) {
    setLanguage(lang);
    setIsAutoDetected(isAuto);
  }

  function handleSubmit() {
    if (code.length > MAX_CODE_LENGTH || isPending) return;
    createRoast({
      code,
      language,
      lineCount: code.split("\n").length,
      roastMode,
    });
  }

  return (
    <>
      {/* Code Editor */}
      <CodeEditorRoot className="w-[780px] min-h-[360px] max-h-[560px]">
        <CodeEditorHeader
          filename={filename}
          language={language}
          isAutoDetected={isAutoDetected}
          onLanguageChange={handleLanguageChange}
        />
        <CodeEditorInput
          code={code}
          onChange={setCode}
          onPaste={handlePaste}
          highlightedHtml={highlightedHtml}
        />
      </CodeEditorRoot>

      {/* Actions Bar */}
      <div className="flex items-center justify-between w-[780px]">
        <div className="flex items-center gap-3">
          <Toggle checked={roastMode} onChange={setRoastMode} />
          <span className="text-text-primary text-sm">roast mode</span>
          <span className="text-text-tertiary text-sm">// maximum sarcasm enabled</span>
        </div>
        <Button
          variant="primary"
          size="lg"
          disabled={code.length > MAX_CODE_LENGTH || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "$ processing..." : "$ roast_my_code"}
        </Button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/home-client.tsx
git commit -m "feat: add roast mutation, loading state, and redirect to HomeClient"
```

---

### Task 7: Update result page with real DB data

**Files:**
- Modify: `src/app/roast/[id]/page.tsx`

Replace `STATIC_ROAST` with a real fetch via `caller.roast.getById`. The diff string from the DB is parsed line-by-line: lines starting with `+` → `added`, `-` → `removed`, anything else → `context`. The code character (prefix) is sliced off before passing to `DiffLine`.

- [ ] **Step 1: Update `src/app/roast/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { DiffLine } from "@/components/ui/diff-line";
import {
  AnalysisCardRoot,
  AnalysisCardTitle,
  AnalysisCardDescription,
} from "@/components/analysis-card";
import {
  CodeBlockRoot,
  CodeBlockHeader,
  CodeBlockCode,
} from "@/components/ui/code-block";
import { caller } from "@/trpc/server";
import { LANGUAGE_MAP } from "@/lib/languages";
import type { BundledLanguage } from "shiki";

export const metadata: Metadata = {
  title: "Roast Result · DevRoast",
  description: "See how badly your code got roasted.",
};

type Props = { params: Promise<{ id: string }> };

export default async function RoastResultPage({ params }: Props) {
  const { id } = await params;
  const roast = await caller.roast.getById({ id });

  if (!roast) notFound();

  const filename = `paste${LANGUAGE_MAP[roast.language]?.extension ?? ".txt"}`;

  const diffLines = roast.suggestedFix?.diff
    .split("\n")
    .map((line) => ({
      type: line.startsWith("+")
        ? ("added" as const)
        : line.startsWith("-")
          ? ("removed" as const)
          : ("context" as const),
      code: line.slice(1),
    })) ?? [];

  return (
    <main className="max-w-[1440px] mx-auto px-20 py-10 flex flex-col gap-0">
      {/* Hero: score + quote */}
      <section className="flex items-start gap-14 py-10">
        <ScoreRing score={roast.score} />

        <div className="flex flex-col gap-3 pt-4">
          <SectionHeading prefix="//">{filename}</SectionHeading>

          <p className="text-text-primary text-xl leading-snug">
            {roast.roastQuote}
          </p>

          <p className="text-text-tertiary text-sm">
            from: <span className="text-text-secondary">anonymous</span>
            {" · "}
            {roast.lineCount} lines
          </p>

          <div className="flex items-center gap-2 pt-1">
            <Badge status="good" label={roast.language} />
          </div>
        </div>
      </section>

      <hr className="border-border-primary" />

      {/* Your submission */}
      <section className="flex flex-col gap-6 py-10">
        <SectionHeading>your_submission</SectionHeading>

        <CodeBlockRoot>
          <CodeBlockHeader filename={filename} />
          <CodeBlockCode
            code={roast.code}
            lang={roast.language as BundledLanguage}
          />
        </CodeBlockRoot>
      </section>

      <hr className="border-border-primary" />

      {/* Detailed analysis */}
      <section className="flex flex-col gap-6 py-10">
        <SectionHeading>detailed_analysis</SectionHeading>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            {roast.analysisIssues.slice(0, 2).map((issue) => (
              <AnalysisCardRoot key={issue.title}>
                <Badge status={issue.severity} label={issue.severity} />
                <AnalysisCardTitle>{issue.title}</AnalysisCardTitle>
                <AnalysisCardDescription>{issue.description}</AnalysisCardDescription>
              </AnalysisCardRoot>
            ))}
          </div>
          {roast.analysisIssues.length > 2 && (
            <div className="grid grid-cols-2 gap-5">
              {roast.analysisIssues.slice(2).map((issue) => (
                <AnalysisCardRoot key={issue.title}>
                  <Badge status={issue.severity} label={issue.severity} />
                  <AnalysisCardTitle>{issue.title}</AnalysisCardTitle>
                  <AnalysisCardDescription>{issue.description}</AnalysisCardDescription>
                </AnalysisCardRoot>
              ))}
            </div>
          )}
        </div>
      </section>

      {roast.suggestedFix && (
        <>
          <hr className="border-border-primary" />

          {/* Suggested fix */}
          <section className="flex flex-col gap-6 py-10">
            <SectionHeading>suggested_fix</SectionHeading>

            <CodeBlockRoot>
              <CodeBlockHeader filename={filename} />
              {diffLines.map((line, i) => (
                <DiffLine key={i} type={line.type} code={line.code} />
              ))}
            </CodeBlockRoot>
          </section>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and manually test the full flow**

```bash
npm run dev
```

1. Go to `http://localhost:3000`
2. Paste code in editor, toggle roast mode, click "$ roast_my_code"
3. Button should show "$ processing..." for ~5-10 seconds
4. Should redirect to `/roast/[uuid]`
5. Page should show real score, roast quote, analysis cards, and diff

- [ ] **Step 4: Commit**

```bash
git add src/app/roast/[id]/page.tsx
git commit -m "feat: replace static roast data with real DB fetch via tRPC"
```

# Roast Creation Feature — Design Spec

**Date:** 2026-04-04

## Overview

Implement the core feature of DevRoast: allow users to submit code from the homepage, have it analyzed by OpenAI GPT-4o-mini, persist the result to the database, and redirect to the result page at `/roast/[id]`.

Share functionality is explicitly out of scope for this iteration.

---

## Flow

```
[Homepage]
  user fills code editor + selects language + toggles roast mode
  → clicks "$ roast_my_code"
  → tRPC mutation roast.create fires (button enters loading state)
  → server calls OpenAI gpt-4o-mini with structured output
  → server saves to DB: roasts + analysis_issues + suggested_fixes
  → server returns { id }
  → client router.push('/roast/' + id)

[Result page /roast/[id]]
  → server fetches roast by ID from DB
  → renders score, verdict, roastQuote, analysis issues, suggested fix diff
  → notFound() if ID doesn't exist
```

---

## Backend

### New files

**`src/lib/openai.ts`**
Exports a singleton OpenAI client instance using `OPENAI_API_KEY` from env.

**`src/lib/prompts.ts`**
Exports `buildPrompt(input: { code, language, roastMode })` returning `{ system, user }` strings.
- Normal mode: analytic and direct tone
- Roast mode: sarcastic and merciless tone
- System prompt instructs the model to return structured JSON matching the schema below

**`src/lib/diff.ts`**
Exports `generateDiff(original: string, fixedCode: string): string` — line-by-line diff producing a unified-style string with `+`/`-` prefixes. Used server-side after the AI responds.

### AI output schema (structured output via `response_format: json_schema`)

```ts
{
  score: number,            // 0.0–10.0, one decimal place
  verdict: "needs_serious_help" | "getting_there" | "surprisingly_decent" | "actually_good" | "clean_code",
  roastQuote: string,       // one-liner: sarcastic summary of the code
  analysisIssues: [
    {
      severity: "critical" | "warning" | "good",
      title: string,
      description: string,
      sortOrder: number      // 0-indexed, determines display order
    }
  ],
  suggestedFix: {
    fixedCode: string        // corrected version of the submitted code
  }
}
```

The `diff` field in `suggested_fixes` table is computed server-side (not by the AI) using `generateDiff(originalCode, fixedCode)`.

### New router `src/trpc/routers/roast.ts`

**`roast.create` mutation**

Input:
```ts
z.object({
  code: z.string().min(1).max(2000),
  language: z.string(),
  lineCount: z.number().int().min(1),
  roastMode: z.boolean(),
})
```

Steps:
1. Build prompt via `buildPrompt`
2. Call OpenAI `gpt-4o-mini` with structured output
3. Parse and validate response
4. Insert into `roasts` table
5. Insert all `analysisIssues` into `analysis_issues` table
6. Compute diff, insert into `suggested_fixes` table
7. Return `{ id: roast.id }`

**`roast.getById` query**

Input: `z.object({ id: z.string().uuid() })`

Fetches:
- Row from `roasts`
- All rows from `analysis_issues` where `roast_id = id`, ordered by `sort_order`
- Row from `suggested_fixes` where `roast_id = id`

Returns the full roast shape needed by the result page. Returns `null` if not found.

### `src/trpc/routers/_app.ts`

Add `roast: roastRouter` to `appRouter`.

---

## Frontend

### HomeClient (`src/app/home-client.tsx`)

- Add `useMutation` hook for `trpc.roast.create`
- On submit: call mutation with `{ code, language, lineCount: code.split('\n').length, roastMode }`
- Button state: disabled + label changes to `processing...` while `isPending`
- On success: `router.push('/roast/' + data.id)`
- On error: no special handling (silent fail is acceptable for now)

### Result page (`src/app/roast/[id]/page.tsx`)

- Replace `STATIC_ROAST` with `caller.roast.getById({ id })`
- If result is `null`, call `notFound()`
- Map `analysisIssues` to the existing `AnalysisCardRoot` grid (already handles variable counts)
- Map `suggestedFix.diff` lines: lines starting with `+` → `added`, `-` → `removed`, else → `context`
- `filename` derived as `paste${languageExtension}` using existing `LANGUAGE_MAP`

---

## New dependency

```
openai  (official OpenAI Node SDK)
```

Install via `npm install openai`.

---

## Out of scope

- Share roast functionality
- Error toast / user-facing error states on submit failure
- Streaming / progressive rendering of the result
- Rate limiting

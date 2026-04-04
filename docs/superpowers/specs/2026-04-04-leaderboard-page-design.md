# Leaderboard Page — Design Spec

**Date:** 2026-04-04

## Overview

Implement the full leaderboard page (`/leaderboard`) with live stats in the hero and top 20 entries, reusing the same patterns (collapsible rows, syntax highlight via Shiki) already established on the homepage shame leaderboard.

---

## Backend — tRPC

### Unify `top3` / `top20` into `getLeaderboard`

Remove the existing `top3` and `top20` procedures and replace with a single parametrized procedure:

```ts
getLeaderboard: baseProcedure
  .input(z.object({ limit: z.number().min(1).max(20).default(3) }))
  .query(async ({ ctx, input }) => { ... })
```

Returns: `{ rows: [{ rank, id, score, code, language, lineCount }], total }`.

**Callers updated:**
- `shame-leaderboard.tsx` → `caller.leaderboard.getLeaderboard({ limit: 3 })`
- `full-leaderboard.tsx` → `caller.leaderboard.getLeaderboard({ limit: 20 })`

---

## Frontend

### Leaderboard Page Hero (`/leaderboard`)

```
> shame_leaderboard
// the most roasted code on the internet
{count} codes roasted · avg score: {avgScore}/10
```

The stats line reuses the existing `<StatsDisplay />` client component (already used on homepage), which queries `stats.global` via tRPC client-side with animated `NumberFlow`.

### Full Leaderboard Table

`<FullLeaderboard />` — Server Component (already exists as untracked file):
- Calls `caller.leaderboard.getLeaderboard({ limit: 20 })` server-side
- Runs Shiki (`vesper` theme) per row for syntax highlighting
- Renders `<LeaderboardCollapsibleRow />` for each entry (same component as homepage)
- Footer: `showing top 20 of {total}`

`<FullLeaderboardSkeleton />` — animated placeholder with 5 skeleton rows.

The page wraps `<FullLeaderboard />` in `<Suspense fallback={<FullLeaderboardSkeleton />}>`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/trpc/routers/leaderboard.ts` | Replace `top3`/`top20` with `getLeaderboard({ limit })` |
| `src/components/shame-leaderboard.tsx` | Update call to `getLeaderboard({ limit: 3 })` |
| `src/components/full-leaderboard.tsx` | Update call to `getLeaderboard({ limit: 20 })` |
| `src/app/leaderboard/page.tsx` | Add `<StatsDisplay />` to hero section |

---

## Out of Scope

- Pagination
- Additional fields (roastQuote, verdict, submittedAt) in leaderboard rows
- Any changes to `LeaderboardCollapsibleRow` or `LeaderboardRowScore`

# AGENTS.md — DevRoast

## Stack
- **Next.js 15** (App Router, `src/` dir, TypeScript)
- **Tailwind CSS v4** — `@import "tailwindcss"` + `@theme` in `globals.css`; NO `tailwind.config.ts`
- **Biome** — 2 spaces, double quotes, semicolons
- **tailwind-variants (`tv()`)** — variant styling
- **tailwind-merge (`twMerge`)** — dynamic class merging outside `tv()`

## Project Structure
```
src/
  app/
    layout.tsx          # Root layout — loads fonts, renders <Navbar>
    page.tsx            # Homepage (Server Component)
    home-client.tsx     # "use client" interactive section of homepage
    globals.css         # Tailwind entry + @theme tokens
    components/         # /components route (UI showcase)
  components/
    ui/                 # Small reusable primitives (Button, Badge, etc.)
    analysis-card.tsx   # Composition: AnalysisCardRoot/Title/Description
    code-editor.tsx     # Composition: CodeEditorRoot/Header/Input ("use client")
    leaderboard-row.tsx # Composition: LeaderboardRowRoot/Rank/Score/Code/Language
    score-ring.tsx      # SVG score ring
```

## Component Rules (see also `src/components/ui/AGENTS.md`)
- **Named exports only** — never `export default` inside `src/components/`
- **Composition pattern** — components with multiple internal pieces use sub-components (`AnalysisCardRoot`, `AnalysisCardTitle`, etc.), not props
- **Styling**: `tv()` for variants → pass `className` as arg inside `tv()` call, never wrap with `twMerge`
- **Dynamic classes outside `tv()`**: always `twMerge(...)`, never template literals
- **Tailwind tokens only** — no hardcoded colors or arbitrary values; use tokens defined in `@theme`

## CSS / Tailwind v4
- All design tokens live in `globals.css` under `@theme` (`--color-*`, `--font-*`, `--text-*`, `--radius-*`)
- `@source "../../src/**/*.{ts,tsx}"` ensures all files are scanned in dev + build
- Do NOT add `--spacing-*` to `@theme` — it collides with all spacing utilities in v4

## Key Patterns
```tsx
// Server Component (default)
export default function Page() { ... }

// Client boundary — only when needed (state, events)
"use client";
export function HomeClient() { ... }

// Async Server Component (e.g. CodeBlockCode)
export async function CodeBlockCode({ code, lang }) { ... }
```

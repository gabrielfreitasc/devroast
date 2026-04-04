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
  app/               # Next.js App Router — pages, layouts, route-specific client components
  components/
    ui/              # Small reusable primitives (Button, Badge, Toggle, etc.)
    *                # Page-level compositions (multi-piece components)
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

## Data Fetching Patterns

### tRPC — queries independentes em paralelo
Sempre que um procedimento precisar executar duas ou mais queries sem dependência entre elas, use `await Promise.all(...)` para rodá-las em paralelo.

```ts
// ✅ paralelo — ambas as queries disparam ao mesmo tempo
const [top, total] = await Promise.all([
  ctx.db.select({ ... }).from(roasts).orderBy(asc(roasts.score)).limit(3),
  ctx.db.select({ count: count() }).from(roasts),
]);

// ❌ sequencial desnecessário — `total` espera `top` terminar sem motivo
const top   = await ctx.db.select(...).from(roasts)...;
const total = await ctx.db.select({ count: count() }).from(roasts);
```

Isso se aplica a qualquer combinação de queries Drizzle, chamadas a APIs externas ou outras operações assíncronas independentes dentro de um mesmo handler ou Server Component.

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

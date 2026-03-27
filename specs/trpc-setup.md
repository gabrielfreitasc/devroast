# Spec: tRPC — Camada de API

## Status das decisões

| Pergunta | Decisão |
|---|---|
| Abordagem de integração | Context Provider (recomendado para Next.js/SSR) |
| Data transformer | Sem superjson por ora — adicionar quando necessário |
| Validação de input | Zod |
| Localização dos arquivos | `src/trpc/` |
| Acesso a dados no server | `createTRPCOptionsProxy` com `prefetch` + `HydrateClient` |

---

## Contexto

O projeto ainda não tem camada de API. As páginas usam dados mockados e as API routes não existem. O tRPC será o único meio de comunicação entre client e server — substituindo REST routes avulsas e garantindo type-safety end-to-end.

A stack é Next.js 15 (App Router) + React 19. O setup deve suportar:
- **Server Components:** prefetch de dados no servidor, sem waterfall no cliente
- **Client Components:** `useQuery` / `useMutation` com dados já hidratados
- **Server Actions / caller:** chamadas diretas server-side sem HTTP quando conveniente

---

## Arquitetura de arquivos

```
src/
└── trpc/
    ├── init.ts              # initTRPC, createTRPCContext, exports base de router/procedure
    ├── query-client.ts      # makeQueryClient — configuração padrão do QueryClient
    ├── client.tsx           # 'use client' — TRPCReactProvider, useTRPC, TRPCProvider
    ├── server.tsx           # 'server-only' — trpc proxy, getQueryClient, HydrateClient, prefetch
    └── routers/
        ├── _app.ts          # appRouter raiz — compõe todos os sub-routers
        ├── roast.ts         # router de roasts (POST /roast, GET /roast/:id)
        ├── leaderboard.ts   # router do leaderboard (GET /leaderboard)
        └── stats.ts         # router de stats (GET /stats — count + avg score)

src/app/
└── api/
    └── trpc/
        └── [trpc]/
            └── route.ts     # HTTP handler — fetchRequestHandler (GET + POST)
```

---

## Contratos de implementação

### `src/trpc/init.ts`

```ts
import { initTRPC } from '@trpc/server';
import { cache } from 'react';

export const createTRPCContext = cache(async () => {
  // Contexto global disponível em todos os procedures
  // Adicionar: db, user session, etc. conforme necessário
  return {};
});

const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

### `src/trpc/query-client.ts`

```ts
import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // evita re-fetch imediato após hidratação SSR
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}
```

### `src/trpc/client.tsx`

```tsx
'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
  })();
  return `${base}/api/trpc`;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getUrl() })],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

### `src/trpc/server.tsx`

```tsx
import 'server-only';

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';
import type { TRPCQueryOptions } from '@trpc/tanstack-react-query';

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export const caller = appRouter.createCaller(createTRPCContext);

export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}
```

### `src/app/api/trpc/[trpc]/route.ts`

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '../../../../trpc/init';
import { appRouter } from '../../../../trpc/routers/_app';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

### `src/trpc/routers/_app.ts`

```ts
import { createTRPCRouter } from '../init';
import { roastRouter } from './roast';
import { leaderboardRouter } from './leaderboard';
import { statsRouter } from './stats';

export const appRouter = createTRPCRouter({
  roast: roastRouter,
  leaderboard: leaderboardRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
```

### Routers (esboço dos contratos)

```ts
// routers/roast.ts
roastRouter = createTRPCRouter({
  submit: baseProcedure
    .input(z.object({ code: z.string(), roastMode: z.boolean() }))
    .mutation(async ({ input }) => { /* chama IA, persiste, retorna { id } */ }),

  byId: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => { /* busca roast + issues + fix */ }),
});

// routers/leaderboard.ts
leaderboardRouter = createTRPCRouter({
  list: baseProcedure
    .query(async () => { /* 20 piores scores */ }),
});

// routers/stats.ts
statsRouter = createTRPCRouter({
  global: baseProcedure
    .query(async () => { /* { count, avgScore } */ }),
});
```

---

## Padrão de uso

### Server Component com prefetch

```tsx
// src/app/leaderboard/page.tsx
import { HydrateClient, prefetch, trpc } from '@/trpc/server';
import { LeaderboardList } from './leaderboard-list';

export default async function LeaderboardPage() {
  prefetch(trpc.leaderboard.list.queryOptions());
  return (
    <HydrateClient>
      <LeaderboardList />
    </HydrateClient>
  );
}
```

### Client Component consumindo dados hidratados

```tsx
// src/app/leaderboard/leaderboard-list.tsx
'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

export function LeaderboardList() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.leaderboard.list.queryOptions());
  return <>{data.map(...)}</>;
}
```

### Mutation em Client Component

```tsx
'use client';

import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

export function RoastForm() {
  const trpc = useTRPC();
  const submit = useMutation(trpc.roast.submit.mutationOptions());

  async function handleSubmit() {
    const { id } = await submit.mutateAsync({ code, roastMode });
    router.push(`/roast/${id}`);
  }
}
```

### Acesso direto via caller (Server Component sem hidratação)

```tsx
// útil quando não precisa passar dados para o client
import { caller } from '@/trpc/server';

export default async function RoastPage({ params }: { params: { id: string } }) {
  const roast = await caller.roast.byId({ id: params.id });
  return <RoastResult data={roast} />;
}
```

---

## Integração no layout root

```tsx
// src/app/layout.tsx
import { TRPCReactProvider } from '@/trpc/client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
```

---

## To-dos de implementação

### 1. Dependências

- [ ] `yarn add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only client-only`

### 2. Infra tRPC

- [ ] Criar `src/trpc/init.ts` — contexto + exports base
- [ ] Criar `src/trpc/query-client.ts` — `makeQueryClient`
- [ ] Criar `src/trpc/client.tsx` — `TRPCReactProvider`, `useTRPC`
- [ ] Criar `src/trpc/server.tsx` — `trpc` proxy, `HydrateClient`, `prefetch`, `caller`
- [ ] Criar `src/app/api/trpc/[trpc]/route.ts` — HTTP handler

### 3. Routers

- [ ] Criar `src/trpc/routers/_app.ts` com `appRouter` e `AppRouter` type
- [ ] Criar `src/trpc/routers/roast.ts` — `submit` (mutation) e `byId` (query)
- [ ] Criar `src/trpc/routers/leaderboard.ts` — `list` (query, top 20 score ASC)
- [ ] Criar `src/trpc/routers/stats.ts` — `global` (query, count + avgScore)
- [ ] Conectar `db` do Drizzle no `createTRPCContext` para uso nos procedures

### 4. Layout

- [ ] Envolver `children` no `src/app/layout.tsx` com `<TRPCReactProvider>`

### 5. Substituir mocks nas páginas

- [ ] `src/app/leaderboard/page.tsx` — usar `prefetch(trpc.leaderboard.list.queryOptions())`
- [ ] `src/app/leaderboard/leaderboard-list.tsx` — criar como Client Component com `useSuspenseQuery`
- [ ] `src/app/page.tsx` — passar stats reais via `prefetch(trpc.stats.global.queryOptions())`
- [ ] `src/app/home-client.tsx` — conectar submit ao `trpc.roast.submit` mutation
- [ ] `src/app/roast/[id]/page.tsx` — buscar dados via `caller.roast.byId` ou prefetch

### 6. Alias de import

- [ ] Confirmar que `@/` está configurado no `tsconfig.json` apontando para `./src`
  - Se não estiver: adicionar `"paths": { "@/*": ["./src/*"] }` no `tsconfig.json`

---

## Notas

- `server-only` no `trpc/server.tsx` garante erro de build caso seja importado acidentalmente no client.
- `client-only` no `trpc/client.tsx` faz o mesmo para o lado server.
- O `getQueryClient` no server usa `cache()` do React para retornar o mesmo `QueryClient` durante o mesmo request (escopo de request no App Router).
- `staleTime: 30 * 1000` é obrigatório para evitar re-fetch imediato no cliente logo após hidratação SSR.
- `caller` é para chamadas server-to-server diretas — não passa pelo HTTP handler, mais eficiente para RSC que não precisam hidratar dados no cliente.
- Não adicionar superjson por ora: o projeto não tem `Date`, `Map`, `Set` nas respostas da API ainda. Adicionar apenas se surgir necessidade concreta.

# Drizzle ORM — Especificação de Implementação

## Contexto

O DevRoast recebe código de usuários, envia para uma IA que gera um roast detalhado (nota, veredicto, análise por severidade, sugestão de fix e citação), e exibe os resultados + um leaderboard da vergonha ranqueado por nota (menor = mais destruído).

Toda essa informação precisa ser persistida no PostgreSQL via Drizzle ORM.

---

## Screens mapeadas (Pencil)

| Screen | Dados necessários |
|---|---|
| Screen 1 — Code Input | submissão de código, toggle de roast mode |
| Screen 2 — Roast Results | score, veredicto, citação, análise (issues), diff (fix sugerido) |
| Screen 3 — Shame Leaderboard | lista de roasts ordenados por score ASC, com rank dinâmico |
| Screen 4 — OG Image | score, veredicto, linguagem, citação |

---

## Enums

```ts
// src/db/schema/enums.ts

export const languageEnum = pgEnum("language", [
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
  "other",
]);

export const severityEnum = pgEnum("severity", [
  "critical",   // bugs críticos, vermelho
  "warning",    // avisos, âmbar
  "good",       // o que foi surpreendentemente decente, verde
]);

export const verdictEnum = pgEnum("verdict", [
  "needs_serious_help",    // score 1–3
  "getting_there",         // score 4–5
  "surprisingly_decent",   // score 6–7
  "actually_good",         // score 8–9
  "clean_code",            // score 10
]);
```

---

## Tabelas

### `roasts`

Tabela principal — cada linha é uma submissão de código que foi roastada.

```ts
export const roasts = pgTable("roasts", {
  id:          uuid("id").primaryKey().defaultRandom(),
  code:        text("code").notNull(),
  language:    languageEnum("language").notNull().default("other"),
  lineCount:   integer("line_count").notNull().default(0),
  roastMode:   boolean("roast_mode").notNull().default(false),

  // resultado da IA
  score:       numeric("score", { precision: 3, scale: 1 }).notNull(), // 1.0 – 10.0
  verdict:     verdictEnum("verdict").notNull(),
  roastQuote:  text("roast_quote").notNull(),  // citação exibida no score hero e OG image

  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});
```

### `analysis_issues`

Issues individuais gerados pela IA para cada roast (os cards de análise detalhada).

```ts
export const analysisIssues = pgTable("analysis_issues", {
  id:          uuid("id").primaryKey().defaultRandom(),
  roastId:     uuid("roast_id").notNull().references(() => roasts.id, { onDelete: "cascade" }),
  severity:    severityEnum("severity").notNull(),
  title:       varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  sortOrder:   integer("sort_order").notNull().default(0), // ordena os cards na UI
});
```

### `suggested_fixes`

O diff sugerido pela IA para corrigir o código submetido (1:1 com roasts).

```ts
export const suggestedFixes = pgTable("suggested_fixes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  roastId:      uuid("roast_id").notNull().unique().references(() => roasts.id, { onDelete: "cascade" }),
  originalCode: text("original_code").notNull(),
  fixedCode:    text("fixed_code").notNull(),
  fileName:     varchar("file_name", { length: 100 }).default("snippet"),
});
```

---

## Relacionamentos (Drizzle relations)

```ts
export const roastsRelations = relations(roasts, ({ many, one }) => ({
  issues: many(analysisIssues),
  fix:    one(suggestedFixes, {
    fields:     [roasts.id],
    references: [suggestedFixes.roastId],
  }),
}));

export const analysisIssuesRelations = relations(analysisIssues, ({ one }) => ({
  roast: one(roasts, {
    fields:     [analysisIssues.roastId],
    references: [roasts.id],
  }),
}));

export const suggestedFixesRelations = relations(suggestedFixes, ({ one }) => ({
  roast: one(roasts, {
    fields:     [suggestedFixes.roastId],
    references: [roasts.id],
  }),
}));
```

---

## Queries esperadas

```ts
// Leaderboard (Screen 3) — 20 roasts piores (menor score)
db.select().from(roasts).orderBy(asc(roasts.score)).limit(20)

// Resultado completo de um roast (Screen 2)
db.query.roasts.findFirst({
  where: eq(roasts.id, id),
  with: {
    issues: { orderBy: [asc(analysisIssues.sortOrder)] },
    fix: true,
  },
})

// Stats globais exibidos no footer (Screen 1)
db.select({ count: count(), avg: avg(roasts.score) }).from(roasts)
```

---

## Docker Compose

```yaml
# docker-compose.yml (raiz do projeto)
services:
  postgres:
    image: postgres:16-alpine
    container_name: devroast-db
    environment:
      POSTGRES_USER:     devroast
      POSTGRES_PASSWORD: devroast
      POSTGRES_DB:       devroast
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devroast -d devroast"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Comandos Docker

```bash
# Subir o banco em background
docker compose up -d

# Derrubar (mantém o volume)
docker compose down

# Derrubar e apagar todos os dados
docker compose down -v

# Ver logs do banco
docker compose logs -f postgres
```

---

## Drizzle Kit — Config e Comandos

### `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect:    "postgresql",
  schema:     "./src/db/schema/index.ts",
  out:        "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict:  true,
});
```

### Scripts no `package.json`

```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:migrate":  "drizzle-kit migrate",
  "db:push":     "drizzle-kit push",
  "db:studio":   "drizzle-kit studio",
  "db:drop":     "drizzle-kit drop"
}
```

### Referência dos comandos

| Comando | Quando usar |
|---|---|
| `yarn db:generate` | Sempre que o schema mudar — gera um novo arquivo SQL em `src/db/migrations/` |
| `yarn db:migrate` | Aplica as migrations pendentes no banco — usar em produção e CI |
| `yarn db:push` | Aplica o schema diretamente sem gerar migration — atalho para desenvolvimento local |
| `yarn db:studio` | Abre o Drizzle Studio no browser para inspecionar/editar os dados visualmente |
| `yarn db:drop` | Remove uma migration específica (interativo) |

> **Regra geral:** use `db:push` para iterar rápido durante desenvolvimento. Use `db:generate` + `db:migrate` para qualquer mudança que vá para produção.

---

## Variáveis de ambiente

```env
# .env.local
DATABASE_URL="postgresql://devroast:devroast@localhost:5432/devroast"
```

Adicionar `.env.local` ao `.gitignore` (já deve estar). Criar um `.env.example` com a linha acima sem o valor para documentar.

---

## Estrutura de arquivos

```
src/
└── db/
    ├── index.ts          # instância do drizzle + pool de conexão
    ├── schema/
    │   ├── index.ts      # re-exporta tudo
    │   ├── enums.ts      # languageEnum, severityEnum, verdictEnum
    │   └── tables.ts     # roasts, analysisIssues, suggestedFixes + relations
    └── migrations/       # gerado pelo drizzle-kit generate
        └── meta/         # snapshot interno do drizzle-kit (não editar)
drizzle.config.ts         # config do drizzle-kit (raiz do projeto)
docker-compose.yml        # Postgres local
.env.local                # DATABASE_URL (não commitar)
.env.example              # template público da .env
```

---

## To-dos de implementação

### 1. Infra local

- [ ] Criar `docker-compose.yml` na raiz (conforme acima)
- [ ] Criar `.env.local` com `DATABASE_URL`
- [ ] Criar `.env.example` com `DATABASE_URL=""` e commitar
- [ ] Rodar `docker compose up -d` e confirmar que o healthcheck passa

### 2. Dependências

- [ ] Instalar: `yarn add drizzle-orm pg`
- [ ] Instalar dev: `yarn add -D drizzle-kit @types/pg`

### 3. Config do Drizzle Kit

- [ ] Criar `drizzle.config.ts` na raiz
- [ ] Adicionar scripts `db:*` no `package.json`

### 4. Schema

- [ ] Criar `src/db/schema/enums.ts` com `languageEnum`, `severityEnum`, `verdictEnum`
- [ ] Criar `src/db/schema/tables.ts` com `roasts`, `analysisIssues`, `suggestedFixes` e todas as `relations`
- [ ] Criar `src/db/schema/index.ts` re-exportando tudo
- [ ] Criar `src/db/index.ts` com a instância do Drizzle usando `pg` Pool

### 5. Migrations

- [ ] Rodar `yarn db:push` para aplicar o schema no banco local pela primeira vez
- [ ] Rodar `yarn db:studio` e confirmar que as três tabelas aparecem corretamente
- [ ] Gerar a migration formal com `yarn db:generate` (para controle de versão e produção)

### 6. API Routes (Next.js)

- [ ] `POST /api/roast` — recebe `{ code, roastMode }`, chama a IA, persiste roast + issues + fix em uma transação, retorna `{ id }`
- [ ] `GET /api/roast/[id]` — retorna o roast com issues e fix para a Screen 2
- [ ] `GET /api/leaderboard` — retorna os 20 piores roasts (score ASC) para a Screen 3
- [ ] `GET /api/stats` — retorna `{ count, avgScore }` para o footer da Screen 1

### 7. Integração com UI

- [ ] Substituir dados mockados em `src/app/page.tsx` pelos dados reais do `/api/leaderboard` e `/api/stats`
- [ ] Conectar o botão `$ roast_my_code` em `home-client.tsx` ao `POST /api/roast` e redirecionar para `/roast/[id]`
- [ ] Criar a página `src/app/roast/[id]/page.tsx` que busca e renderiza a Screen 2

---

## Notas

- **Submissões são 100% anônimas** — não há coluna de usuário, session ou IP em nenhuma tabela. Não implementar autenticação nesse projeto.
- **Leaderboard é público por padrão** — todo roast submetido automaticamente aparece no leaderboard. Não há flag de visibilidade ou moderação.
- O score é `numeric(3,1)` para suportar valores como `3.5`, `10.0`.
- `roast_mode` é persistido para eventual diferenciação de tom no leaderboard ou analytics.
- O `sort_order` em `analysis_issues` preserva a ordem que a IA retorna (críticos primeiro, depois warnings, depois bons).
- `suggested_fixes` é opcional — a API deve criar o registro somente se a IA retornar o fix.

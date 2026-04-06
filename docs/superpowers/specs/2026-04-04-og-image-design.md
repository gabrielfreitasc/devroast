# OG Image Generation — DevRoast

**Date:** 2026-04-04  
**Status:** Approved

## Overview

Gerar automaticamente imagens OpenGraph para os links compartilháveis de resultados de roast. A imagem é gerada on-demand via rota de API, cacheada no CDN, e reflete o design definido no frame "Screen 4 - OG Image" do Pencil.

---

## Arquitetura

### Rota de geração

**Arquivo:** `src/app/api/og/[id]/route.ts`

- Runtime: Node.js (padrão Next.js)
- Método: `GET`
- Busca o roast diretamente via Drizzle (sem tRPC) — apenas os campos necessários: `score`, `roastQuote`, `language`, `lineCount`, `verdict`
- Renderiza um componente JSX com `ImageResponse` do `@takumi-rs/image-response`
- Retorna `Cache-Control: public, s-maxage=31536000, immutable`
- Retorna 404 se o roast não existir

**Fontes:** JetBrains Mono carregada via `fs.readFile` do arquivo baixado pelo Next.js em build time (em `.next/static/media/` ou via `public/fonts/`). Cacheada com top-level await no módulo para não recarregar a cada request.

### Dimensões

`1200 × 630` px (padrão OG).

---

## Componente JSX da OG Image

Fiel ao design do frame "Screen 4 - OG Image":

| Elemento | Detalhes |
|---|---|
| Fundo | `#0a0a0a`, full width/height |
| Logo | `> devroast` em verde (`#4ade80`), topo centralizado |
| Score | Número grande em amarelo/laranja com `/10` menor ao lado direito |
| Badge de status | Bolinha colorida + texto do `verdict` (ex: `needs_serious_help`) |
| Metadado | `lang: {language} · {lineCount} lines` em cinza claro |
| Quote | `roastQuote` em itálico, centralizado, rodapé |

**Cores por verdict:**

| Verdict | Cor |
|---|---|
| `needs_serious_help` | vermelho (`#ef4444`) |
| `getting_there` | laranja (`#f97316`) |
| `surprisingly_decent` | amarelo (`#eab308`) |
| `actually_good` | verde (`#22c55e`) |
| `clean_code` | azul (`#3b82f6`) |

**Score color:** amarelo/laranja (`#f59e0b`) para scores baixos, degradê até verde para altos — ou cor plana amarela (`#f59e0b`) para simplificar (fiel ao design).

Layout usando `tw=` (Tailwind-in-JSX do Takumi) + `style` inline para cores do design system.

---

## Metadata dinâmica

**Arquivo:** `src/app/roast/[id]/page.tsx`

Substituir o `metadata` estático por `generateMetadata` assíncrono:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const roast = await caller.roast.getById({ id });

  if (!roast) return {};

  return {
    title: `${roast.score}/10 · DevRoast`,
    description: roast.roastQuote,
    openGraph: {
      title: `${roast.score}/10 · DevRoast`,
      description: roast.roastQuote,
      images: [`/api/og/${id}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/${id}`],
    },
  };
}
```

---

## Dependências

- `@takumi-rs/image-response` — novo pacote a instalar
- `@takumi-rs/core` — peer dependency (provavelmente instalado junto)
- Fonte JetBrains Mono disponível em build time (já usada no projeto via `next/font/google`)

### Estratégia de carregamento da fonte

O Next.js baixa a fonte JetBrains Mono em build time. Para servi-la na rota de OG, duas opções:

1. **Copiar para `public/fonts/`** — mais simples, fetch via URL relativa
2. **`fs.readFile` do path gerado pelo Next.js** — mais frágil (path pode mudar)

**Usar opção 1:** adicionar o arquivo `.woff2` do JetBrains Mono em `public/fonts/JetBrainsMono-Regular.woff2` e carregá-lo via `fetch('/fonts/JetBrainsMono-Regular.woff2')`.

---

## Erros e edge cases

| Caso | Comportamento |
|---|---|
| ID não existe | Retorna `404` |
| Fonte não carregada | Takumi usa fallback (sem texto legível) — não deve ocorrer em produção |
| `roastQuote` muito longo | Truncar com `...` após 120 caracteres no componente JSX |

---

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/app/api/og/[id]/route.ts` | Criar |
| `src/app/roast/[id]/page.tsx` | Modificar: `metadata` → `generateMetadata` |
| `public/fonts/JetBrainsMono-Regular.woff2` | Adicionar |
| `package.json` | Adicionar `@takumi-rs/image-response` |

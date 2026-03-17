# UI Components — Padrões de Criação

Este arquivo documenta os padrões obrigatórios para todos os componentes dentro de `src/components/ui`.

---

## Regras gerais

- **Nunca use `default export`** — sempre use named exports (`export function Button`)
- **Nunca crie arquivos `index.ts` barrel** nesta pasta sem necessidade explícita
- Um componente por arquivo, com o nome do arquivo em kebab-case (`button.tsx`, `score-ring.tsx`)

---

## Stack de estilização

| Lib | Papel |
|---|---|
| `tailwind-variants` (`tv`) | Definir variantes, tamanhos e estados do componente |
| `tailwind-merge` | **Não usar diretamente** — o `tailwind-variants` já faz o merge internamente |
| Tailwind CSS | Classes utilitárias; usar sempre os tokens do design system |

---

## Estrutura de um componente

```tsx
import { type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

// 1. Definir a receita com tv()
const component = tv({
  base: [
    // classes base que sempre se aplicam
  ],
  variants: {
    variant: {
      primary: [...],
      secondary: [...],
    },
    size: {
      sm: "...",
      md: "...",
      lg: "...",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

// 2. Tipar as props extendendo o elemento HTML nativo + VariantProps
type ComponentProps_ = ComponentProps<"button"> & VariantProps<typeof component>;

// 3. Named export — desestruturar variantes + className + resto das props nativas
export function MyComponent({ variant, size, className, children, ...props }: ComponentProps_) {
  return (
    // 4. Passar className DENTRO da chamada tv() — nunca envolver com twMerge()
    <button className={component({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
```

---

## Merge de classes — regras

### Com `tailwind-variants` (`tv()`)
Passar `className` direto na chamada — o `tailwind-variants` faz o merge internamente.

```tsx
// CORRETO
<button className={button({ variant, size, className })} />

// ERRADO — twMerge é redundante aqui
<button className={twMerge(button({ variant, size }), className)} />
```

### Sem `tailwind-variants` — interpolação de string proibida
Sempre usar `twMerge` ao combinar classes fora de um `tv()`. **Nunca usar template literals para compor classes.**

```tsx
// CORRETO
<span className={twMerge("text-sm font-bold", getDynamicClass(value))} />

// ERRADO — interpolação de string não passa pelo merge
<span className={`text-sm font-bold ${getDynamicClass(value)}`} />
```

---

## Tipagem de props

Sempre extender as props nativas do elemento HTML correspondente via `ComponentProps<"tag">`.
Isso garante que o componente aceita todos os atributos nativos (`onClick`, `disabled`, `type`, `aria-*`, etc.) sem precisar redeclará-los.

```tsx
// Para elementos HTML
type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button>;
type InputProps  = ComponentProps<"input">  & VariantProps<typeof input>;
type AnchorProps = ComponentProps<"a">      & VariantProps<typeof anchor>;
```

---

## Tokens do design system

Usar **sempre** as classes Tailwind mapeadas para os tokens do design (definidos via `@theme` em `globals.css`). Nunca hardcodar cores ou valores arbitrários. Não usar CSS variables manuais — tudo é gerenciado pela diretiva `@theme` do Tailwind v4.

### Cores disponíveis

```
bg-bg-page / bg-bg-surface / bg-bg-elevated / bg-bg-input
text-text-primary / text-text-secondary / text-text-tertiary
accent-green / accent-red / accent-amber / accent-cyan
border-border-primary / border-border-focus
syn-function / syn-keyword / syn-string / syn-number / syn-operator / syn-property / syn-type / syn-variable
diff-removed-bg / diff-added-bg
```

### Tipografia

A fonte padrão (JetBrains Mono) é aplicada automaticamente pelo Preflight do Tailwind no elemento `html`, pois `--font-sans` está definido via `@theme` em `globals.css`. **Não use classes de fonte explícitas** para a fonte primária.

```
// fonte primária — aplicada automaticamente, não precisa de classe
(JetBrains Mono via fontFamily.sans → Preflight)

// fonte secundária — IBM Plex Mono, usar apenas quando necessário
font-serif  → IBM Plex Mono (descrições longas, subtítulos)

font-normal / font-medium / font-semibold / font-bold / font-black
text-xs (12px) / text-sm (13px) / text-base (14px) / text-lg (16px)
text-xl (18px) / text-2xl (20px) / text-3xl (24px) / text-4xl (36px)
text-5xl (48px) / text-display (160px)
```

### Border radius

```
rounded-sm  → 4px
rounded-md  → 6px  (padrão de botões e inputs)
rounded-lg  → 8px  (cards, editors, modais)
```

---

## Exemplo completo — `button.tsx`

```tsx
import { type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-normal text-sm",
    "transition-colors duration-150",
    "cursor-pointer select-none",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
  ],
  variants: {
    variant: {
      primary:     ["bg-accent-green text-bg-page font-medium", "hover:bg-accent-green/90", "active:bg-accent-green/80"],
      secondary:   ["bg-transparent text-text-primary border border-border-primary", "hover:border-border-focus", "active:bg-bg-elevated"],
      link:        ["bg-transparent text-text-secondary border border-border-primary", "hover:text-text-primary hover:border-border-focus"],
      ghost:       ["bg-transparent text-text-primary", "hover:bg-bg-elevated"],
      destructive: ["bg-accent-red text-text-primary font-medium", "hover:bg-accent-red/90"],
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-xs",
      lg: "px-6 py-[10px] text-sm",
    },
    rounded: {
      none: "rounded-none",
      sm:   "rounded-sm",
      md:   "rounded-md",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "lg",
    rounded: "md",
  },
});

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button>;

export function Button({ variant, size, rounded, className, children, ...props }: ButtonProps) {
  return (
    <button className={button({ variant, size, rounded, className })} {...props}>
      {children}
    </button>
  );
}
```

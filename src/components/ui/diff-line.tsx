import { type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const diffLine = tv({
  base: "flex gap-2 px-4 py-2 text-sm",
  variants: {
    type: {
      added: "bg-diff-added-bg",
      removed: "bg-diff-removed-bg",
      context: "",
    },
  },
  defaultVariants: {
    type: "context",
  },
});

const prefix = tv({
  base: "",
  variants: {
    type: {
      added: "text-accent-green",
      removed: "text-accent-red",
      context: "text-text-tertiary",
    },
  },
  defaultVariants: {
    type: "context",
  },
});

const content = tv({
  base: "",
  variants: {
    type: {
      added: "text-text-primary",
      removed: "text-text-secondary",
      context: "text-text-secondary",
    },
  },
  defaultVariants: {
    type: "context",
  },
});

type DiffLineProps = ComponentProps<"div"> &
  VariantProps<typeof diffLine> & {
    code: string;
  };

export function DiffLine({ type, code, className, ...props }: DiffLineProps) {
  const prefixChar = {
    added: "+",
    removed: "-",
    context: " ",
  } as const;

  return (
    <div className={diffLine({ type, className })} {...props}>
      <span className={prefix({ type })}>{prefixChar[type ?? "context"]}</span>
      <span className={content({ type })}>{code}</span>
    </div>
  );
}

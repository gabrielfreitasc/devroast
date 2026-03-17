import { type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const badge = tv({
  base: "inline-flex items-center gap-2",
  variants: {
    status: {
      critical: "text-accent-red",
      warning: "text-accent-amber",
      good: "text-accent-green",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
    },
  },
  defaultVariants: {
    status: "critical",
    size: "sm",
  },
});

const dot = tv({
  base: "shrink-0 rounded-full",
  variants: {
    status: {
      critical: "bg-accent-red",
      warning: "bg-accent-amber",
      good: "bg-accent-green",
    },
    size: {
      sm: "size-2",
      md: "size-3",
    },
  },
  defaultVariants: {
    status: "critical",
    size: "sm",
  },
});

type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badge> & {
    label: string;
  };

export function Badge({ status, size, label, className, ...props }: BadgeProps) {
  return (
    <span className={badge({ status, size, className })} {...props}>
      <span className={dot({ status, size })} />
      {label}
    </span>
  );
}

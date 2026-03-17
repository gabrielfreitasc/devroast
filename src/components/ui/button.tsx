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
      // "$ roast_my_code" — fundo verde sólido, texto escuro
      primary: [
        "bg-accent-green text-bg-page font-medium",
        "hover:bg-accent-green/90",
        "active:bg-accent-green/80",
      ],
      // "$ share_roast" — sem fundo, borda border-primary, texto branco
      secondary: [
        "bg-transparent text-text-primary border border-border-primary",
        "hover:border-border-focus hover:text-text-primary",
        "active:bg-bg-elevated",
      ],
      // "$ view_all >>" — sem fundo, borda border-primary, texto secundário
      link: [
        "bg-transparent text-text-secondary border border-border-primary",
        "hover:text-text-primary hover:border-border-focus",
        "active:bg-bg-elevated",
      ],
      // Ghost — sem borda
      ghost: [
        "bg-transparent text-text-primary",
        "hover:bg-bg-elevated",
        "active:bg-bg-elevated/60",
      ],
      // Destructivo
      destructive: [
        "bg-accent-red text-text-primary font-medium",
        "hover:bg-accent-red/90",
        "active:bg-accent-red/80",
      ],
    },
    size: {
      // Fiel ao design: padding vertical 6-8-10, horizontal 12-16-24
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-xs",
      lg: "px-6 py-[10px] text-sm",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
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

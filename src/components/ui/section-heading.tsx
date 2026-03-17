import { type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const sectionHeading = tv({
  base: "flex items-center gap-2",
  variants: {
    size: {
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
      xl: "text-3xl",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

type SectionHeadingProps = ComponentProps<"div"> &
  VariantProps<typeof sectionHeading> & {
    prefix?: string;
  };

export function SectionHeading({
  children,
  prefix = "//",
  size,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={sectionHeading({ size, className })} {...props}>
      <span className="font-bold text-accent-green">{prefix}</span>
      <span className="font-bold text-text-primary">{children}</span>
    </div>
  );
}

import { type ComponentProps } from "react";
import { tv } from "tailwind-variants";

const analysisCardRoot = tv({
  base: "flex flex-col gap-3 border border-border-primary rounded-lg p-5",
});

const analysisCardTitle = tv({
  base: "text-text-primary text-sm",
});

const analysisCardDescription = tv({
  base: "text-text-secondary font-serif text-xs leading-relaxed",
});

export function AnalysisCardRoot({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={analysisCardRoot({ className })} {...props}>
      {children}
    </div>
  );
}

export function AnalysisCardTitle({ className, children, ...props }: ComponentProps<"p">) {
  return (
    <p className={analysisCardTitle({ className })} {...props}>
      {children}
    </p>
  );
}

export function AnalysisCardDescription({ className, children, ...props }: ComponentProps<"p">) {
  return (
    <p className={analysisCardDescription({ className })} {...props}>
      {children}
    </p>
  );
}

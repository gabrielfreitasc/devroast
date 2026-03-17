import { type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const scoreRing = tv({
  base: "relative",
  variants: {
    size: {
      md: "size-[180px]",
      lg: "size-[240px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const scoreText = tv({
  base: "text-text-primary font-bold leading-none",
  variants: {
    size: {
      md: "text-5xl",
      lg: "text-[64px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const denominator = tv({
  base: "text-text-tertiary leading-none",
  variants: {
    size: {
      md: "text-lg",
      lg: "text-xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

function getScoreColor(score: number): string {
  if (score <= 3.5) return "#EF4444";
  if (score <= 6) return "#F59E0B";
  return "#10B981";
}

type ScoreRingProps = ComponentProps<"div"> &
  VariantProps<typeof scoreRing> & {
    score: number;
    maxScore?: number;
  };

export function ScoreRing({
  score,
  maxScore = 10,
  size,
  className,
  ...props
}: ScoreRingProps) {
  const pct = Math.min(score / maxScore, 1);
  const sizeMap = { md: 180, lg: 240 } as const;
  const px = sizeMap[size ?? "md"];
  const strokeWidth = 4;
  const radius = (px - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const color = getScoreColor(score);

  return (
    <div className={scoreRing({ size, className })} {...props}>
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        className="absolute inset-0"
      >
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${px / 2} ${px / 2})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className={scoreText({ size })}>{score}</span>
        <span className={denominator({ size })}>/{maxScore}</span>
      </div>
    </div>
  );
}

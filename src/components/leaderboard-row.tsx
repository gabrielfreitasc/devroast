import { type ComponentProps } from "react";
import { tv } from "tailwind-variants";
import { twMerge } from "tailwind-merge";

const leaderboardRowRoot = tv({
  base: "flex items-center gap-6 px-5 py-4 border-b border-border-primary w-full",
});

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6) return "text-accent-amber";
  return "text-accent-green";
}

export function LeaderboardRowRoot({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={leaderboardRowRoot({ className })} {...props}>
      {children}
    </div>
  );
}

export function LeaderboardRowRank({ className, children, ...props }: ComponentProps<"span">) {
  return (
    <span className={twMerge("text-text-tertiary text-sm w-10 shrink-0", className)} {...props}>
      {children}
    </span>
  );
}

type LeaderboardRowScoreProps = ComponentProps<"span"> & { score: number };

export function LeaderboardRowScore({ score, className, ...props }: LeaderboardRowScoreProps) {
  return (
    <span className={twMerge("text-sm font-bold w-[60px] shrink-0", getScoreColor(score), className)} {...props}>
      {score}
    </span>
  );
}

export function LeaderboardRowCode({ className, children, ...props }: ComponentProps<"span">) {
  return (
    <span className={twMerge("text-text-secondary text-xs flex-1 truncate", className)} {...props}>
      {children}
    </span>
  );
}

export function LeaderboardRowLanguage({ className, children, ...props }: ComponentProps<"span">) {
  return (
    <span className={twMerge("text-text-tertiary text-xs w-[100px] shrink-0 text-right", className)} {...props}>
      {children}
    </span>
  );
}

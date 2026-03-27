"use client";

import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function StatsDisplay() {
  const trpc = useTRPC();
  const { data } = useQuery({
    ...trpc.stats.global.queryOptions(),
    initialData: { count: 0, avgScore: 0 },
  });

  return (
    <p className="text-text-tertiary text-sm w-[780px]">
      <NumberFlow value={data.count} /> codes roasted · avg score:{" "}
      <NumberFlow
        value={data.avgScore}
        format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
      />
      /10
    </p>
  );
}

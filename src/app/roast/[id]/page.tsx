import type { Metadata } from "next";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { DiffLine } from "@/components/ui/diff-line";
import {
  AnalysisCardRoot,
  AnalysisCardTitle,
  AnalysisCardDescription,
} from "@/components/analysis-card";
import {
  CodeBlockRoot,
  CodeBlockHeader,
  CodeBlockCode,
} from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Roast Result · DevRoast",
  description: "See how badly your code got roasted.",
};

const STATIC_ROAST = {
  id: "3f2a1b4c-8e9d-4f5a-b6c7-d8e9f0a1b2c3",
  filename: "sort(items.version.bak)",
  language: "javascript" as const,
  score: 3.5,
  quote:
    '"this code looks like it was written during a power outage... in 2005."',
  author: "anonymous",
  lines: 17,
  submittedCode: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`,
  analysis: [
    {
      status: "critical" as const,
      label: "critical",
      title: "Div instead of nextInt",
      description:
        "Using integer division looks to be needed here. Use Math.floor() or bitwise OR for integer truncation instead of relying on implicit coercion.",
    },
    {
      status: "warning" as const,
      label: "warning",
      title: "Imperative loop pattern",
      title_note: "",
      description:
        "For loops with indices make intent harder to see. Use Array.reduce() or Array.forEach() to better express the accumulation pattern functionally.",
    },
    {
      status: "warning" as const,
      label: "info",
      title: "client-centric convention",
      description:
        "var declarations are function-scoped and hoisted, which can lead to unexpected bugs. Use const or let for block-scoped, predictable variable lifecycle instead of var throughout.",
    },
    {
      status: "good" as const,
      label: "good",
      title: "single responsibility",
      description:
        "The function does one thing — calculating a total — which is good. Consider extracting the price accessor into a parameter for testability and flexibility.",
    },
  ],
  suggestedFix: {
    filename: "calculateTotal.js",
    lines: [
      { type: "removed" as const, code: "function calculateTotal(items) {" },
      { type: "added" as const,   code: "const calculateTotal = (items) => {" },
      { type: "removed" as const, code: "  var total = 0;" },
      { type: "removed" as const, code: "  for (var i = 0; i < items.length; i++) {" },
      { type: "removed" as const, code: "    total = total + items[i].price;" },
      { type: "removed" as const, code: "  }" },
      { type: "added" as const,   code: "  return items.reduce((sum, item) => sum + item.price, 0);" },
      { type: "context" as const, code: "};" },
    ],
  },
};

type Props = { params: Promise<{ id: string }> };

export default async function RoastResultPage({ params }: Props) {
  const { id } = await params;
  const roast = { ...STATIC_ROAST, id };

  return (
    <main className="max-w-[1440px] mx-auto px-20 py-10 flex flex-col gap-0">
      {/* Hero: score + quote */}
      <section className="flex items-start gap-14 py-10">
        <ScoreRing score={roast.score} />

        <div className="flex flex-col gap-3 pt-4">
          <SectionHeading prefix="//">{roast.filename}</SectionHeading>

          <p className="text-text-primary text-xl leading-snug">
            {roast.quote}
          </p>

          <p className="text-text-tertiary text-sm">
            from:{" "}
            <span className="text-text-secondary">{roast.author}</span>
            {" · "}
            {roast.lines} lines
          </p>

          <div className="flex items-center gap-2 pt-1">
            <Badge status="good" label={roast.language} />
          </div>
        </div>
      </section>

      <hr className="border-border-primary" />

      {/* Your submission */}
      <section className="flex flex-col gap-6 py-10">
        <SectionHeading>your_submission</SectionHeading>

        <CodeBlockRoot>
          <CodeBlockHeader filename={roast.filename} />
          <CodeBlockCode code={roast.submittedCode} lang={roast.language} />
        </CodeBlockRoot>
      </section>

      <hr className="border-border-primary" />

      {/* Detailed analysis */}
      <section className="flex flex-col gap-6 py-10">
        <SectionHeading>detailed_analysis</SectionHeading>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            {roast.analysis.slice(0, 2).map((item) => (
              <AnalysisCardRoot key={item.title}>
                <Badge status={item.status} label={item.label} />
                <AnalysisCardTitle>{item.title}</AnalysisCardTitle>
                <AnalysisCardDescription>{item.description}</AnalysisCardDescription>
              </AnalysisCardRoot>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5">
            {roast.analysis.slice(2).map((item) => (
              <AnalysisCardRoot key={item.title}>
                <Badge status={item.status} label={item.label} />
                <AnalysisCardTitle>{item.title}</AnalysisCardTitle>
                <AnalysisCardDescription>{item.description}</AnalysisCardDescription>
              </AnalysisCardRoot>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-border-primary" />

      {/* Suggested fix */}
      <section className="flex flex-col gap-6 py-10">
        <SectionHeading>suggested_fix</SectionHeading>

        <CodeBlockRoot>
          <CodeBlockHeader filename={roast.suggestedFix.filename} />
          {roast.suggestedFix.lines.map((line, i) => (
            <DiffLine key={i} type={line.type} code={line.code} />
          ))}
        </CodeBlockRoot>
      </section>
    </main>
  );
}

import { notFound } from "next/navigation";
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
import { caller } from "@/trpc/server";
import { LANGUAGE_MAP } from "@/lib/languages";
import type { BundledLanguage } from "shiki";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const roast = await caller.roast.getById({ id });

  if (!roast) return {};

  return {
    title: `${roast.score}/10 · DevRoast`,
    description: roast.roastQuote,
    openGraph: {
      title: `${roast.score}/10 · DevRoast`,
      description: roast.roastQuote,
      images: [`/api/og/${id}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/${id}`],
    },
  };
}

export default async function RoastResultPage({ params }: Props) {
  const { id } = await params;
  const roast = await caller.roast.getById({ id });

  if (!roast) notFound();

  const filename = `paste${LANGUAGE_MAP[roast.language]?.extension ?? ".txt"}`;

  const diffLines = roast.suggestedFix?.diff
    .split("\n")
    .map((line) => ({
      type: line.startsWith("+")
        ? ("added" as const)
        : line.startsWith("-")
          ? ("removed" as const)
          : ("context" as const),
      code: line.slice(1),
    })) ?? [];

  return (
    <main className="max-w-[1440px] mx-auto px-20 py-10 flex flex-col gap-0">
      {/* Hero: score + quote */}
      <section className="flex items-start gap-14 py-10">
        <ScoreRing score={roast.score} />

        <div className="flex flex-col gap-3 pt-4">
          <SectionHeading prefix="//">{filename}</SectionHeading>

          <p className="text-text-primary text-xl leading-snug">
            {roast.roastQuote}
          </p>

          <p className="text-text-tertiary text-sm">
            from: <span className="text-text-secondary">anonymous</span>
            {" · "}
            {roast.lineCount} lines
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
          <CodeBlockHeader filename={filename} />
          <CodeBlockCode
            code={roast.code}
            lang={roast.language as BundledLanguage}
          />
        </CodeBlockRoot>
      </section>

      <hr className="border-border-primary" />

      {/* Detailed analysis */}
      <section className="flex flex-col gap-6 py-10">
        <SectionHeading>detailed_analysis</SectionHeading>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            {roast.analysisIssues.slice(0, 2).map((issue) => (
              <AnalysisCardRoot key={issue.title}>
                <Badge status={issue.severity} label={issue.severity} />
                <AnalysisCardTitle>{issue.title}</AnalysisCardTitle>
                <AnalysisCardDescription>{issue.description}</AnalysisCardDescription>
              </AnalysisCardRoot>
            ))}
          </div>
          {roast.analysisIssues.length > 2 && (
            <div className="grid grid-cols-2 gap-5">
              {roast.analysisIssues.slice(2).map((issue) => (
                <AnalysisCardRoot key={issue.title}>
                  <Badge status={issue.severity} label={issue.severity} />
                  <AnalysisCardTitle>{issue.title}</AnalysisCardTitle>
                  <AnalysisCardDescription>{issue.description}</AnalysisCardDescription>
                </AnalysisCardRoot>
              ))}
            </div>
          )}
        </div>
      </section>

      {roast.suggestedFix && (
        <>
          <hr className="border-border-primary" />

          {/* Suggested fix */}
          <section className="flex flex-col gap-6 py-10">
            <SectionHeading>suggested_fix</SectionHeading>

            <CodeBlockRoot>
              <CodeBlockHeader filename={filename} />
              {diffLines.map((line, i) => (
                <DiffLine key={i} type={line.type} code={line.code} />
              ))}
            </CodeBlockRoot>
          </section>
        </>
      )}
    </main>
  );
}

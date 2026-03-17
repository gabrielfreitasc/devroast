import { twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { DiffLine } from "@/components/ui/diff-line";
import { CodeBlockRoot, CodeBlockHeader, CodeBlockCode } from "@/components/ui/code-block";
import { AnalysisCardRoot, AnalysisCardTitle, AnalysisCardDescription } from "@/components/analysis-card";
import { ScoreRing } from "@/components/score-ring";
import {
  LeaderboardRowRoot,
  LeaderboardRowRank,
  LeaderboardRowScore,
  LeaderboardRowCode,
  LeaderboardRowLanguage,
} from "@/components/leaderboard-row";
import { TogglePreview } from "./toggle-preview";

const sampleCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="border-b border-border-primary pb-3">
        <SectionHeading>{title}</SectionHeading>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-text-tertiary text-xs">{label}</span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-bg-page">

      <main className="px-20 py-16 flex flex-col gap-16 max-w-[1440px] mx-auto">

        <div className="flex flex-col gap-2">
          <SectionHeading size="xl">component_library</SectionHeading>
          <p className="text-text-secondary text-base font-serif">
            visual reference de todos os componentes de UI e suas variantes.
          </p>
        </div>

        {/* BUTTON */}
        <Section title="button">
          <Row label="variant">
            <Button variant="primary">$ roast_my_code</Button>
            <Button variant="secondary">$ share_roast</Button>
            <Button variant="link">$ view_all &gt;&gt;</Button>
            <Button variant="ghost">$ ghost</Button>
            <Button variant="destructive">$ delete</Button>
          </Row>
          <Row label="size">
            <Button size="sm">$ small</Button>
            <Button size="md">$ medium</Button>
            <Button size="lg">$ large</Button>
          </Row>
          <Row label="disabled">
            <Button variant="primary" disabled>$ primary</Button>
            <Button variant="secondary" disabled>$ secondary</Button>
            <Button variant="destructive" disabled>$ destructive</Button>
          </Row>
        </Section>

        {/* SECTION HEADING */}
        <Section title="section_heading">
          <Row label="sizes">
            <div className="flex flex-col gap-4">
              <SectionHeading size="sm">small (default)</SectionHeading>
              <SectionHeading size="md">medium</SectionHeading>
              <SectionHeading size="lg">large</SectionHeading>
              <SectionHeading size="xl">extra_large</SectionHeading>
            </div>
          </Row>
        </Section>

        {/* BADGE */}
        <Section title="badge_status">
          <Row label="variants">
            <Badge status="critical" label="critical" />
            <Badge status="warning" label="warning" />
            <Badge status="good" label="good" />
          </Row>
          <Row label="size md">
            <Badge status="critical" size="md" label="needs_serious_help" />
            <Badge status="warning" size="md" label="could_be_worse" />
            <Badge status="good" size="md" label="surprisingly_decent" />
          </Row>
        </Section>

        {/* TOGGLE */}
        <Section title="toggle">
          <TogglePreview />
        </Section>

        {/* ANALYSIS CARD */}
        <Section title="analysis_card">
          <Row label="variants">
            <div className="flex flex-wrap gap-4">
              <AnalysisCardRoot className="w-full max-w-md">
                <Badge status="critical" label="critical" />
                <AnalysisCardTitle>using var instead of const/let</AnalysisCardTitle>
                <AnalysisCardDescription>
                  the var keyword is function-scoped rather than block-scoped, which can lead to unexpected behavior and bugs.
                </AnalysisCardDescription>
              </AnalysisCardRoot>
              <AnalysisCardRoot className="w-full max-w-md">
                <Badge status="warning" label="warning" />
                <AnalysisCardTitle>missing error handling in async function</AnalysisCardTitle>
                <AnalysisCardDescription>
                  the async function lacks try-catch blocks. if the promise rejects, the error will be unhandled.
                </AnalysisCardDescription>
              </AnalysisCardRoot>
              <AnalysisCardRoot className="w-full max-w-md">
                <Badge status="good" label="good" />
                <AnalysisCardTitle>clean function naming</AnalysisCardTitle>
                <AnalysisCardDescription>
                  function names clearly describe their purpose, making the code self-documenting.
                </AnalysisCardDescription>
              </AnalysisCardRoot>
            </div>
          </Row>
        </Section>

        {/* DIFF LINE */}
        <Section title="diff_line">
          <Row label="types">
            <div className="flex flex-col w-full max-w-xl rounded-lg overflow-hidden border border-border-primary">
              <DiffLine type="removed" code="var total = 0;" />
              <DiffLine type="added" code="const total = 0;" />
              <DiffLine type="context" code="for (let i = 0; i < items.length; i++) {" />
              <DiffLine type="added" code="  total += items[i].price;" />
              <DiffLine type="context" code="}" />
            </div>
          </Row>
        </Section>

        {/* CODE BLOCK */}
        <Section title="code_block">
          <Row label="shiki + vesper theme (server rendered)">
            <CodeBlockRoot className="w-full max-w-xl">
              <CodeBlockHeader filename="calculate.js" />
              <CodeBlockCode code={sampleCode} lang="javascript" />
            </CodeBlockRoot>
          </Row>
        </Section>

        {/* SCORE RING */}
        <Section title="score_ring">
          <Row label="scores">
            <ScoreRing score={3.5} />
            <ScoreRing score={5.8} />
            <ScoreRing score={8.4} />
          </Row>
        </Section>

        {/* LEADERBOARD ROW */}
        <Section title="leaderboard_row">
          <Row label="sample rows">
            <div className="flex flex-col w-full max-w-2xl rounded-lg overflow-hidden border border-border-primary">
              <LeaderboardRowRoot>
                <LeaderboardRowRank>#1</LeaderboardRowRank>
                <LeaderboardRowScore score={2.1} />
                <LeaderboardRowCode>function calculateTotal(items) {"{ var total = 0; ..."}</LeaderboardRowCode>
                <LeaderboardRowLanguage>javascript</LeaderboardRowLanguage>
              </LeaderboardRowRoot>
              <LeaderboardRowRoot>
                <LeaderboardRowRank>#2</LeaderboardRowRank>
                <LeaderboardRowScore score={3.8} />
                <LeaderboardRowCode>def sort_list(lst): for i in range(len(lst)): ...</LeaderboardRowCode>
                <LeaderboardRowLanguage>python</LeaderboardRowLanguage>
              </LeaderboardRowRoot>
              <LeaderboardRowRoot>
                <LeaderboardRowRank>#3</LeaderboardRowRank>
                <LeaderboardRowScore score={7.5} />
                <LeaderboardRowCode>fn main() {"{ let mut v = Vec::new(); v.push(42); ..."}</LeaderboardRowCode>
                <LeaderboardRowLanguage>rust</LeaderboardRowLanguage>
              </LeaderboardRowRoot>
            </div>
          </Row>
        </Section>

        {/* COLORS */}
        <Section title="color_tokens">
          <Row label="accents">
            {[
              ["accent-green", "#10B981", "bg-accent-green"],
              ["accent-red", "#EF4444", "bg-accent-red"],
              ["accent-amber", "#F59E0B", "bg-accent-amber"],
              ["accent-cyan", "#06B6D4", "bg-accent-cyan"],
            ].map(([name, hex, cls]) => (
              <div key={name} className="flex flex-col gap-1.5 items-center">
                <div className={twMerge("w-12 h-12 rounded-md", cls)} />
                <span className="text-text-tertiary text-[11px]">{name}</span>
                <span className="text-text-tertiary text-[11px]">{hex}</span>
              </div>
            ))}
          </Row>
          <Row label="syntax">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-syn-function">function</span>
              <span className="text-syn-keyword">const</span>
              <span className="text-syn-string">&quot;string&quot;</span>
              <span className="text-syn-number">42</span>
              <span className="text-syn-operator">=</span>
              <span className="text-syn-type">Promise</span>
              <span className="text-syn-variable">myVar</span>
            </div>
          </Row>
        </Section>

      </main>
    </div>
  );
}

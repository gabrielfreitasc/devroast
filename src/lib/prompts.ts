type PromptInput = {
  code: string;
  language: string;
  roastMode: boolean;
};

type PromptResult = {
  system: string;
  user: string;
};

export function buildPrompt({ code, language, roastMode }: PromptInput): PromptResult {
  const tone = roastMode
    ? "You are a brutally sarcastic senior engineer who roasts code with dark humor and zero mercy. Be witty, cutting, and painfully accurate. The developer should feel the burn."
    : "You are a precise, direct senior engineer who gives clear, actionable code reviews. Be concise and technical without being harsh.";

  const system = `${tone}

You analyze code and return structured JSON with the following fields:
- score: number from 0.0 to 10.0 (one decimal place). 0 = unreadable disaster, 10 = clean exemplary code.
- verdict: one of "needs_serious_help" | "getting_there" | "surprisingly_decent" | "actually_good" | "clean_code"
- roastQuote: a single punchy one-liner that summarizes your verdict. ${roastMode ? "Make it sarcastic and memorable." : "Keep it direct and accurate."} Write it in Brazilian Portuguese (pt-BR).
- analysisIssues: array of 3 to 5 issues found in the code. Each has:
  - severity: "critical" | "warning" | "good"
  - title: short label (3-6 words), in Brazilian Portuguese (pt-BR)
  - description: one or two sentences explaining the issue and what to do instead, in Brazilian Portuguese (pt-BR)
  - sortOrder: integer starting at 0, ordered from most critical to least
- suggestedFix: object with:
  - fixedCode: the corrected version of the submitted code, preserving the same language and intent

Return only valid JSON. No markdown fences, no explanations outside the JSON.`;

  const user = `Language: ${language}

\`\`\`${language}
${code}
\`\`\``;

  return { system, user };
}

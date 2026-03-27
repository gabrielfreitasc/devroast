export type LanguageMeta = {
  shikiId: string;
  hljsId: string;
  label: string;
  extension: string;
};

export const LANGUAGE_META: LanguageMeta[] = [
  { shikiId: "javascript", hljsId: "javascript", label: "JavaScript", extension: ".js" },
  { shikiId: "typescript", hljsId: "typescript", label: "TypeScript", extension: ".ts" },
  { shikiId: "jsx", hljsId: "javascript", label: "JSX", extension: ".jsx" },
  { shikiId: "tsx", hljsId: "typescript", label: "TSX", extension: ".tsx" },
  { shikiId: "html", hljsId: "xml", label: "HTML", extension: ".html" },
  { shikiId: "css", hljsId: "css", label: "CSS", extension: ".css" },
  { shikiId: "python", hljsId: "python", label: "Python", extension: ".py" },
  { shikiId: "java", hljsId: "java", label: "Java", extension: ".java" },
  { shikiId: "csharp", hljsId: "csharp", label: "C#", extension: ".cs" },
  { shikiId: "php", hljsId: "php", label: "PHP", extension: ".php" },
  { shikiId: "ruby", hljsId: "ruby", label: "Ruby", extension: ".rb" },
  { shikiId: "go", hljsId: "go", label: "Go", extension: ".go" },
  { shikiId: "rust", hljsId: "rust", label: "Rust", extension: ".rs" },
  { shikiId: "kotlin", hljsId: "kotlin", label: "Kotlin", extension: ".kt" },
  { shikiId: "swift", hljsId: "swift", label: "Swift", extension: ".swift" },
  { shikiId: "sql", hljsId: "sql", label: "SQL", extension: ".sql" },
  { shikiId: "bash", hljsId: "bash", label: "Bash", extension: ".sh" },
  { shikiId: "json", hljsId: "json", label: "JSON", extension: ".json" },
  { shikiId: "yaml", hljsId: "yaml", label: "YAML", extension: ".yaml" },
];

export const LANGUAGE_MAP: Record<string, LanguageMeta> = Object.fromEntries(
  LANGUAGE_META.map((l) => [l.shikiId, l]),
);

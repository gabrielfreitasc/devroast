import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import kotlin from "highlight.js/lib/languages/kotlin";
import swift from "highlight.js/lib/languages/swift";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);

// All hljs IDs we detect against (no duplicates)
const HLJS_IDS = [
  "javascript",
  "typescript",
  "xml",
  "css",
  "python",
  "java",
  "csharp",
  "php",
  "ruby",
  "go",
  "rust",
  "kotlin",
  "swift",
  "sql",
  "bash",
  "json",
  "yaml",
];

// Map hljs IDs back to Shiki IDs
// jsx/tsx are intentionally excluded from auto-detection (user must select manually)
const HLJS_TO_SHIKI: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  xml: "html",
  css: "css",
  python: "python",
  java: "java",
  csharp: "csharp",
  php: "php",
  ruby: "ruby",
  go: "go",
  rust: "rust",
  kotlin: "kotlin",
  swift: "swift",
  sql: "sql",
  bash: "bash",
  json: "json",
  yaml: "yaml",
};

export function detectLanguage(code: string): { lang: string; confidence: number } {
  const result = hljs.highlightAuto(code, HLJS_IDS);
  const hljsId = result.language ?? "javascript";
  const shikiId = HLJS_TO_SHIKI[hljsId] ?? "javascript";
  return { lang: shikiId, confidence: result.relevance ?? 0 };
}

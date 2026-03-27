import { pgEnum } from "drizzle-orm/pg-core";

export const languageEnum = pgEnum("language", [
  "javascript",
  "typescript",
  "python",
  "go",
  "rust",
  "java",
  "cpp",
  "c",
  "php",
  "ruby",
  "other",
]);

export const severityEnum = pgEnum("severity", ["critical", "warning", "good"]);

export const verdictEnum = pgEnum("verdict", [
  "needs_serious_help",
  "getting_there",
  "surprisingly_decent",
  "actually_good",
  "clean_code",
]);

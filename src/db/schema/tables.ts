import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { languageEnum, severityEnum, verdictEnum } from "./enums";

export const roasts = pgTable(
  "roasts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    language: languageEnum("language").notNull().default("other"),
    lineCount: integer("line_count").notNull().default(0),
    roastMode: boolean("roast_mode").notNull().default(false),
    score: numeric("score", { precision: 3, scale: 1 }).notNull(),
    verdict: verdictEnum("verdict").notNull(),
    roastQuote: text("roast_quote").notNull(),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_roasts_score").on(table.score),
    index("idx_roasts_submitted_at").on(table.submittedAt),
  ],
);

export const analysisIssues = pgTable("analysis_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  roastId: uuid("roast_id")
    .notNull()
    .references(() => roasts.id, { onDelete: "cascade" }),
  severity: severityEnum("severity").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const suggestedFixes = pgTable("suggested_fixes", {
  id: uuid("id").primaryKey().defaultRandom(),
  roastId: uuid("roast_id")
    .notNull()
    .unique()
    .references(() => roasts.id, { onDelete: "cascade" }),
  originalCode: text("original_code").notNull(),
  fixedCode: text("fixed_code").notNull(),
  diff: text("diff").notNull(),
  fileName: varchar("file_name", { length: 100 }).default("snippet"),
});

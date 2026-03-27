import { faker } from "@faker-js/faker";
import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "dotenv";
import { Pool } from "pg";
import { analysisIssues, roasts, suggestedFixes } from "./schema";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ── helpers ──────────────────────────────────────────────────────────────────

type Language = typeof roasts.$inferInsert["language"];
type Severity = typeof analysisIssues.$inferInsert["severity"];
type Verdict = typeof roasts.$inferInsert["verdict"];

const LANGUAGES: Language[] = [
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
];

const CODE_SAMPLES: Record<string, string> = {
  javascript: `function getData(url) {
  var result;
  $.ajax({ url: url, async: false, success: function(data) { result = data; } });
  return result;
}

var user = eval(localStorage.getItem('user'));
if (user.admin == true) {
  deleteAllUsers();
}`,

  typescript: `export async function fetchUser(id: any) {
  const res = await fetch('/api/user/' + id)
  const data = await res.json()
  // TODO: handle errors someday
  return data as any
}

// @ts-ignore
const secret: string = process.env.SECRET`,

  python: `import pickle
import os

def load_user(data):
    return pickle.loads(data)

def run_command(cmd):
    os.system(cmd)

password = "admin123"
DB_URL = "postgres://root:password@localhost/prod"`,

  go: `func getUser(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	query := "SELECT * FROM users WHERE id = " + id
	rows, err := db.Query(query)
	if err != nil {
		panic(err)
	}
	defer rows.Close()
}`,

  java: `public class Calculator {
    public static void main(String[] args) {
        int a = Integer.parseInt(args[0]);
        int b = Integer.parseInt(args[1]);
        System.out.println("Result: " + a / b);
    }

    public static int add(int a, int b) {
        // TODO: implement later
        return 0;
    }
}`,

  php: `<?php
$id = $_GET['id'];
$query = "SELECT * FROM users WHERE id = $id";
$result = mysqli_query($conn, $query);

$pass = md5($_POST['password']);
if ($pass == $stored_hash) {
    $_SESSION['admin'] = true;
}
?>`,

  ruby: `def authenticate(user, pass)
  if pass == "secret123"
    return true
  end
  User.find_by_sql("SELECT * FROM users WHERE name='#{user}'")
end

$global_state = []`,

  rust: `use std::collections::HashMap;

fn main() {
    let mut map: HashMap<String, String> = HashMap::new();
    let key = String::from("name");
    map.insert(key.clone(), String::from("Alice"));
    // clone everywhere because "the borrow checker is wrong"
    println!("{}", map.get(&key.clone()).unwrap().clone());
}`,

  cpp: `#include <iostream>
#include <string.h>

void copyInput(char* buf) {
    char input[64];
    gets(input);
    strcpy(buf, input);
}

int main() {
    char buffer[64];
    copyInput(buffer);
    printf(buffer);
}`,

  other: `SELECT * FROM users
WHERE username = '\${username}'
AND password = '\${password}';

-- prod backup script
DROP TABLE IF EXISTS users_backup;
SELECT * INTO users_backup FROM users;
DELETE FROM users WHERE created_at < '2020-01-01';`,
};

const ROAST_QUOTES = [
  "this code looks like it was written during a power outage... in 2005.",
  "i've seen better architecture in a sand castle.",
  "congratulations, you've reinvented the bug.",
  "this is less 'code' and more 'a cry for help'.",
  "somewhere, a computer is weeping.",
  "i'd call this spaghetti code, but spaghetti is at least edible.",
  "your future self will hate you for this. deeply.",
  "this function does 47 things. functions should do 1.",
  "global variables: the developer's way of saying 'i give up'.",
  "i see you've discovered the `// TODO: fix later` infinite loop.",
  "copy-pasted so many times this code has identity issues.",
  "there are 3 bugs per line. that's impressive, actually.",
  "this will work great until it doesn't, which is immediately.",
  "sql injection? in this economy? bold choice.",
  "eval() in production is a war crime in some jurisdictions.",
  "storing passwords in plaintext is very retro of you.",
  "i can smell the `undefined is not a function` from here.",
  "this code is like a time capsule from a darker era.",
  "the cyclomatic complexity alone filed a restraining order.",
  "you've managed to make 3 lines do the work of 300. badly.",
];

const ISSUE_TITLES: Record<Severity, string[]> = {
  critical: [
    "SQL injection vulnerability",
    "Synchronous blocking call on main thread",
    "Hardcoded credentials in source code",
    "Use of eval() with user input",
    "Buffer overflow via gets()",
    "Insecure deserialization with pickle",
    "Division by zero — no guard",
    "Unchecked array index access",
    "MD5 used for password hashing",
    "Command injection via os.system()",
  ],
  warning: [
    "Magic numbers without explanation",
    "Dead code left in production",
    "TODO comment blocking a feature",
    "Excessive use of any type",
    "Panic on unhandled error",
    "Global mutable state",
    "Function exceeds 50 lines",
    "Missing null/undefined check",
    "Inconsistent error handling",
    "Deeply nested conditionals",
  ],
  good: [
    "Meaningful variable names",
    "Function does one thing well",
    "Early return pattern applied correctly",
    "Consistent code formatting",
    "Proper use of const/let",
    "Sensible default parameter values",
    "Clear separation of concerns here",
    "Good use of built-in array methods",
  ],
};

const ISSUE_DESCRIPTIONS: Record<Severity, string[]> = {
  critical: [
    "User input is concatenated directly into the query string. Any script kiddie with a browser can drop your tables.",
    "Calling a network request synchronously blocks the entire thread. Your UI is frozen every time this runs.",
    "Credentials are committed to source control. Rotate these immediately and pretend this never happened.",
    "eval() on user-controlled data is essentially handing them your server. This is not a metaphor.",
    "gets() does not check buffer bounds. This is a textbook buffer overflow waiting to be exploited.",
    "pickle.loads() on untrusted data allows arbitrary code execution. An attacker could own your server.",
    "No validation that the divisor is non-zero. One edge case and this crashes in production.",
    "Array is accessed by index without checking length. Off-by-one errors will cause a panic.",
    "MD5 is not a password hashing algorithm. Use bcrypt, argon2, or scrypt.",
    "os.system() with unsanitized input allows shell injection. Never do this.",
  ],
  warning: [
    "The value 42 appears 7 times with no explanation. Extract it as a named constant.",
    "This block is unreachable. Remove it or it will confuse everyone including you in 3 months.",
    "This TODO has been here for 2 years. At this point it's a feature, not a task.",
    "`any` defeats the entire purpose of TypeScript. Specify a proper type or at minimum `unknown`.",
    "Panicking on errors is appropriate in main(), not in library code called by other services.",
    "Global mutable state makes this untestable and creates race conditions in concurrent contexts.",
    "This function is doing at least 6 different things. Break it up.",
    "This can produce a null pointer dereference. Add a guard before accessing this property.",
    "Some errors are silently swallowed, others panic. Pick a strategy and stick with it.",
    "5 levels of nesting. Invert conditions and return early to flatten this.",
  ],
  good: [
    "Variable names clearly describe their purpose. Future readers will thank you.",
    "Single responsibility applied correctly here. This function is easy to test and reason about.",
    "Returning early on invalid input keeps the happy path clean and readable.",
    "Consistent formatting throughout this section makes the logic easy to follow.",
    "Correct use of const prevents accidental reassignment.",
    "Default values prevent undefined errors at the call site without extra validation.",
    "Business logic and data access are clearly separated here.",
    "Using map/filter/reduce instead of imperative loops keeps this concise and readable.",
  ],
};

function scoreToVerdict(score: number): Verdict {
  if (score <= 3) return "needs_serious_help";
  if (score <= 5) return "getting_there";
  if (score <= 7) return "surprisingly_decent";
  if (score <= 9) return "actually_good";
  return "clean_code";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateDiff(original: string, fixed: string): string {
  const originalLines = original.split("\n");
  const fixedLines = fixed.split("\n");
  const diff: string[] = ["--- original", "+++ fixed", "@@ -1 +1 @@"];

  for (const line of originalLines) {
    diff.push(`-${line}`);
  }
  for (const line of fixedLines) {
    diff.push(`+${line}`);
  }

  return diff.join("\n");
}

// ── seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await db.delete(suggestedFixes);
  await db.delete(analysisIssues);
  await db.delete(roasts);
  console.log("🗑️  Cleared existing data");

  const TOTAL = 100;
  const roastIds: string[] = [];

  // ── insert roasts in batches of 25 ────────────────────────────────────────
  for (let i = 0; i < TOTAL; i += 25) {
    const batch = Array.from({ length: Math.min(25, TOTAL - i) }, () => {
      const language = pickRandom(LANGUAGES);
      const score = (faker.number.float({ min: 1, max: 10, fractionDigits: 1 })).toFixed(1);

      return {
        code: CODE_SAMPLES[language as string] ?? CODE_SAMPLES.other,
        language,
        lineCount: faker.number.int({ min: 4, max: 80 }),
        roastMode: faker.datatype.boolean({ probability: 0.3 }),
        score,
        verdict: scoreToVerdict(parseFloat(score)),
        roastQuote: pickRandom(ROAST_QUOTES),
        submittedAt: faker.date.between({
          from: new Date("2025-01-01"),
          to: new Date(),
        }),
      };
    });

    const inserted = await db.insert(roasts).values(batch).returning({ id: roasts.id });
    roastIds.push(...inserted.map((r) => r.id));
  }

  console.log(`✅ Inserted ${roastIds.length} roasts`);

  // ── insert analysis issues ─────────────────────────────────────────────────
  const allIssues: (typeof analysisIssues.$inferInsert)[] = [];

  for (const roastId of roastIds) {
    const numCritical = faker.number.int({ min: 1, max: 3 });
    const numWarning = faker.number.int({ min: 1, max: 3 });
    const numGood = faker.number.int({ min: 0, max: 2 });

    let order = 0;

    for (const title of pickRandomN(ISSUE_TITLES.critical, numCritical)) {
      allIssues.push({
        roastId,
        severity: "critical",
        title,
        description: pickRandom(ISSUE_DESCRIPTIONS.critical),
        sortOrder: order++,
      });
    }

    for (const title of pickRandomN(ISSUE_TITLES.warning, numWarning)) {
      allIssues.push({
        roastId,
        severity: "warning",
        title,
        description: pickRandom(ISSUE_DESCRIPTIONS.warning),
        sortOrder: order++,
      });
    }

    for (const title of pickRandomN(ISSUE_TITLES.good, numGood)) {
      allIssues.push({
        roastId,
        severity: "good",
        title,
        description: pickRandom(ISSUE_DESCRIPTIONS.good),
        sortOrder: order++,
      });
    }
  }

  // insert issues in batches of 50
  for (let i = 0; i < allIssues.length; i += 50) {
    await db.insert(analysisIssues).values(allIssues.slice(i, i + 50));
  }

  console.log(`✅ Inserted ${allIssues.length} analysis issues`);

  // ── insert suggested fixes (80% of roasts) ────────────────────────────────
  const fixBatch: (typeof suggestedFixes.$inferInsert)[] = [];

  for (const roastId of roastIds) {
    if (Math.random() > 0.8) continue;

    const language = pickRandom(LANGUAGES);
    const originalCode = CODE_SAMPLES[language as string] ?? CODE_SAMPLES.other;
    const fixedCode = `// Fixed version\n${originalCode
      .replace(/eval\([^)]+\)/g, "JSON.parse(sanitizedInput)")
      .replace(/gets\([^)]*\)/g, "fgets(input, sizeof(input), stdin)")
      .replace(/os\.system\([^)]+\)/g, "subprocess.run(shlex.split(cmd), check=True)")
      .replace(/pickle\.loads\([^)]+\)/g, "json.loads(data)")
      .replace(/md5/g, "bcrypt.hash")
    }`;

    fixBatch.push({
      roastId,
      originalCode,
      fixedCode,
      diff: generateDiff(originalCode, fixedCode),
      fileName: `snippet.${language === "cpp" ? "cpp" : language === "typescript" ? "ts" : language === "javascript" ? "js" : language}`,
    });
  }

  for (let i = 0; i < fixBatch.length; i += 25) {
    await db.insert(suggestedFixes).values(fixBatch.slice(i, i + 25));
  }

  console.log(`✅ Inserted ${fixBatch.length} suggested fixes`);
  console.log("🎉 Seed complete!");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => pool.end());

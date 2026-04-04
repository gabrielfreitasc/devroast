/**
 * Generates a unified-style line diff between two code strings.
 * Each output line is prefixed with:
 *   "+" for lines added in fixedCode
 *   "-" for lines removed from original
 *   " " (space) for unchanged context lines
 */
export function generateDiff(original: string, fixedCode: string): string {
  const originalLines = original.split("\n");
  const fixedLines = fixedCode.split("\n");
  const m = originalLines.length;
  const n = fixedLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalLines[i - 1] === fixedLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff lines
  const result: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1] === fixedLines[j - 1]) {
      result.unshift(` ${originalLines[i - 1]}`);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift(`+${fixedLines[j - 1]}`);
      j--;
    } else {
      result.unshift(`-${originalLines[i - 1]}`);
      i--;
    }
  }

  return result.join("\n");
}

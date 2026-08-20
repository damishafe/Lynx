import { execFileSync } from "node:child_process";

function git(args: string[], cwd: string): string[] {
  return execFileSync("git", args, { cwd, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function gitRoot(cwd: string): string {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" }).trim();
}

/**
 * Everything that differs from HEAD: unstaged, staged and untracked (respecting
 * .gitignore). Paths are repo-root-relative, sorted, de-duplicated.
 */
export function getChangedFiles(cwd: string): string[] {
  const root = gitRoot(cwd);
  const files = new Set<string>([
    ...git(["diff", "--name-only", "HEAD"], root),
    ...git(["diff", "--name-only", "--cached"], root),
    ...git(["ls-files", "--others", "--exclude-standard"], root),
  ]);
  return [...files].sort();
}

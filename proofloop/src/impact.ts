import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FlowDef = { title?: string; tests: string[]; paths: string[] };
export type FlowMap = {
  flows: Record<string, FlowDef>;
  shared?: string[];
  fallback?: string[];
  ignore?: string[];
};

export type Impact = {
  /** Flows to run, in map order. */
  flows: string[];
  /** Changed, verifiable files that matched no flow. Never silently dropped. */
  unmapped: string[];
  /** flow → the changed files that selected it. */
  matched: Record<string, string[]>;
  /** Changed files that were eligible for mapping. */
  considered: string[];
  /** Changed files skipped (outside frontend/, docs, tests, env, ignore list). */
  ignored: string[];
};

const ALWAYS_IGNORE = [
  "**/*.md",
  "**/*.test.ts",
  "frontend/public/**",
  "frontend/.env*",
  "frontend/.gitignore",
  "frontend/*.json",
  "frontend/*.mjs",
  "frontend/next.config.ts",
  "**/.DS_Store",
];

/** Minimal glob → RegExp: `**` spans directories, `*` stays within one, `?` is one char. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else {
        re += "[^/]*";
      }
    } else if (ch === "?") {
      re += "[^/]";
    } else if ("\\^$+.()|{}[]".includes(ch)) {
      re += `\\${ch}`;
    } else {
      re += ch;
    }
  }
  return new RegExp(`^${re}$`);
}

export function matchesAny(path: string, globs: string[]): boolean {
  return globs.some((g) => globToRegExp(g).test(path));
}

export function computeImpact(changed: string[], map: FlowMap): Impact {
  const ignoreGlobs = [...ALWAYS_IGNORE, ...(map.ignore ?? [])];
  const considered: string[] = [];
  const ignored: string[] = [];
  for (const file of changed) {
    if (!file.startsWith("frontend/") || matchesAny(file, ignoreGlobs)) ignored.push(file);
    else considered.push(file);
  }

  const flowNames = Object.keys(map.flows);
  const selected = new Set<string>();
  const matched: Record<string, string[]> = {};
  const unmapped: string[] = [];

  const select = (flow: string, file: string) => {
    selected.add(flow);
    (matched[flow] ??= []).push(file);
  };

  for (const file of considered) {
    let hit = false;
    if (matchesAny(file, map.shared ?? [])) {
      for (const flow of flowNames) select(flow, file);
      hit = true;
    } else {
      for (const flow of flowNames) {
        if (matchesAny(file, map.flows[flow].paths)) {
          select(flow, file);
          hit = true;
        }
      }
    }
    if (!hit) unmapped.push(file);
  }

  if (unmapped.length > 0) {
    for (const flow of map.fallback ?? []) if (map.flows[flow]) selected.add(flow);
  }

  return {
    flows: flowNames.filter((f) => selected.has(f)),
    unmapped,
    matched,
    considered,
    ignored,
  };
}

export function loadFlowMap(root: string): FlowMap {
  const raw = readFileSync(join(root, "proofloop", "proofloop.map.json"), "utf8");
  return JSON.parse(raw) as FlowMap;
}

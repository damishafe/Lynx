import { existsSync, readFileSync } from "node:fs";
import { join, normalize, resolve, sep } from "node:path";

import { proofloopDir } from "@/lib/proofloop";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const base = resolve(proofloopDir(), "evidence");
  const target = resolve(base, normalize(join(...path)));
  if (!target.startsWith(base + sep) || !existsSync(target)) {
    return new Response("Not found", { status: 404 });
  }
  const isPng = target.endsWith(".png");
  return new Response(readFileSync(target), {
    headers: {
      "Content-Type": isPng ? "image/png" : "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}

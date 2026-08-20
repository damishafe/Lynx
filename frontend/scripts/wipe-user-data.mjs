// One-off: wipe all owned data for a single user, leaving the user doc
// (and auth) intact. Run with:
//   node scripts/wipe-user-data.mjs <email>
//
// Reads MONGODB_URI / MONGODB_DB from .env.local. Touches these collections:
//   units, vendors, work_orders, payouts, activity_events
// Does NOT touch:
//   users  (preserves login + subscription + verification state)

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv(file) {
  try {
    const raw = readFileSync(resolve(ROOT, file), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+[A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, k, vRaw] = m;
      let v = vRaw.trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // env file missing — fall through to whatever the shell exported
  }
}
loadEnv(".env.local");
loadEnv(".env");

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/wipe-user-data.mjs <email>");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "lynx";
if (!uri) {
  console.error("MONGODB_URI is not set. Add it to .env.local first.");
  process.exit(1);
}

const COLLECTIONS = [
  "units",
  "vendors",
  "work_orders",
  "payouts",
  "activity_events",
];

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);

  const user = await db.collection("users").findOne({ email });
  if (!user) {
    console.error(`No user found for ${email} in db "${dbName}".`);
    process.exit(2);
  }

  console.log(`User ${email} found. _id=${user._id.toString()}`);
  console.log(`Wiping owned data — keeping the user doc + auth.\n`);

  let total = 0;
  for (const name of COLLECTIONS) {
    const result = await db
      .collection(name)
      .deleteMany({ ownerId: user._id });
    console.log(`  ${name.padEnd(18)}  ${result.deletedCount} deleted`);
    total += result.deletedCount;
  }

  console.log(`\nDone. ${total} owned documents removed.`);
  console.log(
    `User ${email} can still log in; their dashboard will be empty.`,
  );
} finally {
  await client.close();
}

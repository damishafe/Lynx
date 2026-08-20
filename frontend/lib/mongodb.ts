import { MongoClient, type Db } from "mongodb";

// Reuse a single MongoClient across HMR reloads in dev to avoid connection storms.
declare global {
  var _lynxMongoClientPromise: Promise<MongoClient> | undefined;
}

let cached: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example).",
    );
  }
  if (process.env.NODE_ENV === "development") {
    if (!global._lynxMongoClientPromise) {
      global._lynxMongoClientPromise = new MongoClient(uri).connect();
    }
    return global._lynxMongoClientPromise;
  }
  if (!cached) cached = new MongoClient(uri).connect();
  return cached;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB ?? "lynx";
  return client.db(dbName);
}

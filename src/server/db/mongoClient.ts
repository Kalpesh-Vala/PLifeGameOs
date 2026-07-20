import { MongoClient } from "mongodb";
import { env } from "@/env";

/**
 * Shared native MongoDB client promise for the Auth.js adapter.
 * Returns `null` when no connection string is configured so auth can fall back
 * to stateless JWT sessions during early local development.
 */
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> | null {
  if (!env.MONGODB_URI) return null;

  if (!global._mongoClientPromise) {
    const client = new MongoClient(env.MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}

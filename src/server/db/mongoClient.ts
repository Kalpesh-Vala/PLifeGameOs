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
    const promise = client.connect();
    // Attach a handler so a failed connection (e.g. DNS/network issue) never
    // surfaces as an unhandled rejection that crashes the dev server. The
    // original promise is still returned so the Auth.js adapter can await it.
    promise.catch((error) => {
      console.error("[db] MongoDB client connection failed:", error);
    });
    global._mongoClientPromise = promise;
  }

  return global._mongoClientPromise;
}

import mongoose from "mongoose";
import { env } from "@/env";
import { ensureSrvResolvable } from "@/server/db/dns-fallback";

/**
 * Cached Mongoose connection.
 *
 * In development, Next.js clears the module cache on every request which would
 * otherwise create a new connection on each hot reload. We cache the connection
 * promise on the global object to avoid exhausting the connection pool.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoose: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongoose ?? { conn: null, promise: null };
if (!global._mongoose) global._mongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env.local to use database features.",
    );
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = ensureSrvResolvable(env.MONGODB_URI).then(() =>
      mongoose.connect(env.MONGODB_URI!, {
        dbName: env.MONGODB_DB,
        bufferCommands: false,
      }),
    );
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

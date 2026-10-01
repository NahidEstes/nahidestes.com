import mongoose from "mongoose";

declare global { var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined; }

const cache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (cache.conn) return cache.conn;
  try {
    cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
    cache.conn = await cache.promise;
    return cache.conn;
  } catch {
    cache.conn = null;
    cache.promise = null;
    return null;
  }
}

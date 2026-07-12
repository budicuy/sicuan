import { Pool } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
// import { EnhancedQueryLogger } from "drizzle-query-logger";
import * as schema from "@/db/schema";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be specified");
}

// const isDev = process.env.NODE_ENV !== "production";

const client = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({
  client,
  schema,
  // logger: isDev ? new EnhancedQueryLogger() : false,
});

export type DB = typeof db;

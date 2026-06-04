import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be specified");
}

const client = neon(process.env.DATABASE_URL);
export const db = drizzle({ client, schema });
export type DB = typeof db;

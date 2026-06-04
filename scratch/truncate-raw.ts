import { sql } from "drizzle-orm";
import { db } from "@/db";

async function main() {
  console.log("Truncating raw_material table...");
  await db.execute(sql`TRUNCATE TABLE raw_material CASCADE;`);
  console.log("Truncation successful.");
}

main().catch(console.error);

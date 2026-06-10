import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./index";

async function main() {
  console.log("⏳ Running migrations over HTTP...");
  try {
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();

<<<<<<< HEAD
import { seeders } from "@/db/seeds";

async function main() {
  console.log("🚀 Starting database seeding...\n");

  try {
    for (const seeder of seeders) {
      await seeder();
    }
    console.log("\n🎉 All seeds completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
=======
import { seedDatabaseFromJson } from "@/db/seeds";

async function main() {
  console.log("🚀 Menjalankan Database Seeder dari JSON...\n");

  try {
    await seedDatabaseFromJson();
    console.log("\n🎉 Seeding database berhasil 100%!");
  } catch (error) {
    console.error("\n❌ Seeding database gagal:", error);
>>>>>>> backup-lokal-fa650a6
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();

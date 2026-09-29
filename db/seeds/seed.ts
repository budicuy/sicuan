import { seedDatabaseFromJson } from "@/db/seeds";

async function main() {
  console.log("🚀 Menjalankan Database Seeder dari JSON...\n");

  try {
    await seedDatabaseFromJson();
    console.log("\n🎉 Seeding database berhasil 100%!");
  } catch (error) {
    console.error("\n❌ Seeding database gagal:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();

import { seeders } from "./index";

async function main() {
  console.log("🚀 Starting database seeding...\n");

  try {
    for (const seeder of seeders) {
      await seeder();
    }
    console.log("\n🎉 All seeds completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();

import * as fs from "node:fs";

console.log("Generating database schema using local migrations folder...");

try {
  // Combine all SQL files in db/migrations into schema_dump.sql
  const migrationFolder = "./db/migrations";
  if (!fs.existsSync(migrationFolder)) {
    console.error("Migration folder not found.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationFolder)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("No SQL files found in migrations folder.");
  } else {
    let combinedSql = "-- Generated Schema Dump (Tables and Columns Only)\n\n";
    for (const file of files) {
      const content = fs.readFileSync(`${migrationFolder}/${file}`, "utf-8");
      combinedSql += `-- Migration File: ${file}\n${content}\n\n`;
    }

    fs.writeFileSync("schema_dump.sql", combinedSql);
    console.log("Success! Database schema exported to schema_dump.sql");
  }
} catch (error) {
  console.error("Error generating schema SQL:", error);
}

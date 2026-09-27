import * as fs from "node:fs";
import * as path from "node:path";
import { Pool } from "@neondatabase/serverless";

async function backupDatabase(connectionString: string, label: string) {
  console.log(`\n==================================================`);
  console.log(`[BACKUP] Memulai proses backup untuk: ${label}`);
  console.log(`==================================================`);

  const client = new Pool({ connectionString });

  try {
    // 1. Get all user tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames: string[] = tablesRes.rows.map(
      (r: { table_name: string }) => r.table_name,
    );
    console.log(`Ditemukan ${tableNames.length} tabel di schema 'public'.`);

    const backupData: Record<
      string,
      { count: number; rows: Record<string, unknown>[] }
    > = {};
    let totalRows = 0;

    for (const tableName of tableNames) {
      try {
        const countRes = await client.query(
          `SELECT COUNT(*) as count FROM "${tableName}"`,
        );
        const count = parseInt(countRes.rows[0]?.count || "0", 10);

        const rowsRes = await client.query(`SELECT * FROM "${tableName}"`);
        const rows = rowsRes.rows;

        backupData[tableName] = {
          count,
          rows,
        };
        totalRows += count;
        console.log(
          `  ✓ Tabel "${tableName}": ${count} baris data berhasil diambil.`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ Gagal membaca tabel "${tableName}":`, message);
      }
    }

    // 2. Ensure backup directory exists
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 3. Save JSON backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${label}-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), "utf-8");

    console.log(`\n[SUKSES] Backup selesai!`);
    console.log(`File: ${filepath}`);
    console.log(`Total tabel: ${tableNames.length}`);
    console.log(`Total baris data tersimpan: ${totalRows}`);

    return { success: true, filepath, totalRows, tableNames };
  } catch (error) {
    console.error(`[ERROR] Gagal melakukan backup untuk ${label}:`, error);
    throw error;
  } finally {
    await client.end();
  }
}

async function run() {
  const prodUrl =
    "postgresql://neondb_owner:npg_UgORpS7fJ6EB@ep-noisy-mountain-aojlc9k5-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const devUrl =
    "postgresql://neondb_owner:npg_UgORpS7fJ6EB@ep-still-haze-aosbeqea-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

  // Backup Production first (terpenting karena target yang akan dipush dan dijaga datanya)
  console.log("Memulai backup Database PRODUCTION...");
  await backupDatabase(prodUrl, "production");

  // Backup Development juga untuk redundansi
  console.log("\nMemulai backup Database DEVELOPMENT...");
  await backupDatabase(devUrl, "development");

  console.log("\nSemua database berhasil di-backup dengan aman!");
}

run().catch((err) => {
  console.error("Backup fatal error:", err);
  process.exit(1);
});

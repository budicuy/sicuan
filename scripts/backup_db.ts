import * as fs from "node:fs";
import * as path from "node:path";
import { Pool } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) {
    return "NULL";
  }
  if (typeof val === "boolean") {
    return val ? "TRUE" : "FALSE";
  }
  if (typeof val === "number") {
    return String(val);
  }
  if (val instanceof Date) {
    return `'${val.toISOString()}'`;
  }
  if (Array.isArray(val)) {
    // Format postgres text array literal: '{"a","b"}'
    const escapedItems = val.map((item) => {
      if (item === null || item === undefined) return "NULL";
      const s = String(item).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${s}"`;
    });
    return `'${`{${escapedItems.join(",")}}`}'`;
  }
  if (typeof val === "object") {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  // String escaping
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function runBackup() {
  console.log("📦 Memulai backup database ke file SQL...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup_${timestamp}.sql`;
    const backupDir = path.join(process.cwd(), "db", "backups");
    const backupFilePath = path.join(backupDir, backupFileName);

    let sqlOutput = `-- ========================================================\n`;
    sqlOutput += `-- SICUAN DATABASE BACKUP\n`;
    sqlOutput += `-- Created At: ${new Date().toISOString()}\n`;
    sqlOutput += `-- ========================================================\n\n`;
    sqlOutput += `SET statement_timeout = 0;\n`;
    sqlOutput += `SET lock_timeout = 0;\n`;
    sqlOutput += `SET client_encoding = 'UTF8';\n`;
    sqlOutput += `SET standard_conforming_strings = on;\n\n`;

    // 1. Ambil daftar tabel
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '__drizzle%'
      ORDER BY table_name;
    `);

    const tableNames: string[] = tablesRes.rows.map(
      (r: { table_name: string }) => r.table_name,
    );
    console.log(
      `Ditemukan ${tableNames.length} tabel untuk di-backup:`,
      tableNames.join(", "),
    );

    // 2. Dump data setiap tabel
    for (const table of tableNames) {
      console.log(`  -> Mem-backup tabel "${table}"...`);
      const dataRes = await client.query(`SELECT * FROM "${table}";`);

      sqlOutput += `-- --------------------------------------------------------\n`;
      sqlOutput += `-- Data for table: "${table}" (${dataRes.rows.length} rows)\n`;
      sqlOutput += `-- --------------------------------------------------------\n`;

      if (dataRes.rows.length === 0) {
        sqlOutput += `-- (table is empty)\n\n`;
        continue;
      }

      const columns = Object.keys(dataRes.rows[0]);
      const quotedCols = columns.map((c) => `"${c}"`).join(", ");

      sqlOutput += `INSERT INTO "${table}" (${quotedCols}) VALUES\n`;

      const valueRows: string[] = [];
      for (const row of dataRes.rows) {
        const rowVals = columns
          .map((col) => escapeSqlValue(row[col]))
          .join(", ");
        valueRows.push(`  (${rowVals})`);
      }

      sqlOutput += `${valueRows.join(",\n")};\n\n`;
    }

    // 3. Dump sequences current value
    const seqRes = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public';
    `);

    if (seqRes.rows.length > 0) {
      sqlOutput += `-- --------------------------------------------------------\n`;
      sqlOutput += `-- Sequences state\n`;
      sqlOutput += `-- --------------------------------------------------------\n`;

      for (const s of seqRes.rows) {
        const seqName = s.sequence_name;
        try {
          const valRes = await client.query(
            `SELECT last_value, is_called FROM "${seqName}";`,
          );
          if (valRes.rows.length > 0) {
            const { last_value, is_called } = valRes.rows[0];
            sqlOutput += `SELECT setval('"${seqName}"', ${last_value}, ${is_called});\n`;
          }
        } catch {
          // ignore if sequence cannot be read
        }
      }
      sqlOutput += `\n`;
    }

    fs.writeFileSync(backupFilePath, sqlOutput, "utf-8");
    const stats = fs.statSync(backupFilePath);
    console.log(`✅ Backup berhasil disimpan ke: ${backupFilePath}`);
    console.log(`Ukuran file: ${(stats.size / 1024).toFixed(2)} KB`);

    return backupFilePath;
  } finally {
    client.release();
    await pool.end();
  }
}

runBackup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Gagal melakukan backup database:", err);
    process.exit(1);
  });

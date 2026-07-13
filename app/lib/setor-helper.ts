import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Pemetaan role ke kode huruf pada nomor setoran.
 * Format nomor setor: {id}/{kode}/NDL/BJM/{dd}/{mm}/{yyyy}
 *
 * B = Bank Sampah
 * W = Warmindo
 * K = Konsumen
 */
export const ROLE_TO_CODE: Record<string, string> = {
  "bank-sampah": "B",
  warmindo: "W",
  konsumen: "K",
};

/**
 * Menghasilkan ID berikutnya berdasarkan MAX(id) dari tabel setor_sampah.
 * Lebih aman dari nextval karena tidak terpengaruh rollback/gap sequence.
 */
export async function getNextSetorId(): Promise<number> {
  const result = await db.execute<{ max: string | null }>(
    sql`SELECT MAX(id) as max FROM setor_sampah`,
  );
  const currentMax = result.rows[0]?.max;
  return currentMax ? Number.parseInt(currentMax, 10) + 1 : 1;
}

/**
 * Membuat nomor setoran berformat: {id}/{kode}/NDL/BJM/{dd}/{mm}/{yyyy}
 */
export function buildNomorSetor(
  id: number,
  role: string,
  tanggalSetor: string,
): string {
  const dateParts = tanggalSetor.split("-");
  const tahun = dateParts[0] || "2026";
  const bulan = dateParts[1] || "01";
  const tanggal = dateParts[2] || "01";
  const code = ROLE_TO_CODE[role] || "K";
  return `${id}/${code}/NDL/BJM/${tanggal}/${bulan}/${tahun}`;
}

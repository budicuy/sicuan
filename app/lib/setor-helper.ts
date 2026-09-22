import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Pemetaan role ke kode huruf pada nomor setoran.
 * Format nomor setor tampilan: {nomorUrut}/{kode}/NDL/BJM/{dd}/{mm}/{yyyy}
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
 * Menghasilkan nomor urut berikutnya berdasarkan MAX nomor urut di tabel setor_sampah.
 * Tidak mengambil dari ID primary key, melainkan nomor urut tertinggi + 1.
 */
export async function getNextNomorUrut(): Promise<number> {
  const result = await db.execute<{ nomor_setor: string }>(
    sql`SELECT nomor_setor FROM setor_sampah`,
  );
  let max = 0;
  for (const row of result.rows) {
    if (!row.nomor_setor) continue;
    const rawPrefix = row.nomor_setor.split("/")[0].trim();
    const num = Number.parseInt(rawPrefix, 10);
    if (!Number.isNaN(num) && num > max) {
      max = num;
    }
  }
  return max + 1;
}

/**
 * Alias getNextSetorId untuk backward compatibility.
 */
export const getNextSetorId = getNextNomorUrut;

/**
 * Memformat nomor setoran menjadi: {nomorUrut}/{kodeRole}/NDL/BJM/{dd}/{mm}/{yyyy}
 * Tanggal diambil dari tanggalSetor sehingga selalu sinkron saat tanggal diedit.
 */
export function formatNomorSetor(
  nomorSetor: string | number | null | undefined,
  roleOrKategori: string | null | undefined,
  tanggalSetor: string | Date | null | undefined,
): string {
  if (!nomorSetor) return "-";

  // Ambil hanya nomor urut jika masih mengandung format lama (misal "16/B/NDL/...")
  const rawStr = String(nomorSetor).trim();
  const cleanNomor = rawStr.includes("/")
    ? rawStr.split("/")[0].trim()
    : rawStr;

  let dd = "01";
  let mm = "01";
  let yyyy = "2026";

  if (typeof tanggalSetor === "string") {
    const parts = tanggalSetor.split("-");
    if (parts.length === 3) {
      yyyy = parts[0] || yyyy;
      mm = parts[1] ? parts[1].padStart(2, "0") : mm;
      dd = parts[2] ? parts[2].padStart(2, "0") : dd;
    }
  } else if (tanggalSetor instanceof Date) {
    dd = String(tanggalSetor.getDate()).padStart(2, "0");
    mm = String(tanggalSetor.getMonth() + 1).padStart(2, "0");
    yyyy = String(tanggalSetor.getFullYear());
  }

  const roleKey = roleOrKategori || "konsumen";
  const code = ROLE_TO_CODE[roleKey] || "K";

  return `${cleanNomor}/${code}/NDL/BJM/${dd}/${mm}/${yyyy}`;
}

/**
 * Membuat atau memformat nomor setoran lengkap.
 */
export function buildNomorSetor(
  nomorUrutOrId: number | string,
  role: string,
  tanggalSetor: string | Date,
): string {
  return formatNomorSetor(nomorUrutOrId, role, tanggalSetor);
}

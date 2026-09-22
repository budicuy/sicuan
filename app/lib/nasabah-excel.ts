import * as XLSX from "xlsx";
import type { NasabahWithUser } from "@/app/types";

export interface ParsedNasabahRow {
  rowNumber: number;
  name: string;
  username: string;
  password?: string;
  role: string;
  status: string;
  nik?: string;
  tanggalLahir?: string;
  noTelepon?: string;
  email?: string;
  jenisBank?: string;
  noRekening?: string;
  alamat?: string;
}

/**
 * Normalisasi header dari Excel agar toleran terhadap variasi penulisan.
 */
function normalizeHeaderKey(key: string): string {
  const cleaned = key
    .toLowerCase()
    .replace(/[*()]/g, "")
    .replace(/[_\s-]+/g, "")
    .trim();

  if (cleaned.includes("nama") && !cleaned.includes("bank")) return "name";
  if (cleaned.includes("user")) return "username";
  if (cleaned.includes("pass") || cleaned.includes("sandi")) return "password";
  if (cleaned.includes("role") || cleaned.includes("peran")) return "role";
  if (cleaned.includes("status")) return "status";
  if (cleaned.includes("nik") || cleaned.includes("ktp")) return "nik";
  if (cleaned.includes("lahir") || cleaned.includes("tgl"))
    return "tanggalLahir";
  if (
    cleaned.includes("telp") ||
    cleaned.includes("hp") ||
    cleaned.includes("phone")
  )
    return "noTelepon";
  if (cleaned.includes("email") || cleaned.includes("surel")) return "email";
  if (cleaned.includes("bank")) return "jenisBank";
  if (cleaned.includes("rek") || cleaned.includes("account"))
    return "noRekening";
  if (cleaned.includes("alamat") || cleaned.includes("address"))
    return "alamat";

  return cleaned;
}

/**
 * Mengonversi nilai tanggal Excel (baik serial number maupun string) ke format YYYY-MM-DD.
 */
function formatExcelDate(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === "number") {
    // Excel date serial number
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  const str = String(val).trim();
  if (!str) return undefined;

  // Coba parse format YYYY-MM-DD atau DD/MM/YYYY atau DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return str;
}

/**
 * Menghasilkan dan mengunduh template Excel untuk import data nasabah.
 */
export function downloadNasabahTemplate(): void {
  const headers = [
    "Nama Lengkap *",
    "Username *",
    "Password *",
    "Role *",
    "Status",
    "NIK",
    "Tanggal Lahir",
    "No Telepon",
    "Email",
    "Jenis Bank",
    "No Rekening",
    "Alamat Lengkap",
  ];

  // Baris contoh untuk memandu pengguna
  const sampleData = [
    {
      "Nama Lengkap *": "Budi Santoso",
      "Username *": "budi.santoso",
      "Password *": "budi12345",
      "Role *": "konsumen",
      Status: "Aktif",
      NIK: "6371012345670001",
      "Tanggal Lahir": "1995-08-17",
      "No Telepon": "081234567890",
      Email: "budi.santoso@gmail.com",
      "Jenis Bank": "BCA",
      "No Rekening": "1234567890",
      "Alamat Lengkap": "Jl. Ahmad Yani Km 5, Banjarmasin",
    },
    {
      "Nama Lengkap *": "Warmindo Berkah",
      "Username *": "warmindo.berkah",
      "Password *": "berkah12345",
      "Role *": "warmindo",
      Status: "Aktif",
      NIK: "6371029876540002",
      "Tanggal Lahir": "1990-05-12",
      "No Telepon": "082198765432",
      Email: "warmindo.berkah@gmail.com",
      "Jenis Bank": "Mandiri",
      "No Rekening": "9876543210123",
      "Alamat Lengkap": "Jl. Hasan Basri No. 12, Banjarmasin",
    },
    {
      "Nama Lengkap *": "Bank Sampah Sejahtera",
      "Username *": "bs.sejahtera",
      "Password *": "sejahtera123",
      "Role *": "bank-sampah",
      Status: "Aktif",
      NIK: "",
      "Tanggal Lahir": "",
      "No Telepon": "085211223344",
      Email: "banksampah.sejahtera@gmail.com",
      "Jenis Bank": "BRI",
      "No Rekening": "456701009988776",
      "Alamat Lengkap": "Jl. Pramuka Komp. Semanda, Banjarmasin",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Atur lebar kolom agar mudah dibaca
  ws["!cols"] = [
    { wch: 25 }, // Nama Lengkap
    { wch: 20 }, // Username
    { wch: 16 }, // Password
    { wch: 16 }, // Role
    { wch: 12 }, // Status
    { wch: 20 }, // NIK
    { wch: 15 }, // Tanggal Lahir
    { wch: 16 }, // No Telepon
    { wch: 28 }, // Email
    { wch: 12 }, // Jenis Bank
    { wch: 20 }, // No Rekening
    { wch: 40 }, // Alamat
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template Nasabah");

  XLSX.writeFile(wb, "Template_Import_Nasabah_SICUAN.csv", { bookType: "csv" });
}

/**
 * Ekspor data nasabah ke file CSV.
 */
export function exportNasabahToCSV(
  data: NasabahWithUser[],
  filename = "Data_Nasabah_SICUAN",
): void {
  const rows = data.map((item, index) => ({
    No: index + 1,
    "Nama Lengkap": item.user?.name || "-",
    Username: item.user?.username || "-",
    Role: item.user?.role ? item.user.role.toUpperCase() : "-",
    Status: item.user?.status || "Aktif",
    NIK: item.nik || "-",
    "Tanggal Lahir": item.tanggalLahir || "-",
    "No. Telepon": item.noTelepon || "-",
    Email: item.email || "-",
    "Jenis Bank": item.jenisBank ? item.jenisBank.toUpperCase() : "-",
    "No. Rekening": item.noRekening || "-",
    "Total Poin": item.poin ?? 0,
    Alamat: item.alamat || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Nasabah");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filename}_${today}.csv`, { bookType: "csv" });
}

// Alias untuk kompatibilitas
export const exportNasabahToExcel = exportNasabahToCSV;

/**
 * Parsing file Excel yang diunggah pengguna menjadi baris data yang siap divalidasi.
 */
export async function parseNasabahExcelFile(
  file: File,
): Promise<ParsedNasabahRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: "array" });

  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("File Excel tidak memiliki lembar kerja (worksheet).");
  }

  const ws = wb.Sheets[firstSheetName];
  if (!ws) {
    throw new Error("Gagal membaca lembar kerja Excel.");
  }

  const rawJson: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: false,
  });

  if (rawJson.length === 0) {
    throw new Error("File Excel kosong atau tidak memiliki baris data.");
  }

  const rows: ParsedNasabahRow[] = [];

  for (let idx = 0; idx < rawJson.length; idx++) {
    const rawRow = rawJson[idx];
    const rowNum = idx + 2; // +1 untuk header (baris 1), +1 untuk index 1-based

    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(rawRow)) {
      const normKey = normalizeHeaderKey(key);
      normalized[normKey] = String(value ?? "").trim();
    }

    // Skip baris kosong sepenuhnya
    const hasValues = Object.values(normalized).some((v) => v.length > 0);
    if (!hasValues) continue;

    // Normalisasi role
    let role = (normalized.role || "konsumen")
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (role === "banksampah") role = "bank-sampah";

    // Normalisasi status
    let status = normalized.status || "Aktif";
    if (
      status.toLowerCase() === "nonaktif" ||
      status.toLowerCase() === "inactive"
    ) {
      status = "Nonaktif";
    } else {
      status = "Aktif";
    }

    rows.push({
      rowNumber: rowNum,
      name: normalized.name || "",
      username: normalized.username || "",
      password: normalized.password || "",
      role,
      status,
      nik: normalized.nik
        ? String(normalized.nik).replace(/['"]/g, "").trim()
        : undefined,
      tanggalLahir: formatExcelDate(normalized.tanggalLahir),
      noTelepon: normalized.noTelepon
        ? String(normalized.noTelepon).replace(/['"]/g, "").trim()
        : undefined,
      email: normalized.email || undefined,
      jenisBank: normalized.jenisBank
        ? normalized.jenisBank.toUpperCase()
        : undefined,
      noRekening: normalized.noRekening
        ? String(normalized.noRekening).replace(/['"]/g, "").trim()
        : undefined,
      alamat: normalized.alamat || undefined,
    });
  }

  return rows;
}

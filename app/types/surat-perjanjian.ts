export type KategoriMitraPerjanjian =
  | "bank-sampah"
  | "bank-sampah-b"
  | "warmindo";

export type StatusSuratPerjanjian = "aktif" | "expired" | "diarsipkan";

export interface SuratPerjanjianItem {
  id: number;
  nomorSurat: string;
  judul: string;
  userId: number;
  kategoriMitra: KategoriMitraPerjanjian;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  tanggalMulai: string;
  tanggalBerakhir: string;
  status: StatusSuratPerjanjian;
  suratSebelumnyaId: number | null;
  catatan: string | null;
  createdAt: Date;
  updatedAt: Date;
  mitra?: {
    id: number;
    name: string;
    role: string;
    noTelepon?: string | null;
    alamat?: string | null;
  } | null;
  // Computed helpers
  sisaHari?: number;
  isExpired?: boolean;
}

export interface SuratPerjanjianSummary {
  totalAktif: number;
  totalExpired: number;
  totalDiarsipkan: number;
  totalMitra: number;
}

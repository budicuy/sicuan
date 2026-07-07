/**
 * setoran.ts — Types terkait setoran sampah.
 * Digunakan di semua role: admin, konsumen, warmiendo, bank-sampah.
 */

export type JenisSampah = "Karton" | "Etiket" | "Paper Cup";

export type StatusSetoran =
  | "pending"
  | "diverifikasi"
  | "diserahkan"
  | "diterima"
  | "ditolak";

/**
 * SetoranType — data lengkap satu record setoran dari DB.
 * Sebelumnya didefinisikan ulang (identik) di 8+ file action.ts.
 */
export interface SetoranType {
  id: number;
  nomorSetor: string;
  userId: number;
  jenisSampah: JenisSampah;
  beratKg: number;
  beratAiKg?: number | null;
  tanggalSetor: string;
  fotoTimbangan: string;
  fotoBuktiTambahan: string[];
  catatan?: string | null;
  totalPoin: number;
  status: StatusSetoran;
  metodeSetor?: string | null;
  ekspedisiId?: number | null;
  ekspedisi?: { id: number; namaVendor: string; noTelepon: string } | null;
  user?: { id: number; name: string; username: string; role: string } | null;
  totalKredit?: number;
  kategoriNasabah: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SetorSampahItem — tampilan ringkas setoran untuk tabel laporan.
 * Sebelumnya didefinisikan ulang di 7+ page.tsx laporan.
 */
export interface SetorSampahItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  totalPoin: number;
  totalKredit?: number;
  tanggalSetor: string;
  status: string;
  createdAt: Date;
  fotoTimbangan: string;
  fotoBuktiTambahan?: string[] | null;
  catatan: string | null;
  /** Dipakai di laporan & setor warmiendo/bank-sampah */
  metodeSetor?: string | null;
  /** Dipakai di laporan warmiendo */
  ekspedisiId?: number | null;
  /** Dipakai di laporan & setor warmiendo */
  ekspedisi?: { id: number; namaVendor: string; noTelepon: string } | null;
  user?: {
    name: string;
    username: string;
    role: string;
  } | null;
}

/**
 * pencairan.ts — Types terkait pencairan dana.
 */

export type MetodePembayaran = "tunai" | "transfer";
export type KategoriSumber =
  | "bank-sampah-induk"
  | "tps-3r"
  | "bank-sampah-unit";

/**
 * DisbursementItem — data pencairan untuk tabel admin.
 * Merge dari page.tsx dan BuktiPembayaranModal.tsx (field opsional disatukan).
 */
export interface DisbursementItem {
  id: number;
  userId: number;
  jumlah: number;
  jenisBank: string | null;
  noRekening: string | null;
  status: string;
  metodePembayaran: string;
  keterangan: string | null;
  ttdPenyerahUrl: string | null;
  /** Hanya ada di tabel admin page */
  buktiTransfer?: string | null;
  periodeBulan: number | null;
  periodeTahun: number | null;
  createdAt: Date;
  user: {
    name: string;
    username: string;
    role: string;
  };
  /** Hanya ada di tabel admin page */
  buktiPembayaranId?: number | null;
}

/**
 * DisbursementHistoryItem — riwayat pencairan untuk tampilan nasabah/warmiendo.
 */
export interface DisbursementHistoryItem {
  id: number;
  userId: number;
  jumlah: number;
  jenisBank: string | null;
  noRekening: string | null;
  status: string;
  metodePembayaran: string;
  buktiTransfer: string | null;
  createdAt: string | Date;
  buktiPembayaranId: number | null;
}

/** Item breakdown data sampah pada form pencairan */
export interface DataSampahPencairan {
  jenis: string;
  beratKg: number;
  kredit: number;
}

/** Data pencairan yang sedang aktif/berjalan */
export interface PencairanAktif {
  id: number;
  jumlah: number;
  status: string;
  metodePembayaran: string;
  createdAt: string | Date;
  keterangan?: string;
  ttdPenyerahUrl?: string | null;
  ttdPenerimaUrl?: string | null;
}

/** Data user lengkap pada halaman pengajuan pencairan */
export interface UserDataPencairan {
  kredit: number;
  lastMonthKredit?: number;
  isCurrentMonth: boolean;
  sudahDicairkan: boolean;
  pencairanAktif: PencairanAktif | null;
  jenisBank: string;
  noRekening: string;
  alamat?: string;
  noTelepon?: string;
  idPelanggan?: string;
  dataSampah?: DataSampahPencairan[];
  totalBeratKg?: number;
  user: { id: number; name: string; role: string };
}

/**
 * master-data.ts — Types untuk master data (ekspedisi, harga, kupon, poin).
 */

export interface Ekspedisi {
  id: number;
  namaVendor: string;
  noTelepon: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HargaSampah {
  id: number;
  jenisSampah: string;
  minBerat: number;
  maxBerat: number | null;
  harga: number;
  createdAt: Date;
  updatedAt: Date;
}

export type KuponTier = "silver" | "gold" | "diamond";

export interface Kupon {
  id: number;
  nama: string;
  deskripsi: string;
  poin: number;
  tier: KuponTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface PoinSampah {
  id: number;
  jenisSampah: string;
  pointPerKg: number;
  createdAt: Date;
  updatedAt: Date;
}

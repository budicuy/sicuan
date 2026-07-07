/**
 * raw-material.ts — Types terkait data raw material dan laporan raw material.
 */

/** Data raw material dari DB (1 baris per bulan) */
export interface RawMaterial {
  id: number;
  periode: string;
  etiketNnGram: number;
  etiketGnGram: number;
  etiketCnGram: number;
  kartonNnGram: number;
  kartonGnGram: number;
  kartonCnGram: number;
  cupCnGram: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Baris tampilan hasil expand 1 DB row → 7 display rows */
export interface DisplayRow {
  id: number;
  _key: string;
  periode: string;
  kategori: "Cup" | "Etiket" | "Karton";
  klasifikasi: "Cup Noodle (CN)" | "Glass Noodle (GN)" | "Normal Noodle (NN)";
  beratGram: number;
  beratKg: number;
}

export interface WeeklyReportPoint {
  weekLabel: string;
  totalRaw: number;
  totalDeposited: number;
  totalPct: number;
  [key: string]: string | number;
}

export interface MonthlyReportPoint {
  monthLabel: string;
  totalRaw: number;
  totalDeposited: number;
  totalPct: number;
  [key: string]: string | number;
}

export interface YearlyReportPoint {
  yearLabel: string;
  totalRaw: number;
  totalDeposited: number;
  totalPct: number;
  [key: string]: string | number;
}

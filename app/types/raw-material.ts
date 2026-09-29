/**
 * raw-material.ts — Types terkait data raw material dan laporan raw material.
 */

export type { RawMaterial } from "@/db/schema/raw-material";

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

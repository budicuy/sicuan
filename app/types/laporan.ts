/**
 * laporan.ts — Types untuk halaman laporan raw material (chart & report).
 */

export interface RankingPoint {
  userId: number;
  name: string;
  totalWeight: number;
}

export interface ChartDataPoint {
  weekLabel?: string;
  monthLabel?: string;
  yearLabel?: string;
  totalRaw: number;
  totalDeposited: number;
  [key: string]: string | number | undefined;
}

export interface ReportSegment {
  overall: {
    totalRawWeight: number;
    totalDepositedWeight: number;
    overallPercentage: number;
  };
  byCategory: {
    category: string;
    rawWeight: number;
    depositedWeight: number;
    percentage: number;
    classifications: { name: string; weight: number }[];
  }[];
  byRole: {
    role: string;
    totalWeight: number;
    sharePercentage: number;
    rawContributionPercentage: number;
    categories: { category: string; weight: number }[];
  }[];
  topCategories: {
    category: string;
    depositedWeight: number;
    rawWeight: number;
    percentage: number;
  }[];
  rankings: {
    Konsumen: RankingPoint[];
    Warmindo: RankingPoint[];
    "Bank Sampah": RankingPoint[];
  };
}

export interface ReportData {
  success: boolean;
  weekly: ReportSegment;
  monthly: ReportSegment;
  yearly: ReportSegment;
  weeklyData: ChartDataPoint[];
  monthlyData: ChartDataPoint[];
  yearlyData: ChartDataPoint[];
}

// ─── Types untuk Laporan Setoran Terpadu ──────────────────────────────

export interface UnifiedReportSummary {
  totalSetoran: number;
  totalBerat: number;
  totalPoin: number;
  totalKredit: number;
  rataRataBerat: number;
  totalDiterima: number;
  totalDitolak: number;
  totalPending: number;
  tingkatPenerimaan: number;
}

export interface MonthlyTrendItem {
  bulan: string;
  bulanIndex: number;
  totalSetoran: number;
  totalBerat: number;
  warmindo: number;
  bankSampah: number;
  konsumen: number;
}

export interface DistributionItem {
  label: string;
  count: number;
  totalBerat: number;
  persentase: number;
}

export interface DetailSetoranItem {
  id: number;
  nomorSetor: string;
  nasabah: string;
  kategoriNasabah: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  status: string;
  metodeSetor: string | null;
  totalPoin: number;
  kredit: number;
}

export interface TrendPoint {
  name: string;
  Volume: number;
}

export interface UnifiedReportData {
  summary: UnifiedReportSummary;
  monthlyTrend: MonthlyTrendItem[];
  weeklyTrend: TrendPoint[];
  yearlyTrend: TrendPoint[];
  categoryDistribution: DistributionItem[];
  wasteTypeDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];
  metodeDistribution: DistributionItem[];
  detailData: DetailSetoranItem[];
  totalDetailData: number;
}

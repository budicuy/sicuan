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
    Warmiendo: RankingPoint[];
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

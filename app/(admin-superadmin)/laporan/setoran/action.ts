"use server";

import { and, asc, desc, eq, type SQL, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import type {
  DetailSetoranItem,
  DistributionItem,
  MonthlyTrendItem,
  UnifiedReportData,
  UnifiedReportSummary,
} from "@/app/types";
import { db } from "@/db";
import { hargaSampah, setorSampah } from "@/db/schema";

// ── Auth Helper ───────────────────────────────────────────────────────

async function getCurrentUser(): Promise<{
  id: number;
  role: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return decodeJwt(token) as { id: number; role: string };
  } catch {
    return null;
  }
}

// ── Nama Bulan ────────────────────────────────────────────────────────

const BULAN_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

// ── Main Report Function ──────────────────────────────────────────────

export async function getUnifiedReport(params: {
  selectedYear?: number;
  selectedMonth?: number | null;
  kategori?: string;
  jenisSampah?: string;
  status?: string;
  metodeSetor?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<UnifiedReportData> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return emptyReport();
  }

  const year = params.selectedYear ?? new Date().getFullYear();
  const month = params.selectedMonth ?? null;
  const kategori = params.kategori ?? "";
  const jenisSampah = params.jenisSampah ?? "";
  const status = params.status ?? "";
  const metodeSetor = params.metodeSetor ?? "";
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;
  const sortBy = params.sortBy ?? "id";
  const sortOrder = params.sortOrder ?? "desc";

  // ── Build filters ────────────────────────────────────────────────

  const filters: SQL[] = [
    sql`extract(year from ${setorSampah.createdAt}) = ${year}`,
  ];

  if (month) {
    filters.push(sql`extract(month from ${setorSampah.createdAt}) = ${month}`);
  }

  if (kategori && kategori !== "Semua") {
    filters.push(
      eq(
        setorSampah.kategoriNasabah,
        kategori as "konsumen" | "warmindo" | "bank-sampah",
      ),
    );
  }

  if (jenisSampah && jenisSampah !== "Semua") {
    filters.push(
      eq(
        setorSampah.jenisSampah,
        jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      ),
    );
  }

  if (status && status !== "Semua") {
    filters.push(
      eq(
        setorSampah.status,
        status as
          | "pending"
          | "diverifikasi"
          | "diserahkan"
          | "diterima"
          | "ditolak",
      ),
    );
  }

  if (metodeSetor && metodeSetor !== "Semua") {
    filters.push(sql`${setorSampah.metodeSetor} = ${metodeSetor}`);
  }

  const combinedWhere = and(...filters);

  // ── Yearly Filters (last 5 years) ──
  const startYear = year - 4;
  const yearlyFilters: SQL[] = [
    sql`extract(year from ${setorSampah.createdAt}) >= ${startYear}`,
    sql`extract(year from ${setorSampah.createdAt}) <= ${year}`,
  ];

  if (kategori && kategori !== "Semua") {
    yearlyFilters.push(
      eq(
        setorSampah.kategoriNasabah,
        kategori as "konsumen" | "warmindo" | "bank-sampah",
      ),
    );
  }

  if (jenisSampah && jenisSampah !== "Semua") {
    yearlyFilters.push(
      eq(
        setorSampah.jenisSampah,
        jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      ),
    );
  }

  if (status && status !== "Semua") {
    yearlyFilters.push(
      eq(
        setorSampah.status,
        status as
          | "pending"
          | "diverifikasi"
          | "diserahkan"
          | "diterima"
          | "ditolak",
      ),
    );
  }

  if (metodeSetor && metodeSetor !== "Semua") {
    yearlyFilters.push(sql`${setorSampah.metodeSetor} = ${metodeSetor}`);
  }

  // ── Order Column ─────────────────────────────────────────────────

  let orderColumn: SQL = desc(setorSampah.id);
  if (sortBy === "beratKg") {
    orderColumn =
      sortOrder === "asc"
        ? asc(setorSampah.beratKg)
        : desc(setorSampah.beratKg);
  } else if (sortBy === "tanggalSetor") {
    orderColumn =
      sortOrder === "asc"
        ? asc(setorSampah.tanggalSetor)
        : desc(setorSampah.tanggalSetor);
  } else if (sortBy === "status") {
    orderColumn =
      sortOrder === "asc" ? asc(setorSampah.status) : desc(setorSampah.status);
  }

  // ── Parallel Queries ─────────────────────────────────────────────

  const [allRows, paginatedRows, allRanges, yearlyTrendsRes] =
    await Promise.all([
      // Full dataset for aggregation (lightweight select)
      db
        .select({
          id: setorSampah.id,
          beratKg: setorSampah.beratKg,
          totalPoin: setorSampah.totalPoin,
          jenisSampah: setorSampah.jenisSampah,
          status: setorSampah.status,
          metodeSetor: setorSampah.metodeSetor,
          kategoriNasabah: setorSampah.kategoriNasabah,
          createdAt: setorSampah.createdAt,
        })
        .from(setorSampah)
        .where(combinedWhere),

      // Paginated detail data with user join
      db.query.setorSampah.findMany({
        where: combinedWhere,
        with: {
          user: { columns: { id: true, name: true } },
        },
        orderBy: [orderColumn],
        limit,
        offset,
      }),

      // Pricing data
      db
        .select()
        .from(hargaSampah),

      // Yearly trends for the last 5 years
      db
        .select({
          year: sql<number>`extract(year from ${setorSampah.createdAt})`,
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(and(...yearlyFilters))
        .groupBy(sql`extract(year from ${setorSampah.createdAt})`),
    ]);

  // ── Compute Summary ──────────────────────────────────────────────

  let totalBerat = 0;
  let totalPoin = 0;
  let totalKredit = 0;
  let totalDiterima = 0;
  let totalDitolak = 0;
  let totalPending = 0;

  // Distribution accumulators
  const categoryMap = new Map<string, { count: number; berat: number }>();
  const wasteTypeMap = new Map<string, { count: number; berat: number }>();
  const statusMap = new Map<string, { count: number; berat: number }>();
  const metodeMap = new Map<string, { count: number; berat: number }>();
  const monthlyMap = new Map<
    number,
    {
      totalSetoran: number;
      totalBerat: number;
      warmindo: number;
      bankSampah: number;
      konsumen: number;
    }
  >();

  for (const row of allRows) {
    totalBerat += row.beratKg;
    totalPoin += row.totalPoin;

    // Kredit calculation (for warmindo and bank-sampah categories only, status diterima)
    if (
      row.status === "diterima" &&
      (row.kategoriNasabah === "warmindo" ||
        row.kategoriNasabah === "bank-sampah")
    ) {
      const range = allRanges.find(
        (r) =>
          r.jenisSampah === row.jenisSampah &&
          row.beratKg >= r.minBerat &&
          (r.maxBerat === null || row.beratKg <= r.maxBerat),
      );
      totalKredit += range?.harga ?? 0;
    }

    // Status counts
    if (row.status === "diterima") totalDiterima++;
    else if (row.status === "ditolak") totalDitolak++;
    else if (row.status === "pending") totalPending++;

    // Category distribution
    const catKey = row.kategoriNasabah;
    const catEntry = categoryMap.get(catKey) ?? { count: 0, berat: 0 };
    catEntry.count++;
    catEntry.berat += row.beratKg;
    categoryMap.set(catKey, catEntry);

    // Waste type distribution
    const wtKey = row.jenisSampah;
    const wtEntry = wasteTypeMap.get(wtKey) ?? { count: 0, berat: 0 };
    wtEntry.count++;
    wtEntry.berat += row.beratKg;
    wasteTypeMap.set(wtKey, wtEntry);

    // Status distribution
    const stKey = row.status;
    const stEntry = statusMap.get(stKey) ?? { count: 0, berat: 0 };
    stEntry.count++;
    stEntry.berat += row.beratKg;
    statusMap.set(stKey, stEntry);

    // Metode distribution
    const mtKey = row.metodeSetor ?? "langsung";
    const mtEntry = metodeMap.get(mtKey) ?? { count: 0, berat: 0 };
    mtEntry.count++;
    mtEntry.berat += row.beratKg;
    metodeMap.set(mtKey, mtEntry);

    // Monthly trend
    const monthIdx = row.createdAt.getMonth(); // 0-based
    const monthEntry = monthlyMap.get(monthIdx) ?? {
      totalSetoran: 0,
      totalBerat: 0,
      warmindo: 0,
      bankSampah: 0,
      konsumen: 0,
    };
    monthEntry.totalSetoran++;
    monthEntry.totalBerat += row.beratKg;
    if (row.kategoriNasabah === "warmindo") monthEntry.warmindo += row.beratKg;
    else if (row.kategoriNasabah === "bank-sampah")
      monthEntry.bankSampah += row.beratKg;
    else monthEntry.konsumen += row.beratKg;
    monthlyMap.set(monthIdx, monthEntry);
  }

  const totalSetoran = allRows.length;

  const summary: UnifiedReportSummary = {
    totalSetoran,
    totalBerat: Math.round(totalBerat * 100) / 100,
    totalPoin,
    totalKredit,
    rataRataBerat:
      totalSetoran > 0
        ? Math.round((totalBerat / totalSetoran) * 100) / 100
        : 0,
    totalDiterima,
    totalDitolak,
    totalPending,
    tingkatPenerimaan:
      totalSetoran > 0
        ? Math.round((totalDiterima / totalSetoran) * 1000) / 10
        : 0,
  };

  // ── Monthly Trend ────────────────────────────────────────────────

  const monthlyTrend: MonthlyTrendItem[] = [];
  const monthCount = month ? 1 : 12;
  const startMonth = month ? month - 1 : 0;

  for (let i = 0; i < monthCount; i++) {
    const idx = startMonth + i;
    const entry = monthlyMap.get(idx);
    monthlyTrend.push({
      bulan: BULAN_NAMES[idx],
      bulanIndex: idx + 1,
      totalSetoran: entry?.totalSetoran ?? 0,
      totalBerat: Math.round((entry?.totalBerat ?? 0) * 100) / 100,
      warmindo: Math.round((entry?.warmindo ?? 0) * 100) / 100,
      bankSampah: Math.round((entry?.bankSampah ?? 0) * 100) / 100,
      konsumen: Math.round((entry?.konsumen ?? 0) * 100) / 100,
    });
  }

  // ── Weekly Trend ──
  const targetMonth = month ?? new Date().getMonth() + 1;
  const weeklyData = [0, 0, 0, 0, 0];
  for (const row of allRows) {
    const rowMonth = row.createdAt.getMonth() + 1;
    if (rowMonth === targetMonth) {
      const day = row.createdAt.getDate();
      const weekIdx = Math.min(4, Math.floor((day - 1) / 7));
      weeklyData[weekIdx] += row.beratKg;
    }
  }
  const weeklyTrend = weeklyData.map((weight, index) => ({
    name: `Mng ${index + 1}`,
    Volume: Math.round(weight * 100) / 100,
  }));

  // ── Yearly Trend ──
  const last5Years = Array.from({ length: 5 }, (_, i) => startYear + i);
  const yearlyTrend = last5Years.map((y) => {
    const match = yearlyTrendsRes.find((item) => Number(item.year) === y);
    return {
      name: String(y),
      Volume: match ? Math.round(Number(match.totalWeight) * 100) / 100 : 0,
    };
  });

  // ── Distributions ────────────────────────────────────────────────

  const categoryDistribution = buildDistribution(categoryMap, totalSetoran);
  const wasteTypeDistribution = buildDistribution(wasteTypeMap, totalSetoran);
  const statusDistribution = buildDistribution(statusMap, totalSetoran);
  const metodeDistribution = buildDistribution(metodeMap, totalSetoran);

  // ── Detail Data ──────────────────────────────────────────────────

  const detailData: DetailSetoranItem[] = paginatedRows.map((row) => {
    const range = allRanges.find(
      (r) =>
        r.jenisSampah === row.jenisSampah &&
        row.beratKg >= r.minBerat &&
        (r.maxBerat === null || row.beratKg <= r.maxBerat),
    );
    const isMoneyCategory =
      row.kategoriNasabah === "warmindo" ||
      row.kategoriNasabah === "bank-sampah";
    const kredit = isMoneyCategory ? (range?.harga ?? 0) : 0;

    return {
      id: row.id,
      nomorSetor: row.nomorSetor,
      nasabah: row.user?.name ?? "–",
      kategoriNasabah: row.kategoriNasabah,
      jenisSampah: row.jenisSampah,
      beratKg: row.beratKg,
      tanggalSetor: row.tanggalSetor,
      status: row.status,
      metodeSetor: row.metodeSetor,
      totalPoin: row.totalPoin,
      kredit,
    };
  });

  return {
    summary,
    monthlyTrend,
    weeklyTrend,
    yearlyTrend,
    categoryDistribution,
    wasteTypeDistribution,
    statusDistribution,
    metodeDistribution,
    detailData,
    totalDetailData: totalSetoran,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────

function buildDistribution(
  map: Map<string, { count: number; berat: number }>,
  total: number,
): DistributionItem[] {
  return Array.from(map.entries())
    .map(([label, { count, berat }]) => ({
      label,
      count,
      totalBerat: Math.round(berat * 100) / 100,
      persentase: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function emptyReport(): UnifiedReportData {
  return {
    summary: {
      totalSetoran: 0,
      totalBerat: 0,
      totalPoin: 0,
      totalKredit: 0,
      rataRataBerat: 0,
      totalDiterima: 0,
      totalDitolak: 0,
      totalPending: 0,
      tingkatPenerimaan: 0,
    },
    monthlyTrend: [],
    weeklyTrend: [],
    yearlyTrend: [],
    categoryDistribution: [],
    wasteTypeDistribution: [],
    statusDistribution: [],
    metodeDistribution: [],
    detailData: [],
    totalDetailData: 0,
  };
}

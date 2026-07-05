"use server";

import { eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { nasabah, rawMaterial, setorSampah } from "@/db/schema";

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

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
    };
    return payload;
  } catch {
    return null;
  }
}

function normalizeCategory(cat: string): "Karton" | "Etiket" | "Paper Cup" {
  if (cat === "Cup") return "Paper Cup";
  return cat as "Karton" | "Etiket" | "Paper Cup";
}

export async function getRawMaterialReport(
  targetYear?: number,
  targetMonth?: number,
  targetWeek?: number,
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    throw new Error(
      "Unauthorized. Only administrators can access this report.",
    );
  }

  // 1. Fetch raw materials and waste deposits in parallel (Optimal Queries)
  const [rawRows, setoranRows] = await Promise.all([
    db
      .select({
        id: rawMaterial.id,
        periode: rawMaterial.periode,
        kategori: rawMaterial.kategori,
        klasifikasi: rawMaterial.klasifikasi,
        beratKg: rawMaterial.beratKg,
      })
      .from(rawMaterial),
    db
      .select({
        beratKg: setorSampah.beratKg,
        jenisSampah: setorSampah.jenisSampah,
        tanggalSetor: setorSampah.tanggalSetor,
        userId: setorSampah.userId,
        userName: nasabah.name,
        kategoriNasabah: setorSampah.kategoriNasabah,
      })
      .from(setorSampah)
      .leftJoin(nasabah, eq(setorSampah.userId, nasabah.id))
      .where(eq(setorSampah.status, "diterima")),
  ]);

  // Combine all deposits
  const allDeposits = setoranRows.map((r) => ({
    beratKg: r.beratKg,
    jenisSampah: r.jenisSampah,
    tanggalSetor: r.tanggalSetor,
    userId: r.userId,
    userName: r.userName,
    source:
      r.kategoriNasabah === "konsumen"
        ? "Konsumen"
        : r.kategoriNasabah === "warmiendo"
          ? "Warmiendo"
          : "Bank Sampah",
  }));

  // ── Helper: parse date day of month
  const getDay = (dateStr: string) => {
    const parts = dateStr.split("-");
    return parts.length >= 3 ? Number(parts[2]) : 1;
  };

  // ── Helper: parse date month (1-indexed)
  const getMonth = (dateStr: string) => {
    const parts = dateStr.split("-");
    return parts.length >= 2 ? Number(parts[1]) : 1;
  };

  // ── Helper: parse date year
  const getYear = (dateStr: string) => {
    const parts = dateStr.split("-");
    return parts.length >= 1 ? Number(parts[0]) : 2026;
  };

  // ── Helper: get week index (1 to 5)
  const getWeekIndex = (dateStr: string) => {
    const day = getDay(dateStr);
    return Math.min(5, Math.floor((day - 1) / 7) + 1);
  };

  // 2. Filter data for report calculations based on inputs
  const TARGET_YEAR = targetYear ?? 2026;
  const TARGET_MONTH = targetMonth ?? 6; // June
  const TARGET_WEEK = targetWeek ?? 1;

  const categories: ("Karton" | "Etiket" | "Paper Cup")[] = [
    "Karton",
    "Etiket",
    "Paper Cup",
  ];

  // Rankings helper
  const getRankings = (depositsList: typeof allDeposits, role: string) => {
    const roleFiltered = depositsList.filter((d) => d.source === role);
    const userWeightMap: Record<number, { name: string; weight: number }> = {};

    for (const d of roleFiltered) {
      const uId = d.userId || 0;
      if (!userWeightMap[uId]) {
        userWeightMap[uId] = {
          name: d.userName || "Nasabah",
          weight: 0,
        };
      }
      userWeightMap[uId].weight += d.beratKg;
    }

    return Object.entries(userWeightMap)
      .map(([id, info]) => ({
        userId: Number(id),
        name: info.name,
        totalWeight: info.weight,
      }))
      .sort((a, b) => b.totalWeight - a.totalWeight)
      .slice(0, 3);
  };

  // Generic helper to compute report for a given time period
  const getReportForFilter = (
    filterRawFn: (r: (typeof rawRows)[number]) => boolean,
    filterDepFn: (d: (typeof allDeposits)[number]) => boolean,
  ) => {
    const filteredRaw = rawRows.filter(filterRawFn);
    const filteredDeposits = allDeposits.filter(filterDepFn);

    const totalRawWeight = filteredRaw.reduce((sum, r) => sum + r.beratKg, 0);
    const totalDepositedWeight = filteredDeposits.reduce(
      (sum, d) => sum + d.beratKg,
      0,
    );
    const overallPercentage =
      totalRawWeight > 0 ? (totalDepositedWeight / totalRawWeight) * 100 : 0;

    const byCategory = categories.map((cat) => {
      const catRaw = filteredRaw.filter(
        (r) => normalizeCategory(r.kategori) === cat,
      );
      const catDeposited = filteredDeposits.filter(
        (d) => d.jenisSampah === cat,
      );

      const rawWeight = catRaw.reduce((sum, r) => sum + r.beratKg, 0);
      const depositedWeight = catDeposited.reduce(
        (sum, d) => sum + d.beratKg,
        0,
      );
      const percentage =
        rawWeight > 0 ? (depositedWeight / rawWeight) * 100 : 0;

      const classificationMap: Record<string, number> = {};
      for (const r of catRaw) {
        classificationMap[r.klasifikasi] =
          (classificationMap[r.klasifikasi] || 0) + r.beratKg;
      }
      const classifications = Object.entries(classificationMap).map(
        ([name, weight]) => ({
          name,
          weight,
        }),
      );

      return {
        category: cat,
        rawWeight,
        depositedWeight,
        percentage,
        classifications,
      };
    });

    const byRole = ["Konsumen", "Warmiendo", "Bank Sampah"].map((role) => {
      const roleDeposits = filteredDeposits.filter((d) => d.source === role);
      const totalWeight = roleDeposits.reduce((sum, d) => sum + d.beratKg, 0);
      const sharePercentage =
        totalDepositedWeight > 0
          ? (totalWeight / totalDepositedWeight) * 100
          : 0;
      const rawContributionPercentage =
        totalRawWeight > 0 ? (totalWeight / totalRawWeight) * 100 : 0;

      const categoriesBreakdown = categories.map((cat) => {
        const catDep = roleDeposits.filter((d) => d.jenisSampah === cat);
        return {
          category: cat,
          weight: catDep.reduce((sum, d) => sum + d.beratKg, 0),
        };
      });

      return {
        role,
        totalWeight,
        sharePercentage,
        rawContributionPercentage,
        categories: categoriesBreakdown,
      };
    });

    const topCategories = byCategory
      .map((item) => ({
        category: item.category,
        depositedWeight: item.depositedWeight,
        rawWeight: item.rawWeight,
        percentage: item.percentage,
      }))
      .sort((a, b) => b.depositedWeight - a.depositedWeight);

    const rankings = {
      Konsumen: getRankings(filteredDeposits, "Konsumen"),
      Warmiendo: getRankings(filteredDeposits, "Warmiendo"),
      "Bank Sampah": getRankings(filteredDeposits, "Bank Sampah"),
    };

    return {
      overall: {
        totalRawWeight,
        totalDepositedWeight,
        overallPercentage,
      },
      byCategory,
      byRole,
      topCategories,
      rankings,
    };
  };

  // 4. Weekly Trend (for June 2026)
  const juneRaw = rawRows.filter(
    (r) =>
      getYear(r.periode) === TARGET_YEAR &&
      getMonth(r.periode) === TARGET_MONTH,
  );
  const juneDeposits = allDeposits.filter(
    (d) =>
      getYear(d.tanggalSetor) === TARGET_YEAR &&
      getMonth(d.tanggalSetor) === TARGET_MONTH,
  );

  const weeklyData = [1, 2, 3, 4, 5].map((weekNum) => {
    const weekRaw = juneRaw.filter((r) => getWeekIndex(r.periode) === weekNum);
    const weekDeposited = juneDeposits.filter(
      (d) => getWeekIndex(d.tanggalSetor) === weekNum,
    );

    const dataObj: WeeklyReportPoint = {
      weekLabel: `Minggu ${weekNum}`,
      totalRaw: 0,
      totalDeposited: 0,
      totalPct: 0,
    };

    categories.forEach((cat) => {
      const catRaw = weekRaw.filter(
        (r) => normalizeCategory(r.kategori) === cat,
      );
      const catDep = weekDeposited.filter((d) => d.jenisSampah === cat);

      const raw = catRaw.reduce((sum, r) => sum + r.beratKg, 0);
      const dep = catDep.reduce((sum, d) => sum + d.beratKg, 0);

      dataObj[`${cat}_raw`] = raw;
      dataObj[`${cat}_dep`] = dep;
      dataObj[`${cat}_pct`] = raw > 0 ? (dep / raw) * 100 : 0;

      dataObj.totalRaw += raw;
      dataObj.totalDeposited += dep;
    });

    dataObj.totalPct =
      dataObj.totalRaw > 0
        ? (dataObj.totalDeposited / dataObj.totalRaw) * 100
        : 0;
    return dataObj;
  });

  // 5. Monthly Trend (for year 2026)
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const monthlyData = monthNames.map((monthName, idx) => {
    const monthNum = idx + 1;
    const monthRaw = rawRows.filter(
      (r) =>
        getYear(r.periode) === TARGET_YEAR && getMonth(r.periode) === monthNum,
    );
    const monthDeposited = allDeposits.filter(
      (d) =>
        getYear(d.tanggalSetor) === TARGET_YEAR &&
        getMonth(d.tanggalSetor) === monthNum,
    );

    const dataObj: MonthlyReportPoint = {
      monthLabel: monthName,
      totalRaw: 0,
      totalDeposited: 0,
      totalPct: 0,
    };

    categories.forEach((cat) => {
      const catRaw = monthRaw.filter(
        (r) => normalizeCategory(r.kategori) === cat,
      );
      const catDep = monthDeposited.filter((d) => d.jenisSampah === cat);

      const raw = catRaw.reduce((sum, r) => sum + r.beratKg, 0);
      const dep = catDep.reduce((sum, d) => sum + d.beratKg, 0);

      dataObj[`${cat}_raw`] = raw;
      dataObj[`${cat}_dep`] = dep;
      dataObj.totalRaw += raw;
      dataObj.totalDeposited += dep;
    });

    dataObj.totalPct =
      dataObj.totalRaw > 0
        ? (dataObj.totalDeposited / dataObj.totalRaw) * 100
        : 0;
    return dataObj;
  });

  // 6. Yearly Trend
  const years = [TARGET_YEAR - 2, TARGET_YEAR - 1, TARGET_YEAR];
  const yearlyData = years.map((yr) => {
    const yearRaw = rawRows.filter((r) => getYear(r.periode) === yr);
    const yearDeposited = allDeposits.filter(
      (d) => getYear(d.tanggalSetor) === yr,
    );

    const dataObj: YearlyReportPoint = {
      yearLabel: String(yr),
      totalRaw: 0,
      totalDeposited: 0,
      totalPct: 0,
    };

    categories.forEach((cat) => {
      const catRaw = yearRaw.filter(
        (r) => normalizeCategory(r.kategori) === cat,
      );
      const catDep = yearDeposited.filter((d) => d.jenisSampah === cat);

      const raw = catRaw.reduce((sum, r) => sum + r.beratKg, 0);
      const dep = catDep.reduce((sum, d) => sum + d.beratKg, 0);

      dataObj[`${cat}_raw`] = raw;
      dataObj[`${cat}_dep`] = dep;
      dataObj.totalRaw += raw;
      dataObj.totalDeposited += dep;
    });

    dataObj.totalPct =
      dataObj.totalRaw > 0
        ? (dataObj.totalDeposited / dataObj.totalRaw) * 100
        : 0;
    return dataObj;
  });

  return {
    success: true,
    weekly: getReportForFilter(
      (r) =>
        getYear(r.periode) === TARGET_YEAR &&
        getMonth(r.periode) === TARGET_MONTH &&
        getWeekIndex(r.periode) === TARGET_WEEK,
      (d) =>
        getYear(d.tanggalSetor) === TARGET_YEAR &&
        getMonth(d.tanggalSetor) === TARGET_MONTH &&
        getWeekIndex(d.tanggalSetor) === TARGET_WEEK,
    ),
    monthly: getReportForFilter(
      (r) =>
        getYear(r.periode) === TARGET_YEAR &&
        getMonth(r.periode) === TARGET_MONTH,
      (d) =>
        getYear(d.tanggalSetor) === TARGET_YEAR &&
        getMonth(d.tanggalSetor) === TARGET_MONTH,
    ),
    yearly: getReportForFilter(
      (r) => getYear(r.periode) === TARGET_YEAR,
      (d) => getYear(d.tanggalSetor) === TARGET_YEAR,
    ),
    weeklyData,
    monthlyData,
    yearlyData,
  };
}

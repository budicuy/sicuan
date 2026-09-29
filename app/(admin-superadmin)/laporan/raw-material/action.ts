"use server";

import { eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import type {
  MonthlyReportPoint,
  WeeklyReportPoint,
  YearlyReportPoint,
} from "@/app/types";
import { db } from "@/db";
import { nasabah, rawMaterial, setorSampah } from "@/db/schema";

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

// ── Helpers: parse date parts ─────────────────────────────────────────────

const getYear = (dateStr: string) => {
  const parts = dateStr.split("-");
  return parts.length >= 1 ? Number(parts[0]) : 2026;
};

const getMonth = (dateStr: string) => {
  const parts = dateStr.split("-");
  return parts.length >= 2 ? Number(parts[1]) : 1;
};

const getDay = (dateStr: string) => {
  const parts = dateStr.split("-");
  return parts.length >= 3 ? Number(parts[2]) : 1;
};

const getWeekIndex = (dateStr: string) => {
  const day = getDay(dateStr);
  return Math.min(5, Math.floor((day - 1) / 7) + 1);
};

// ── Helper: hitung total berat (kg) dari satu baris raw material per kategori

interface RawRow {
  id: number;
  periode: string;
  etiketNnGram: number;
  etiketGnGram: number;
  etiketCnGram: number;
  kartonNnGram: number;
  kartonGnGram: number;
  kartonCnGram: number;
  cupCnGram: number;
}

function etiketKg(r: RawRow) {
  return (r.etiketNnGram + r.etiketGnGram + r.etiketCnGram) / 1000;
}
function kartonKg(r: RawRow) {
  return (r.kartonNnGram + r.kartonGnGram + r.kartonCnGram) / 1000;
}
function cupKg(r: RawRow) {
  return r.cupCnGram / 1000;
}
function totalKg(r: RawRow) {
  return etiketKg(r) + kartonKg(r) + cupKg(r);
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

  const TARGET_YEAR = targetYear ?? 2026;
  const TARGET_MONTH = targetMonth ?? 6;
  const TARGET_WEEK = targetWeek ?? 1;

  const categories: ("Karton" | "Etiket" | "Paper Cup")[] = [
    "Karton",
    "Etiket",
    "Paper Cup",
  ];

  // 1. Fetch raw materials and waste deposits in parallel
  const [rawRows, setoranRows] = await Promise.all([
    db
      .select({
        id: rawMaterial.id,
        periode: rawMaterial.periode,
        etiketNnGram: rawMaterial.etiketNnGram,
        etiketGnGram: rawMaterial.etiketGnGram,
        etiketCnGram: rawMaterial.etiketCnGram,
        kartonNnGram: rawMaterial.kartonNnGram,
        kartonGnGram: rawMaterial.kartonGnGram,
        kartonCnGram: rawMaterial.kartonCnGram,
        cupCnGram: rawMaterial.cupCnGram,
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

  const allDeposits = setoranRows.map((r) => ({
    beratKg: r.beratKg,
    jenisSampah: r.jenisSampah,
    tanggalSetor: r.tanggalSetor,
    userId: r.userId,
    userName: r.userName,
    source:
      r.kategoriNasabah === "konsumen"
        ? "Konsumen"
        : r.kategoriNasabah === "warmindo"
          ? "Warmindo"
          : "Bank Sampah",
  }));

  // ── Rankings helper ───────────────────────────────────────────────────────
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

  // ── Generic helper: hitung laporan untuk filter raw + deposit tertentu ───
  const getReportForFilter = (
    filterRawFn: (r: (typeof rawRows)[number]) => boolean,
    filterDepFn: (d: (typeof allDeposits)[number]) => boolean,
  ) => {
    const filteredRaw = rawRows.filter(filterRawFn) as RawRow[];
    const filteredDeposits = allDeposits.filter(filterDepFn);

    const totalRawWeight = filteredRaw.reduce((sum, r) => sum + totalKg(r), 0);
    const totalDepositedWeight = filteredDeposits.reduce(
      (sum, d) => sum + d.beratKg,
      0,
    );
    const overallPercentage =
      totalRawWeight > 0 ? (totalDepositedWeight / totalRawWeight) * 100 : 0;

    const byCategory = categories.map((cat) => {
      // Hitung berat raw per kategori langsung dari kolom flat
      const rawWeight = filteredRaw.reduce((sum, r) => {
        if (cat === "Etiket") return sum + etiketKg(r);
        if (cat === "Karton") return sum + kartonKg(r);
        return sum + cupKg(r); // Paper Cup
      }, 0);

      const catDeposited = filteredDeposits.filter(
        (d) => d.jenisSampah === cat,
      );
      const depositedWeight = catDeposited.reduce(
        (sum, d) => sum + d.beratKg,
        0,
      );
      const percentage =
        rawWeight > 0 ? (depositedWeight / rawWeight) * 100 : 0;

      // Klasifikasi dalam kategori (dari kolom flat)
      const classifications: { name: string; weight: number }[] = [];
      if (cat === "Etiket") {
        classifications.push(
          {
            name: "Normal Noodle (NN)",
            weight: filteredRaw.reduce((s, r) => s + r.etiketNnGram / 1000, 0),
          },
          {
            name: "Glass Noodle (GN)",
            weight: filteredRaw.reduce((s, r) => s + r.etiketGnGram / 1000, 0),
          },
          {
            name: "Cup Noodle (CN)",
            weight: filteredRaw.reduce((s, r) => s + r.etiketCnGram / 1000, 0),
          },
        );
      } else if (cat === "Karton") {
        classifications.push(
          {
            name: "Normal Noodle (NN)",
            weight: filteredRaw.reduce((s, r) => s + r.kartonNnGram / 1000, 0),
          },
          {
            name: "Glass Noodle (GN)",
            weight: filteredRaw.reduce((s, r) => s + r.kartonGnGram / 1000, 0),
          },
          {
            name: "Cup Noodle (CN)",
            weight: filteredRaw.reduce((s, r) => s + r.kartonCnGram / 1000, 0),
          },
        );
      } else {
        classifications.push({
          name: "Cup Noodle (CN)",
          weight: filteredRaw.reduce((s, r) => s + r.cupCnGram / 1000, 0),
        });
      }

      return {
        category: cat,
        rawWeight,
        depositedWeight,
        percentage,
        classifications,
      };
    });

    const byRole = ["Konsumen", "Warmindo", "Bank Sampah"].map((role) => {
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
      Warmindo: getRankings(filteredDeposits, "Warmindo"),
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

  // ── Weekly Trend ──────────────────────────────────────────────────────────
  // Raw material per bulan digunakan sebagai target penuh untuk setiap minggu
  const juneRaw = rawRows.filter(
    (r) =>
      getYear(r.periode) === TARGET_YEAR &&
      getMonth(r.periode) === TARGET_MONTH,
  ) as RawRow[];

  const juneDeposits = allDeposits.filter(
    (d) =>
      getYear(d.tanggalSetor) === TARGET_YEAR &&
      getMonth(d.tanggalSetor) === TARGET_MONTH,
  );

  const weeklyData = [1, 2, 3, 4, 5].map((weekNum) => {
    // Raw: gunakan target bulan penuh (1 row per bulan) sebagai acuan
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
      const raw = juneRaw.reduce((sum, r) => {
        if (cat === "Etiket") return sum + etiketKg(r);
        if (cat === "Karton") return sum + kartonKg(r);
        return sum + cupKg(r);
      }, 0);

      const dep = weekDeposited
        .filter((d) => d.jenisSampah === cat)
        .reduce((sum, d) => sum + d.beratKg, 0);

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

  // ── Monthly Trend ─────────────────────────────────────────────────────────
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
    ) as RawRow[];

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
      const raw = monthRaw.reduce((sum, r) => {
        if (cat === "Etiket") return sum + etiketKg(r);
        if (cat === "Karton") return sum + kartonKg(r);
        return sum + cupKg(r);
      }, 0);

      const dep = monthDeposited
        .filter((d) => d.jenisSampah === cat)
        .reduce((sum, d) => sum + d.beratKg, 0);

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

  // ── Yearly Trend ──────────────────────────────────────────────────────────
  const years = [TARGET_YEAR - 2, TARGET_YEAR - 1, TARGET_YEAR];
  const yearlyData = years.map((yr) => {
    const yearRaw = rawRows.filter(
      (r) => getYear(r.periode) === yr,
    ) as RawRow[];
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
      const raw = yearRaw.reduce((sum, r) => {
        if (cat === "Etiket") return sum + etiketKg(r);
        if (cat === "Karton") return sum + kartonKg(r);
        return sum + cupKg(r);
      }, 0);

      const dep = yearDeposited
        .filter((d) => d.jenisSampah === cat)
        .reduce((sum, d) => sum + d.beratKg, 0);

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
        getMonth(r.periode) === TARGET_MONTH,
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

"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import { db } from "@/db";
import { rawMaterial } from "@/db/schema";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};

export async function getRawMaterial(params?: {
  page?: number;
  limit?: number;
  search?: string;
  kategori?: string;
  klasifikasi?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const kategori = params?.kategori ?? "";
  const klasifikasi = params?.klasifikasi ?? "";
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "desc";

  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(rawMaterial.periode, `%${search}%`),
        ilike(rawMaterial.kategori, `%${search}%`),
        ilike(rawMaterial.klasifikasi, `%${search}%`),
      ),
    );
  }

  if (kategori) {
    whereConditions.push(
      eq(rawMaterial.kategori, kategori as "Cup" | "Etiket" | "Karton"),
    );
  }

  if (klasifikasi) {
    whereConditions.push(
      eq(
        rawMaterial.klasifikasi,
        klasifikasi as
          | "Cup Noodle (CN)"
          | "Glass Noodle (GN)"
          | "Normal Noodle (NN)",
      ),
    );
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(rawMaterial)
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn =
    sortOrder === "desc" ? desc(rawMaterial.id) : asc(rawMaterial.id);
  if (sortBy === "periode") {
    orderColumn =
      sortOrder === "desc"
        ? desc(rawMaterial.periode)
        : asc(rawMaterial.periode);
  } else if (sortBy === "kategori") {
    orderColumn =
      sortOrder === "desc"
        ? desc(rawMaterial.kategori)
        : asc(rawMaterial.kategori);
  } else if (sortBy === "klasifikasi") {
    orderColumn =
      sortOrder === "desc"
        ? desc(rawMaterial.klasifikasi)
        : asc(rawMaterial.klasifikasi);
  } else if (sortBy === "beratKg") {
    orderColumn =
      sortOrder === "desc"
        ? desc(rawMaterial.beratKg)
        : asc(rawMaterial.beratKg);
  } else if (sortBy === "beratGram") {
    orderColumn =
      sortOrder === "desc"
        ? desc(rawMaterial.beratGram)
        : asc(rawMaterial.beratGram);
  }

  // Get data
  const data = await db
    .select()
    .from(rawMaterial)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

export async function saveRawMaterial(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Input dari <input type="month"> memberikan format YYYY-MM
  // Simpan sebagai YYYY-MM-01 (hari pertama bulan) sesuai tipe date DB
  const periodeRaw = formData.get("periode") as string;
  const oldPeriode = formData.get("oldPeriode") as string;

  if (!periodeRaw || !/^\d{4}-\d{2}$/.test(periodeRaw)) {
    return {
      success: false,
      errors: {
        periode: ["Periode harus diisi dengan format bulan yang valid"],
      },
    };
  }

  const periode = `${periodeRaw}-01`; // YYYY-MM-01

  const etiket_cn = Number(formData.get("etiket_cn") || 0);
  const etiket_gn = Number(formData.get("etiket_gn") || 0);
  const etiket_nn = Number(formData.get("etiket_nn") || 0);
  const karton_cn = Number(formData.get("karton_cn") || 0);
  const karton_gn = Number(formData.get("karton_gn") || 0);
  const karton_nn = Number(formData.get("karton_nn") || 0);
  const cup_cn = Number(formData.get("cup_cn") || 0);

  try {
    // neon-http driver tidak support transaction — gunakan sequential operations
    // 1. Hapus data periode lama terlebih dahulu
    const periodeToDelete = oldPeriode || periode;
    await db
      .delete(rawMaterial)
      .where(eq(rawMaterial.periode, periodeToDelete));

    // 2. Insert 7 kombinasi kategori/klasifikasi sekaligus
    const rows = [
      {
        kategori: "Cup" as const,
        klasifikasi: "Cup Noodle (CN)" as const,
        beratGram: cup_cn,
      },
      {
        kategori: "Etiket" as const,
        klasifikasi: "Cup Noodle (CN)" as const,
        beratGram: etiket_cn,
      },
      {
        kategori: "Etiket" as const,
        klasifikasi: "Glass Noodle (GN)" as const,
        beratGram: etiket_gn,
      },
      {
        kategori: "Etiket" as const,
        klasifikasi: "Normal Noodle (NN)" as const,
        beratGram: etiket_nn,
      },
      {
        kategori: "Karton" as const,
        klasifikasi: "Cup Noodle (CN)" as const,
        beratGram: karton_cn,
      },
      {
        kategori: "Karton" as const,
        klasifikasi: "Glass Noodle (GN)" as const,
        beratGram: karton_gn,
      },
      {
        kategori: "Karton" as const,
        klasifikasi: "Normal Noodle (NN)" as const,
        beratGram: karton_nn,
      },
    ];

    const recordsToInsert = rows.map((r) => ({
      periode,
      kategori: r.kategori,
      klasifikasi: r.klasifikasi,
      beratGram: r.beratGram,
      beratKg: r.beratGram / 1000,
    }));

    await db.insert(rawMaterial).values(recordsToInsert);
  } catch (error) {
    console.error("Error saving raw material:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server saat menyimpan data"] },
    };
  }

  revalidatePath("/raw-material");
  return { success: true };
}

export async function deleteRawMaterial(id: number): Promise<ActionState> {
  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Hanya Superadmin yang dapat menghapus data."],
      },
    };
  }
  try {
    // Find the record first to get the period
    const record = await db.query.rawMaterial.findFirst({
      where: eq(rawMaterial.id, id),
    });

    if (record) {
      // Delete all records in that period
      await db
        .delete(rawMaterial)
        .where(eq(rawMaterial.periode, record.periode));
    }
    revalidatePath("/raw-material");
    return { success: true };
  } catch (error) {
    console.error("Error deleting raw material:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus data raw material"] },
    };
  }
}

export async function getRawMaterialByPeriod(periode: string) {
  try {
    return await db
      .select()
      .from(rawMaterial)
      .where(eq(rawMaterial.periode, periode));
  } catch (error) {
    console.error("Error fetching raw material by period:", error);
    return [];
  }
}

"use server";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { nasabah, setorSampah } from "@/db/schema";

// Helper: format tanggal Indonesia
function _formatTanggalIndo(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Fetch suggestions directly from DB based on search text, limited to 10
export async function getNasabahSuggestions(search = "") {
  const whereConditions = [];

  // Enforce role is either konsumen or warmiendo
  whereConditions.push(
    or(eq(nasabah.role, "konsumen"), eq(nasabah.role, "warmiendo")),
  );

  if (search) {
    whereConditions.push(ilike(nasabah.name, `%${search}%`));
  }

  return db
    .select({
      id: nasabah.id,
      userId: nasabah.id,
      name: nasabah.name,
      role: nasabah.role,
    })
    .from(nasabah)
    .where(and(...whereConditions))
    .orderBy(nasabah.name)
    .limit(10);
}

export async function createSetoranNasabah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userIdStr = formData.get("userId") as string;
  const jenisSampah = formData.get("jenisSampah") as string;
  const beratKgRaw = formData.get("beratKg") as string;
  const hargaPerKgRaw = formData.get("hargaPerKg") as string;
  const totalKreditRaw = formData.get("totalKredit") as string;
  const tanggalSetor = formData.get("tanggalSetor") as string;
  const catatan = (formData.get("catatan") as string) || null;

  if (
    !userIdStr ||
    !jenisSampah ||
    !beratKgRaw ||
    !hargaPerKgRaw ||
    !totalKreditRaw ||
    !tanggalSetor
  ) {
    return {
      success: false,
      errors: { _form: ["Semua input setoran wajib diisi."] },
    };
  }

  const userId = Number.parseInt(userIdStr, 10);
  const beratKg = Number.parseFloat(beratKgRaw);
  const totalKredit = Number.parseInt(totalKreditRaw, 10);

  if (
    Number.isNaN(userId) ||
    Number.isNaN(beratKg) ||
    Number.isNaN(totalKredit)
  ) {
    return {
      success: false,
      errors: { _form: ["Input numerik tidak valid."] },
    };
  }

  try {
    // 1. Fetch depositor info
    const depositor = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, userId),
    });

    if (!depositor) {
      return {
        success: false,
        errors: { userId: ["Nasabah tidak ditemukan."] },
      };
    }

    // Query next sequence value for auto-increment ID
    const nextValResult = await db.execute<{ nextval: string }>(
      sql`SELECT nextval('setor_sampah_id_seq')`,
    );
    const nextId = nextValResult.rows[0]?.nextval
      ? Number.parseInt(nextValResult.rows[0].nextval as string, 10)
      : 1;

    const dateParts = tanggalSetor.split("-");
    const tahun = dateParts[0] || "2026";
    const bulan = dateParts[1] || "01";
    const tanggal = dateParts[2] || "01";

    const roleToCode: Record<string, string> = {
      "bank-sampah": "K",
      warmiendo: "W",
      konsumen: "B",
    };
    const code = roleToCode[depositor.role] || "B";
    const nomorSetorFormatted = `${nextId}/${code}/NDL/BJM/${tanggal}/${bulan}/${tahun}`;

    const baseValues = {
      id: nextId,
      nomorSetor: nomorSetorFormatted,
      userId,
      jenisSampah: jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      beratKg,
      beratAiKg: null,
      tanggalSetor,
      fotoTimbangan: "tanpa_foto", // Skip waste pictures constraint
      fotoBuktiTambahan: [],
      catatan,
      totalPoin: totalKredit, // Store cash amount in totalPoin column for display
      status: "diterima" as const,
    };

    // 4. Insert setoran record based on depositor's role
    const setoranData = {
      ...baseValues,
      kategoriNasabah: depositor.role as
        | "konsumen"
        | "warmiendo"
        | "bank-sampah",
      metodeSetor: depositor.role === "warmiendo" ? "langsung" : null,
    };
    await db.insert(setorSampah).values(setoranData);

    // 5. Update user cash balance (kredit) directly
    await db
      .update(nasabah)
      .set({
        kredit: sql`${nasabah.kredit} + ${totalKredit}`,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, userId));
  } catch (error) {
    console.error("Error creating setoran nasabah by bank-sampah:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server saat menyimpan setoran"] },
    };
  }

  revalidatePath("/nasabah/bank-sampah-setor");
  return { success: true };
}

export async function getRiwayatSetoran(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const search = params?.search ?? "";
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;

  try {
    const filterConditions = [
      inArray(setorSampah.kategoriNasabah, ["konsumen", "warmiendo"]),
    ];

    if (search) {
      const searchOr = or(
        ilike(setorSampah.nomorSetor, `%${search}%`),
        ilike(setorSampah.catatan, `%${search}%`),
      );
      if (searchOr) {
        filterConditions.push(searchOr);
      }
    }

    const setoran = await db.query.setorSampah.findMany({
      where: and(...filterConditions),
      with: { user: true },
      orderBy: [desc(setorSampah.id)],
      limit: 200,
    });

    const merged = setoran.map((s) => ({
      id: s.id,
      nomorSetor: s.nomorSetor,
      userId: s.userId,
      jenisSampah: s.jenisSampah,
      beratKg: s.beratKg,
      tanggalSetor: s.tanggalSetor,
      catatan: s.catatan,
      totalPoin: s.totalPoin, // Holds the Rupiah value
      status: s.status,
      createdAt: s.createdAt,
      user: s.user,
    }));

    const total = merged.length;
    const paginated = merged.slice(offset, offset + limit);

    return { data: paginated, total };
  } catch (error) {
    console.error("Error fetching setoran history:", error);
    return { data: [], total: 0 };
  }
}

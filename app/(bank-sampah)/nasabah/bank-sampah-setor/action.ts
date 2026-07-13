"use server";

import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { buildNomorSetor, getNextSetorId } from "@/app/lib/setor-helper";
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

  // Enforce role is either konsumen or warmindo
  whereConditions.push(
    or(eq(nasabah.role, "konsumen"), eq(nasabah.role, "warmindo")),
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

    // Gunakan MAX(id)+1 agar nomor urut tidak loncat akibat gap sequence
    const nextId = await getNextSetorId();

    const nomorSetorFormatted = buildNomorSetor(
      nextId,
      depositor.role,
      tanggalSetor,
    );

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
        | "warmindo"
        | "bank-sampah",
      metodeSetor: depositor.role === "warmindo" ? "langsung" : null,
    };
    await db.insert(setorSampah).values(setoranData);
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
      inArray(setorSampah.kategoriNasabah, ["konsumen", "warmindo"]),
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

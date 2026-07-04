"use server";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  nasabah,
  setorSampahKonsumen,
  setorSampahWarmiendo,
  users,
} from "@/db/schema";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};

// Helper: format tanggal Indonesia
function formatTanggalIndo(dateStr: string): string {
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
    or(eq(users.role, "konsumen"), eq(users.role, "warmiendo")),
  );

  if (search) {
    whereConditions.push(ilike(users.name, `%${search}%`));
  }

  return db
    .select({
      id: nasabah.id,
      userId: nasabah.userId,
      name: users.name,
      role: users.role,
    })
    .from(nasabah)
    .innerJoin(users, eq(nasabah.userId, users.id))
    .where(and(...whereConditions))
    .orderBy(users.name)
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
  const tanggalSetor = formData.get("tanggalSetor") as string;
  const catatan = (formData.get("catatan") as string) || null;

  const userId = Number.parseInt(userIdStr, 10);
  if (Number.isNaN(userId)) {
    return {
      success: false,
      errors: { userId: ["Harap pilih nasabah"] },
    };
  }

  if (
    !jenisSampah ||
    !["Karton", "Etiket", "Paper Cup"].includes(jenisSampah)
  ) {
    return {
      success: false,
      errors: { jenisSampah: ["Jenis sampah tidak valid"] },
    };
  }

  const beratKg = Number.parseFloat(beratKgRaw);
  if (Number.isNaN(beratKg) || beratKg <= 0) {
    return {
      success: false,
      errors: { beratKg: ["Berat harus lebih besar dari 0 kg"] },
    };
  }

  const hargaPerKg = Number.parseFloat(hargaPerKgRaw);
  if (Number.isNaN(hargaPerKg) || hargaPerKg < 0) {
    return {
      success: false,
      errors: { hargaPerKg: ["Harga per kg harus minimal Rp 0"] },
    };
  }

  if (!tanggalSetor) {
    return {
      success: false,
      errors: { tanggalSetor: ["Tanggal setor wajib diisi"] },
    };
  }

  try {
    // 1. Get user details
    const depositor = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!depositor) {
      return {
        success: false,
        errors: { userId: ["Nasabah tidak ditemukan"] },
      };
    }

    // 2. Calculate cash reward based on manual price input
    const totalKredit = Math.round(beratKg * hargaPerKg);

    // 3. Generate nomorSetor
    const tanggalFormatted = formatTanggalIndo(tanggalSetor);
    const nomorSetor = `Setoran ${depositor.name} – ${tanggalFormatted}`;

    const baseValues = {
      nomorSetor,
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
    if (depositor.role === "warmiendo") {
      await db.insert(setorSampahWarmiendo).values({
        ...baseValues,
        metodeSetor: "langsung",
      });
    } else {
      await db.insert(setorSampahKonsumen).values(baseValues);
    }

    // 5. Update nasabah cash balance (kredit) without adding points
    const existingProfile = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, userId),
    });

    if (existingProfile) {
      await db
        .update(nasabah)
        .set({
          kredit: existingProfile.kredit + totalKredit,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.userId, userId));
    } else {
      await db.insert(nasabah).values({
        userId,
        poin: 0,
        kredit: totalKredit,
      });
    }
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
    // We get setoran history for both konsumen and warmiendo
    const filterConditionsK = [];
    const filterConditionsW = [];

    if (search) {
      filterConditionsK.push(
        or(
          ilike(setorSampahKonsumen.nomorSetor, `%${search}%`),
          ilike(setorSampahKonsumen.catatan, `%${search}%`),
        ),
      );
      filterConditionsW.push(
        or(
          ilike(setorSampahWarmiendo.nomorSetor, `%${search}%`),
          ilike(setorSampahWarmiendo.catatan, `%${search}%`),
        ),
      );
    }

    const whereK =
      filterConditionsK.length > 0 ? and(...filterConditionsK) : undefined;
    const whereW =
      filterConditionsW.length > 0 ? and(...filterConditionsW) : undefined;

    const [konsumenSetoran, warmiendoSetoran] = await Promise.all([
      db.query.setorSampahKonsumen.findMany({
        where: whereK,
        with: { user: true },
        orderBy: [desc(setorSampahKonsumen.id)],
        limit: 100,
      }),
      db.query.setorSampahWarmiendo.findMany({
        where: whereW,
        with: { user: true },
        orderBy: [desc(setorSampahWarmiendo.id)],
        limit: 100,
      }),
    ]);

    // Merge and sort in memory
    const merged = [
      ...konsumenSetoran.map((s) => ({
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
      })),
      ...warmiendoSetoran.map((s) => ({
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
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = merged.length;
    const paginated = merged.slice(offset, offset + limit);

    return { data: paginated, total };
  } catch (error) {
    console.error("Error fetching setoran history:", error);
    return { data: [], total: 0 };
  }
}

"use server";

import { randomUUID } from "node:crypto";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { readWeightFromImage } from "@/app/lib/gemini-weight-reader";
import { calculateSetoranReward } from "@/app/lib/pricing";
import { uploadImageToR2 } from "@/app/lib/r2";
import { getNextNomorUrut } from "@/app/lib/setor-helper";
import type {
  ActionState,
  JenisSumberSampah,
  SetorSampahItem,
} from "@/app/types";
import { db } from "@/db";
import { nasabah, poinSampah, setorSampah } from "@/db/schema";

async function getCurrentUser(): Promise<{
  id: number;
  name: string;
  role: string;
} | null> {
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

export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

export async function getWastePoints() {
  try {
    const points = await db.select().from(poinSampah);
    return points.reduce(
      (acc, item) => {
        acc[item.jenisSampah] = item.pointPerKg;
        return acc;
      },
      {} as Record<string, number>,
    );
  } catch (error) {
    console.error("Error fetching waste points:", error);
    return {};
  }
}

export async function validateFotoTimbangan(base64Image: string): Promise<{
  success: boolean;
  berat: number;
  message: string;
}> {
  try {
    const readResult = await readWeightFromImage(base64Image);

    if (
      !readResult.success ||
      readResult.berat === null ||
      readResult.berat === undefined ||
      readResult.berat <= 0
    ) {
      return {
        success: false,
        berat: 0,
        message:
          readResult.message ||
          "AI tidak dapat mendeteksi angka timbangan dengan jelas. Pastikan foto fokus dan angka timbangan terlihat terang.",
      };
    }

    return {
      success: true,
      berat: readResult.berat,
      message: "Berat timbangan berhasil dideteksi oleh AI.",
    };
  } catch (error) {
    console.error("Validasi AI foto timbangan gagal:", error);
    return {
      success: false,
      berat: 0,
      message: "Terjadi gangguan saat memvalidasi foto timbangan via AI.",
    };
  }
}

export async function submitJemputSampah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "bank-sampah-b") {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Sesi Bank Sampah Tipe B tidak valid."],
      },
    };
  }

  const jenisSampah = formData.get("jenisSampah") as string;
  const beratKgRaw = formData.get("beratKg") as string;
  const beratAiKgRaw = formData.get("beratAiKg") as string;
  const tanggalSetor = formData.get("tanggalSetor") as string;
  const sumberSampah = formData.get("sumberSampah") as JenisSumberSampah;
  const fotoTimbanganBase64 = formData.get("fotoTimbangan") as string;
  const isManualValidation = formData.get("requestManualValidation") === "true";
  const fotoBuktiTambahanBase64 = formData.getAll(
    "fotoBuktiTambahan",
  ) as string[];
  const catatan = (formData.get("catatan") as string) || null;

  // Validasi input
  if (!jenisSampah || !beratKgRaw || !tanggalSetor || !fotoTimbanganBase64) {
    return {
      success: false,
      errors: {
        _form: [
          "Jenis sampah, berat timbangan, tanggal, dan foto timbangan wajib diisi.",
        ],
      },
    };
  }

  const validSumber: JenisSumberSampah[] = [
    "Warmindo",
    "Karyawan",
    "Factory Visit",
    "Masyarakat",
  ];
  if (!sumberSampah || !validSumber.includes(sumberSampah)) {
    return {
      success: false,
      errors: {
        sumberSampah: [
          "Sumber sampah wajib dipilih (Warmindo, Karyawan, Factory Visit, atau Masyarakat).",
        ],
      },
    };
  }

  const beratKg = Number.parseFloat(beratKgRaw);
  if (Number.isNaN(beratKg) || beratKg <= 0) {
    return {
      success: false,
      errors: { beratKg: ["Berat sampah harus berupa angka positif."] },
    };
  }

  try {
    const uuid = randomUUID();
    const fotoTimbanganUrl = await uploadImageToR2(
      fotoTimbanganBase64,
      "setoran-timbangan",
      `${user.id}-${uuid}`,
    );

    // Foto bukti tambahan bersifat opsional untuk Bank Sampah Tipe B
    const fotoBuktiUrls: string[] = [];
    let count = 1;
    for (const base64 of fotoBuktiTambahanBase64) {
      if (base64 && base64.trim() !== "") {
        const url = await uploadImageToR2(
          base64,
          "setoran-bukti-tambahan",
          `${user.id}-${uuid}-${count}`,
        );
        fotoBuktiUrls.push(url);
        count++;
      }
    }

    // Hitung poin (sama seperti konsumen via pricing engine)
    const { totalPoin } = await calculateSetoranReward(
      jenisSampah,
      beratKg,
      "bank-sampah-b",
    );

    // Generate nomor setor otomatis
    const nextUrut = await getNextNomorUrut();
    const nomorSetor = String(nextUrut);

    // Tentukan status setoran:
    // Jika AI sukses -> langsung 'diterima' & poin langsung bertambah
    // Jika manual validation diajukan ke admin -> 'pending' & poin bertambah setelah disetujui admin
    const finalStatus = isManualValidation ? "pending" : "diterima";

    await db.transaction(async (tx) => {
      await tx.insert(setorSampah).values({
        nomorSetor,
        userId: user.id,
        jenisSampah: jenisSampah as "Karton" | "Etiket" | "Paper Cup",
        beratKg,
        beratAiKg:
          !isManualValidation && beratAiKgRaw
            ? Number.parseFloat(beratAiKgRaw)
            : null,
        tanggalSetor,
        fotoTimbangan: fotoTimbanganUrl,
        fotoBuktiTambahan: fotoBuktiUrls,
        catatan,
        totalPoin: isManualValidation ? 0 : totalPoin,
        status: finalStatus,
        kategoriNasabah: "bank-sampah-b",
        sumberSampah,
      });

      // Tambahkan poin ke profil nasabah HANYA jika langsung diterima (validasi AI)
      if (!isManualValidation) {
        await tx
          .update(nasabah)
          .set({
            poin: sql`COALESCE(${nasabah.poin}, 0) + ${totalPoin}`,
            updatedAt: new Date(),
          })
          .where(eq(nasabah.id, user.id));
      }
    });

    revalidatePath("/dashboard/bank-sampah-b-dashboard");
    revalidatePath("/laporan/bank-sampah-b-laporan");
    revalidatePath("/setor-sampah/bank-sampah-b-setor");

    return {
      success: true,
      message: isManualValidation
        ? "Setoran penjemputan berhasil diajukan untuk validasi manual oleh Admin! Poin reward akan masuk setelah diverifikasi."
        : `Setoran penjemputan berhasil diverifikasi AI dan dicatat! Anda mendapatkan +${totalPoin} Poin.`,
    };
  } catch (error) {
    console.error("Gagal submit jemput sampah Tipe B:", error);
    return {
      success: false,
      errors: {
        _form: [
          "Terjadi kesalahan server saat menyimpan data penjemputan sampah.",
        ],
      },
    };
  }
}

export async function getMySetoranB(params?: {
  page?: number;
  limit?: number;
  search?: string;
  jenisSampah?: string;
  sumberSampah?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  data: SetorSampahItem[];
  total: number;
  totalBerat: number;
  totalPoin: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: [], total: 0, totalBerat: 0, totalPoin: 0 };
  }

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const jenisSampah = params?.jenisSampah ?? "";
  const sumberSampah = params?.sumberSampah ?? "";
  const sortBy = params?.sortBy ?? "createdAt";
  const sortOrder = params?.sortOrder ?? "desc";

  const conditions = [
    eq(setorSampah.userId, user.id),
    eq(setorSampah.kategoriNasabah, "bank-sampah-b"),
  ];

  if (jenisSampah) {
    conditions.push(
      eq(
        setorSampah.jenisSampah,
        jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      ),
    );
  }

  if (sumberSampah) {
    conditions.push(eq(setorSampah.sumberSampah, sumberSampah));
  }

  if (search) {
    const searchFilter = or(
      ilike(setorSampah.nomorSetor, `%${search}%`),
      ilike(setorSampah.catatan, `%${search}%`),
      ilike(setorSampah.sumberSampah, `%${search}%`),
    );
    if (searchFilter) {
      conditions.push(searchFilter);
    }
  }

  const whereClause = and(...conditions);

  const [countRes, records] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`,
        totalBerat: sql<number>`COALESCE(sum(${setorSampah.beratKg}), 0)`,
        totalPoin: sql<number>`COALESCE(sum(${setorSampah.totalPoin}), 0)`,
      })
      .from(setorSampah)
      .where(whereClause),
    db.query.setorSampah.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [
        sortOrder === "asc"
          ? sql`${setorSampah[sortBy as keyof typeof setorSampah._.columns] || setorSampah.createdAt} ASC`
          : sql`${setorSampah[sortBy as keyof typeof setorSampah._.columns] || setorSampah.createdAt} DESC`,
      ],
    }),
  ]);

  const mappedData: SetorSampahItem[] = records.map((r) => ({
    id: r.id,
    nomorSetor: r.nomorSetor,
    jenisSampah: r.jenisSampah,
    beratKg: r.beratKg,
    totalPoin: r.totalPoin,
    tanggalSetor: r.tanggalSetor,
    status: r.status,
    createdAt: r.createdAt,
    fotoTimbangan: r.fotoTimbangan || "",
    fotoBuktiTambahan: r.fotoBuktiTambahan,
    catatan: r.catatan,
    sumberSampah: r.sumberSampah,
  }));

  return {
    data: mappedData,
    total: Number(countRes[0]?.count ?? 0),
    totalBerat: Number(countRes[0]?.totalBerat ?? 0),
    totalPoin: Number(countRes[0]?.totalPoin ?? 0),
  };
}

"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { uploadPdfToR2 } from "@/app/lib/r2";
import type {
  ActionState,
  KategoriMitraPerjanjian,
  SuratPerjanjianItem,
  SuratPerjanjianSummary,
} from "@/app/types";
import { db } from "@/db";
import { nasabah, suratPerjanjian } from "@/db/schema";

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
      username: string;
    };
  } catch {
    return null;
  }
}

/**
 * Menghitung tanggal 1 bulan setelah tanggal mulai.
 * Contoh: 2026-09-30 -> 2026-10-30
 */
export async function calculateOneMonthExpiry(
  startDateStr: string,
): Promise<string> {
  const date = new Date(startDateStr);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split("T")[0];
}

/**
 * Menghitung jumlah surat yang saat ini berstatus expired / sudah lewat 1 bulan
 * untuk ditampilkan sebagai badgeCount merah di sidebar menu admin.
 */
export async function getExpiredPksCount(): Promise<number> {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // Ambil surat yang tidak berstatus 'diarsipkan' dan tanggal berakhirnya sudah lewat dari hari ini
    const expiredList = await db.query.suratPerjanjian.findMany({
      where: and(
        eq(suratPerjanjian.status, "aktif"),
        lte(suratPerjanjian.tanggalBerakhir, todayStr),
      ),
    });

    return expiredList.length;
  } catch (error) {
    console.error("Gagal menghitung expired PKS count:", error);
    return 0;
  }
}

/**
 * Mengambil daftar surat perjanjian kerja sama dengan filter, pencarian, dan kalkulasi sisa hari.
 */
export async function getSuratPerjanjianList(params?: {
  search?: string;
  status?: string;
  kategoriMitra?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: SuratPerjanjianItem[];
  total: number;
  summary: SuratPerjanjianSummary;
}> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return {
      data: [],
      total: 0,
      summary: {
        totalAktif: 0,
        totalExpired: 0,
        totalDiarsipkan: 0,
        totalMitra: 0,
      },
    };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Ambil seluruh data surat perjanjian beserta data mitranya
    const allSurat = await db.query.suratPerjanjian.findMany({
      with: {
        mitra: {
          columns: {
            id: true,
            name: true,
            role: true,
            noTelepon: true,
            alamat: true,
          },
        },
      },
      orderBy: [desc(suratPerjanjian.id)],
    });

    // Otomatis sinkronisasi status expired jika tanggal berakhir sudah lewat dan masih 'aktif'
    const toUpdateExpiredIds: number[] = [];
    for (const s of allSurat) {
      if (s.status === "aktif" && s.tanggalBerakhir < todayStr) {
        toUpdateExpiredIds.push(s.id);
      }
    }

    if (toUpdateExpiredIds.length > 0) {
      await db
        .update(suratPerjanjian)
        .set({ status: "expired", updatedAt: new Date() })
        .where(inArray(suratPerjanjian.id, toUpdateExpiredIds));
    }

    // Mapping item dan hitung sisa hari
    const mapped: SuratPerjanjianItem[] = allSurat.map((item) => {
      const expDate = new Date(item.tanggalBerakhir);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Jika surat aktif tapi tanggalBerakhir sudah lewat -> tandai expired
      const isPast = diffDays < 0;
      let finalStatus = item.status;
      if (item.status === "aktif" && isPast) {
        finalStatus = "expired";
      }

      return {
        ...item,
        status: finalStatus,
        kategoriMitra: item.kategoriMitra as KategoriMitraPerjanjian,
        sisaHari: diffDays,
        isExpired: isPast && item.status !== "diarsipkan",
      };
    });

    // Hitung ringkasan
    const uniqueMitraIds = new Set(
      mapped
        .filter((s) => s.status === "aktif" || s.status === "expired")
        .map((s) => s.userId),
    );

    const summary: SuratPerjanjianSummary = {
      totalAktif: mapped.filter((s) => s.status === "aktif").length,
      totalExpired: mapped.filter((s) => s.status === "expired").length,
      totalDiarsipkan: mapped.filter((s) => s.status === "diarsipkan").length,
      totalMitra: uniqueMitraIds.size,
    };

    // Filter
    let filtered = mapped;

    if (params?.status && params.status !== "Semua") {
      filtered = filtered.filter((s) => s.status === params.status);
    }

    if (params?.kategoriMitra && params.kategoriMitra !== "Semua") {
      filtered = filtered.filter(
        (s) => s.kategoriMitra === params.kategoriMitra,
      );
    }

    if (params?.search && params.search.trim() !== "") {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.nomorSurat.toLowerCase().includes(q) ||
          s.judul.toLowerCase().includes(q) ||
          s.mitra?.name?.toLowerCase().includes(q) ||
          s.catatan?.toLowerCase().includes(q),
      );
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: paginated,
      total: filtered.length,
      summary,
    };
  } catch (error) {
    console.error("Gagal mengambil data surat perjanjian:", error);
    return {
      data: [],
      total: 0,
      summary: {
        totalAktif: 0,
        totalExpired: 0,
        totalDiarsipkan: 0,
        totalMitra: 0,
      },
    };
  }
}

/**
 * Mengambil daftar mitra yang valid (Bank Sampah Tipe A, Tipe B, atau Warmindo)
 * untuk pilihan dropdown saat membuat atau memperpanjang surat.
 */
export async function getMitraOptions(): Promise<
  {
    id: number;
    name: string;
    role: string;
    lokasi?: string | null;
    noHp?: string | null;
    alamat?: string | null;
    activeSurat?: SuratPerjanjianItem | null;
  }[]
> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return [];
  }

  try {
    const mitras = await db.query.nasabah.findMany({
      where: inArray(nasabah.role, [
        "bank-sampah",
        "bank-sampah-b",
        "warmindo",
      ]),
      orderBy: [nasabah.name],
      with: {
        suratPerjanjian: {
          orderBy: [desc(suratPerjanjian.id)],
          limit: 1,
        },
      },
    });

    return mitras.map((m) => {
      const latest = m.suratPerjanjian?.[0];
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        noTelepon: m.noTelepon,
        alamat: m.alamat,
        activeSurat: latest
          ? ({
              ...latest,
              kategoriMitra: latest.kategoriMitra as KategoriMitraPerjanjian,
            } as SuratPerjanjianItem)
          : null,
      };
    });
  } catch (error) {
    console.error("Gagal mengambil opsi mitra:", error);
    return [];
  }
}

/**
 * Mengambil histori arsip surat-surat sebelumnya milik mitra tertentu.
 */
export async function getSuratHistoryByMitra(
  userId: number,
): Promise<SuratPerjanjianItem[]> {
  try {
    const list = await db.query.suratPerjanjian.findMany({
      where: eq(suratPerjanjian.userId, userId),
      with: {
        mitra: true,
      },
      orderBy: [desc(suratPerjanjian.id)],
    });

    return list.map((item) => ({
      ...item,
      kategoriMitra: item.kategoriMitra as KategoriMitraPerjanjian,
    }));
  } catch (error) {
    console.error("Gagal mengambil histori surat mitra:", error);
    return [];
  }
}

/**
 * Membuat surat perjanjian kerja sama baru (masa berlaku 1 bulan).
 */
export async function createSuratPerjanjian(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return {
      success: false,
      errors: { _form: ["Akses ditolak. Hanya admin yang berwenang."] },
    };
  }

  const userId = Number(formData.get("userId"));
  const nomorSurat = (formData.get("nomorSurat") as string)?.trim();
  const judul = (formData.get("judul") as string)?.trim();
  const tanggalMulai = formData.get("tanggalMulai") as string;
  const catatan = (formData.get("catatan") as string)?.trim() || null;
  const pdfBase64 = formData.get("pdfBase64") as string;
  const originalFileName =
    (formData.get("fileName") as string) || "surat-perjanjian.pdf";

  if (!userId || !nomorSurat || !judul || !tanggalMulai || !pdfBase64) {
    return {
      success: false,
      errors: {
        _form: [
          "Mitra, nomor surat, perihal judul, tanggal mulai, dan file PDF wajib diisi.",
        ],
      },
    };
  }

  try {
    // Ambil data mitra
    const mitraData = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, userId),
    });

    if (!mitraData) {
      return {
        success: false,
        errors: { _form: ["Data mitra tidak ditemukan."] },
      };
    }

    // Cek duplikasi nomor surat
    const existingNomor = await db.query.suratPerjanjian.findFirst({
      where: eq(suratPerjanjian.nomorSurat, nomorSurat),
    });

    if (existingNomor) {
      return {
        success: false,
        errors: {
          nomorSurat: [
            "Nomor surat perjanjian sudah digunakan. Gunakan nomor lain.",
          ],
        },
      };
    }

    // Hitung tanggal berakhir: 1 bulan setelah tanggal mulai
    const tanggalBerakhir = await calculateOneMonthExpiry(tanggalMulai);

    // Upload PDF ke Cloudflare R2
    const uuid = randomUUID();
    const cleanFilename = `${userId}-${uuid}`;
    const fileUrl = await uploadPdfToR2(
      pdfBase64,
      "perjanjian-kerjasama",
      cleanFilename,
    );

    // Hitung ukuran file perkiraan dari base64
    const fileSize = Math.round((pdfBase64.length * 3) / 4);

    // Simpan ke database
    await db.insert(suratPerjanjian).values({
      nomorSurat,
      judul,
      userId,
      kategoriMitra: mitraData.role,
      fileUrl,
      fileName: originalFileName,
      fileSize,
      tanggalMulai,
      tanggalBerakhir,
      status: "aktif",
      catatan,
    });

    revalidatePath("/perjanjian-kerjasama");

    return {
      success: true,
      message: `Surat Perjanjian Kerja Sama (${nomorSurat}) untuk ${mitraData.name} berhasil dibuat dengan masa berlaku 1 bulan (s.d. ${tanggalBerakhir}).`,
    };
  } catch (error) {
    console.error("Gagal membuat surat perjanjian:", error);
    return {
      success: false,
      errors: {
        _form: ["Terjadi kesalahan server saat menyimpan surat perjanjian."],
      },
    };
  }
}

/**
 * Memperpanjang surat perjanjian kerja sama:
 * - Surat lama otomatis berstatus 'diarsipkan' (riwayat data tetap utuh dan tersimpan)
 * - Surat baru dibuat dengan status 'aktif' dan masa berlaku 1 bulan baru
 */
export async function renewSuratPerjanjian(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return {
      success: false,
      errors: { _form: ["Akses ditolak. Hanya admin yang berwenang."] },
    };
  }

  const suratLamaId = Number(formData.get("suratLamaId"));
  const nomorSuratBaru = (formData.get("nomorSurat") as string)?.trim();
  const judul = (formData.get("judul") as string)?.trim();
  const tanggalMulai = formData.get("tanggalMulai") as string;
  const catatan = (formData.get("catatan") as string)?.trim() || null;
  const pdfBase64 = formData.get("pdfBase64") as string;
  const originalFileName =
    (formData.get("fileName") as string) || "perpanjangan-spk.pdf";

  if (
    !suratLamaId ||
    !nomorSuratBaru ||
    !judul ||
    !tanggalMulai ||
    !pdfBase64
  ) {
    return {
      success: false,
      errors: {
        _form: [
          "Data perpanjangan surat belum lengkap. Pastikan nomor surat baru, tanggal mulai, dan file PDF baru sudah diisi.",
        ],
      },
    };
  }

  try {
    // 1. Ambil surat lama
    const suratLama = await db.query.suratPerjanjian.findFirst({
      where: eq(suratPerjanjian.id, suratLamaId),
      with: {
        mitra: true,
      },
    });

    if (!suratLama) {
      return {
        success: false,
        errors: {
          _form: ["Surat perjanjian yang ingin diperpanjang tidak ditemukan."],
        },
      };
    }

    // 2. Cek nomor surat baru
    const duplicate = await db.query.suratPerjanjian.findFirst({
      where: eq(suratPerjanjian.nomorSurat, nomorSuratBaru),
    });

    if (duplicate) {
      return {
        success: false,
        errors: {
          nomorSurat: [
            "Nomor surat baru ini sudah digunakan. Harap gunakan nomor lain.",
          ],
        },
      };
    }

    // 3. Hitung tanggal berakhir 1 bulan ke depan
    const tanggalBerakhir = await calculateOneMonthExpiry(tanggalMulai);

    // 4. Upload PDF baru ke Cloudflare R2
    const uuid = randomUUID();
    const cleanFilename = `${suratLama.userId}-renew-${uuid}`;
    const fileUrl = await uploadPdfToR2(
      pdfBase64,
      "perjanjian-kerjasama",
      cleanFilename,
    );
    const fileSize = Math.round((pdfBase64.length * 3) / 4);

    // 5. Transaksi: Arsipkan surat lama & insert surat baru
    await db.transaction(async (tx) => {
      // Ubah status surat lama menjadi 'diarsipkan'
      await tx
        .update(suratPerjanjian)
        .set({
          status: "diarsipkan",
          updatedAt: new Date(),
        })
        .where(eq(suratPerjanjian.id, suratLamaId));

      // Buat surat perpanjangan baru yang menunjuk ke surat lama
      await tx.insert(suratPerjanjian).values({
        nomorSurat: nomorSuratBaru,
        judul,
        userId: suratLama.userId,
        kategoriMitra: suratLama.kategoriMitra,
        fileUrl,
        fileName: originalFileName,
        fileSize,
        tanggalMulai,
        tanggalBerakhir,
        status: "aktif",
        suratSebelumnyaId: suratLamaId,
        catatan,
      });
    });

    revalidatePath("/perjanjian-kerjasama");

    return {
      success: true,
      message: `Perpanjangan Surat Kerja Sama untuk ${suratLama.mitra.name} berhasil disimpan! Surat lama telah diarsipkan dan surat baru aktif hingga ${tanggalBerakhir}.`,
    };
  } catch (error) {
    console.error("Gagal memperpanjang surat perjanjian:", error);
    return {
      success: false,
      errors: {
        _form: [
          "Terjadi kesalahan saat memproses perpanjangan surat perjanjian.",
        ],
      },
    };
  }
}

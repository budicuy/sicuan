"use server";

import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { uploadImageToR2 } from "@/app/lib/r2";
import { db } from "@/db";
import { nasabah, pencairanDana, users } from "@/db/schema";

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
      username: string;
    };
    return payload;
  } catch {
    return null;
  }
}

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function getDisbursementData() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmiendo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.userId, user.id),
  });

  return {
    success: true,
    data: {
      kredit: profile?.kredit ?? 0,
      jenisBank: profile?.jenisBank || "",
      noRekening: profile?.noRekening || "",
      user: {
        name: user.name,
        role: user.role,
      },
    },
  };
}

export async function requestDisbursement(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmiendo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  const jumlahStr = formData.get("jumlah") as string;
  const jumlah = Number.parseInt(jumlahStr, 10);

  if (Number.isNaN(jumlah) || jumlah <= 0) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: { jumlah: ["Jumlah pencairan harus berupa angka positif"] },
    };
  }

  if (jumlah < 10000) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: { jumlah: ["Minimal pencairan adalah Rp 10.000"] },
    };
  }

  // Get nasabah profile
  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.userId, user.id),
  });

  if (!profile) {
    return {
      success: false,
      message:
        "Profil nasabah tidak ditemukan. Harap lengkapi profil Anda terlebih dahulu.",
    };
  }

  if (!profile.jenisBank || !profile.noRekening) {
    return {
      success: false,
      message:
        "Informasi rekening bank belum diisi. Silakan lengkapi di menu Profil Saya.",
      errors: {
        _form: ["Informasi rekening bank tidak lengkap"],
      },
    };
  }

  if (profile.kredit < jumlah) {
    return {
      success: false,
      message: `Saldo kredit tidak mencukupi. Saldo Anda saat ini Rp ${profile.kredit.toLocaleString("id-ID")}`,
      errors: { jumlah: ["Saldo kredit tidak mencukupi"] },
    };
  }

  try {
    // 1. Deduct from nasabah credit
    await db
      .update(nasabah)
      .set({
        kredit: profile.kredit - jumlah,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.userId, user.id));

    // 2. Insert disbursement log (defaults to "pending")
    await db.insert(pencairanDana).values({
      userId: user.id,
      jumlah,
      jenisBank: profile.jenisBank,
      noRekening: profile.noRekening,
      status: "pending",
    });

    revalidatePath("/ajukan-pencairan-dana/bank-sampah-pencairan");
    return {
      success: true,
      message: `Pencairan dana sebesar Rp ${jumlah.toLocaleString("id-ID")} berhasil diajukan dan sedang menunggu verifikasi manual oleh admin.`,
    };
  } catch (error) {
    console.error("Disbursement error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memproses pencairan dana.",
    };
  }
}

export async function getDisbursementHistory() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db
    .select()
    .from(pencairanDana)
    .where(eq(pencairanDana.userId, user.id))
    .orderBy(desc(pencairanDana.createdAt));
}

// ── ADMIN / SUPERADMIN OPERATIONS ───────────────────────────────────────────

export async function getAllDisbursementsForAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    throw new Error("Unauthorized");
  }

  return db
    .select({
      id: pencairanDana.id,
      userId: pencairanDana.userId,
      jumlah: pencairanDana.jumlah,
      jenisBank: pencairanDana.jenisBank,
      noRekening: pencairanDana.noRekening,
      status: pencairanDana.status,
      buktiTransfer: pencairanDana.buktiTransfer,
      createdAt: pencairanDana.createdAt,
      user: {
        name: users.name,
        username: users.username,
        role: users.role,
      },
    })
    .from(pencairanDana)
    .innerJoin(users, eq(pencairanDana.userId, users.id))
    .orderBy(desc(pencairanDana.createdAt));
}

export async function approveDisbursement(
  id: number,
  buktiTransferBase64: string,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  if (!buktiTransferBase64) {
    return {
      success: false,
      message: "Bukti transfer berupa foto wajib diunggah",
    };
  }

  try {
    // 1. Fetch request
    const request = await db.query.pencairanDana.findFirst({
      where: eq(pencairanDana.id, id),
    });

    if (!request) {
      return {
        success: false,
        message: "Permintaan pencairan tidak ditemukan",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "Permintaan sudah diproses sebelumnya",
      };
    }

    // 2. Upload proof to R2
    const uuid = randomUUID();
    const buktiUrl = await uploadImageToR2(
      buktiTransferBase64,
      "transfer",
      `${request.userId}-${uuid}`,
    );

    // 3. Update status and save proof
    await db
      .update(pencairanDana)
      .set({
        status: "berhasil",
        buktiTransfer: buktiUrl,
      })
      .where(eq(pencairanDana.id, id));

    revalidatePath("/pencairan-dana");
    return {
      success: true,
      message: "Permintaan pencairan dana berhasil disetujui.",
    };
  } catch (error) {
    console.error("Error approving disbursement:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menyetujui pencairan.",
    };
  }
}

export async function rejectDisbursement(
  id: number,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  try {
    // 1. Fetch request
    const request = await db.query.pencairanDana.findFirst({
      where: eq(pencairanDana.id, id),
    });

    if (!request) {
      return {
        success: false,
        message: "Permintaan pencairan tidak ditemukan",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "Permintaan sudah diproses sebelumnya",
      };
    }

    // 2. Refund to nasabah
    const profile = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, request.userId),
    });

    if (profile) {
      await db
        .update(nasabah)
        .set({
          kredit: profile.kredit + request.jumlah,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.userId, request.userId));
    }

    // 3. Update status to ditolak
    await db
      .update(pencairanDana)
      .set({
        status: "ditolak",
      })
      .where(eq(pencairanDana.id, id));

    revalidatePath("/pencairan-dana");
    return {
      success: true,
      message:
        "Permintaan pencairan dana berhasil ditolak dan saldo dikembalikan.",
    };
  } catch (error) {
    console.error("Error rejecting disbursement:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menolak pencairan.",
    };
  }
}

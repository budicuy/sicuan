"use server";

import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import { uploadImageToR2, uploadVideoToR2 } from "@/app/lib/r2";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { videoPost } from "@/db/schema";

function cleanUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.includes(".r2.dev/")) {
    const parts = url.split(".r2.dev/");
    return `/api/media/${parts[1]}`;
  }
  return url;
}

/**
 * Pengecekan hak akses Superadmin
 */
export async function checkIsSuperadmin() {
  return verifyIsSuperadmin();
}

/**
 * Mengambil semua slide media aktif untuk tayang di Login & Dashboard (Carousel Slider).
 */
export async function getActiveMediaSlider() {
  try {
    const items = await db.query.videoPost.findMany({
      where: eq(videoPost.isActive, true),
      orderBy: [asc(videoPost.urutan), asc(videoPost.id)],
    });

    return items.map((item) => ({
      ...item,
      mediaUrl: cleanUrl(item.mediaUrl || item.videoUrl),
      videoUrl: cleanUrl(item.videoUrl),
    }));
  } catch (error) {
    console.error("Gagal mengambil active media slider:", error);
    return [];
  }
}

/**
 * Kompatibilitas mundur: mengambil slide video/media pertama yang aktif.
 */
export async function getActiveVideoPost() {
  try {
    const items = await getActiveMediaSlider();
    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error("Gagal mengambil active video post:", error);
    return null;
  }
}

/**
 * Mengambil seluruh daftar media slider untuk halaman konfigurasi Superadmin.
 */
export async function getAllMediaSlider() {
  try {
    const items = await db.query.videoPost.findMany({
      orderBy: [asc(videoPost.urutan), asc(videoPost.id)],
    });

    // Inisialisasi default jika tabel masih kosong
    if (items.length === 0) {
      const [inserted] = await db
        .insert(videoPost)
        .values({
          tipe: "video",
          mediaUrl: "/edukasi.mp4",
          videoUrl: "/edukasi.mp4",
          urutan: 0,
          isActive: true,
        })
        .returning();
      return [
        {
          ...inserted,
          mediaUrl: inserted.mediaUrl || inserted.videoUrl || "",
        },
      ];
    }

    return items.map((item) => ({
      ...item,
      mediaUrl: cleanUrl(item.mediaUrl || item.videoUrl),
      videoUrl: cleanUrl(item.videoUrl),
    }));
  } catch (error) {
    console.error("Gagal mengambil media slider list:", error);
    return [];
  }
}

/**
 * Kompatibilitas: mengambil 1 media post untuk fallback.
 */
export async function getVideoPost() {
  const all = await getAllMediaSlider();
  return all.length > 0 ? all[0] : null;
}

const addMediaSchema = z.object({
  tipe: z.enum(["video", "gambar"]),
  mediaUrl: z.string().min(1, "File media atau URL wajib diisi"),
});

/**
 * Menambahkan slide media baru (Foto atau Video) ke dalam slider.
 */
export async function addMediaSlide(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: {
        _form: ["Hanya Superadmin yang berhak mengelola Media Slider."],
      },
    };
  }

  const tipe = (formData.get("tipe") as "video" | "gambar") || "video";
  const urlInput = (formData.get("urlInput") as string) || "";
  const fileBase64 = (formData.get("fileBase64") as string) || "";

  let finalMediaUrl = urlInput.trim();

  try {
    if (fileBase64 && fileBase64.trim() !== "") {
      const uuid = randomUUID();

      if (tipe === "video") {
        const buffer = Buffer.from(
          fileBase64.replace(/^data:video\/\w+;base64,/, ""),
          "base64",
        );
        if (buffer.length > 20 * 1024 * 1024) {
          return {
            success: false,
            errors: {
              mediaUrl: [
                "Ukuran file video melebihi 20 MB. Silakan kompresi atau gunakan direct URL.",
              ],
            },
          };
        }
        finalMediaUrl = await uploadVideoToR2(buffer, `slide-${uuid}.mp4`);
      } else {
        // Foto / Gambar
        const buffer = Buffer.from(
          fileBase64.replace(/^data:image\/\w+;base64,/, ""),
          "base64",
        );
        if (buffer.length > 5 * 1024 * 1024) {
          return {
            success: false,
            errors: {
              mediaUrl: [
                "Ukuran file foto melebihi 5 MB. Silakan gunakan foto yang lebih kecil.",
              ],
            },
          };
        }
        finalMediaUrl = await uploadImageToR2(
          buffer,
          "slider-photos",
          `photo-${uuid}`,
        );
      }
    }

    const parsed = addMediaSchema.safeParse({
      tipe,
      mediaUrl: cleanUrl(finalMediaUrl),
    });

    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Tentukan urutan terakhir
    const existing = await db.query.videoPost.findMany({
      orderBy: [desc(videoPost.urutan)],
      limit: 1,
    });
    const nextUrutan = existing.length > 0 ? (existing[0].urutan ?? 0) + 1 : 0;

    await db.insert(videoPost).values({
      tipe: parsed.data.tipe,
      mediaUrl: parsed.data.mediaUrl,
      videoUrl: parsed.data.tipe === "video" ? parsed.data.mediaUrl : null,
      urutan: nextUrutan,
      isActive: true,
    });

    revalidatePaths();
    return { success: true };
  } catch (error) {
    console.error("Gagal menambahkan media slide:", error);
    return {
      success: false,
      errors: {
        _form: ["Terjadi kesalahan server saat menambahkan media slider."],
      },
    };
  }
}

/**
 * Menghapus 1 slide media dari slider.
 */
export async function deleteMediaSlide(id: number): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: { _form: ["Akses ditolak."] },
    };
  }

  try {
    await db.delete(videoPost).where(eq(videoPost.id, id));
    revalidatePaths();
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus slide media:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus slide media."] },
    };
  }
}

/**
 * Toggle status aktif/nonaktif slide media.
 */
export async function toggleMediaSlideStatus(
  id: number,
  makeActive: boolean,
): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: { _form: ["Akses ditolak."] },
    };
  }

  try {
    await db
      .update(videoPost)
      .set({ isActive: makeActive, updatedAt: new Date() })
      .where(eq(videoPost.id, id));

    revalidatePaths();
    return { success: true };
  } catch (error) {
    console.error("Gagal mengubah status slide:", error);
    return {
      success: false,
      errors: { _form: ["Gagal mengubah status penayangan slide."] },
    };
  }
}

/**
 * Mengubah posisi urutan slide (naik atau turun).
 */
export async function moveMediaSlideOrder(
  id: number,
  direction: "up" | "down",
): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: { _form: ["Akses ditolak."] },
    };
  }

  try {
    const items = await db.query.videoPost.findMany({
      orderBy: [asc(videoPost.urutan), asc(videoPost.id)],
    });

    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex === -1) {
      return { success: false, errors: { _form: ["Slide tidak ditemukan."] } };
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) {
      return { success: true }; // Sudah di ujung
    }

    const currentItem = items[currentIndex];
    const targetItem = items[targetIndex];

    const tempUrutan = currentItem.urutan ?? currentIndex;
    const targetUrutan = targetItem.urutan ?? targetIndex;

    // Swap urutan
    await db
      .update(videoPost)
      .set({ urutan: targetUrutan, updatedAt: new Date() })
      .where(eq(videoPost.id, currentItem.id));

    await db
      .update(videoPost)
      .set({ urutan: tempUrutan, updatedAt: new Date() })
      .where(eq(videoPost.id, targetItem.id));

    revalidatePaths();
    return { success: true };
  } catch (error) {
    console.error("Gagal mengubah urutan slide:", error);
    return {
      success: false,
      errors: { _form: ["Gagal mengubah urutan slide."] },
    };
  }
}

function revalidatePaths() {
  revalidatePath("/video-post");
  revalidatePath("/login");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/warmindo-dashboard");
  revalidatePath("/dashboard/bank-sampah-dashboard");
}

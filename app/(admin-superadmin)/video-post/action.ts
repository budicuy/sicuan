"use server";

import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import { uploadImageToR2, uploadVideoToR2 } from "@/app/lib/r2";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { videoPost } from "@/db/schema";

/**
 * Mengambil data video post aktif untuk tayang di Login & Dashboard.
 */
export async function getActiveVideoPost() {
  try {
    const video = await db.query.videoPost.findFirst({
      where: eq(videoPost.isActive, true),
      orderBy: [desc(videoPost.id)],
    });
    return video || null;
  } catch (error) {
    console.error("Gagal mengambil active video post:", error);
    return null;
  }
}

/**
 * Mengambil data single video post untuk konfigurasi di halaman Admin.
 */
export async function getVideoPost() {
  try {
    let video = await db.query.videoPost.findFirst({
      orderBy: [desc(videoPost.id)],
    });

    // Jika belum ada record sama sekali, buat 1 record default
    if (!video) {
      const [inserted] = await db
        .insert(videoPost)
        .values({
          judul: "Program Daur Ulang Kemasan Indofood SICUAN",
          deskripsi:
            "Video panduan dan edukasi pengumpulan sampah kemasan Indofood bersama Bank Sampah dan Mitra Warmindo untuk masa depan bumi yang berkelanjutan.",
          videoUrl: "/edukasi.mp4",
          isActive: true,
        })
        .returning();
      video = inserted;
    }

    return video;
  } catch (error) {
    console.error("Gagal mengambil video post config:", error);
    return null;
  }
}

const videoPostSchema = z.object({
  judul: z.string().min(2, "Judul video minimal 2 karakter"),
  deskripsi: z.string().optional().default(""),
  videoUrl: z.string().min(1, "URL Video atau File Video wajib ada"),
  thumbnailUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * Mengubah / memperbarui 1 video post yang ada.
 */
export async function updateVideoPost(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: { _form: ["Hanya Superadmin yang berhak mengelola Video Post."] },
    };
  }

  const judul = (formData.get("judul") as string) || "";
  const deskripsi = (formData.get("deskripsi") as string) || "";
  const videoUrlInput = (formData.get("videoUrl") as string) || "";
  const videoBase64 = (formData.get("videoBase64") as string) || "";
  const thumbnailBase64 = (formData.get("thumbnailBase64") as string) || "";
  const isActive = formData.get("isActive") === "true";

  let finalVideoUrl = videoUrlInput;

  try {
    // 1. Jika ada upload file video base64, validasi 20MB & upload ke R2
    if (videoBase64 && videoBase64.trim() !== "") {
      const buffer = Buffer.from(
        videoBase64.replace(/^data:video\/\w+;base64,/, ""),
        "base64",
      );
      if (buffer.length > 20 * 1024 * 1024) {
        return {
          success: false,
          errors: {
            videoUrl: [
              "Ukuran file video melebihi batas maksimal 20 MB. Silakan gunakan video yang lebih kecil atau gunakan URL langsung.",
            ],
          },
        };
      }
      const uuid = randomUUID();
      finalVideoUrl = await uploadVideoToR2(buffer, `post-${uuid}.mp4`);
    }

    if (!finalVideoUrl || finalVideoUrl.trim() === "") {
      return {
        success: false,
        errors: { videoUrl: ["Silakan unggah video atau masukkan URL video."] },
      };
    }

    // 2. Jika ada thumbnail gambar
    let finalThumbnailUrl: string | null = null;
    if (thumbnailBase64 && thumbnailBase64.trim() !== "") {
      const uuid = randomUUID();
      finalThumbnailUrl = await uploadImageToR2(
        thumbnailBase64,
        "video-thumbnails",
        `thumb-${uuid}`,
      );
    }

    const parsed = videoPostSchema.safeParse({
      judul,
      deskripsi,
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl,
      isActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Ambil single record yang ada
    const existing = await db.query.videoPost.findFirst({
      orderBy: [desc(videoPost.id)],
    });

    if (existing) {
      await db
        .update(videoPost)
        .set({
          judul: parsed.data.judul,
          deskripsi: parsed.data.deskripsi,
          videoUrl: parsed.data.videoUrl,
          thumbnailUrl: finalThumbnailUrl ?? undefined,
          isActive: parsed.data.isActive,
          updatedAt: new Date(),
        })
        .where(eq(videoPost.id, existing.id));
    } else {
      await db.insert(videoPost).values({
        judul: parsed.data.judul,
        deskripsi: parsed.data.deskripsi,
        videoUrl: parsed.data.videoUrl,
        thumbnailUrl: finalThumbnailUrl,
        isActive: parsed.data.isActive,
      });
    }

    revalidatePath("/video-post");
    revalidatePath("/login");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/warmindo-dashboard");
    revalidatePath("/dashboard/bank-sampah-dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal memperbarui video post:", error);
    return {
      success: false,
      errors: {
        _form: ["Terjadi kesalahan server saat memperbarui video post."],
      },
    };
  }
}

/**
 * Toggle status tayang aktif / nonaktif video.
 */
export async function toggleVideoStatus(
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
    const existing = await db.query.videoPost.findFirst({
      orderBy: [desc(videoPost.id)],
    });

    if (existing) {
      await db
        .update(videoPost)
        .set({ isActive: makeActive, updatedAt: new Date() })
        .where(eq(videoPost.id, existing.id));
    }

    revalidatePath("/video-post");
    revalidatePath("/login");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/warmindo-dashboard");
    revalidatePath("/dashboard/bank-sampah-dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal mengubah status video post:", error);
    return {
      success: false,
      errors: { _form: ["Gagal mengubah status penayangan video."] },
    };
  }
}

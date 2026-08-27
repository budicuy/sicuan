import { db } from "@/db";
import { videoPost } from "@/db/schema";

export async function seedVideoPost() {
  const existing = await db.query.videoPost.findFirst();
  if (!existing) {
    await db.insert(videoPost).values([
      {
        judul: "Program Daur Ulang Kemasan Indofood SICUAN",
        deskripsi:
          "Video panduan dan edukasi pengumpulan sampah kemasan Indofood bersama Bank Sampah dan Mitra Warmindo untuk masa depan bumi yang berkelanjutan.",
        videoUrl: "/edukasi.mp4",
        isActive: true,
      },
    ]);
  } else {
    await db.update(videoPost).set({
      videoUrl: "/edukasi.mp4",
      updatedAt: new Date(),
    });
  }
}

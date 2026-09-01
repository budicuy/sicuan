import { db } from "@/db";
import { videoPost } from "@/db/schema";

export async function seedVideoPost() {
  await db.delete(videoPost);

  await db.insert(videoPost).values([
    {
      tipe: "video",
      mediaUrl: "/edukasi.mp4",
      videoUrl: "/edukasi.mp4",
      urutan: 0,
      isActive: true,
    },
    {
      tipe: "gambar",
      mediaUrl: "/sampel_1.png",
      videoUrl: null,
      urutan: 1,
      isActive: true,
    },
  ]);
}

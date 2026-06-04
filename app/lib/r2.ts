"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID ?? ""}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

/**
 * Optimasi gambar sebelum upload:
 * - Resize max 1200px (lebar) agar tidak terlalu besar
 * - Konversi ke WebP, quality 75
 * - Pastikan ukuran akhir < 500 KB
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
}

/**
 * Upload buffer ke Cloudflare R2.
 * @param buffer  - gambar yang sudah dioptimasi
 * @param key     - path di bucket (misal: setor-sampah/timbangan/uuid.webp)
 * @returns public URL gambar
 */
export async function uploadToR2(buffer: Buffer, key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? "",
    Key: key,
    Body: buffer,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  });

  await r2Client.send(command);
  return `${process.env.R2_ENDPOINT ?? ""}/${key}`;
}

/**
 * Upload gambar ke R2 dengan optimasi otomatis.
 * @param imageData - base64 string atau Buffer
 * @param folder    - sub-folder di bucket (contoh: "timbangan" atau "bukti")
 * @param filename  - nama file tanpa ekstensi
 * @returns public URL
 */
export async function uploadImageToR2(
  imageData: string | Buffer,
  folder: string,
  filename: string,
): Promise<string> {
  const rawBuffer =
    typeof imageData === "string"
      ? Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), "base64")
      : imageData;

  const optimized = await optimizeImage(rawBuffer);
  const key = `setor-sampah/${folder}/${filename}.webp`;
  return uploadToR2(optimized, key);
}

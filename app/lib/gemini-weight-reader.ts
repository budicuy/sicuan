"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface WeightReadResult {
  success: boolean;
  berat: number; // dalam kg
  message: string;
}

const PROMPT = `Kamu adalah asisten AI yang bertugas memvalidasi setoran sampah dan membaca angka berat dari foto timbangan atau timbangan digital.

Tugas kamu adalah:
1. Periksa apakah gambar menampilkan sampah/kemasan/dus/label yang merupakan produk dari Indofood (seperti mie instan Indomie, Pop Mie, Sarimi, Supermi, Sakura, Intermi, atau produk makanan/minuman/snack Indofood lainnya seperti Chitato, Lays, Chiki, dll.). Identifikasi hanya jika logo, merek, atau desain kemasan terlihat cukup jelas. Jika identitas merek/logo tidak terlihat jelas, buram, atau kamu tidak yakin, jangan menebak. Tolak dengan alasan identitas produk tidak dapat dipastikan.
2. Periksa apakah sampah Indofood tersebut benar-benar ditimbang (diletakkan di atas timbangan, atau digantungkan pada timbangan gantung). Timbangan tidak boleh kosong atau objek sampah harus menempel/tergantung pada alat timbangan tersebut. Jika sampah tidak diletakkan di atas timbangan atau tidak digantung pada timbangan gantung, tolak setoran.
3. Periksa apakah angka berat yang dibaca dari timbangan masuk akal/logis untuk volume atau jumlah sampah yang terlihat pada gambar. Sebagai acuan standar, berat sampah etiket (kemasan plastik mie instan/snack) adalah sekitar 3 hingga 7 gram per bungkus (0.003 - 0.007 kg). Jadi, satu atau beberapa bungkus plastik kosong tidak mungkin memiliki berat yang tidak wajar seperti beberapa kilogram (misalnya 10 kg). Jika beratnya tidak logis, tolak setoran.
4. Jika semua validasi di atas lolos, baca angka berat yang tertera pada timbangan dalam satuan kilogram (kg).

Balas HANYA dalam format JSON berikut (tidak ada teks lain di luar JSON):

Jika sampah BUKAN merupakan produk Indofood:
{
  "success": false,
  "berat": 0,
  "message": "sampah bukan produk indofood"
}

Jika identitas merek/logo tidak terlihat jelas, atau kamu tidak yakin produk Indofood (jangan menebak):
{
  "success": false,
  "berat": 0,
  "message": "identitas produk tidak dapat dipastikan karena logo atau merek tidak terlihat jelas"
}

Jika objek sampah tidak diletakkan di atas timbangan atau tidak digantung pada timbangan gantung, atau timbangan kosong:
{
  "success": false,
  "berat": 0,
  "message": "sampah harus diletakkan di atas timbangan atau digantungkan pada timbangan gantung"
}

Jika angka berat yang terdeteksi tidak logis/tidak wajar untuk volume/jumlah sampah yang terlihat (misalnya: berat terdeteksi 10 kg padahal di gambar hanya ada 1 bungkus mi instan kosong/ringan):
{
  "success": false,
  "berat": 0,
  "message": "<berikan penjelasan yang ramah, mudah dipahami, dan dinamis mengenai alasan ketidaklogisan ini secara spesifik berdasarkan gambar, contoh: 'Berat yang terdeteksi (10 kg) tidak logis untuk sampah plastik mi instan yang hanya berjumlah 1 bungkus. Silakan periksa kembali unit timbangan Anda atau pastikan tidak ada benda berat lain di atas timbangan.'>"
}

Jika semua validasi lolos dan kamu berhasil membaca beratnya:
{
  "success": true,
  "berat": <angka_dalam_kg>,
  "message": "Berat berhasil dibaca dari gambar timbangan."
}

Jika semua validasi lolos tetapi kamu tidak bisa membaca berat karena gambar buram, tidak jelas, atau tidak ada timbangan:
{
  "success": false,
  "berat": 0,
  "message": "Tidak dapat membaca berat dari gambar. Pastikan gambar timbangan jelas dan terlihat angka beratnya."
}`;

/**
 * Membaca berat dari gambar timbangan menggunakan Gemini AI.
 * Mencoba MODEL_1 → MODEL_2 → MODEL_3 secara berurutan (fallback).
 */
export async function readWeightFromImage(
  imageBase64: string,
  mimeType: string = "image/webp",
): Promise<WeightReadResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      berat: 0,
      message: "Gagal membaca berat dari gambar. Silakan coba lagi nanti.",
    };
  }

  const models = [
    process.env.MODEL_1 || "",
    process.env.MODEL_2 || "",
    process.env.MODEL_3 || "",
  ].filter(Boolean);

  const genAI = new GoogleGenerativeAI(apiKey);

  // Hapus prefix data URL jika ada
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        PROMPT,
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ]);

      const text = result.response.text().trim();

      // Ekstrak JSON dari response (kadang ada markdown code block)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[${modelName}] Response bukan JSON:`, text);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]) as WeightReadResult;
      console.log(`[${modelName}] Berhasil membaca berat: ${parsed.berat} kg`);
      return parsed;
    } catch (err) {
      console.error(`[${modelName}] Error:`, err);
      // Coba model berikutnya
    }
  }

  return {
    success: false,
    berat: 0,
    message: "Gagal membaca berat dari gambar. Silakan coba lagi nanti.",
  };
}

/**
 * Validasi apakah berat dari AI sesuai dengan input user.
 * Tanpa toleransi, berat harus sama persis antara yang diinput dan yang dibaca AI.
 * @param beratUser  - berat yang diinput user (kg)
 * @param beratAi    - berat yang dibaca AI dari foto (kg)
 * @returns true jika berat sama persis
 */
export async function validateBeratTolerance(
  beratUser: number,
  beratAi: number,
): Promise<boolean> {
  return beratUser === beratAi;
}

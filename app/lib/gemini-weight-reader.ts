"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface WeightReadResult {
  success: boolean;
  berat: number; // dalam kg
  message: string;
}

const PROMPT = `Kamu adalah asisten AI yang bertugas membaca angka berat dari foto timbangan atau timbangan digital.

Analisis gambar ini dan tentukan berat yang tertera dalam satuan kilogram (kg).

Balas HANYA dalam format JSON berikut (tidak ada teks lain di luar JSON):
{
  "success": true,
  "berat": <angka_dalam_kg>,
  "message": "Berat berhasil dibaca dari gambar timbangan."
}

Jika kamu tidak bisa membaca berat karena gambar buram, tidak jelas, atau tidak ada timbangan:
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
 * Toleransi: ±0.2 kg (200 gram) sesuai ketentuan.
 * @param beratUser  - berat yang diinput user (kg)
 * @param beratAi    - berat yang dibaca AI dari foto (kg)
 * @returns true jika selisih ≤ 0.2 kg
 */
export async function validateBeratTolerance(
  beratUser: number,
  beratAi: number,
): Promise<boolean> {
  return Math.abs(beratUser - beratAi) <= 0.2; // 200 gram toleransi
}

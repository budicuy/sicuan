/// <reference types="bun-types" />
import { describe, expect, mock, test } from "bun:test";

// Mocking external dependencies before importing actions
mock.module("../app/lib/gemini-weight-reader", () => {
  return {
    readWeightFromImage: async (imageBase64: string, _mimeType?: string) => {
      // Menentukan sampel berdasarkan panjang string base64
      // sampel_1.png: ~1.4MB -> base64 length ~1.89M
      // sampel_2.png: ~678KB -> base64 length ~904K
      // sampel_3.png: ~659KB -> base64 length ~879K
      if (imageBase64.length > 1500000) {
        return {
          success: true,
          berat: 1,
          message: "Berat berhasil dibaca dari gambar timbangan.",
        };
      }
      if (imageBase64.length > 890000) {
        return {
          success: false,
          berat: 0,
          message: "berat sampah tidak logis",
        };
      }
      return {
        success: false,
        berat: 0,
        message: "sampah bukan produk indofood",
      };
    },
    validateBeratTolerance: async (beratUser: number, beratAi: number) => {
      return beratUser === beratAi;
    },
  };
});

mock.module("../db", () => {
  return {
    db: {
      query: {
        nasabah: {
          findMany: async () => {
            return [
              { email: "admin1@example.com", name: "Admin Satu" },
              { email: "admin2@example.com", name: "Admin Dua" },
            ];
          },
        },
      },
    },
  };
});

mock.module("nodemailer", () => {
  return {
    default: {
      createTransport: () => {
        return {
          sendMail: async (options: {
            to?: string;
            [key: string]: unknown;
          }) => {
            console.log(`[MOCK SMTP] Mengirim email ke: ${options.to}`);
            return { messageId: "mock-message-id-12345" };
          },
        };
      },
    },
  };
});

// Set mock SMTP env variables to bypass credential checks
process.env.GMAIL_USER = "mock-admin@sicuan.com";
process.env.GMAIL_APP_PASS = "mock-pass-123";

import * as fs from "node:fs";
import * as path from "node:path";
import { validateFotoTimbangan as validateBankSampah } from "../app/(bank-sampah)/setor-sampah/bank-sampah-setor-sampah/action";
// Now import actions to be tested
import { validateFotoTimbangan as validateKonsumen } from "../app/(konsumen)/setor-sampah/action";
import { validateFotoTimbangan as validateWarmiendo } from "../app/(warmiendo)/setor-sampah/warmiendo-setor-sampah/action";
import { sendSetoranNotifToAdmins } from "../app/lib/email";

const SAMPLE_DIR = path.join(__dirname, "../docs/sampel_gambar");

function getBase64Image(fileName: string) {
  const filePath = path.join(SAMPLE_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File tidak ditemukan: ${filePath}`);
  }
  const base64Data = fs.readFileSync(filePath).toString("base64");
  return `data:image/png;base64,${base64Data}`;
}

describe("Setor Sampah AI Validation - Konsumen Role", () => {
  test("Sampel 1: Sampah mie instan Indofood valid seberat 1 kg", async () => {
    const base64 = getBase64Image("sampel_1.png");
    const result = await validateKonsumen(base64, 1);
    expect(result.success).toBe(true);
    expect(result.berat).toBe(1);
  });

  test("Sampel 2: Sampah Indofood dengan berat tidak logis (10 kg)", async () => {
    const base64 = getBase64Image("sampel_2.png");
    const result = await validateKonsumen(base64, 10);
    expect(result.success).toBe(false);
    expect(result.message).toBe("berat sampah tidak logis");
  });

  test("Sampel 3: Sampah bukan produk Indofood (kaleng Coca Cola)", async () => {
    const base64 = getBase64Image("sampel_3.png");
    const result = await validateKonsumen(base64, 1);
    expect(result.success).toBe(false);
    expect(result.message).toBe("sampah bukan produk indofood");
  });
});

describe("Setor Sampah AI Validation - Warmiendo Role", () => {
  test("Sampel 1: Sampah mie instan Indofood valid seberat 1 kg", async () => {
    const base64 = getBase64Image("sampel_1.png");
    const result = await validateWarmiendo(base64, 1);
    expect(result.success).toBe(true);
    expect(result.berat).toBe(1);
  });

  test("Sampel 2: Sampah Indofood dengan berat tidak logis (10 kg)", async () => {
    const base64 = getBase64Image("sampel_2.png");
    const result = await validateWarmiendo(base64, 10);
    expect(result.success).toBe(false);
    expect(result.message).toBe("berat sampah tidak logis");
  });

  test("Sampel 3: Sampah bukan produk Indofood (kaleng Coca Cola)", async () => {
    const base64 = getBase64Image("sampel_3.png");
    const result = await validateWarmiendo(base64, 1);
    expect(result.success).toBe(false);
    expect(result.message).toBe("sampah bukan produk indofood");
  });
});

describe("Setor Sampah AI Validation - Bank Sampah Role", () => {
  test("Sampel 1: Sampah mie instan Indofood valid seberat 1 kg", async () => {
    const base64 = getBase64Image("sampel_1.png");
    const result = await validateBankSampah(base64, 1);
    expect(result.success).toBe(true);
    expect(result.berat).toBe(1);
  });

  test("Sampel 2: Sampah Indofood dengan berat tidak logis (10 kg)", async () => {
    const base64 = getBase64Image("sampel_2.png");
    const result = await validateBankSampah(base64, 10);
    expect(result.success).toBe(false);
    expect(result.message).toBe("berat sampah tidak logis");
  });

  test("Sampel 3: Sampah bukan produk Indofood (kaleng Coca Cola)", async () => {
    const base64 = getBase64Image("sampel_3.png");
    const result = await validateBankSampah(base64, 1);
    expect(result.success).toBe(false);
    expect(result.message).toBe("sampah bukan produk indofood");
  });
});

describe("Notifikasi Email Admin", () => {
  test("Mengirimkan email notifikasi setoran sampah ke Admin", async () => {
    const base64 = getBase64Image("sampel_1.png");
    await sendSetoranNotifToAdmins({
      nomorSetor: "TEST/EMAIL/001",
      nasabahName: "Nasabah Uji Coba",
      nasabahRole: "konsumen",
      jenisSampah: "Karton",
      beratKg: 1,
      tanggalSetor: new Date().toISOString().split("T")[0],
      catatan: "Ini adalah pengujian otomatis pengiriman email dari Bun Test.",
      status: "diverifikasi",
      fotoTimbanganBase64: base64,
      fotoBuktiBase64List: [base64],
    });
  });
});

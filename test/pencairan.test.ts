import { describe, mock, test } from "bun:test";

// Mock nodemailer to prevent real SMTP connections
mock.module("nodemailer", () => {
  return {
    default: {
      createTransport: () => {
        return {
          sendMail: async (options: {
            to?: string;
            [key: string]: unknown;
          }) => {
            console.log(
              `[MOCK SMTP] Mengirim email pencairan ke: ${options.to}`,
            );
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

import {
  sendPencairanNotifToAdmins,
  sendPencairanPengajuanNotifToUser,
  sendPencairanSelesaiNotifToUser,
} from "../app/lib/email";

describe("Notifikasi Email Pengajuan Pencairan Dana", () => {
  test("Mengirimkan email tanda terima pengajuan pencairan ke User", async () => {
    await sendPencairanPengajuanNotifToUser({
      userEmail: "nasabah-pencairan@example.com",
      userName: "Budi Nasabah",
      jumlah: 50000,
      metode: "transfer",
      jenisBank: "Bank Central Asia (BCA)",
      noRekening: "1234567890",
      tanggalPengajuan: "08/07/2026",
    });
  });

  test("Mengirimkan email tanda terima pengajuan pencairan secara tunai", async () => {
    await sendPencairanPengajuanNotifToUser({
      userEmail: "nasabah-tunai@example.com",
      userName: "Siti Nasabah",
      jumlah: 25000,
      metode: "tunai",
      tanggalPengajuan: "08/07/2026",
    });
  });
});

describe("Notifikasi Email Realisasi Pencairan Dana (Selesai)", () => {
  test("Mengirimkan email pencairan berhasil ke User", async () => {
    await sendPencairanSelesaiNotifToUser({
      userEmail: "nasabah-pencairan@example.com",
      userName: "Budi Nasabah",
      jumlah: 50000,
      metode: "transfer",
      status: "berhasil",
      buktiTransferUrl: "https://r2.example.com/proofs/transfer-proof-123.jpg",
      pdfBase64: "dGVzdCBwZGYgY29udGVudA==", // dummy base64 "test pdf content"
      pdfFileName: "bukti-pencairan-BJM-001.pdf",
    });
  });

  test("Mengirimkan email pencairan ditolak ke User", async () => {
    await sendPencairanSelesaiNotifToUser({
      userEmail: "nasabah-pencairan@example.com",
      userName: "Budi Nasabah",
      jumlah: 50000,
      metode: "transfer",
      status: "ditolak",
    });
  });
});

describe("Notifikasi Email Pencairan ke Admin", () => {
  test("Mengirimkan notifikasi email pengajuan pencairan baru ke Admin", async () => {
    await sendPencairanNotifToAdmins({
      nasabahName: "Warmiendo Mitra",
      nasabahRole: "warmiendo",
      jumlah: 150000,
      metode: "transfer",
      jenisBank: "Bank Mandiri",
      noRekening: "9876543210",
      keterangan: "Pencairan rutin bulanan",
      tanggal: new Date(),
    });
  });
});

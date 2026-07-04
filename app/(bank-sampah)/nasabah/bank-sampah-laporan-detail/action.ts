"use server";

import { renderToStream } from "@react-pdf/renderer";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import React from "react";
import { LaporanNasabahDocument } from "@/app/components/shared/LaporanNasabahDocument";
import {
  disconnectWhatsApp,
  initWhatsApp,
  whatsappSession,
} from "@/app/lib/whatsapp";
import { db } from "@/db";
import {
  nasabah,
  setorSampahKonsumen,
  setorSampahWarmiendo,
  users,
} from "@/db/schema";

export async function getNasabahListWithSummaries(params?: {
  search?: string;
}) {
  const search = params?.search ?? "";

  const whereConditions = [];
  whereConditions.push(
    or(eq(users.role, "konsumen"), eq(users.role, "warmiendo")),
  );

  if (search) {
    whereConditions.push(ilike(users.name, `%${search}%`));
  }

  try {
    // Database-level one-time patch: update incorrect/empty phone numbers to '082152676658'
    await db
      .update(nasabah)
      .set({ noTelepon: "082152676658" })
      .where(
        or(
          sql`no_telepon is null`,
          sql`no_telepon = ''`,
          eq(nasabah.noTelepon, "0877-2374-9524"),
        ),
      );

    // 1. Fetch filtered nasabah profiles list
    const nasabahList = await db
      .select({
        id: nasabah.id,
        userId: nasabah.userId,
        nik: nasabah.nik,
        noTelepon: nasabah.noTelepon,
        alamat: nasabah.alamat,
        poin: nasabah.poin,
        kredit: nasabah.kredit,
        user: {
          name: users.name,
          role: users.role,
          username: users.username,
        },
      })
      .from(nasabah)
      .innerJoin(users, eq(nasabah.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(users.name);

    // 2. Fetch aggregates for all konsumen setoran (grouped by userId)
    const konsumenAggregates = await db
      .select({
        userId: setorSampahKonsumen.userId,
        totalBerat: sql<number>`sum(${setorSampahKonsumen.beratKg})`,
        totalTransaksi: sql<number>`count(${setorSampahKonsumen.id})`,
      })
      .from(setorSampahKonsumen)
      .groupBy(setorSampahKonsumen.userId);

    // 3. Fetch aggregates for all warmiendo setoran (grouped by userId)
    const warmiendoAggregates = await db
      .select({
        userId: setorSampahWarmiendo.userId,
        totalBerat: sql<number>`sum(${setorSampahWarmiendo.beratKg})`,
        totalTransaksi: sql<number>`count(${setorSampahWarmiendo.id})`,
      })
      .from(setorSampahWarmiendo)
      .groupBy(setorSampahWarmiendo.userId);

    // 4. Map the aggregates by userId for O(1) lookups
    const aggregatesMap = new Map<
      number,
      { totalBerat: number; totalTransaksi: number }
    >();

    for (const row of konsumenAggregates) {
      if (row.userId) {
        aggregatesMap.set(row.userId, {
          totalBerat: Number(row.totalBerat) || 0,
          totalTransaksi: Number(row.totalTransaksi) || 0,
        });
      }
    }

    for (const row of warmiendoAggregates) {
      if (row.userId) {
        aggregatesMap.set(row.userId, {
          totalBerat: Number(row.totalBerat) || 0,
          totalTransaksi: Number(row.totalTransaksi) || 0,
        });
      }
    }

    // 5. Merge stats with the nasabah list
    const data = nasabahList.map((n) => {
      const agg = aggregatesMap.get(n.userId) ?? {
        totalBerat: 0,
        totalTransaksi: 0,
      };
      return {
        ...n,
        totalBerat: agg.totalBerat,
        totalTransaksi: agg.totalTransaksi,
      };
    });

    return data;
  } catch (error) {
    console.error("Error fetching nasabah list with summaries:", error);
    return [];
  }
}

export async function getNasabahDetailAndSetoran(nasabahId: number) {
  try {
    const profile = await db
      .select({
        id: nasabah.id,
        userId: nasabah.userId,
        nik: nasabah.nik,
        noTelepon: nasabah.noTelepon,
        alamat: nasabah.alamat,
        poin: nasabah.poin,
        kredit: nasabah.kredit,
        jenisBank: nasabah.jenisBank,
        noRekening: nasabah.noRekening,
        user: {
          name: users.name,
          role: users.role,
          username: users.username,
        },
      })
      .from(nasabah)
      .innerJoin(users, eq(nasabah.userId, users.id))
      .where(eq(nasabah.id, nasabahId))
      .limit(1);

    if (profile.length === 0) {
      return null;
    }

    const n = profile[0];
    let setoranList = [];

    if (n.user.role === "warmiendo") {
      setoranList = await db.query.setorSampahWarmiendo.findMany({
        where: eq(setorSampahWarmiendo.userId, n.userId),
        orderBy: [desc(setorSampahWarmiendo.id)],
      });
    } else {
      setoranList = await db.query.setorSampahKonsumen.findMany({
        where: eq(setorSampahKonsumen.userId, n.userId),
        orderBy: [desc(setorSampahKonsumen.id)],
      });
    }

    return {
      profile: n,
      setoran: setoranList.map((s) => ({
        id: s.id,
        nomorSetor: s.nomorSetor,
        jenisSampah: s.jenisSampah,
        beratKg: s.beratKg,
        tanggalSetor: s.tanggalSetor,
        catatan: s.catatan,
        totalPoin: s.totalPoin, // Rupiah value
        status: s.status,
      })),
    };
  } catch (error) {
    console.error("Error fetching nasabah detail and setoran:", error);
    return null;
  }
}

// Server Action to render PDF and return base64
export async function generateNasabahPdfAction(nasabahId: number) {
  try {
    const data = await getNasabahDetailAndSetoran(nasabahId);
    if (!data) {
      return { success: false, message: "Nasabah tidak ditemukan" };
    }

    const element = React.createElement(LaporanNasabahDocument, { data });
    // biome-ignore lint/suspicious/noExplicitAny: react-pdf renderToStream requires its own element type
    const stream = await renderToStream(element as any);

    const chunks: Uint8Array[] = [];
    // biome-ignore lint/suspicious/noExplicitAny: node stream chunk type
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const pdfBase64 = buffer.toString("base64");

    return {
      success: true,
      pdfBase64,
      fileName: `Laporan_Setoran_${data.profile.user.name.replace(/\s+/g, "_")}.pdf`,
    };
  } catch (error) {
    console.error("Error generating PDF in action:", error);
    return { success: false, message: "Gagal membuat dokumen PDF" };
  }
}

// --- WhatsApp API integrations ---

export async function getWhatsAppStatus() {
  return {
    status: whatsappSession.status,
    qrCode: whatsappSession.qrCode,
    errorMsg: whatsappSession.errorMsg,
  };
}

export async function connectWhatsAppAction() {
  await initWhatsApp();
  return {
    status: whatsappSession.status,
    qrCode: whatsappSession.qrCode,
    errorMsg: whatsappSession.errorMsg,
  };
}

export async function logoutWhatsAppAction() {
  await disconnectWhatsApp();
  return {
    status: whatsappSession.status,
    qrCode: whatsappSession.qrCode,
  };
}

// Helper to wait until Baileys WebSocket opens (timeout 12s)
async function waitForWhatsAppReady(timeoutMs = 12000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (whatsappSession.status === "ready" && whatsappSession.sock) {
      return true;
    }
    if (whatsappSession.status === "disconnected") {
      return false;
    }
    // Sleep for 200ms
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

export async function sendPdfToWhatsAppAction(
  nasabahId: number,
  phone: string,
  totalBerat: number,
  totalKredit: number,
  totalTransaksi: number,
) {
  // If not connected, initialize the connection dynamically (Serverless wakeup)
  if (!whatsappSession.sock) {
    await initWhatsApp();
  }

  // Block and wait until socket connects to WhatsApp servers
  const isReady = await waitForWhatsAppReady();
  if (!isReady || !whatsappSession.sock) {
    return {
      success: false,
      message:
        "Gagal mengkoneksikan ke WhatsApp Web. Pastikan WhatsApp Anda aktif atau scan ulang QR Code.",
    };
  }

  try {
    const data = await getNasabahDetailAndSetoran(nasabahId);
    if (!data) {
      return { success: false, message: "Nasabah tidak ditemukan" };
    }

    const res = await generateNasabahPdfAction(nasabahId);
    if (!res.success || !res.pdfBase64 || !res.fileName) {
      return {
        success: false,
        message: res.message || "Gagal membuat dokumen PDF",
      };
    }

    // Format WA JID (Baileys uses JID format: number@s.whatsapp.net)
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = `62${cleaned.slice(1)}`;
    }
    if (!cleaned.startsWith("62") && cleaned.length > 0) {
      cleaned = `62${cleaned}`;
    }
    const recipientJid = `${cleaned}@s.whatsapp.net`;

    const messageText = `Halo *${data.profile.user.name}*, berikut adalah Laporan Detail Setoran Sampah Anda di Bank Sampah Indofood:

- *Total Transaksi*: ${totalTransaksi} Setoran
- *Total Berat Sampah*: ${totalBerat.toLocaleString("id-ID")} kg
- *Total Saldo Uang*: Rp ${totalKredit.toLocaleString("id-ID")}

Terima kasih atas partisipasi aktif Anda dalam menjaga kelestarian lingkungan!`;

    // Send PDF document via Baileys API
    const pdfBuffer = Buffer.from(res.pdfBase64, "base64");
    await whatsappSession.sock.sendMessage(recipientJid, {
      document: pdfBuffer,
      mimetype: "application/pdf",
      fileName: res.fileName,
      caption: messageText,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending PDF via Baileys:", error);
    return {
      success: false,
      message: `Gagal mengirim pesan: ${String(error)}`,
    };
  }
}

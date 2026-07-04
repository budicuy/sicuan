"use server";

import { renderToStream } from "@react-pdf/renderer";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import React from "react";
import { LaporanNasabahDocument } from "@/app/components/shared/LaporanNasabahDocument";
import { sendEmail } from "@/app/lib/email";
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
    // 1. Fetch filtered nasabah profiles list (including email)
    const nasabahList = await db
      .select({
        id: nasabah.id,
        userId: nasabah.userId,
        nik: nasabah.nik,
        noTelepon: nasabah.noTelepon,
        email: nasabah.email,
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
        email: nasabah.email,
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

export async function sendPdfToEmailAction(
  nasabahId: number,
  emailAddress: string,
  totalBerat: number,
  totalKredit: number,
  totalTransaksi: number,
) {
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

    const messageText = `Halo ${data.profile.user.name},

Berikut adalah Laporan Detail Setoran Sampah Anda di Bank Sampah Indofood:

- Total Transaksi: ${totalTransaksi} Setoran
- Total Berat Sampah: ${totalBerat.toLocaleString("id-ID")} kg
- Total Saldo Uang: Rp ${totalKredit.toLocaleString("id-ID")}

Terima kasih atas partisipasi aktif Anda dalam menjaga kelestarian lingkungan! Berkas PDF laporan lengkap Anda terlampir pada email ini.

Salam hangat,
Bank Sampah Indofood`;

    // Convert base64 PDF to Buffer for Nodemailer
    const pdfBuffer = Buffer.from(res.pdfBase64, "base64");

    await sendEmail({
      to: emailAddress,
      subject: `Laporan Setoran Sampah - ${data.profile.user.name}`,
      text: messageText,
      attachments: [
        {
          filename: res.fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending PDF via Email:", error);
    return {
      success: false,
      message: `Gagal mengirim email: ${String(error)}`,
    };
  }
}

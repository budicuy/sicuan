"use server";

import { renderToStream } from "@react-pdf/renderer";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import React from "react";
import { LaporanNasabahDocument } from "@/app/components/shared/LaporanNasabahDocument";
import { sendEmail } from "@/app/lib/email";
import { db } from "@/db";
import { nasabah, setorSampah } from "@/db/schema";

export async function getNasabahListWithSummaries(params?: {
  search?: string;
}) {
  const search = params?.search ?? "";

  const whereConditions = [];
  whereConditions.push(
    or(eq(nasabah.role, "konsumen"), eq(nasabah.role, "warmiendo")),
  );

  if (search) {
    whereConditions.push(ilike(nasabah.name, `%${search}%`));
  }

  try {
    // 1. Fetch filtered users list directly
    const nasabahList = await db
      .select({
        id: nasabah.id,
        userId: nasabah.id,
        nik: nasabah.nik,
        noTelepon: nasabah.noTelepon,
        email: nasabah.email,
        alamat: nasabah.alamat,
        poin: nasabah.poin,
        kredit: nasabah.kredit,
        user: {
          name: nasabah.name,
          role: nasabah.role,
          username: nasabah.username,
        },
      })
      .from(nasabah)
      .where(and(...whereConditions))
      .orderBy(nasabah.name);

    // 2. Fetch aggregates for all setoran (grouped by userId)
    const aggregates = await db
      .select({
        userId: setorSampah.userId,
        totalBerat: sql<number>`sum(${setorSampah.beratKg})`,
        totalTransaksi: sql<number>`count(${setorSampah.id})`,
      })
      .from(setorSampah)
      .groupBy(setorSampah.userId);

    // 3. Map the aggregates by userId for O(1) lookups
    const aggregatesMap = new Map<
      number,
      { totalBerat: number; totalTransaksi: number }
    >();

    for (const row of aggregates) {
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
        userId: nasabah.id,
        nik: nasabah.nik,
        noTelepon: nasabah.noTelepon,
        email: nasabah.email,
        alamat: nasabah.alamat,
        poin: nasabah.poin,
        kredit: nasabah.kredit,
        jenisBank: nasabah.jenisBank,
        noRekening: nasabah.noRekening,
        user: {
          name: nasabah.name,
          role: nasabah.role,
          username: nasabah.username,
        },
      })
      .from(nasabah)
      .where(eq(nasabah.id, nasabahId))
      .limit(1);

    if (profile.length === 0) {
      return null;
    }

    const n = profile[0];
    const setoranList = await db.query.setorSampah.findMany({
      where: and(
        eq(setorSampah.userId, n.userId),
        eq(
          setorSampah.kategoriNasabah,
          n.user.role as "konsumen" | "warmiendo" | "bank-sampah",
        ),
      ),
      orderBy: [desc(setorSampah.id)],
    });

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

    // Plain text fallback
    const messageText = `Halo ${data.profile.user.name},

Berikut adalah Laporan Detail Setoran Sampah Anda di SICUAN:

- Total Transaksi: ${totalTransaksi} Setoran
- Total Berat Sampah: ${totalBerat.toLocaleString("id-ID")} kg
- Total Saldo Uang: Rp ${totalKredit.toLocaleString("id-ID")}

Terima kasih atas partisipasi aktif Anda dalam menjaga kelestarian lingkungan! Berkas PDF laporan lengkap Anda terlampir pada email ini.

Salam hangat,
SICUAN`;

    // Styled HTML Email Template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan Setoran Sampah - SICUAN</title>
</head>
<body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6;" border="0" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 35px 30px; text-align: center;">
              <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 1px; display: block; margin: 0; text-transform: uppercase;">SICUAN</span>
              <span style="font-size: 13px; color: #d1fae5; font-weight: 600; display: block; margin-top: 5px; letter-spacing: 0.5px;">Mewujudkan Lingkungan Bersih & Berkelanjutan</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 10px 0;">Halo ${data.profile.user.name},</p>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 25px 0;">Berikut adalah ringkasan Laporan Detail Setoran Sampah Anda. Berkas PDF laporan transaksi lengkap Anda telah dilampirkan pada email ini.</p>
              
              <!-- Stats Grid -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 0 5px 0 0;" width="33%">
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px 10px; text-align: center;">
                      <span style="font-size: 10px; font-weight: bold; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">Setoran</span>
                      <span style="font-size: 16px; font-weight: 800; color: #166534; font-family: monospace;">${totalTransaksi}</span>
                    </div>
                  </td>
                  <td style="padding: 0 5px;" width="33%">
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px 10px; text-align: center;">
                      <span style="font-size: 10px; font-weight: bold; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">Total Berat</span>
                      <span style="font-size: 16px; font-weight: 800; color: #166534; font-family: monospace;">${totalBerat.toLocaleString("id-ID")} kg</span>
                    </div>
                  </td>
                  <td style="padding: 0 0 0 5px;" width="33%">
                    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 15px 10px; text-align: center;">
                      <span style="font-size: 10px; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">Saldo Kredit</span>
                      <span style="font-size: 16px; font-weight: 800; color: #065f46; font-family: monospace;">Rp ${totalKredit.toLocaleString("id-ID")}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                <p style="font-size: 13px; color: #475569; line-height: 1.5; margin: 0; font-style: italic;">
                  &ldquo;Terima kasih atas partisipasi aktif Anda dalam program pemilahan sampah ini. Setiap kilogram sampah yang Anda setorkan berkontribusi nyata dalam menjaga kelestarian lingkungan sekitar kita.&rdquo;
                </p>
              </div>
              
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 5px 0;">Salam hangat,</p>
              <p style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 0;">Tim SICUAN</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #eef2f6; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0 0 5px 0;">Email ini dikirim secara otomatis oleh Sistem Portal SICUAN.</p>
              <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0;">&copy; 2026 PT. Indofood Sukses Makmur Tbk. All Rights Reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Convert base64 PDF to Buffer for Nodemailer
    const pdfBuffer = Buffer.from(res.pdfBase64, "base64");

    await sendEmail({
      to: emailAddress,
      subject: `Laporan Setoran Sampah - ${data.profile.user.name}`,
      text: messageText,
      html: htmlContent,
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

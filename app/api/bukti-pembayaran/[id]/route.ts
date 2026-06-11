import { renderToStream } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import React from "react";
import sharp from "sharp";
import type { BuktiPembayaranData } from "@/app/components/shared/BuktiPembayaranDocument";
import { BuktiPembayaranDocument } from "@/app/components/shared/BuktiPembayaranDocument";
import { db } from "@/db";
import { buktiPembayaran } from "@/db/schema";
import type { DataSampahItem } from "@/db/schema/bukti-pembayaran";

async function convertWebPToPngBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pngBuffer = await sharp(buffer).png().toBuffer();

    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch (err) {
    console.error("Error converting WebP to PNG for PDF:", err);
    return null;
  }
}

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
      username: string;
    };
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const docId = Number.parseInt(id, 10);
  if (Number.isNaN(docId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const doc = await db.query.buktiPembayaran.findFirst({
    where: eq(buktiPembayaran.id, docId),
  });

  if (!doc) {
    return NextResponse.json(
      { error: "Dokumen tidak ditemukan" },
      { status: 404 },
    );
  }

  // Access control: only the owner or admin/superadmin can access
  const canAccess =
    doc.userId === user.id ||
    user.role === "admin" ||
    user.role === "superadmin";

  if (!canAccess) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  // Convert WebP signature images from Cloudflare R2 to PNG base64 data URLs
  // because @react-pdf/renderer does not support rendering WebP format out of the box.
  let penyerahPng: string | null = null;
  if (doc.ttdPenyerahUrl) {
    penyerahPng = await convertWebPToPngBase64(doc.ttdPenyerahUrl);
  }

  let penerimaPng: string | null = null;
  if (doc.ttdPenerimaUrl) {
    penerimaPng = await convertWebPToPngBase64(doc.ttdPenerimaUrl);
  }

  const data: BuktiPembayaranData = {
    nomorDokumen: doc.nomorDokumen,
    tanggal: doc.createdAt,
    namaBankSampah: doc.namaBankSampah,
    idPelanggan: doc.idPelanggan,
    nama: doc.nama,
    alamat: doc.alamat,
    noTelepon: doc.noTelepon,
    periodeBulan: doc.periodeBulan,
    periodeTahun: doc.periodeTahun,
    kategoriSumber: doc.kategoriSumber,
    dataSampah: doc.dataSampah as DataSampahItem[],
    totalBeratKg: doc.totalBeratKg,
    tarifDasar: doc.tarifDasar,
    biayaTambahan: doc.biayaTambahan,
    totalTagihan: doc.totalTagihan,
    metodePembayaran: doc.metodePembayaran,
    keterangan: doc.keterangan,
    ttdPenyerahUrl: penyerahPng || doc.ttdPenyerahUrl,
    ttdPenerimaUrl: penerimaPng || doc.ttdPenerimaUrl,
    namaPenyerah: doc.namaPenyerah,
    jabatanPenyerah: doc.jabatanPenyerah,
    namaPenerima: doc.namaPenerima,
    jabatanPenerima: doc.jabatanPenerima,
  };

  const element = React.createElement(BuktiPembayaranDocument, { data });
  // biome-ignore lint/suspicious/noExplicitAny: react-pdf renderToStream requires its own element type
  const stream = await renderToStream(element as any);

  const fileName = `Bukti-Pembayaran-${doc.nomorDokumen.replace(/\//g, "-")}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

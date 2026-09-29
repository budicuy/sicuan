import { and, eq, inArray, isNotNull } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { nasabah } from "@/db/schema";

export interface EmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
  cid?: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;

  if (!user || !pass) {
    throw new Error(
      "Kredensial Gmail SMTP (GMAIL_USER & GMAIL_APP_PASS) belum dikonfigurasi di file .env.",
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: `"SICUAN" <${user}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email successfully sent: ${info.messageId}`);
  return info;
}

// ─── Notifikasi Pengajuan Pencairan ke Semua Admin/Superadmin ─────────────────

export async function sendPencairanNotifToAdmins(payload: {
  nasabahName: string;
  nasabahRole: string;
  jumlah: number;
  metode: string;
  jenisBank?: string | null;
  noRekening?: string | null;
  keterangan?: string | null;
  tanggal: Date;
}) {
  // Ambil semua admin & superadmin yang punya email
  const admins = await db.query.nasabah.findMany({
    where: and(
      inArray(nasabah.role, ["admin", "superadmin"]),
      isNotNull(nasabah.email),
    ),
    columns: { email: true, name: true },
  });

  if (admins.length === 0) {
    console.warn("Tidak ada admin/superadmin dengan email terdaftar.");
    return;
  }

  const {
    nasabahName,
    nasabahRole,
    jumlah,
    metode,
    jenisBank,
    noRekening,
    keterangan,
    tanggal,
  } = payload;

  const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  const roleLabelMap: Record<string, string> = {
    "bank-sampah": "Bank Sampah",
    warmindo: "Warmindo",
    konsumen: "Konsumen",
  };
  const roleLabel = roleLabelMap[nasabahRole] ?? nasabahRole;

  const tanggalStr = tanggal.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const metodeBadgeColor =
    metode === "tunai"
      ? "background:#dcfce7;color:#15803d;"
      : "background:#dbeafe;color:#1d4ed8;";
  const metodeLabel = metode === "tunai" ? "Tunai" : "Transfer Bank";

  const tujuanTransfer =
    metode !== "tunai" && jenisBank && noRekening
      ? `${jenisBank} — ${noRekening}`
      : metode !== "tunai"
        ? "Rekening belum diisi"
        : "—";

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Notifikasi Pengajuan Pencairan Dana</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2027 0%,#1a3a2a 60%,#134e2a 100%);border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#4ade80;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">SICUAN</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Pengajuan Pencairan Dana
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">
                      Ada permintaan pencairan baru yang menunggu verifikasi Anda.
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <div style="width:56px;height:56px;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);border-radius:16px;display:flex;align-items:center;justify-content:center;">
                      <span style="font-size:28px;line-height:56px;display:block;text-align:center;">💸</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert strip -->
          <tr>
            <td style="background:#fef9c3;border-left:4px solid #eab308;padding:12px 20px;">
              <p style="margin:0;font-size:12px;color:#92400e;font-weight:600;">
                ⏳ Pengajuan ini berstatus <strong>PENDING</strong> dan memerlukan persetujuan admin.
              </p>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 40px;">

              <!-- Jumlah besar -->
              <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#16a34a;">Total Pencairan</p>
                <p style="margin:0;font-size:36px;font-weight:900;color:#15803d;letter-spacing:-1px;">${formatRp(jumlah)}</p>
              </div>

              <!-- Detail -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td colspan="2" style="padding-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Detail Pengajuan</p>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;width:45%;">Nasabah</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${nasabahName}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Kategori</td>
                  <td style="padding:12px 0;">
                    <span style="background:#ede9fe;color:#6d28d9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;">${roleLabel}</span>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Metode Pembayaran</td>
                  <td style="padding:12px 0;">
                    <span style="${metodeBadgeColor}font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;">${metodeLabel}</span>
                  </td>
                </tr>
                ${
                  metode !== "tunai"
                    ? `<tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Rekening Tujuan</td>
                  <td style="padding:12px 0;font-weight:600;font-size:13px;color:#0f172a;font-family:monospace;">${tujuanTransfer}</td>
                </tr>`
                    : ""
                }
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Tanggal Pengajuan</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${tanggalStr}</td>
                </tr>
                ${
                  keterangan
                    ? `<tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Keterangan</td>
                  <td style="padding:12px 0;font-size:13px;color:#374151;font-style:italic;">"${keterangan}"</td>
                </tr>`
                    : ""
                }
              </table>

              <!-- CTA -->
              <div style="margin-top:28px;text-align:center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "#"}/pencairan-dana"
                  style="display:inline-block;background:linear-gradient(135deg,#15803d,#166534);color:#fff;font-size:14px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
                  Tinjau Pengajuan di Dashboard →
                </a>
              </div>

              <!-- Footer note -->
              <p style="margin:24px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
                Email ini dikirim otomatis oleh sistem SICUAN.<br/>
                Harap jangan membalas email ini.
              </p>

            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood  Sukses Makmur Tbk — Bank Sampah
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SICUAN] Pengajuan Pencairan Dana Baru

Nasabah   : ${nasabahName} (${roleLabel})
Jumlah    : ${formatRp(jumlah)}
Metode    : ${metodeLabel}
${metode !== "tunai" ? `Rekening  : ${tujuanTransfer}\n` : ""}Tanggal   : ${tanggalStr}
${keterangan ? `Keterangan: ${keterangan}\n` : ""}
Silakan login ke dashboard admin untuk memproses pengajuan ini.
  `.trim();

  // Kirim ke semua admin/superadmin secara paralel (fire-and-forget)
  const results = await Promise.allSettled(
    admins
      .filter((a) => !!a.email)
      .map((admin) =>
        sendEmail({
          to: admin.email as string,
          subject: `💸 Pengajuan Pencairan Dana — ${nasabahName} (${formatRp(jumlah)})`,
          text,
          html,
        }),
      ),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`Gagal mengirim email ke ${failed.length} admin:`, failed);
  }
}

// ─── Notifikasi Pencairan Selesai ke User/Nasabah yang Mengajukan ──────────────

export async function sendPencairanSelesaiNotifToUser(payload: {
  userEmail: string;
  userName: string;
  jumlah: number;
  metode: string;
  status: "berhasil" | "ditolak";
  buktiTransferUrl?: string | null;
  pdfBase64?: string;
  pdfFileName?: string;
}) {
  const {
    userEmail,
    userName,
    jumlah,
    metode,
    status,
    buktiTransferUrl,
    pdfBase64,
    pdfFileName,
  } = payload;

  const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  const statusTitle =
    status === "berhasil"
      ? "Pencairan Dana Berhasil Dicairkan"
      : "Pengajuan Pencairan Dana Ditolak";
  const statusBadge =
    status === "berhasil"
      ? `<span style="background:#dcfce7;color:#15803d;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;">Berhasil</span>`
      : `<span style="background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;">Ditolak</span>`;

  const headerBg =
    status === "berhasil"
      ? "linear-gradient(135deg,#064e3b 0%,#047857 60%,#10b981 100%)"
      : "linear-gradient(135deg,#7f1d1d 0%,#b91c1c 60%,#ef4444 100%)";

  const bannerText =
    status === "berhasil"
      ? "🎉 Selamat! Pengajuan pencairan dana Anda telah diproses dan berhasil dicairkan."
      : "⚠️ Pengajuan pencairan dana Anda tidak dapat disetujui. Silakan cek detail atau ajukan kembali.";

  const text = `
[SICUAN] Notifikasi Pencairan Dana

Halo ${userName},
Status pencairan dana Anda sebesar ${formatRp(jumlah)} telah diperbarui menjadi: ${status.toUpperCase()}.
Metode Pembayaran: ${metode === "tunai" ? "Tunai" : "Transfer Bank"}.
${buktiTransferUrl ? `Bukti transfer dapat diunduh di: ${buktiTransferUrl}\n` : ""}
Terima kasih atas kontribusi Anda dalam menjaga lingkungan!
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${statusTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${headerBg};border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">SICUAN</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                      ${statusTitle}
                    </h1>
                  </td>
                  <td align="right" valign="middle" style="width:70px;padding-left:12px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;width:56px;height:56px;text-align:center;border-collapse:collapse;border:0;">
                      <tr>
                        <td align="center" valign="middle" style="font-size:28px;line-height:56px;margin:0;padding:0;">
                          ${status === "berhasil" ? "✅" : "❌"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner Status -->
          <tr>
            <td style="background:${status === "berhasil" ? "#f0fdf4" : "#fef2f2"};border-left:4px solid ${status === "berhasil" ? "#10b981" : "#ef4444"};padding:14px 20px;">
              <p style="margin:0;font-size:12.5px;color:${status === "berhasil" ? "#15803d" : "#991b1b"};font-weight:600;">
                ${bannerText}
              </p>
            </td>
          </tr>

          <!-- Content Card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 40px;">
              
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#64748b;padding-bottom:6px;">Nama Penerima</td>
                    <td align="right" style="font-size:13px;font-weight:700;color:#0f172a;padding-bottom:6px;">${userName}</td>
                  </tr>
                  <tr style="border-top:1px solid #f1f5f9;">
                    <td style="font-size:13px;color:#64748b;padding:8px 0;">Jumlah Dana</td>
                    <td align="right" style="font-size:15px;font-weight:800;color:${status === "berhasil" ? "#15803d" : "#0f172a"};padding:8px 0;">${formatRp(jumlah)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#64748b;padding:8px 0;">Metode Pembayaran</td>
                    <td align="right" style="font-size:13px;font-weight:600;color:#0f172a;padding:8px 0;">${metode === "tunai" ? "Tunai" : "Transfer Bank"}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#64748b;padding-top:6px;">Status Pengajuan</td>
                    <td align="right" style="padding-top:6px;">${statusBadge}</td>
                  </tr>
                </table>
              </div>

              ${
                status === "berhasil" && buktiTransferUrl
                  ? `
              <div style="margin-top:24px;text-align:center;background:#f0fdf4;border:1px dashed #86efac;border-radius:12px;padding:16px;">
                <p style="margin:0 0 10px;font-size:12px;color:#16a34a;font-weight:600;">Bukti transfer pembayaran terlampir:</p>
                <a href="${buktiTransferUrl}" target="_blank" style="display:inline-block;background:#15803d;color:#ffffff;font-size:12px;font-weight:700;padding:8px 20px;border-radius:8px;text-decoration:none;">Lihat Bukti Transfer</a>
              </div>
              `
                  : ""
              }

              ${
                status === "berhasil" && pdfBase64
                  ? `
              <div style="margin-top:12px;text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
                <p style="margin:0;font-size:12px;color:#475569;font-weight:600;">📄 Dokumen Bukti Pembayaran Resmi dilampirkan dalam format PDF.</p>
              </div>
              `
                  : ""
              }

              <!-- Info/Footer Note -->
              <div style="margin-top:28px;border-top:1px solid #e2e8f0;padding-top:20px;text-align:center;">
                <p style="margin:0 0 4px;font-size:13px;color:#475569;font-weight:600;">Terima kasih atas kerja keras Anda!</p>
                <p style="margin:0;font-size:12px;color:#64748b;">Setiap sampah yang Anda kelola membantu menciptakan lingkungan yang lebih bersih dan berkelanjutan.</p>
              </div>

              <p style="margin:28px 0 0;text-align:center;font-size:10.5px;color:#94a3b8;">
                Email ini dikirim secara otomatis oleh sistem SICUAN.<br/>
                © PT. Indofood  Sukses Makmur Tbk
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();

  const attachments =
    pdfBase64 && pdfFileName
      ? [
          {
            filename: pdfFileName,
            content: Buffer.from(pdfBase64, "base64"),
            contentType: "application/pdf",
          },
        ]
      : undefined;

  await sendEmail({
    to: userEmail,
    subject: `📩 [Update] Pencairan Dana Anda — ${status === "berhasil" ? "Berhasil" : "Ditolak"} (${formatRp(jumlah)})`,
    text,
    html,
    attachments,
  });
}

// ─── Notifikasi Setoran Sampah Baru ke Semua Admin (Superadmin Dikecualikan) ───

export async function sendSetoranNotifToAdmins(payload: {
  nomorSetor: string;
  nasabahName: string;
  nasabahRole: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  catatan?: string | null;
  status: string;
  fotoTimbanganBase64?: string;
  fotoBuktiBase64List?: string[];
}) {
  // Ambil semua admin saja (superadmin dikecualikan) yang punya email
  const admins = await db.query.nasabah.findMany({
    where: and(eq(nasabah.role, "admin"), isNotNull(nasabah.email)),
    columns: { email: true, name: true },
  });

  const validAdmins = admins.filter(
    (admin) => admin.email && admin.email.trim() !== "",
  );

  if (validAdmins.length === 0) {
    console.warn("Tidak ada admin dengan email terdaftar.");
    return;
  }

  const {
    nomorSetor,
    nasabahName,
    nasabahRole,
    jenisSampah,
    beratKg,
    tanggalSetor,
    catatan,
    status,
  } = payload;

  const roleLabelMap: Record<string, string> = {
    "bank-sampah": "Bank Sampah",
    warmindo: "Warmindo",
    konsumen: "Konsumen",
  };
  const roleLabel = roleLabelMap[nasabahRole] ?? nasabahRole;

  const isVerified = status === "diverifikasi" || status === "diterima";
  const statusBadge = isVerified
    ? `<span style="background:#dcfce7;color:#15803d;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;">Diverifikasi</span>`
    : `<span style="background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;">Pending Validasi</span>`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Notifikasi Setoran Sampah Baru</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2027 0%,#1a3a2a 60%,#134e2a 100%);border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#4ade80;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">SICUAN</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Setoran Sampah Baru
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">
                      Ada data setoran sampah baru yang berhasil masuk ke database.
                    </p>
                  </td>
                  <td align="right" valign="middle" style="width:70px;padding-left:12px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;width:56px;height:56px;text-align:center;border-collapse:collapse;border:0;">
                      <tr>
                        <td align="center" valign="middle" style="font-size:28px;line-height:56px;margin:0;padding:0;">
                          ♻️
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 40px;">

              <!-- Detail -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Detail Setoran</p>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;width:45%;">Nomor Setor</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${nomorSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Nasabah</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${nasabahName}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Kategori</td>
                  <td style="padding:12px 0;">
                    <span style="background:#ede9fe;color:#6d28d9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;">${roleLabel}</span>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Jenis Sampah</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${jenisSampah}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Berat Sampah</td>
                  <td style="padding:12px 0;font-weight:800;font-size:15px;color:#15803d;">${beratKg} kg</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Tanggal Setor</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${tanggalSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Status Validasi</td>
                  <td style="padding:12px 0;">${statusBadge}</td>
                </tr>
                ${
                  catatan
                    ? `<tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Catatan</td>
                  <td style="padding:12px 0;font-size:13px;color:#374151;font-style:italic;">"${catatan}"</td>
                </tr>`
                    : ""
                }
              </table>


              <!-- Button Lihat Setoran -->
              <div style="margin:32px 0 20px;text-align:center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sicuan.vercel.app"}/dashboard/admin-dashboard" target="_blank" style="background-color:#16a34a;background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:12px;display:inline-block;box-shadow:0 4px 6px -1px rgba(22,163,74,0.2);font-family:'Segoe UI',Arial,sans-serif;">
                  Lihat Setoran di Dashboard
                </a>
              </div>

              <!-- Footer note -->
              <p style="margin:32px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
                Email ini dikirim otomatis oleh sistem Portal Sicuan SICUAN.<br/>
                Harap jangan membalas email ini.
              </p>

            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood  Sukses Makmur Tbk — Bank Sampah
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SICUAN] Setoran Sampah Baru Terdaftar

Nomor Setor    : ${nomorSetor}
Nasabah        : ${nasabahName} (${roleLabel})
Jenis Sampah   : ${jenisSampah}
Berat Sampah   : ${beratKg} kg
Tanggal Setor  : ${tanggalSetor}
Status Validasi: ${status.toUpperCase()}
${catatan ? `Catatan        : ${catatan}\n` : ""}
Silakan masuk ke dashboard admin untuk memeriksa detail dan berkas bukti setoran.
  `.trim();

  const results = await Promise.allSettled(
    validAdmins.map((admin) =>
      sendEmail({
        to: admin.email as string,
        subject: `♻️ Setoran Sampah Baru — ${nomorSetor} (${nasabahName})`,
        text,
        html,
      }),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(
      `Gagal mengirim notif setoran ke ${failed.length} admin:`,
      failed,
    );
  }
}

// ─── Notifikasi Serah Terima/Kirim Sampah Baru ke Bank Sampah ───

export async function sendHandoverNotifToBankSampah(payload: {
  nomorSetor: string;
  nasabahName: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  catatan?: string | null;
  fotoTimbanganUrl?: string | null;
}) {
  // Ambil semua bank-sampah yang punya email
  const bankSampahs = await db.query.nasabah.findMany({
    where: and(eq(nasabah.role, "bank-sampah"), isNotNull(nasabah.email)),
    columns: { email: true, name: true },
  });

  const validBankSampahs = bankSampahs.filter(
    (bs) => bs.email && bs.email.trim() !== "",
  );

  if (validBankSampahs.length === 0) {
    console.warn("Tidak ada bank-sampah dengan email terdaftar.");
    return;
  }

  const {
    nomorSetor,
    nasabahName,
    jenisSampah,
    beratKg,
    tanggalSetor,
    catatan,
  } = payload;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Notifikasi Setoran Masuk Baru</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#047857 100%);border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#34d399;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Bank Sampah Indofood</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Sampah Siap Diterima
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">
                      Ada setoran sampah baru dari mitra Warmindo yang sedang dalam perjalanan ke Bank Sampah Anda.
                    </p>
                  </td>
                  <td align="right" valign="middle" style="width:70px;padding-left:12px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;width:56px;height:56px;text-align:center;border-collapse:collapse;border:0;">
                      <tr>
                        <td align="center" valign="middle" style="font-size:28px;line-height:56px;margin:0;padding:0;">
                          🚚
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 40px;">

              <!-- Detail -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Detail Setoran Kurir</p>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;width:45%;">Nomor Setor</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${nomorSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Mitra Pengirim</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${nasabahName} (Warmindo)</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Jenis Sampah</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${jenisSampah}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Berat Sampah</td>
                  <td style="padding:12px 0;font-weight:800;font-size:15px;color:#047857;">${beratKg} kg</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Tanggal Kirim</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${tanggalSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Status Tindakan</td>
                  <td style="padding:12px 0;">
                    <span style="background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;">Harus Diterima</span>
                  </td>
                </tr>
                ${
                  catatan
                    ? `<tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Catatan</td>
                  <td style="padding:12px 0;font-size:13px;color:#374151;font-style:italic;">"${catatan}"</td>
                </tr>`
                    : ""
                }
              </table>


              <!-- Tindakan -->
              <div style="margin-top:32px;text-align:center;">
                <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
                  Harap segera lakukan konfirmasi penerimaan sampah setelah barang sampai di lokasi Bank Sampah Anda.
                </p>
                <div style="margin-top:16px;margin-bottom:8px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sicuan.vercel.app"}/setor-sampah/terima-setoran-warmindo" target="_blank" style="background-color:#059669;background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:12px;display:inline-block;box-shadow:0 4px 6px -1px rgba(5,150,105,0.2);font-family:'Segoe UI',Arial,sans-serif;">
                    Terima &amp; Konfirmasi Setoran
                  </a>
                </div>
              </div>

              <!-- Footer note -->
              <p style="margin:32px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
                Email ini dikirim otomatis oleh sistem Portal Sicuan Bank Sampah Indofood.<br/>
                Harap jangan membalas email ini.
              </p>

            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood  Sukses Makmur Tbk — Bank Sampah
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[Bank Sampah Indofood] Notifikasi Sampah Baru Harus Diterima

Nomor Setor    : ${nomorSetor}
Mitra Pengirim : ${nasabahName} (Warmindo)
Jenis Sampah   : ${jenisSampah}
Berat Sampah   : ${beratKg} kg
Tanggal Kirim  : ${tanggalSetor}
Status         : HARUS DITERIMA (Sedang Dikirim)
${catatan ? `Catatan        : ${catatan}\n` : ""}
Harap segera periksa dashboard Bank Sampah Anda untuk mengonfirmasi penerimaan barang.
  `.trim();

  const results = await Promise.allSettled(
    validBankSampahs.map((bs) =>
      sendEmail({
        to: bs.email as string,
        subject: `🚚 [Harus Diterima] Setoran Sampah Baru dari Warmindo — ${nomorSetor}`,
        text,
        html,
      }),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(
      `Gagal mengirim notif serah sampah ke ${failed.length} bank-sampah:`,
      failed,
    );
  }
}

// ─── Notifikasi Penugasan Ekspedisi Ke Warmindo ───

export async function sendAssignmentNotifToWarmindo(payload: {
  warmindoEmail: string;
  warmindoName: string;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  vendorName: string;
  vendorPhone: string;
}) {
  const {
    warmindoEmail,
    warmindoName,
    nomorSetor,
    jenisSampah,
    beratKg,
    tanggalSetor,
    vendorName,
    vendorPhone,
  } = payload;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Setoran Sampah Ditugaskan ke Ekspedisi</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#38bdf8;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">SICUAN</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Penjemputan Ditugaskan
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">
                      Halo ${warmindoName}, setoran sampah Anda telah diverifikasi oleh Admin dan kurir ekspedisi telah ditugaskan untuk menjemput.
                    </p>
                  </td>
                  <td align="right" valign="middle" style="width:70px;padding-left:12px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;width:56px;height:56px;text-align:center;border-collapse:collapse;border:0;">
                      <tr>
                        <td align="center" valign="middle" style="font-size:28px;line-height:56px;margin:0;padding:0;">
                          📦
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 40px;">

              <!-- Detail Setoran -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Detail Setoran Anda</p>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;width:45%;">Nomor Setor</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${nomorSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Jenis Sampah</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${jenisSampah}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Berat Sampah</td>
                  <td style="padding:12px 0;font-weight:800;font-size:15px;color:#0369a1;">${beratKg} kg</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Tanggal Setor</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${tanggalSetor}</td>
                </tr>
              </table>

              <!-- Kurir Ekspedisi -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:20px;">
                <tr>
                  <td colspan="2" style="padding:16px 0 12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Kurir Penjemput</p>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;width:45%;">Nama Vendor</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${vendorName}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">No. Telepon Kurir</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${vendorPhone}</td>
                </tr>
              </table>

              <!-- Tindakan -->
              <div style="margin-top:32px;text-align:center;">
                <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
                  Silakan serahkan sampah kepada kurir ekspedisi saat penjemputan dilakukan, lalu konfirmasi penyerahan sampah pada halaman detail setoran Anda.
                </p>
                <div style="margin-top:16px;margin-bottom:8px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sicuan.vercel.app"}/setor-sampah" target="_blank" style="background-color:#0284c7;background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:12px;display:inline-block;box-shadow:0 4px 6px -1px rgba(2,132,199,0.2);font-family:'Segoe UI',Arial,sans-serif;">
                    Buka Setoran Saya
                  </a>
                </div>
              </div>

              <!-- Footer note -->
              <p style="margin:32px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
                Email ini dikirim otomatis oleh sistem Portal Sicuan Bank Sampah Indofood.<br/>
                Harap jangan membalas email ini.
              </p>

            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood  Sukses Makmur Tbk — Bank Sampah
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SICUAN] Penjemputan Ditugaskan ke Ekspedisi

Halo ${warmindoName}, setoran sampah Anda telah diverifikasi oleh Admin dan kurir ekspedisi telah ditugaskan untuk menjemput.

Nomor Setor    : ${nomorSetor}
Jenis Sampah   : ${jenisSampah}
Berat Sampah   : ${beratKg} kg
Tanggal Setor  : ${tanggalSetor}

Kurir Penjemput:
Nama Vendor    : ${vendorName}
No. Telepon    : ${vendorPhone}

Silakan serahkan sampah kepada kurir ekspedisi saat penjemputan dilakukan, lalu buka halaman detail setoran di web portal untuk melakukan konfirmasi penyerahan.
  `.trim();

  await sendEmail({
    to: warmindoEmail,
    subject: `📦 [Penjemputan Ditugaskan] Setoran Sampah ${nomorSetor}`,
    text,
    html,
  });
}

// ─── Notifikasi Tanda Terima Setoran Baru Ke Nasabah ───

export async function sendReceiptNotifToDepositor(payload: {
  email: string;
  name: string;
  role: string;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  catatan?: string;
  status: string;
}) {
  const {
    email,
    name,
    role,
    nomorSetor,
    jenisSampah,
    beratKg,
    tanggalSetor,
    catatan,
    status,
  } = payload;

  const roleLabel =
    role === "warmindo"
      ? "Warmindo"
      : role === "bank-sampah"
        ? "Bank Sampah"
        : "Konsumen";
  const isVerified = status === "diverifikasi" || status === "diterima";
  const statusLabel = isVerified ? "Disetujui Otomatis" : "Menunggu Verifikasi";
  const statusBadge = isVerified
    ? `<span style="background:#dcfce7;color:#15803d;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;">Diterima (AI)</span>`
    : `<span style="background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;">Pending Validasi</span>`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Bukti Pengajuan Setoran Sampah</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2027 0%,#1a3a2a 60%,#134e2a 100%);border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#4ade80;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">SICUAN</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Setoran Terdaftar
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">
                      Halo ${name}, pengajuan setoran sampah Anda telah berhasil kami catat di database.
                    </p>
                  </td>
                  <td align="right" valign="middle" style="width:70px;padding-left:12px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;width:56px;height:56px;text-align:center;border-collapse:collapse;border:0;">
                      <tr>
                        <td align="center" valign="middle" style="font-size:28px;line-height:56px;margin:0;padding:0;">
                          📥
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 40px;">

              <!-- Detail -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Tanda Terima Setoran</p>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;width:45%;">Nomor Setor</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${nomorSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Kategori Peran</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${roleLabel}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Jenis Sampah</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${jenisSampah}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Berat Sampah</td>
                  <td style="padding:12px 0;font-weight:800;font-size:15px;color:#16a34a;">${beratKg} kg</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Tanggal Setor</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${tanggalSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Status Pengajuan</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${statusBadge}</td>
                </tr>
                ${
                  catatan
                    ? `
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Catatan</td>
                  <td style="padding:12px 0;font-size:13px;color:#475569;font-style:italic;">"${catatan}"</td>
                </tr>
                `
                    : ""
                }
              </table>

              <!-- Button Lihat Setoran -->
              <div style="margin:32px 0 20px;text-align:center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sicuan.vercel.app"}/setor-sampah" target="_blank" style="background-color:#16a34a;background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:12px;display:inline-block;box-shadow:0 4px 6px -1px rgba(22,163,74,0.2);font-family:'Segoe UI',Arial,sans-serif;">
                  Lihat Riwayat Setoran
                </a>
              </div>

              <!-- Footer note -->
              <p style="margin:32px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
                Email ini dikirim otomatis oleh sistem Portal Sicuan Bank Sampah Indofood.<br/>
                Harap jangan membalas email ini.
              </p>

            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood  Sukses Makmur Tbk — Bank Sampah
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SICUAN] Pengajuan Setoran Sampah Terdaftar

Halo ${name}, pengajuan setoran sampah Anda telah berhasil kami catat.

Nomor Setor    : ${nomorSetor}
Peran          : ${roleLabel}
Jenis Sampah   : ${jenisSampah}
Berat Sampah   : ${beratKg} kg
Tanggal Setor  : ${tanggalSetor}
Status         : ${statusLabel}
${catatan ? `Catatan        : ${catatan}\n` : ""}
Silakan kunjungi dashboard Sicuan untuk melacak status setoran Anda.
  `.trim();

  await sendEmail({
    to: email,
    subject: `📥 [Tanda Terima] Setoran Sampah ${nomorSetor} Terdaftar`,
    text,
    html,
  });
}

// ─── Notifikasi Pembaruan Status Setoran Ke Nasabah ───

export async function sendStatusUpdateNotifToDepositor(payload: {
  email: string;
  name: string;
  role: string;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  status: "diterima" | "ditolak";
  totalPoin?: number;
  alasanPenolakan?: string;
}) {
  const {
    email,
    name,
    role,
    nomorSetor,
    jenisSampah,
    beratKg,
    tanggalSetor,
    status,
    totalPoin = 0,
    alasanPenolakan,
  } = payload;

  const isDiterima = status === "diterima";
  const _roleLabel =
    role === "warmindo"
      ? "Warmindo"
      : role === "bank-sampah"
        ? "Bank Sampah"
        : "Konsumen";

  // Header styles
  const headerBg = isDiterima
    ? "linear-gradient(135deg,#064e3b 0%,#047857 100%)" // Green gradient
    : "linear-gradient(135deg,#7f1d1d 0%,#b91c1c 100%)"; // Red gradient
  const headerText = isDiterima ? "Setoran Diterima" : "Setoran Ditolak";
  const headerLogo = isDiterima ? "✅" : "❌";
  const subheadText = isDiterima
    ? `Selamat ${name}! Setoran sampah Anda telah berhasil dikonfirmasi dan disetujui.`
    : `Mohon maaf ${name}, setoran sampah Anda ditolak setelah diverifikasi oleh petugas.`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Notifikasi Status Setoran Sampah</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${headerBg};border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">SICUAN</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      ${headerText}
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">
                      ${subheadText}
                    </p>
                  </td>
                  <td align="right" valign="middle" style="width:70px;padding-left:12px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;width:56px;height:56px;text-align:center;border-collapse:collapse;border:0;">
                      <tr>
                        <td align="center" valign="middle" style="font-size:28px;line-height:56px;margin:0;padding:0;">
                          ${headerLogo}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 40px;">

              <!-- Detail Setoran -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Hasil Verifikasi Setoran</p>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;width:45%;">Nomor Setor</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${nomorSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Jenis Sampah</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${jenisSampah}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Berat Sampah</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${beratKg} kg</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Tanggal Setor</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${tanggalSetor}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Status Akhir</td>
                  <td style="padding:12px 0;font-size:13px;">
                    ${
                      isDiterima
                        ? `<span style="color:#16a34a;font-weight:700;">Diterima</span>`
                        : `<span style="color:#dc2626;font-weight:700;">Ditolak</span>`
                    }
                  </td>
                </tr>
              </table>

              <!-- Blok Reward / Blok Alasan Penolakan -->
              ${
                isDiterima
                  ? role === "konsumen"
                    ? `
              <div style="background-color:#f0fdf4;border:1px dashed #bbf7d0;border-radius:12px;padding:16px;margin:24px 0;text-align:center;">
                <p style="margin:0 0 4px;font-size:12px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Poin yang Didapat</p>
                <p style="margin:0;font-size:28px;font-weight:800;color:#15803d;">+${totalPoin} Poin</p>
              </div>
              `
                    : ""
                  : `
              <div style="background-color:#fef2f2;border:1px dashed #fecaca;border-radius:12px;padding:16px;margin:24px 0;">
                <p style="margin:0 0 6px;font-size:12px;color:#b91c1c;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Alasan Penolakan:</p>
                <p style="margin:0;font-size:13px;color:#7f1d1d;font-style:italic;">"${alasanPenolakan || "Ada ketidaksesuaian data sampah dengan fisik."}"</p>
              </div>
              `
              }

              <!-- Button Lihat Setoran -->
              <div style="margin:32px 0 20px;text-align:center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sicuan.vercel.app"}/setor-sampah" target="_blank" style="background-color:${isDiterima ? "#16a34a" : "#dc2626"};color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:12px;display:inline-block;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);font-family:'Segoe UI',Arial,sans-serif;">
                  Buka Riwayat Setoran
                </a>
              </div>

              <!-- Footer note -->
              <p style="margin:32px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
                Email ini dikirim otomatis oleh sistem Portal Sicuan Bank Sampah Indofood.<br/>
                Harap jangan membalas email ini.
              </p>

            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood  Sukses Makmur Tbk — Bank Sampah
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const statusLabel = isDiterima ? "DITERIMA" : "DITOLAK";
  const rewardOrReason = isDiterima
    ? role === "konsumen"
      ? `Poin Diperoleh: +${totalPoin} Poin`
      : ""
    : `Alasan Penolakan: ${alasanPenolakan || "-"}`;

  const text = `
[SICUAN] Hasil Verifikasi Setoran Sampah — ${statusLabel}

Halo ${name},

Setoran sampah Anda dengan nomor ${nomorSetor} telah selesai diverifikasi oleh petugas dengan hasil: ${statusLabel}.

Detail Setoran:
Nomor Setor    : ${nomorSetor}
Jenis Sampah   : ${jenisSampah}
Berat Sampah   : ${beratKg} kg
Tanggal Setor  : ${tanggalSetor}

${rewardOrReason}

Silakan kunjungi dashboard Sicuan untuk melacak riwayat setoran Anda.
  `.trim();

  await sendEmail({
    to: email,
    subject: `${isDiterima ? "✅ [Disetujui]" : "❌ [Ditolak]"} Hasil Verifikasi Setoran ${nomorSetor}`,
    text,
    html,
  });
}

// ─── Notifikasi Bukti Pengajuan Pencairan Dana Ke Nasabah ───

export async function sendPencairanPengajuanNotifToUser(payload: {
  userEmail: string;
  userName: string;
  jumlah: number;
  metode: string;
  jenisBank?: string | null;
  noRekening?: string | null;
  tanggalPengajuan: string;
}) {
  const {
    userEmail,
    userName,
    jumlah,
    metode,
    jenisBank,
    noRekening,
    tanggalPengajuan,
  } = payload;
  const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Bukti Pengajuan Pencairan Dana</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#075985 0%,#0369a1 60%,#0284c7 100%);border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#38bdf8;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">SICUAN</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Pengajuan Pencairan
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">
                      Halo ${userName}, pengajuan pencairan dana Anda berhasil didaftarkan dan menunggu persetujuan admin.
                    </p>
                  </td>
                  <td align="right" valign="middle" style="width:70px;padding-left:12px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;width:56px;height:56px;text-align:center;border-collapse:collapse;border:0;">
                      <tr>
                        <td align="center" valign="middle" style="font-size:28px;line-height:56px;margin:0;padding:0;">
                          💸
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 40px;">

              <!-- Detail -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Tanda Terima Pengajuan</p>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;width:45%;">Nama Pengaju</td>
                  <td style="padding:12px 0;font-weight:700;font-size:13px;color:#0f172a;">${userName}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Jumlah Pencairan</td>
                  <td style="padding:12px 0;font-weight:800;font-size:16px;color:#0284c7;">${formatRp(jumlah)}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Metode Pembayaran</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;font-weight:600;">${metode === "tunai" ? "Tunai" : "Transfer Bank"}</td>
                </tr>
                ${
                  metode !== "tunai"
                    ? `
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Bank Tujuan</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${jenisBank || "-"}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Nomor Rekening</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${noRekening || "-"}</td>
                </tr>
                `
                    : ""
                }
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Tanggal Pengajuan</td>
                  <td style="padding:12px 0;font-size:13px;color:#0f172a;">${tanggalPengajuan}</td>
                </tr>
                <tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:12px 0;color:#64748b;font-size:13px;">Status Verifikasi</td>
                  <td style="padding:12px 0;font-size:13px;"><span style="background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;">Pending Verifikasi</span></td>
                </tr>
              </table>

              <!-- Info/Footer Note -->
              <div style="margin-top:28px;border-top:1px solid #e2e8f0;padding-top:20px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#64748b;">Pengajuan Anda saat ini sedang dalam antrean verifikasi oleh Admin Keuangan kami.</p>
              </div>

              <!-- Footer note -->
              <p style="margin:32px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
                Email ini dikirim otomatis oleh sistem Portal Sicuan Bank Sampah Indofood.<br/>
                Harap jangan membalas email ini.
              </p>

            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood  Sukses Makmur Tbk — Bank Sampah
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SICUAN] Tanda Terima Pengajuan Pencairan Dana

Halo ${userName},

Pengajuan pencairan dana Anda sebesar ${formatRp(jumlah)} berhasil didaftarkan dan sedang menunggu verifikasi admin.

Detail Pengajuan:
Nama Pengaju   : ${userName}
Jumlah Dana    : ${formatRp(jumlah)}
Metode         : ${metode === "tunai" ? "Tunai" : "Transfer Bank"}
Bank Tujuan    : ${metode !== "tunai" ? jenisBank || "-" : "-"}
No Rekening    : ${metode !== "tunai" ? noRekening || "-" : "-"}
Tanggal        : ${tanggalPengajuan}
Status         : Pending Verifikasi
  `.trim();

  await sendEmail({
    to: userEmail,
    subject: `💸 [Tanda Terima] Pengajuan Pencairan Dana ${formatRp(jumlah)}`,
    text,
    html,
  });
}

export async function sendResetPasswordEmail(payload: {
  email: string;
  name: string;
  resetLink: string;
}) {
  const { email, name, resetLink } = payload;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Reset Password Akun SICUAN</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);border-radius:20px 20px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;margin-bottom:16px;">
                      <span style="color:#38bdf8;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">SICUAN</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Permintaan Reset Password
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03);">
              <p style="margin:0 0 16px;font-size:16px;color:#334155;line-height:1.6;">
                Halo <strong>${name}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                Kami menerima permintaan untuk mereset password akun SICUAN Anda. Klik tombol di bawah ini untuk mengganti password Anda:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display:inline-block;background:#0284c7;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:14px 28px;border-radius:12px;box-shadow:0 4px 6px -1px rgba(2,132,199,0.2);">
                      Reset Password Saya
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.6;background:#f8fafc;padding:16px;border-radius:12px;border:1px dashed #cbd5e1;">
                <strong>Penting:</strong> Link reset password ini hanya berlaku selama <strong>1 jam</strong> dan hanya dapat digunakan <strong>satu kali</strong>. Jika Anda tidak meminta reset password ini, abaikan email ini dengan aman.
              </p>

              <div style="height:1px;background:#e2e8f0;margin:32px 0 24px;"></div>

              <p style="margin:0 0 6px;font-size:13px;color:#475569;">
                Terima kasih,<br/>
                <strong>Tim SICUAN</strong>
              </p>

              <!-- Footer note -->
              <p style="margin:32px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
                Email ini dikirim otomatis oleh sistem Portal Sicuan Bank Sampah Indofood.<br/>
                Harap jangan membalas email ini.
              </p>
            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood Sukses Makmur Tbk — Bank Sampah
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SICUAN] Permintaan Reset Password

Halo ${name},

Kami menerima permintaan untuk mereset password akun SICUAN Anda.
Silakan klik link di bawah ini untuk mengganti password Anda:

${resetLink}

Penting: Link reset password ini hanya berlaku selama 1 jam dan hanya dapat digunakan satu kali. Jika Anda tidak meminta reset password ini, abaikan email ini dengan aman.

Terima kasih,
Tim SICUAN
  `.trim();

  await sendEmail({
    to: email,
    subject: "🔐 Reset Password Akun SICUAN",
    text,
    html,
  });
}

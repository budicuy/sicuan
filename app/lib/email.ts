import { and, inArray, isNotNull } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { nasabah } from "@/db/schema";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
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
    from: `"Bank Sampah Indofood" <${user}>`,
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
    warmiendo: "Warmiendo",
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
                      <span style="color:#4ade80;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Bank Sampah Indofood</span>
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
                Email ini dikirim otomatis oleh sistem Bank Sampah Indofood.<br/>
                Harap jangan membalas email ini.
              </p>

            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} PT. Indofood CBP Sukses Makmur Tbk — Bank Sampah
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
[Bank Sampah Indofood] Pengajuan Pencairan Dana Baru

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
[Bank Sampah Indofood] Notifikasi Pencairan Dana

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
                      <span style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Bank Sampah Indofood</span>
                    </div>
                    <h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                      ${statusTitle}
                    </h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="font-size:32px;">${status === "berhasil" ? "✅" : "❌"}</span>
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
                Email ini dikirim secara otomatis oleh sistem Bank Sampah Indofood.<br/>
                © PT. Indofood CBP Sukses Makmur Tbk
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

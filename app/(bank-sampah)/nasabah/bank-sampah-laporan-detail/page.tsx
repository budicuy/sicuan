"use client";

import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  LogOut,
  QrCode,
  Search,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  connectWhatsAppAction,
  generateNasabahPdfAction,
  getNasabahDetailAndSetoran,
  getNasabahListWithSummaries,
  getWhatsAppStatus,
  logoutWhatsAppAction,
  sendPdfToWhatsAppAction,
} from "@/app/(bank-sampah)/nasabah/bank-sampah-laporan-detail/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";

interface NasabahSummaryItem {
  id: number;
  userId: number;
  nik: string | null;
  noTelepon: string | null;
  alamat: string | null;
  poin: number;
  kredit: number;
  user: {
    name: string;
    role: string;
    username: string;
  };
  totalBerat: number;
  totalTransaksi: number;
}

interface SetoranDetailItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  catatan: string | null;
  totalPoin: number; // Rupiah value
  status: string;
}

interface NasabahDetail {
  profile: {
    id: number;
    userId: number;
    nik: string | null;
    noTelepon: string | null;
    alamat: string | null;
    poin: number;
    kredit: number;
    jenisBank: string | null;
    noRekening: string | null;
    user: {
      name: string;
      role: string;
      username: string;
    };
  };
  setoran: SetoranDetailItem[];
}

export default function LaporanDetailNasabahPage() {
  const [nasabahList, setNasabahList] = useState<NasabahSummaryItem[]>([]);
  const [_selectedNasabahId, setSelectedNasabahId] = useState<number | null>(
    null,
  );
  const [_detailData, setDetailData] = useState<NasabahDetail | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [_isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [sendingWaId, setSendingWaId] = useState<number | null>(null);

  // WhatsApp states
  const [waStatus, setWaStatus] = useState<
    "disconnected" | "connecting" | "qr_ready" | "authenticated" | "ready"
  >("disconnected");
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waError, setWaError] = useState<string | null>(null);
  const [isWaLoading, setIsWaLoading] = useState(false);

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadNasabahList = useCallback(() => {
    startTransition(() => {
      getNasabahListWithSummaries({ search: searchQuery }).then((res) => {
        setNasabahList(res as NasabahSummaryItem[]);
      });
    });
  }, [searchQuery]);

  useEffect(() => {
    loadNasabahList();
  }, [loadNasabahList]);

  // Periodically poll WhatsApp connection status
  useEffect(() => {
    const checkStatus = () => {
      getWhatsAppStatus().then((res) => {
        setWaStatus(res.status);
        setWaQrCode(res.qrCode);
        setWaError(res.errorMsg);
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000); // check status every 3s
    return () => clearInterval(interval);
  }, []);

  const handleConnectWhatsApp = () => {
    setIsWaLoading(true);
    connectWhatsAppAction().then((res) => {
      setWaStatus(res.status);
      setWaQrCode(res.qrCode);
      setWaError(res.errorMsg);
      setIsWaLoading(false);
    });
  };

  const handleDisconnectWhatsApp = () => {
    setIsWaLoading(true);
    logoutWhatsAppAction().then((res) => {
      setWaStatus(res.status);
      setWaQrCode(null);
      setIsWaLoading(false);
    });
  };

  const handleSelectNasabah = (id: number) => {
    setSelectedNasabahId(id);
    setIsLoadingDetail(true);
    getNasabahDetailAndSetoran(id).then((res) => {
      setDetailData(res);
      setIsLoadingDetail(false);
    });
  };

  const _handleBackToList = () => {
    setSelectedNasabahId(null);
    setDetailData(null);
    loadNasabahList();
  };

  const formatWaNumber = (phone: string | null): string => {
    if (!phone) return "";
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, "");
    // If starts with 0, convert to 62
    if (cleaned.startsWith("0")) {
      cleaned = `62${cleaned.slice(1)}`;
    }
    // Ensure it starts with 62
    if (!cleaned.startsWith("62") && cleaned.length > 0) {
      cleaned = `62${cleaned}`;
    }
    return cleaned;
  };

  // Hybrid Sender: Direct API (auto-reconnect with DB session) or graceful fallback via browser wa.me link
  const handleSendReportDirect = async (
    nasabahId: number,
    nasabahName: string,
    phone: string | null,
    totalBerat: number,
    totalKredit: number,
    totalTransaksi: number,
  ) => {
    if (!phone) {
      showFeedback(
        "error",
        "Nomor WA Kosong",
        `Nomor telepon untuk nasabah ${nasabahName} belum diatur.`,
      );
      return;
    }

    setSendingWaId(nasabahId);
    const formattedPhone = formatWaNumber(phone);
    const messageText = `Halo *${nasabahName}*, berikut adalah ringkasan Laporan Setoran Sampah Anda di Bank Sampah Indofood:

- *Total Transaksi*: ${totalTransaksi} Setoran
- *Total Berat Sampah*: ${totalBerat.toLocaleString("id-ID")} kg
- *Total Saldo Uang*: Rp ${totalKredit.toLocaleString("id-ID")}

*Catatan*: File PDF Laporan Setoran Lengkap Anda telah otomatis diunduh di perangkat ini. Silakan lampirkan file PDF tersebut di chat WhatsApp ini jika Anda ingin menyimpannya. Terima kasih!`;

    try {
      // 1. Try sending automatically in the background using Baileys and DB-stored session
      const res = await sendPdfToWhatsAppAction(
        nasabahId,
        phone,
        totalBerat,
        totalKredit,
        totalTransaksi,
      );
      if (res.success) {
        showFeedback(
          "success",
          "Terkirim Otomatis!",
          `Laporan PDF transaksi setoran untuk nasabah ${nasabahName} telah berhasil dikirim secara otomatis langsung ke nomor WhatsApp ${phone} menggunakan sesi aman database.`,
        );
        setSendingWaId(null);
        return;
      }

      // 2. Fallback to manual browser wa.me sharing if direct sending fails (e.g. no session scanned yet)
      console.log(
        "Baileys direct send failed, falling back to wa.me link. Reason:",
        res.message,
      );

      const pdfRes = await generateNasabahPdfAction(nasabahId);
      if (pdfRes.success && pdfRes.pdfBase64 && pdfRes.fileName) {
        // Trigger local download
        const linkSource = `data:application/pdf;base64,${pdfRes.pdfBase64}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = pdfRes.fileName;
        downloadLink.click();

        // Redirect to wa.me link
        window.open(
          `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`,
          "_blank",
        );

        showFeedback(
          "success",
          "WhatsApp Hubungan Terbuka",
          `WhatsApp belum terhubung atau sedang menyambung. Berkas PDF telah diunduh otomatis dan ruang obrolan WhatsApp Web telah dibuka. Silakan lampirkan berkas PDF di chat.`,
        );
      } else {
        showFeedback(
          "error",
          "Gagal Membuat Laporan",
          pdfRes.message || "Terjadi kesalahan server saat membuat file PDF.",
        );
      }
    } catch (error) {
      console.error("Error dispatching direct/fallback PDF WhatsApp:", error);
      showFeedback(
        "error",
        "Kesalahan Sistem",
        "Terjadi kesalahan internal saat memproses laporan.",
      );
    } finally {
      setSendingWaId(null);
    }
  };

  const _formatTanggal = (dateStr: string) => {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp Pairing Integration Header */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 bg-emerald-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5.5 h-5.5 text-emerald-600 animate-pulse" />
            <h2 className="font-bold text-neutral-800 text-sm uppercase tracking-wider">
              Integrasi Kirim WhatsApp Langsung (QR Code)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                waStatus === "ready"
                  ? "bg-emerald-500 animate-ping"
                  : waStatus === "connecting" || waStatus === "qr_ready"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-red-500"
              }`}
            />
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
              {waStatus === "ready"
                ? "Terhubung"
                : waStatus === "connecting"
                  ? "Sedang Menghubungkan..."
                  : waStatus === "qr_ready"
                    ? "Siap Dipindai"
                    : "Terputus"}
            </span>
          </div>
        </div>

        <div className="p-6">
          {waStatus === "disconnected" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-semibold text-neutral-800">
                  WhatsApp belum aktif.
                </p>
                <p className="text-xs text-neutral-500">
                  Hubungkan WhatsApp Anda untuk mengirim dokumen PDF langsung ke
                  ruang obrolan nasabah.
                </p>
              </div>
              <button
                type="button"
                disabled={isWaLoading}
                onClick={handleConnectWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-75"
              >
                {isWaLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    Menghubungkan...
                  </span>
                ) : (
                  "Hubungkan Akun WhatsApp"
                )}
              </button>
            </div>
          )}

          {waStatus === "connecting" && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-semibold text-neutral-600">
                Menghidupkan layanan WhatsApp... Harap tunggu sebentar.
              </p>
            </div>
          )}

          {waStatus === "qr_ready" && waQrCode && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
              <div className="border border-neutral-200 p-3 bg-white rounded-2xl shadow-md">
                {/* biome-ignore lint/performance/noImgElement: base64 QR code does not benefit from next/image */}
                <img
                  src={waQrCode}
                  alt="WhatsApp Web QR Code"
                  className="w-48 h-48 block"
                />
              </div>
              <div className="space-y-4 max-w-md text-center md:text-left">
                <div>
                  <h3 className="font-bold text-neutral-800 text-base">
                    Pindai Kode QR WhatsApp
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Gunakan perangkat WhatsApp utama Anda untuk menghubungkan
                    sistem.
                  </p>
                </div>
                <ol className="text-xs text-neutral-600 space-y-2 list-decimal list-inside text-left">
                  <li>
                    Buka aplikasi <b>WhatsApp</b> di ponsel Anda.
                  </li>
                  <li>
                    Buka <b>Menu / Pengaturan</b> lalu pilih{" "}
                    <b>Perangkat Tertaut</b>.
                  </li>
                  <li>
                    Ketuk tombol <b>Tautkan Perangkat</b>.
                  </li>
                  <li>Arahkan kamera ponsel Anda ke kode QR di layar ini.</li>
                </ol>
                <button
                  type="button"
                  onClick={handleDisconnectWhatsApp}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-600 font-bold transition-all text-xs cursor-pointer"
                >
                  Batal Hubungkan
                </button>
              </div>
            </div>
          )}

          {waStatus === "ready" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-800">
                    WhatsApp Terhubung Aktif!
                  </p>
                  <p className="text-xs text-neutral-500">
                    Anda dapat mengirimkan dokumen laporan PDF secara langsung
                    ke nomor tujuan nasabah tanpa ribet.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isWaLoading}
                onClick={handleDisconnectWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-bold transition-all rounded-xl text-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar WhatsApp
              </button>
            </div>
          )}

          {waError && (
            <div className="mt-4 p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{waError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600" />
            Laporan Nasabah
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Lihat daftar ringkasan kontribusi seluruh nasabah. Klik &ldquo;Lihat
            Laporan&rdquo; pada nasabah untuk melihat laporan log transaksi
            setoran lengkap milik mereka.
          </p>
        </div>
      </div>

      {/* Directory Control Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nasabah berdasarkan nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850"
          />
        </div>
        {isPending && (
          <div className="flex items-center">
            <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Directory Table Grid */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Nasabah</th>
                <th className="px-6 py-3.5">No. Telepon</th>
                <th className="px-6 py-3.5">Total Berat Setor</th>
                <th className="px-6 py-3.5">Total Transaksi</th>
                <th className="px-6 py-3.5">Saldo Kredit</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {nasabahList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-neutral-400"
                  >
                    Tidak ditemukan data nasabah.
                  </td>
                </tr>
              ) : (
                nasabahList.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-neutral-50/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-neutral-900">
                        {n.user.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5">
                        Role: <span className="lowercase">{n.user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 font-medium">
                      {n.noTelepon || "-"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-neutral-800">
                      {n.totalBerat.toLocaleString("id-ID")} kg
                    </td>
                    <td className="px-6 py-4 text-neutral-600 font-semibold">
                      {n.totalTransaksi} Setoran
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600 font-mono">
                      Rp {n.kredit.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectNasabah(n.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-sm rounded-lg transition-all border-0 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Laporan
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={sendingWaId !== null}
                          onClick={() =>
                            handleSendReportDirect(
                              n.id,
                              n.user.name,
                              n.noTelepon,
                              n.totalBerat,
                              n.kredit,
                              n.totalTransaksi,
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-sm rounded-lg transition-all border-0 cursor-pointer disabled:opacity-75"
                        >
                          {sendingWaId === n.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mengirim WA...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Kirim WA</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}

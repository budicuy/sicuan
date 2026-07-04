"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Building,
  CheckCircle,
  ChevronRight,
  Coins,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  QrCode,
  Scale,
  Search,
  Send,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  connectWhatsAppAction,
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
  const [selectedNasabahId, setSelectedNasabahId] = useState<number | null>(
    null,
  );
  const [detailData, setDetailData] = useState<NasabahDetail | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
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

  const handleBackToList = () => {
    setSelectedNasabahId(null);
    setDetailData(null);
    loadNasabahList();
  };

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

    if (waStatus !== "ready") {
      showFeedback(
        "error",
        "WhatsApp Belum Terhubung",
        "Silakan hubungkan akun WhatsApp Anda terlebih dahulu menggunakan pemindaian QR Code di bagian atas halaman sebelum mengirim laporan langsung.",
      );
      return;
    }

    setSendingWaId(nasabahId);

    try {
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
          "Terkirim via WhatsApp!",
          `Laporan transaksi setoran PDF untuk nasabah ${nasabahName} telah berhasil dikirimkan langsung ke nomor WhatsApp ${phone} secara otomatis!`,
        );
      } else {
        showFeedback(
          "error",
          "Gagal Mengirim WA",
          res.message || "Gagal mengirim berkas PDF ke WhatsApp.",
        );
      }
    } catch (error) {
      console.error("Error dispatching direct PDF WhatsApp:", error);
      showFeedback(
        "error",
        "Kesalahan Sistem",
        "Terjadi kesalahan internal saat mengirim laporan via WhatsApp.",
      );
    } finally {
      setSendingWaId(null);
    }
  };

  const formatTanggal = (dateStr: string) => {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (selectedNasabahId !== null) {
    if (isLoadingDetail || !detailData) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-sm font-semibold text-neutral-500">
            Memuat laporan nasabah...
          </p>
        </div>
      );
    }

    const { profile, setoran } = detailData;
    const totalBerat = setoran.reduce((sum, s) => sum + s.beratKg, 0);
    const totalKredit = setoran.reduce((sum, s) => sum + s.totalPoin, 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Detail Header & Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-primary-600 transition-colors border-0 bg-transparent cursor-pointer p-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
              Laporan Detail: {profile.user.name}
            </h1>
          </div>

          <button
            type="button"
            disabled={sendingWaId !== null}
            onClick={() =>
              handleSendReportDirect(
                profile.id,
                profile.user.name,
                profile.noTelepon,
                totalBerat,
                totalKredit,
                setoran.length,
              )
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 border-0 cursor-pointer disabled:opacity-75"
          >
            {sendingWaId === profile.id ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Mengirim PDF...</span>
              </>
            ) : (
              <>
                <Send className="w-4.5 h-4.5" />
                <span>Kirim Langsung ke WA</span>
              </>
            )}
          </button>
        </div>

        {/* Nasabah Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-neutral-800 border-b border-neutral-100 pb-2.5 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Informasi Profil Nasabah
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  NIK
                </span>
                <span className="text-sm text-neutral-850 font-semibold font-mono">
                  {profile.nik || "-"}
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Tipe Nasabah
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-full inline-block uppercase">
                  {profile.user.role}
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  No. Telepon / WhatsApp
                </span>
                <span className="text-sm text-neutral-850 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  {profile.noTelepon || "-"}
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Akun Username
                </span>
                <span className="text-sm text-neutral-500 font-mono">
                  @{profile.user.username}
                </span>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Alamat
                </span>
                <span className="text-sm text-neutral-700 flex items-start gap-1.5 leading-relaxed">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  {profile.alamat || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-neutral-800 border-b border-neutral-100 pb-2.5 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              Detail Keuangan
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Metode Penampung Reward
                </span>
                {profile.jenisBank ? (
                  <div className="text-sm">
                    <span className="font-bold text-neutral-800 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-[9px] mr-1 uppercase">
                      {profile.jenisBank}
                    </span>
                    <span className="font-mono text-neutral-700 font-semibold">
                      {profile.noRekening || "-"}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-neutral-500 font-semibold flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-neutral-400" />
                    Tunai / Belum diatur
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Saldo Kredit Saat Ini
                </span>
                <span className="text-xl font-black text-emerald-600 font-mono block">
                  Rp {profile.kredit.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregated Detail Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-primary-50 rounded-xl">
              <Scale className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                Total Berat Terkumpul
              </span>
              <span className="text-2xl font-bold text-neutral-900 font-mono block mt-0.5">
                {totalBerat.toLocaleString("id-ID")}{" "}
                <span className="text-sm font-semibold text-neutral-500">
                  kg
                </span>
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Coins className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                Total Kredit Diperoleh
              </span>
              <span className="text-2xl font-bold text-emerald-600 font-mono block mt-0.5">
                Rp {totalKredit.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                Total Setoran
              </span>
              <span className="text-2xl font-bold text-neutral-900 font-mono block mt-0.5">
                {setoran.length.toLocaleString("id-ID")}{" "}
                <span className="text-sm font-semibold text-neutral-500">
                  Transaksi
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Setoran Detail Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="font-bold text-neutral-800 text-sm uppercase tracking-wider">
              Daftar Log Transaksi Setoran
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/60 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Nomor Setor</th>
                  <th className="px-6 py-3.5">Jenis Sampah</th>
                  <th className="px-6 py-3.5">Berat (kg)</th>
                  <th className="px-6 py-3.5">Kredit (Rp)</th>
                  <th className="px-6 py-3.5">Tanggal Setor</th>
                  <th className="px-6 py-3.5">Catatan</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {setoran.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-neutral-400"
                    >
                      Nasabah belum pernah melakukan setoran sampah.
                    </td>
                  </tr>
                ) : (
                  setoran.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-neutral-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-neutral-800">
                        {s.nomorSetor}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/50">
                          {s.jenisSampah}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-850 font-semibold">
                        {s.beratKg} kg
                      </td>
                      <td className="px-6 py-4 font-bold text-primary-600 font-mono">
                        Rp {s.totalPoin.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {formatTanggal(s.tanggalSetor)}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 text-xs truncate max-w-xs">
                        {s.catatan || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                          Diterima
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

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

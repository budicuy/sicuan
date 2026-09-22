"use client";

import imageCompression from "browser-image-compression";
import {
  Camera,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  type CreateBuktiPembayaranInput,
  createBuktiPembayaran,
  getDraftSuratPencairanPdf,
  getNasabahProfileAndMonthlyWaste,
} from "@/app/(admin-superadmin)/pencairan-dana/action";
import { DisbursementLetterPreview } from "@/app/components/shared/DisbursementLetterPreview";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import type { DisbursementItem } from "@/app/types";
import type { DataSampahItem } from "@/db/schema/bukti-pembayaran";

const BULAN_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface Props {
  item: DisbursementItem;
  nasabahData?: {
    idPelanggan: string;
    namaBankSampah: string;
    alamat?: string | null;
    noTelepon?: string | null;
  };
  onClose: () => void;
  onSuccess: (docId: number) => void;
}

export function BuktiPembayaranModal({
  item,
  nasabahData,
  onClose,
  onSuccess,
}: Props) {
  const thisYear = item.periodeTahun || new Date(item.createdAt).getFullYear();
  const thisMonthNum =
    item.periodeBulan || new Date(item.createdAt).getMonth() + 1;
  const thisMonth = BULAN_OPTIONS[thisMonthNum - 1];

  // Form state (managed automatically, no manual inputs shown)
  const [namaBankSampah, setNamaBankSampah] = useState(
    nasabahData?.namaBankSampah ?? item.user.name,
  );
  const [idPelanggan, setIdPelanggan] = useState(
    nasabahData?.idPelanggan ?? `SPK-${String(item.userId).padStart(3, "0")}`,
  );
  const [alamat, setAlamat] = useState(nasabahData?.alamat ?? "");
  const [noTelepon, setNoTelepon] = useState(nasabahData?.noTelepon ?? "");
  const [periodeBulan, _setPeriodeBulan] = useState(thisMonth);
  const [periodeTahun, _setPeriodeTahun] = useState(thisYear);
  const [kategoriSumber, _setKategoriSumber] = useState(
    item.user.role === "warmindo" ? "tps-3r" : "bank-sampah-induk",
  );
  const [dataSampah, setDataSampah] = useState<DataSampahItem[]>([
    { jenis: "Karton", beratKg: 0, terlampir: true },
  ]);
  const initialBiayaTambahan = item.biayaTambahan || 0;
  const initialTarifDasar = item.jumlah - initialBiayaTambahan;
  const [tarifDasar, _setTarifDasar] = useState(initialTarifDasar);
  const [biayaTambahan, _setBiayaTambahan] = useState(initialBiayaTambahan);
  const [keterangan, _setKeterangan] = useState(item.keterangan ?? "");
  const [namaPenyerah, _setNamaPenyerah] = useState(
    "PT. Indofood Sukses Makmur Tbk.",
  );
  const [jabatanPenyerah, _setJabatanPenyerah] = useState(
    "Pimpinan Perusahaan",
  );
  const [namaPenerima, _setNamaPenerima] = useState(item.user.name);
  const [jabatanPenerima, _setJabatanPenerima] = useState(
    item.user.role === "warmindo"
      ? "Pengelola Warmindo"
      : "Pimpinan Bank Sampah",
  );

  const isCash = item.metodePembayaran === "tunai";

  // Cash scan proof upload & pdf download
  const [buktiScanCashBase64, setBuktiScanCashBase64] = useState<string | null>(
    null,
  );
  const [buktiScanCashFileName, setBuktiScanCashFileName] = useState("");
  const [buktiScanCashFileSize, setBuktiScanCashFileSize] = useState("");
  const [buktiScanCashError, setBuktiScanCashError] = useState("");
  const [isCompressingScanCash, setIsCompressingScanCash] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Admin TTD upload (hanya jika transfer bank)
  const [ttdAdminBase64, setTtdAdminBase64] = useState<string | null>(null);
  const [ttdError, setTtdError] = useState("");
  const [isCompressingTtd, setIsCompressingTtd] = useState(false);

  // Transfer proof upload (required for pending transfer)
  const [buktiTransferBase64, setBuktiTransferBase64] = useState<string | null>(
    null,
  );
  const [buktiTransferError, setBuktiTransferError] = useState("");
  const [isCompressingBukti, setIsCompressingBukti] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    // Automatically pre-populate profile & monthly waste
    getNasabahProfileAndMonthlyWaste(
      item.userId,
      periodeTahun,
      periodeBulan,
    ).then((res) => {
      if (res.success && res.data) {
        if (res.data.alamat) setAlamat(res.data.alamat);
        if (res.data.noTelepon) setNoTelepon(res.data.noTelepon);
        if (res.data.idPelanggan) setIdPelanggan(res.data.idPelanggan);
        if (res.data.namaBankSampah) setNamaBankSampah(res.data.namaBankSampah);
        if (res.data.dataSampah && res.data.dataSampah.length > 0) {
          setDataSampah(res.data.dataSampah);
        } else {
          setDataSampah([{ jenis: "Karton", beratKg: 0, terlampir: true }]);
        }
      }
    });
  }, [item.userId, periodeBulan, periodeTahun]);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showFeedback = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setFeedback({ isOpen: true, type, title, message });
    },
    [],
  );

  const totalBeratKg = dataSampah.reduce((sum, s) => sum + (s.beratKg || 0), 0);
  const totalTagihan = tarifDasar + biayaTambahan;

  const handleBuktiScanCashUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    setBuktiScanCashError("");
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setBuktiScanCashError(
        "Format file tidak didukung. Harap unggah berkas PDF (.pdf).",
      );
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      setBuktiScanCashError(
        `Ukuran file terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Batas maksimal adalah 5 MB.`,
      );
      return;
    }

    setIsCompressingScanCash(true);
    setBuktiScanCashFileName(file.name);
    setBuktiScanCashFileSize((file.size / (1024 * 1024)).toFixed(2));

    const reader = new FileReader();
    reader.onload = () => {
      setBuktiScanCashBase64(reader.result as string);
      setIsCompressingScanCash(false);
    };
    reader.onerror = () => {
      setBuktiScanCashError("Gagal membaca dokumen PDF.");
      setIsCompressingScanCash(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadSurat = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await getDraftSuratPencairanPdf(item.id);
      if (!res.success || !res.pdfBase64) {
        showFeedback(
          "error",
          "Gagal Unduh Surat",
          res.message || "Gagal mengunduh surat.",
        );
        return;
      }
      const byteCharacters = atob(res.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.fileName || `Kuitansi-Pencairan-Tunai-${item.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengunduh surat.";
      showFeedback("error", "Gagal Unduh Surat", errorMessage);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleTtdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setTtdError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTtdError("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }
    setIsCompressingTtd(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        setTtdAdminBase64(reader.result as string);
        setIsCompressingTtd(false);
      };
      reader.onerror = () => {
        setTtdError("Gagal membaca file.");
        setIsCompressingTtd(false);
      };
      reader.readAsDataURL(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setTtdAdminBase64(reader.result as string);
        setIsCompressingTtd(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBuktiTransferUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    setBuktiTransferError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBuktiTransferError("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }
    setIsCompressingBukti(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        setBuktiTransferBase64(reader.result as string);
        setIsCompressingBukti(false);
      };
      reader.onerror = () => {
        setBuktiTransferError("Gagal membaca file.");
        setIsCompressingBukti(false);
      };
      reader.readAsDataURL(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setBuktiTransferBase64(reader.result as string);
        setIsCompressingBukti(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!isCash && !ttdAdminBase64) {
      setTtdError("Tanda tangan admin wajib diunggah sebelum membuat dokumen.");
      return;
    }

    if (isCash && !buktiScanCashBase64) {
      setBuktiScanCashError(
        "Bukti scan / foto kuitansi serah terima tunai wajib diunggah.",
      );
      return;
    }

    const needsBuktiTransfer = !isCash && item.status === "pending";
    if (needsBuktiTransfer && !buktiTransferBase64) {
      setBuktiTransferError(
        "Bukti foto transfer wajib diunggah untuk pencairan transfer.",
      );
      return;
    }

    const input: CreateBuktiPembayaranInput = {
      pencairanDanaId: item.id,
      userId: item.userId,
      namaBankSampah,
      idPelanggan,
      nama: item.user.name,
      alamat,
      noTelepon,
      periodeBulan,
      periodeTahun,
      // Map kategori to db notation
      kategoriSumber:
        kategoriSumber === "tps-3r"
          ? "tps_3r"
          : kategoriSumber === "bank-sampah-unit"
            ? "bank_sampah_unit"
            : "bank_sampah_induk",
      dataSampah,
      totalBeratKg,
      tarifDasar,
      biayaTambahan,
      totalTagihan,
      metodePembayaran: item.metodePembayaran,
      keterangan,
      ttdPenerimaBase64: ttdAdminBase64 || undefined,
      namaPenyerah,
      jabatanPenyerah,
      namaPenerima,
      jabatanPenerima,
      buktiTransferBase64: buktiTransferBase64 || undefined,
      buktiScanCashBase64: buktiScanCashBase64 || undefined,
    };

    startTransition(async () => {
      const res = await createBuktiPembayaran(input);
      if (res.success && res.docId) {
        showFeedback(
          "success",
          isCash ? "Pencairan Tunai Berhasil" : "Dokumen Dibuat",
          res.message,
        );
        onSuccess(res.docId);
      } else {
        showFeedback("error", "Gagal Memproses Pencairan", res.message);
      }
    });
  };

  // Convert categories back for the preview prop type check
  const letterKategori = (
    kategoriSumber === "tps-3r"
      ? "tps-3r"
      : kategoriSumber === "bank-sampah-unit"
        ? "bank-sampah-unit"
        : "bank-sampah-induk"
  ) as "bank-sampah-induk" | "tps-3r" | "bank-sampah-unit";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-primary-600" />
              <div>
                <h3 className="text-base font-bold text-neutral-800">
                  Buat Dokumen Bukti Pembayaran
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Untuk: {item.user.name} —{" "}
                  {item.metodePembayaran === "tunai"
                    ? "Tunai"
                    : "Transfer Bank"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {isCash ? (
              <div className="space-y-4">
                {/* Langkah 1: Unduh Surat */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                          1
                        </span>
                        <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                          Unduh Surat &amp; Kuitansi Fisik
                        </h4>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed max-w-md">
                        Cetak surat kuitansi ini untuk ditandatangani basah oleh
                        pimpinan bank sampah dan perwakilan Indofood saat serah
                        terima uang tunai secara langsung di tempat.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSurat}
                      disabled={isDownloadingPdf}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all border-0 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isDownloadingPdf ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Unduh Dokumen PDF</span>
                    </button>
                  </div>
                </div>

                {/* Langkah 2: Upload Scan Bukti Cash */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-[11px] font-bold">
                      2
                    </span>
                    <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      Unggah Bukti Scan Dokumen Kuitansi Fisik (PDF){" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Setelah uang tunai diserahkan dan kuitansi fisik telah
                    ditandatangani basah di tempat, unggah hasil scan berkas PDF
                    tersebut sebagai bukti pencairan yang sah.
                  </p>

                  {isCompressingScanCash ? (
                    <div className="h-32 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center gap-2 bg-white">
                      <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                      <span className="text-xs text-neutral-500">
                        Membaca dokumen PDF...
                      </span>
                    </div>
                  ) : buktiScanCashBase64 ? (
                    <div className="flex items-center justify-between gap-4 bg-white p-3.5 border border-emerald-200 bg-emerald-50/20 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            ✓ Dokumen PDF Terlampir
                          </p>
                          <p
                            className="text-xs font-semibold text-neutral-800 truncate mt-0.5"
                            title={buktiScanCashFileName}
                          >
                            {buktiScanCashFileName ||
                              "scan_kuitansi_pencairan.pdf"}
                          </p>
                          {buktiScanCashFileSize && (
                            <p className="text-[10px] text-neutral-400">
                              Ukuran: {buktiScanCashFileSize} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBuktiScanCashBase64(null);
                          setBuktiScanCashFileName("");
                          setBuktiScanCashFileSize("");
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border-0 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="relative h-32 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-400 transition-colors flex flex-col items-center justify-center gap-1.5 bg-white cursor-pointer">
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleBuktiScanCashUpload}
                        className="sr-only"
                      />
                      <FileText className="w-6 h-6 text-neutral-400" />
                      <p className="text-xs font-semibold text-neutral-600">
                        Klik untuk upload berkas scan kuitansi (PDF)
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Format file: PDF saja (maks. 5MB)
                      </p>
                    </label>
                  )}
                  {buktiScanCashError && (
                    <p className="text-xs font-semibold text-red-500">
                      {buktiScanCashError}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* TTD Admin Upload — ONLY input required for transfer */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    Unggah Tanda Tangan Admin{" "}
                    <span className="text-red-500">*</span>
                  </span>

                  {isCompressingTtd ? (
                    <div className="h-28 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center gap-2 bg-white">
                      <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                      <span className="text-xs text-neutral-500">
                        Mengompresi gambar...
                      </span>
                    </div>
                  ) : ttdAdminBase64 ? (
                    <div className="flex items-center justify-between gap-4 bg-white p-3 border border-neutral-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-28 rounded-lg border border-neutral-100 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                          {/* biome-ignore lint/performance/noImgElement: TTD preview */}
                          <img
                            src={ttdAdminBase64}
                            alt="Tanda Tangan"
                            className="max-h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            ✓ TTD Admin Terpasang
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Tanda tangan akan langsung masuk ke surat pratinjau
                            di bawah.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTtdAdminBase64(null)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border-0 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="relative h-28 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-400 transition-colors flex flex-col items-center justify-center gap-1.5 bg-white cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTtdUpload}
                        className="sr-only"
                      />
                      <Camera className="w-6 h-6 text-neutral-400" />
                      <p className="text-xs font-semibold text-neutral-600">
                        Klik untuk upload foto tanda tangan admin
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Tanda tangan diperlukan untuk mengesahkan bukti
                        pembayaran
                      </p>
                    </label>
                  )}
                  {ttdError && (
                    <p className="text-xs font-semibold text-red-500">
                      {ttdError}
                    </p>
                  )}
                </div>

                {/* Bukti Transfer Upload — Only shown for pending transfer requests */}
                {item.status === "pending" && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4">
                    <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                      Unggah Bukti Transfer{" "}
                      <span className="text-red-500">*</span>
                    </span>

                    {isCompressingBukti ? (
                      <div className="h-28 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center gap-2 bg-white">
                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                        <span className="text-xs text-neutral-500">
                          Mengompresi gambar...
                        </span>
                      </div>
                    ) : buktiTransferBase64 ? (
                      <div className="flex items-center justify-between gap-4 bg-white p-3 border border-neutral-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-28 rounded-lg border border-neutral-100 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                            {/* biome-ignore lint/performance/noImgElement: Bukti Transfer preview */}
                            <img
                              src={buktiTransferBase64}
                              alt="Bukti Transfer"
                              className="max-h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              ✓ Bukti Transfer Terunggah
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              Bukti transfer berhasil dipilih.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBuktiTransferBase64(null)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border-0 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="relative h-28 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-400 transition-colors flex flex-col items-center justify-center gap-1.5 bg-white cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBuktiTransferUpload}
                          className="sr-only"
                        />
                        <Camera className="w-6 h-6 text-neutral-400" />
                        <p className="text-xs font-semibold text-neutral-600">
                          Klik untuk upload foto bukti transfer bank
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          Bukti transfer wajib dilampirkan sebelum menyetujui
                        </p>
                      </label>
                    )}
                    {buktiTransferError && (
                      <p className="text-xs font-semibold text-red-500">
                        {buktiTransferError}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Live Letter Preview */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Pratinjau Dokumen Bukti Pembayaran
              </span>
              <div className="border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
                <DisbursementLetterPreview
                  data={{
                    user: {
                      name: item.user.name,
                      role: item.user.role,
                    },
                    idPelanggan,
                    alamat,
                    noTelepon,
                    dataSampah: dataSampah.map((d) => ({
                      jenis: d.jenis,
                      beratKg: d.beratKg,
                    })),
                    totalBeratKg,
                  }}
                  customAmount={(tarifDasar + biayaTambahan).toString()}
                  metode={item.metodePembayaran}
                  keterangan={keterangan}
                  ttdBase64={item.ttdPenyerahUrl}
                  kategoriSumber={letterKategori}
                  ttdAdminBase64={ttdAdminBase64}
                  biayaTambahan={biayaTambahan}
                  catatanBiayaTambahan={item.catatanBiayaTambahan}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-neutral-100 flex gap-3 shrink-0 bg-neutral-50/70">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer bg-white transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isPending ||
                (isCash
                  ? isCompressingScanCash || !buktiScanCashBase64
                  : isCompressingTtd ||
                    isCompressingBukti ||
                    !ttdAdminBase64 ||
                    (item.status === "pending" && !buktiTransferBase64))
              }
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 border-0 cursor-pointer transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isCash
                  ? "Selesaikan Pencairan Tunai & Simpan Bukti"
                  : "Buat & Simpan Dokumen"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </>
  );
}

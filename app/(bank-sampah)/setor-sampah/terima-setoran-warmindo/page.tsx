"use client";

import imageCompression from "browser-image-compression";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Recycle,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  bankSampahTerimaSetoran,
  getSetoranWarmindoForBankSampah,
  validateFotoTimbangan,
} from "@/app/(bank-sampah)/setor-sampah/bank-sampah-setor-sampah/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";

const terimaSteps = [
  {
    element: "#tour-bank-sampah-terima-filters",
    popover: {
      title: "Filter Pengiriman Setoran",
      description:
        "Anda dapat memfilter kiriman setoran dari Warmindo berdasarkan statusnya (seperti Sedang Dikirim, Diterima, dll).",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-sampah-terima-list",
    popover: {
      title: "Daftar Setoran Warmindo",
      description:
        "Daftar setoran sampah yang sedang dalam proses pengiriman oleh kurir ekspedisi. Klik tombol 'Terima & Konfirmasi' untuk memproses verifikasi fisik sampah.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-sampah-terima-modal",
    popover: {
      title: "Verifikasi & Konfirmasi Penerimaan",
      description:
        "Timbang sampah secara aktual, masukkan berat aktualnya, lampirkan foto timbangan verifikasi, lalu klik 'Konfirmasi Penerimaan' untuk menyelesaikan proses.",
      side: "top" as const,
    },
  },
];

interface WarmindoSetoranItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  status: string;
  catatan?: string | null;
  createdAt: Date;
  metodeSetor?: string | null;
  fotoTimbangan: string;
  fotoBuktiTambahan?: string[] | null;
  user?: { id: number; name: string; username: string; role: string } | null;
  ekspedisi?: { id: number; namaVendor: string; noTelepon: string } | null;
}

export default function TerimaSetoranWarmindoPage() {
  const [warmindoSetoran, setWarmindoSetoran] = useState<WarmindoSetoranItem[]>(
    [],
  );
  const [warmindoFilterStatus, setWarmindoFilterStatus] = useState("Semua");
  const [isLoadingWarmindo, setIsLoadingWarmindo] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<any>(null);

  const handleTourStart = () => {
    savedStateRef.current = {
      warmindoSetoran,
      warmindoFilterStatus,
    };
    setIsTourActive(true);
    setWarmindoFilterStatus("diserahkan");
    setWarmindoSetoran([
      {
        id: 999,
        nomorSetor: "SIMULASI-W-01",
        jenisSampah: "Karton",
        beratKg: 25.0,
        tanggalSetor: new Date().toISOString().split("T")[0],
        status: "diserahkan",
        catatan: "Setoran Karton Warmindo Demo",
        createdAt: new Date(),
        metodeSetor: "ekspedisi",
        fotoTimbangan: "/sampel_1.png",
        fotoBuktiTambahan: ["/sampel_1.png"],
        user: {
          id: 101,
          name: "Warmindo Bakti Jaya",
          username: "warmindo_demo",
          role: "warmindo",
        },
        ekspedisi: {
          id: 201,
          namaVendor: "J&T Express",
          noTelepon: "088888xxxx",
        },
      },
      {
        id: 998,
        nomorSetor: "SIMULASI-W-02",
        jenisSampah: "Etiket",
        beratKg: 12.5,
        tanggalSetor: new Date().toISOString().split("T")[0],
        status: "pending",
        catatan: "Setoran Etiket Warmindo Demo (Datang Langsung)",
        createdAt: new Date(),
        metodeSetor: "langsung",
        fotoTimbangan: "/sampel_1.png",
        fotoBuktiTambahan: ["/sampel_1.png"],
        user: {
          id: 101,
          name: "Warmindo Bakti Jaya",
          username: "warmindo_demo",
          role: "warmindo",
        },
      },
    ]);
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    if (savedStateRef.current) {
      setWarmindoSetoran(savedStateRef.current.warmindoSetoran);
      setWarmindoFilterStatus(savedStateRef.current.warmindoFilterStatus);
    }
  };

  const [selectedItemForTerima, setSelectedItemForTerima] =
    useState<WarmindoSetoranItem | null>(null);
  const [beratAktual, setBeratAktual] = useState("");
  const [jenisSampahAktual, setJenisSampahAktual] = useState("Karton");
  const [fotoTimbangan, setFotoTimbangan] = useState<string | null>(null);
  const [fotoBuktiList, setFotoBuktiList] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const buktiInputRef = useRef<HTMLInputElement>(null);

  const [aiValidated, setAiValidated] = useState(false);
  const [beratAiKg, setBeratAiKg] = useState<number | null>(null);
  const [requestManual, setRequestManual] = useState(false);
  const [isValidatingAI, setIsValidatingAI] = useState(false);

  const handleBuktiChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const limit = 3 - fotoBuktiList.length;
    const filesToProcess = Array.from(files).slice(0, limit);

    for (const file of filesToProcess) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        const compressed = await compressImage(result, 200 * 1024);
        setFotoBuktiList((prev) => [...prev, compressed]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBukti = (index: number) => {
    setFotoBuktiList((prev) => prev.filter((_, i) => i !== index));
  };

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => setFeedback({ isOpen: true, type, title, message });

  const compressImage = async (
    dataUrl: string,
    maxSizeBytes: number,
  ): Promise<string> => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });

      const options = {
        maxSizeMB: maxSizeBytes / (1024 * 1024),
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
    } catch (err) {
      console.error("Gagal kompres gambar:", err);
      return dataUrl;
    }
  };

  const loadWarmindoSetoran = useCallback(async () => {
    setIsLoadingWarmindo(true);
    const res = await getSetoranWarmindoForBankSampah({
      page: 1,
      limit: 50,
      status: warmindoFilterStatus !== "Semua" ? warmindoFilterStatus : "",
    });
    setWarmindoSetoran(res.data as WarmindoSetoranItem[]);
    setIsLoadingWarmindo(false);
  }, [warmindoFilterStatus]);

  useEffect(() => {
    loadWarmindoSetoran();
  }, [loadWarmindoSetoran]);

  const handleOpenTerimaModal = (item: WarmindoSetoranItem) => {
    setSelectedItemForTerima(item);
    setBeratAktual("");
    setJenisSampahAktual(item.jenisSampah);
    setAiValidated(false);
    setBeratAiKg(null);
    setRequestManual(false);
    setIsValidatingAI(false);
    if (isTourActive) {
      setFotoTimbangan("/sampel_1.png");
      setFotoBuktiList(["/sampel_1.png"]);
      setAiValidated(true);
      setBeratAiKg(10.0);
      setBeratAktual("10.0");
    } else {
      setFotoTimbangan(null);
      setFotoBuktiList([]);
    }
    setFormErrors({});
  };

  const handleValidasiAI = async () => {
    if (!fotoTimbangan || !beratAktual) return;
    setIsValidatingAI(true);
    setFormErrors({});
    try {
      const res = await validateFotoTimbangan(
        fotoTimbangan,
        Number(beratAktual),
      );
      if (res.success) {
        setAiValidated(true);
        setBeratAiKg(res.berat);
      } else {
        setFormErrors({ fotoTimbangan: [res.message] });
      }
    } catch (err) {
      console.error(err);
      setFormErrors({ fotoTimbangan: ["Terjadi kesalahan saat memvalidasi."] });
    } finally {
      setIsValidatingAI(false);
    }
  };

  const handleTerimaWarmindo = async () => {
    if (!selectedItemForTerima) return;
    setFormErrors({});

    const beratNum = Number.parseFloat(beratAktual);
    if (Number.isNaN(beratNum) || beratNum <= 0) {
      setFormErrors({
        beratAktual: ["Berat aktual harus berupa angka positif."],
      });
      return;
    }

    if (!fotoTimbangan) {
      setFormErrors({
        fotoTimbangan: ["Foto timbangan verifikasi wajib dilampirkan."],
      });
      return;
    }

    if (fotoBuktiList.length === 0) {
      setFormErrors({
        fotoBukti: ["Minimal 1 foto bukti tambahan wajib dilampirkan."],
      });
      return;
    }

    setProcessingId(selectedItemForTerima.id);
    if (isTourActive) {
      setTimeout(() => {
        setProcessingId(null);
        setWarmindoSetoran((prev) =>
          prev.map((item) =>
            item.id === selectedItemForTerima.id
              ? {
                  ...item,
                  status: requestManual ? "pending" : "diterima",
                  beratKg: beratNum,
                  jenisSampah: jenisSampahAktual,
                  fotoTimbangan: fotoTimbangan,
                  fotoBuktiTambahan: fotoBuktiList,
                }
              : item,
          ),
        );
        setSelectedItemForTerima(null);
        document.dispatchEvent(new CustomEvent("close-tour-guide"));
        showFeedback(
          "success",
          "Berhasil!",
          requestManual
            ? `Simulasi: Sukses mengajukan verifikasi manual setoran ${selectedItemForTerima.nomorSetor}.`
            : `Simulasi: Sukses melakukan verifikasi dan menerima setoran ${selectedItemForTerima.nomorSetor} (${jenisSampahAktual}) seberat ${beratNum} kg.`,
        );
      }, 1000);
      return;
    }

    startTransition(async () => {
      const res = await bankSampahTerimaSetoran(
        selectedItemForTerima.id,
        beratNum,
        fotoTimbangan,
        jenisSampahAktual,
        fotoBuktiList,
        requestManual,
        beratAiKg || undefined,
      );
      setProcessingId(null);
      if (res.success) {
        showFeedback("success", "Berhasil!", res.message);
        setSelectedItemForTerima(null);
        loadWarmindoSetoran();
      } else {
        showFeedback("error", "Gagal!", res.message);
      }
    });
  };

  const formatTanggal = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    if (status === "diterima")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "diverifikasi")
      return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "diserahkan")
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (status === "pending")
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getStatusLabel = (status: string) => {
    if (status === "pending") return "Menunggu Verifikasi";
    if (status === "diverifikasi") return "Menunggu Pickup";
    if (status === "diserahkan") return "Sedang Dikirim";
    if (status === "diterima") return "Diterima";
    if (status === "ditolak") return "Ditolak";
    return status;
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 lg:p-8">
      <TourGuide
        pageKey="bank_sampah_terima"
        steps={terimaSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary-100">
            <Recycle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Terima Setoran Warmindo
            </h1>
            <p className="text-sm text-neutral-500">
              Verifikasi dan terima kiriman setoran sampah dari mitra Warmindo
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-neutral-900">
                Daftar Setoran Warmindo
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Konfirmasi penerimaan sampah dari mitra Warmindo
              </p>
            </div>
            <div
              id="tour-bank-sampah-terima-filters"
              className="flex items-center gap-2 flex-wrap"
            >
              {[
                "pending",
                "diverifikasi",
                "diserahkan",
                "diterima",
                "Semua",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWarmindoFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    warmindoFilterStatus === s
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  {s === "pending"
                    ? "Pending"
                    : s === "diverifikasi"
                      ? "Diverifikasi"
                      : s === "diserahkan"
                        ? "Dikirim"
                        : s === "diterima"
                          ? "Diterima"
                          : "Semua"}
                </button>
              ))}
              <button
                type="button"
                onClick={loadWarmindoSetoran}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-all cursor-pointer"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-800 space-y-1">
            <p className="font-bold">Alur Verifikasi Setoran Warmindo:</p>
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                Pending
              </span>
              <span className="text-sky-500">
                → Diverifikasi oleh Admin &amp; Ekspedisi →
              </span>
              <span className="font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                Diverifikasi
              </span>
              <span className="text-sky-500">→ Warmindo konfirmasi →</span>
              <span className="font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                Dikirim
              </span>
              <span className="text-sky-500">→ Terima Sampah →</span>
              <span className="font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Diterima
              </span>
              <span className="text-sky-500">
                → Tercatat dalam rekap akumulasi bulanan
              </span>
            </div>
          </div>
        </div>

        {isLoadingWarmindo ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm text-neutral-500">
              Memuat data setoran Warmindo...
            </p>
          </div>
        ) : warmindoSetoran.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center gap-3">
            <Package className="w-10 h-10 text-neutral-300" />
            <p className="text-sm text-neutral-500 font-medium">
              Tidak ada setoran dengan status ini
            </p>
            <p className="text-xs text-neutral-400">
              Coba pilih filter status lain di atas
            </p>
          </div>
        ) : (
          <div
            id="tour-bank-sampah-terima-list"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {warmindoSetoran.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {item.nomorSetor}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.user?.name ?? "Warmindo"} ·{" "}
                        {formatTanggal(item.tanggalSetor)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 ${getStatusBadge(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3 flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Jenis Sampah</span>
                    <span className="font-semibold text-neutral-800">
                      {item.jenisSampah}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Berat</span>
                    <span className="font-bold text-primary-700">
                      {item.beratKg} kg
                    </span>
                  </div>
                  {item.ekspedisi && (
                    <div className="flex items-start justify-between text-xs gap-2">
                      <span className="text-neutral-500 shrink-0">
                        Ekspedisi
                      </span>
                      <span className="font-semibold text-neutral-800 text-right">
                        {item.ekspedisi.namaVendor}
                        <span className="text-neutral-500 font-normal block">
                          {item.ekspedisi.noTelepon}
                        </span>
                      </span>
                    </div>
                  )}
                  {item.catatan && (
                    <p className="text-[11px] text-neutral-500 bg-neutral-50 rounded-lg p-2 border border-neutral-100 italic">
                      &ldquo;{item.catatan}&rdquo;
                    </p>
                  )}
                </div>

                {item.status === "pending" &&
                  item.metodeSetor === "langsung" && (
                    <div className="px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => handleOpenTerimaModal(item)}
                        disabled={isPending && processingId === item.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs border-0 cursor-pointer transition-all shadow-sm"
                      >
                        {isPending && processingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Validasi
                      </button>
                    </div>
                  )}

                {item.status === "diserahkan" && (
                  <div className="px-4 pb-4 space-y-2">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700">
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      <span>Sampah dalam perjalanan ke Bank Sampah</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenTerimaModal(item)}
                      disabled={isPending && processingId === item.id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs border-0 cursor-pointer transition-all shadow-sm"
                    >
                      {isPending && processingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Validasi
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItemForTerima && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            id="tour-bank-sampah-terima-modal"
            className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
                Verifikasi Penerimaan Sampah
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItemForTerima(null)}
                className="text-neutral-400 hover:text-neutral-600 bg-transparent border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label
                  htmlFor="modalJenisSampah"
                  className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5"
                >
                  Jenis Sampah <span className="text-red-500">*</span>
                </label>
                <select
                  id="modalJenisSampah"
                  value={jenisSampahAktual}
                  onChange={(e) => setJenisSampahAktual(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-semibold"
                >
                  <option value="Karton">Karton</option>
                  <option value="Etiket">Etiket</option>
                  <option value="Paper Cup">Paper Cup</option>
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="modalBeratAktual"
                    className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5"
                  >
                    Berat Aktual (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modalBeratAktual"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={beratAktual}
                    onChange={(e) => setBeratAktual(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all"
                  />
                  {formErrors.beratAktual && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.beratAktual[0]}
                    </p>
                  )}
                </div>

                <div className="border-t border-neutral-100 pt-4 space-y-3">
                  <span className="block text-xs font-semibold text-neutral-700 uppercase">
                    Foto Timbangan Verifikasi{" "}
                    <span className="text-red-500">*</span>
                  </span>
                  {fotoTimbangan ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-video bg-neutral-50 max-h-48">
                        <Image
                          src={fotoTimbangan}
                          alt="Timbangan verifikasi"
                          className="w-full h-full object-contain"
                          fill
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFotoTimbangan(null);
                            setAiValidated(false);
                            setBeratAiKg(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleValidasiAI}
                        disabled={isValidatingAI || aiValidated || !beratAktual}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 text-xs font-bold transition-all cursor-pointer"
                      >
                        {isValidatingAI ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        {aiValidated
                          ? "✓ Tervalidasi AI"
                          : "Validasi Berat dengan AI"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-400 text-neutral-600 transition-all cursor-pointer"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="font-semibold text-xs">
                          Ambil Foto / Upload Timbangan
                        </span>
                      </button>
                      <input
                        id="modalFotoTimbangan"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            const result = ev.target?.result as string;
                            const compressed = await compressImage(
                              result,
                              200 * 1024,
                            );
                            setFotoTimbangan(compressed);
                            setAiValidated(false);
                            setBeratAiKg(null);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                  )}
                  {formErrors.fotoTimbangan && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.fotoTimbangan[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="block text-xs font-semibold text-neutral-700 uppercase">
                      Foto Bukti Tambahan Verifikasi{" "}
                      <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-neutral-400">
                      {fotoBuktiList.length}/3 foto
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {fotoBuktiList.map((imgB64, idx) => (
                      <div
                        key={imgB64}
                        className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-black group"
                      >
                        <Image
                          src={imgB64}
                          alt={`Bukti tambahan ${idx + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => removeBukti(idx)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors border-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {fotoBuktiList.length < 3 && (
                      <div className="relative aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400 text-neutral-500 transition-all cursor-pointer">
                        <Plus className="w-6 h-6 text-neutral-400" />
                        <span className="text-xs font-semibold">Tambah</span>
                        <input
                          ref={buktiInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBuktiChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                  {formErrors.fotoBukti && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.fotoBukti[0]}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2 pt-4 border-t border-neutral-100">
                  <input
                    id="requestManual"
                    type="checkbox"
                    checked={requestManual}
                    onChange={(e) => setRequestManual(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600 cursor-pointer"
                  />
                  <label
                    htmlFor="requestManual"
                    className="text-xs text-neutral-600 leading-normal cursor-pointer select-none font-medium"
                  >
                    Ajukan validasi manual oleh Admin
                    <span className="block text-[10px] text-neutral-400 font-normal">
                      Pilih jika pembacaan AI terus gagal atau gambar timbangan
                      tidak terbaca dengan baik.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedItemForTerima(null)}
                className="px-4 py-2 border border-neutral-200 hover:border-neutral-300 text-neutral-600 rounded-lg text-xs font-bold transition-all bg-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  isPending ||
                  !beratAktual ||
                  !fotoTimbangan ||
                  fotoBuktiList.length === 0 ||
                  (!aiValidated && !requestManual)
                }
                onClick={handleTerimaWarmindo}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 border-0 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Konfirmasi Penerimaan
              </button>
            </div>
          </div>
        </div>
      )}

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

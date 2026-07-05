"use client";

import imageCompression from "browser-image-compression";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Plus,
  Recycle,
  ShieldCheck,
  Truck,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  bankSampahTerimaSetoran,
  bankSampahVerifySetoran,
  createSetorSampah,
  getAllActiveEkspedisi,
  getMySetoran,
  getSetoranWarmiendoForBankSampah,
  validateFotoTimbangan,
} from "@/app/(bank-sampah)/setor-sampah/bank-sampah-setor-sampah/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";

interface SetorSampahItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  totalPoin: number;
  totalKredit?: number;
  tanggalSetor: string;
  status: string;
  createdAt: Date;
  metodeSetor?: string;
}

interface WarmiendoSetoranItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  status: string;
  catatan?: string | null;
  createdAt: Date;
  user?: { id: number; name: string; username: string; role: string } | null;
  ekspedisi?: { id: number; namaVendor: string; noTelepon: string } | null;
}

interface EkspedisiItem {
  id: number;
  namaVendor: string;
  noTelepon: string;
}

function addWatermarkToImage(
  imageDataUrl: string,
  timestamp: Date,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);

      const timeStr = timestamp.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const fontSize = Math.max(16, Math.floor(img.width * 0.035));
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const padding = fontSize * 0.6;
      const textWidth = ctx.measureText(timeStr).width;
      const boxW = textWidth + padding * 2;
      const boxH = fontSize + padding * 2;
      const x = img.width - boxW - padding;
      const y = img.height - boxH - padding;

      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 6);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(timeStr, x + padding, y + padding + fontSize * 0.8);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = imageDataUrl;
  });
}

function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        setError(
          "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.",
        );
      }
    };
    startCamera();

    return () => {
      stream?.getTracks().forEach((t) => {
        t.stop();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream?.getTracks]);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stream?.getTracks().forEach((t) => {
      t.stop();
    });
    onCapture(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Foto Timbangan</h3>
          <button
            type="button"
            onClick={() => {
              stream?.getTracks().forEach((t) => {
                t.stop();
              });
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border-2 border-white/40 rounded-lg pointer-events-none" />
            </div>
            <p className="text-white/60 text-xs text-center mb-4">
              Arahkan kamera ke layar timbangan. Pastikan angka terlihat jelas.
            </p>
            <button
              type="button"
              onClick={capture}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              <Camera className="w-5 h-5" />
              Ambil Foto
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function BankSampahSetorSampah() {
  const [activeTab, setActiveTab] = useState<"setor-saya" | "kelola-warmiendo">(
    "setor-saya",
  );

  // ── Tab 1: Form Setor Saya ──────────────────────────────────────────────────
  const [jenisSampah, setJenisSampah] = useState("Karton");
  const [beratKg, setBeratKg] = useState("");
  const [tanggalSetor, setTanggalSetor] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [catatan, setCatatan] = useState("");

  const [showCamera, setShowCamera] = useState(false);
  const [fotoTimbangan, setFotoTimbangan] = useState<string | null>(null);
  const [isValidatingAI, setIsValidatingAI] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);
  const [beratAiKg, setBeratAiKg] = useState<number | null>(null);
  const [aiError, setAiError] = useState("");
  const [requestManual, setRequestManual] = useState(false);

  const [fotoBuktiList, setFotoBuktiList] = useState<string[]>([]);
  const buktiInputRef = useRef<HTMLInputElement>(null);
  const timbanganInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<SetorSampahItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // ── Tab 2: Kelola Setoran Warmiendo ────────────────────────────────────────
  const [warmiendoSetoran, setWarmiendoSetoran] = useState<
    WarmiendoSetoranItem[]
  >([]);
  const [warmiendoFilterStatus, setWarmiendoFilterStatus] = useState("Semua");
  const [ekspedisiList, setEkspedisiList] = useState<EkspedisiItem[]>([]);
  const [selectedEkspedisi, setSelectedEkspedisi] = useState<
    Record<number, number>
  >({});
  const [isLoadingWarmiendo, setIsLoadingWarmiendo] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ── Shared ──────────────────────────────────────────────────────────────────
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

  const dateParts = tanggalSetor.split("-");
  const tahun = dateParts[0] || "2026";
  const bulan = dateParts[1] || "01";
  const tanggal = dateParts[2] || "01";
  const namaSetorPreview = `[OTOMATIS]/K/NDL/BJM/${tanggal}/${bulan}/${tahun}`;

  const loadData = useCallback(async () => {
    const historyRes = await getMySetoran({ page: 1, limit: 10 });
    setHistory(historyRes.data as SetorSampahItem[]);
  }, []);

  const loadWarmiendoSetoran = useCallback(async () => {
    setIsLoadingWarmiendo(true);
    const res = await getSetoranWarmiendoForBankSampah({
      page: 1,
      limit: 50,
      status: warmiendoFilterStatus !== "Semua" ? warmiendoFilterStatus : "",
    });
    setWarmiendoSetoran(res.data as WarmiendoSetoranItem[]);
    setIsLoadingWarmiendo(false);
  }, [warmiendoFilterStatus]);

  const loadEkspedisi = useCallback(async () => {
    const res = await getAllActiveEkspedisi();
    setEkspedisiList(res as EkspedisiItem[]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "kelola-warmiendo") {
      loadWarmiendoSetoran();
      loadEkspedisi();
    }
  }, [activeTab, loadWarmiendoSetoran, loadEkspedisi]);

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

  const handleCameraCapture = async (rawDataUrl: string) => {
    setShowCamera(false);
    setAiValidated(false);
    setAiError("");
    setBeratAiKg(null);
    setRequestManual(false);

    const withWatermark = await addWatermarkToImage(rawDataUrl, new Date());
    const compressed = await compressImage(withWatermark, 200 * 1024);
    setFotoTimbangan(compressed);
  };

  const handleTimbanganFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiValidated(false);
    setAiError("");
    setBeratAiKg(null);
    setRequestManual(false);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawDataUrl = ev.target?.result as string;
      const withWatermark = await addWatermarkToImage(rawDataUrl, new Date());
      const compressed = await compressImage(withWatermark, 200 * 1024);
      setFotoTimbangan(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleValidasiAI = async () => {
    if (!fotoTimbangan) return;
    const beratNum = Number.parseFloat(beratKg);
    if (Number.isNaN(beratNum) || beratNum <= 0) {
      setAiError("Isi berat (kg) terlebih dahulu sebelum validasi.");
      return;
    }

    setIsValidatingAI(true);
    setAiError("");
    setAiValidated(false);
    setRequestManual(false);

    const result = await validateFotoTimbangan(fotoTimbangan, beratNum);
    setIsValidatingAI(false);

    if (result.success) {
      setAiValidated(true);
      setBeratAiKg(result.berat);
    } else {
      setAiError(result.message);
      setBeratAiKg(null);
    }
  };

  const handleBuktiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fotoBuktiList.length + files.length > 3) {
      showFeedback("error", "Batas Foto", "Maksimal 3 foto bukti tambahan.");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        const compressed = await compressImage(result, 100 * 1024);
        setFotoBuktiList((prev) =>
          prev.length < 3 ? [...prev, compressed] : prev,
        );
      };
      reader.readAsDataURL(file);
    });

    if (buktiInputRef.current) buktiInputRef.current.value = "";
  };

  const removeBukti = (idx: number) => {
    setFotoBuktiList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    if (!fotoTimbangan) {
      setFormErrors({ fotoTimbangan: ["Wajib mengambil foto timbangan."] });
      return;
    }
    if (!aiValidated && !requestManual) {
      setFormErrors({
        fotoTimbangan: ["Foto timbangan harus divalidasi terlebih dahulu."],
      });
      return;
    }
    if (fotoBuktiList.length < 1) {
      setFormErrors({
        fotoBukti: ["Minimal 1 foto bukti tambahan diperlukan."],
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("fotoTimbanganBase64", fotoTimbangan);
    formData.set("metodeSetor", "langsung");
    formData.set("requestManualValidation", requestManual ? "true" : "false");
    if (beratAiKg !== null) formData.set("beratAiKg", String(beratAiKg));
    fotoBuktiList.forEach((b64) => {
      formData.append("fotoBuktiBase64[]", b64);
    });

    startTransition(async () => {
      const result = await createSetorSampah({ success: false }, formData);
      if (result.success) {
        showFeedback(
          "success",
          "Setoran Berhasil!",
          `Setoran sampah ${jenisSampah} (${beratKg} kg) Anda telah berhasil dicatat.`,
        );
        setBeratKg("");
        setCatatan("");
        setFotoTimbangan(null);
        setFotoBuktiList([]);
        setAiValidated(false);
        setRequestManual(false);
        setBeratAiKg(null);
        setTanggalSetor(new Date().toISOString().split("T")[0]);
        loadData();
      } else {
        if (result.errors?._form) {
          showFeedback("error", "Gagal!", result.errors._form[0]);
        } else if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    });
  };

  const handleVerifyWarmiendo = async (id: number) => {
    const ekspedisiId = selectedEkspedisi[id];
    if (!ekspedisiId) {
      showFeedback(
        "error",
        "Pilih Ekspedisi",
        "Pilih vendor ekspedisi penjemput terlebih dahulu.",
      );
      return;
    }
    setProcessingId(id);
    startTransition(async () => {
      const res = await bankSampahVerifySetoran(id, ekspedisiId);
      setProcessingId(null);
      if (res.success) {
        showFeedback("success", "Berhasil!", res.message);
        loadWarmiendoSetoran();
      } else {
        showFeedback("error", "Gagal!", res.message);
      }
    });
  };

  const handleTerimaWarmiendo = async (id: number) => {
    setProcessingId(id);
    startTransition(async () => {
      const res = await bankSampahTerimaSetoran(id);
      setProcessingId(null);
      if (res.success) {
        showFeedback("success", "Berhasil!", res.message);
        loadWarmiendoSetoran();
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

  const activeWarmiendoCount = warmiendoSetoran.filter(
    (s) => s.status === "pending" || s.status === "diserahkan",
  ).length;

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary-100">
            <Recycle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Setor Sampah Bank Sampah
            </h1>
            <p className="text-sm text-neutral-500">
              Kelola setoran sampah Anda dan verifikasi setoran dari mitra
              Warmiendo
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-5 flex-wrap">
          <button
            type="button"
            id="tab-setor-saya"
            onClick={() => setActiveTab("setor-saya")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
              activeTab === "setor-saya"
                ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
            }`}
          >
            <Package className="w-4 h-4" />
            Setor Sampah Saya
          </button>
          <button
            type="button"
            id="tab-kelola-warmiendo"
            onClick={() => setActiveTab("kelola-warmiendo")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
              activeTab === "kelola-warmiendo"
                ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Kelola Setoran Warmiendo
            {activeWarmiendoCount > 0 && activeTab !== "kelola-warmiendo" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-600 text-white">
                {activeWarmiendoCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── TAB 1: Setor Sampah Saya ─────────────────────────────────────────── */}
      {activeTab === "setor-saya" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 bg-primary-50/30">
                <h2 className="font-semibold text-neutral-900">
                  Form Setor Sampah
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label
                    htmlFor="nomorSetor"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    NOMOR SETOR OTOMATIS
                  </label>
                  <input
                    id="nomorSetor"
                    type="text"
                    value={namaSetorPreview}
                    readOnly
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="jenisSampah"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    Jenis Sampah <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="jenisSampah"
                    name="jenisSampah"
                    value={jenisSampah}
                    onChange={(e) => setJenisSampah(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all"
                  >
                    <option value="Karton">Karton</option>
                    <option value="Etiket">Etiket</option>
                    <option value="Paper Cup">Paper Cup</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="beratKg"
                      className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                    >
                      Berat (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="beratKg"
                      type="number"
                      name="beratKg"
                      value={beratKg}
                      onChange={(e) => {
                        setBeratKg(e.target.value);
                        setAiValidated(false);
                        setRequestManual(false);
                      }}
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all"
                    />
                    {formErrors.beratKg && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.beratKg[0]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="tanggalSetor"
                      className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                    >
                      Tanggal Setor <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="tanggalSetor"
                      type="date"
                      name="tanggalSetor"
                      value={tanggalSetor}
                      onChange={(e) => setTanggalSetor(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Foto Bukti Timbangan <span className="text-red-500">*</span>
                  </span>
                  <p className="text-xs text-neutral-500">
                    Wajib diambil menggunakan kamera. Foto akan otomatis
                    mendapat watermark tanggal &amp; jam.
                  </p>

                  {fotoTimbangan ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-video bg-neutral-50">
                        <Image
                          src={fotoTimbangan}
                          alt="Foto timbangan"
                          className="w-full h-full object-contain"
                          fill
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFotoTimbangan(null);
                            setAiValidated(false);
                            setAiError("");
                            setBeratAiKg(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {aiValidated ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 border border-primary-200">
                          <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                          <p className="text-xs text-primary-700 font-medium">
                            Berat tervalidasi AI: {beratAiKg} kg ✓
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {aiError && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-red-600">{aiError}</p>
                            </div>
                          )}

                          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <input
                              type="checkbox"
                              id="requestManual"
                              checked={requestManual}
                              onChange={(e) =>
                                setRequestManual(e.target.checked)
                              }
                              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 cursor-pointer mt-0.5"
                            />
                            <div className="flex flex-col">
                              <label
                                htmlFor="requestManual"
                                className="text-xs text-amber-800 font-semibold cursor-pointer"
                              >
                                Ajukan validasi manual oleh Admin
                              </label>
                              <span className="text-[10px] text-amber-700 mt-1 leading-normal">
                                💡 Info: Validasi AI diproses instan, sedangkan
                                validasi manual oleh admin membutuhkan waktu 1-2
                                hari kerja.
                              </span>
                            </div>
                          </div>

                          {!requestManual && (
                            <>
                              <button
                                type="button"
                                onClick={handleValidasiAI}
                                disabled={isValidatingAI || !beratKg}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                              >
                                {isValidatingAI ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Memvalidasi dengan AI...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Validasi Berat dengan AI
                                  </>
                                )}
                              </button>
                              {!beratKg && (
                                <p className="text-xs text-amber-600 text-center">
                                  ⚠ Isi berat (kg) terlebih dahulu sebelum
                                  validasi
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-50 hover:border-primary-400 text-primary-600 transition-all cursor-pointer"
                        >
                          <Camera className="w-8 h-8" />
                          <span className="font-semibold text-sm">
                            Ambil Foto Timbangan
                          </span>
                          <span className="text-xs text-primary-500">
                            Menggunakan Kamera
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => timbanganInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-400 text-neutral-600 transition-all cursor-pointer"
                        >
                          <Upload className="w-8 h-8" />
                          <span className="font-semibold text-sm">
                            Upload Foto Timbangan
                          </span>
                          <span className="text-xs text-neutral-500">
                            Pilih dari Galeri/File
                          </span>
                        </button>
                      </div>

                      <input
                        ref={timbanganInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleTimbanganFileChange}
                      />

                      {formErrors.fotoTimbangan && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.fotoTimbangan[0]}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Foto Bukti Tambahan{" "}
                      <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-neutral-400">
                      {fotoBuktiList.length}/3
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Minimal 1, maksimal 3 foto. Bisa dari kamera atau galeri.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {fotoBuktiList.map((src, idx) => (
                      <div
                        key={src.substring(100, 200)}
                        className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50"
                      >
                        <Image
                          src={src}
                          alt={`Bukti ${idx + 1}`}
                          className="w-full h-full object-cover"
                          fill
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => removeBukti(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {fotoBuktiList.length < 3 && (
                      <button
                        type="button"
                        onClick={() => buktiInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-400 hover:bg-primary-50/50 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-primary-600 transition-all"
                      >
                        <Plus className="w-6 h-6" />
                        <span className="text-xs font-medium">Tambah</span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={buktiInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleBuktiChange}
                  />

                  {formErrors.fotoBukti && (
                    <p className="text-red-500 text-xs">
                      {formErrors.fotoBukti[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="catatan"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    Catatan Tambahan (opsional)
                  </label>
                  <textarea
                    id="catatan"
                    name="catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={3}
                    placeholder="Catatan kondisi sampah, dll..."
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    isPending ||
                    (!aiValidated && !requestManual) ||
                    fotoBuktiList.length < 1
                  }
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses Setoran...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit Setoran
                    </>
                  )}
                </button>

                {!aiValidated && !requestManual && fotoTimbangan && (
                  <p className="text-xs text-amber-600 text-center">
                    ⚠ Validasi foto timbangan dengan AI atau ajukan validasi
                    manual sebelum submit
                  </p>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden sticky top-6">
              <div className="px-6 py-4 border-b border-neutral-100 bg-primary-50/30">
                <h2 className="font-semibold text-neutral-900">
                  Riwayat Setoran
                </h2>
              </div>

              <div className="divide-y divide-neutral-100 max-h-[calc(100vh-280px)] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="py-12 text-center">
                    <Recycle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-400 text-sm">
                      Belum ada riwayat setoran
                    </p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="px-5 py-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-900 truncate">
                            {item.nomorSetor}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-neutral-500">
                              {item.jenisSampah}
                            </span>
                            <span className="text-neutral-300">·</span>
                            <span className="text-xs font-semibold text-neutral-700">
                              {item.beratKg} kg
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span className="text-xs text-neutral-400">
                              {formatTanggal(item.tanggalSetor)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Kelola Setoran Warmiendo ────────────────────────────────────── */}
      {activeTab === "kelola-warmiendo" && (
        <div className="space-y-5">
          {/* Filter & Header */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-neutral-900">
                  Daftar Setoran Warmiendo
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verifikasi pengajuan, tugaskan kurir ekspedisi, dan konfirmasi
                  penerimaan sampah
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
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
                    onClick={() => setWarmiendoFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      warmiendoFilterStatus === s
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
                  onClick={loadWarmiendoSetoran}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Workflow Info Banner */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-xs text-sky-800 space-y-1">
              <p className="font-bold">Alur Verifikasi Setoran Warmiendo:</p>
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Pending
                </span>
                <span className="text-sky-500">
                  → Pilih ekspedisi &amp; Verifikasi →
                </span>
                <span className="font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                  Diverifikasi
                </span>
                <span className="text-sky-500">→ Warmiendo konfirmasi →</span>
                <span className="font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                  Dikirim
                </span>
                <span className="text-sky-500">→ Terima Sampah →</span>
                <span className="font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Diterima
                </span>
                <span className="text-sky-500">+ insentif dikreditkan</span>
              </div>
            </div>
          </div>

          {/* List Setoran */}
          {isLoadingWarmiendo ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p className="text-sm text-neutral-500">
                Memuat data setoran Warmiendo...
              </p>
            </div>
          ) : warmiendoSetoran.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {warmiendoSetoran.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-neutral-900 truncate">
                          {item.nomorSetor}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {item.user?.name ?? "Warmiendo"} ·{" "}
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

                  {/* Card Body */}
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

                  {/* Card Actions */}
                  {item.status === "pending" && (
                    <div className="px-4 pb-4 space-y-2">
                      <select
                        id={`ekspedisi-${item.id}`}
                        value={selectedEkspedisi[item.id] ?? ""}
                        onChange={(e) =>
                          setSelectedEkspedisi((prev) => ({
                            ...prev,
                            [item.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all"
                      >
                        <option value="">— Pilih Ekspedisi Penjemput —</option>
                        {ekspedisiList.map((eks) => (
                          <option key={eks.id} value={eks.id}>
                            {eks.namaVendor} ({eks.noTelepon})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleVerifyWarmiendo(item.id)}
                        disabled={isPending && processingId === item.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs border-0 cursor-pointer transition-all shadow-sm"
                      >
                        {isPending && processingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        Verifikasi &amp; Tugaskan Kurir
                      </button>
                    </div>
                  )}

                  {item.status === "diverifikasi" && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-700">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>
                          Menunggu konfirmasi penyerahan dari Warmiendo
                        </span>
                      </div>
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
                        onClick={() => handleTerimaWarmiendo(item.id)}
                        disabled={isPending && processingId === item.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs border-0 cursor-pointer transition-all shadow-sm"
                      >
                        {isPending && processingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Terima &amp; Konfirmasi Sampah Diterima
                      </button>
                    </div>
                  )}

                  {item.status === "diterima" && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Sampah diterima &middot; Insentif sudah dikreditkan
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
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

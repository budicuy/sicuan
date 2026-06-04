"use client";

import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Recycle,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FeedbackModal } from "@/app/components/FeedbackModal";
import {
  createSetorSampah,
  getMySetoran,
  validateFotoTimbangan,
} from "./action";

// ── Types ─────────────────────────────────────────────────────────────────

interface SetorSampahItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  totalPoin: number;
  tanggalSetor: string;
  status: string;
  createdAt: Date;
}

// ── Helper: watermark timestamp pada gambar via Canvas ───────────────────

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

      // Gambar foto asli
      ctx.drawImage(img, 0, 0);

      // Format timestamp
      const timeStr = timestamp.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // Style watermark
      const fontSize = Math.max(16, Math.floor(img.width * 0.035));
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const padding = fontSize * 0.6;
      const textWidth = ctx.measureText(timeStr).width;
      const boxW = textWidth + padding * 2;
      const boxH = fontSize + padding * 2;
      const x = img.width - boxW - padding;
      const y = img.height - boxH - padding;

      // Background semi-transparan
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 6);
      ctx.fill();

      // Teks putih
      ctx.fillStyle = "#ffffff";
      ctx.fillText(timeStr, x + padding, y + padding + fontSize * 0.8);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = imageDataUrl;
  });
}

// ── Komponen CameraCapture ───────────────────────────────────────────────

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
              {/* Viewfinder overlay */}
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

// ── Main Page ────────────────────────────────────────────────────────────

export default function SetorSampahPage() {
  // Form state
  const [jenisSampah, setJenisSampah] = useState("Karton");
  const [beratKg, setBeratKg] = useState("");
  const [tanggalSetor, setTanggalSetor] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [catatan, setCatatan] = useState("");

  // Foto timbangan state
  const [showCamera, setShowCamera] = useState(false);
  const [fotoTimbangan, setFotoTimbangan] = useState<string | null>(null); // base64 dengan watermark
  const [isValidatingAI, setIsValidatingAI] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);
  const [beratAiKg, setBeratAiKg] = useState<number | null>(null);
  const [aiError, setAiError] = useState("");

  // Foto bukti tambahan
  const [fotoBuktiList, setFotoBuktiList] = useState<string[]>([]);
  const buktiInputRef = useRef<HTMLInputElement>(null);

  // History state
  const [history, setHistory] = useState<SetorSampahItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Feedback modal
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

  // Nama setor otomatis (ditampilkan ke user)
  const namaSetorPreview = `Setoran – ${new Date(tanggalSetor).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

  // Load history
  const loadHistory = useCallback(async () => {
    const res = await getMySetoran({ page: 1, limit: 10 });
    setHistory(res.data as SetorSampahItem[]);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Handler: foto timbangan dari kamera ──────────────────────────────

  const handleCameraCapture = async (rawDataUrl: string) => {
    setShowCamera(false);
    setAiValidated(false);
    setAiError("");
    setBeratAiKg(null);

    // Tambah watermark timestamp
    const withWatermark = await addWatermarkToImage(rawDataUrl, new Date());
    setFotoTimbangan(withWatermark);
  };

  // ── Handler: validasi AI ──────────────────────────────────────────────

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

    const result = await validateFotoTimbangan(fotoTimbangan, beratNum);
    setIsValidatingAI(false);

    if (result.success) {
      setAiValidated(true);
      setBeratAiKg(result.berat);
    } else {
      setAiError(result.message);
      setFotoTimbangan(null); // paksa foto ulang
      setBeratAiKg(null);
    }
  };

  // ── Handler: foto bukti tambahan ─────────────────────────────────────

  const handleBuktiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fotoBuktiList.length + files.length > 3) {
      showFeedback("error", "Batas Foto", "Maksimal 3 foto bukti tambahan.");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setFotoBuktiList((prev) =>
          prev.length < 3 ? [...prev, result] : prev,
        );
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (buktiInputRef.current) buktiInputRef.current.value = "";
  };

  const removeBukti = (idx: number) => {
    setFotoBuktiList((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Handler: submit form ──────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side guards
    if (!fotoTimbangan) {
      setFormErrors({ fotoTimbangan: ["Wajib mengambil foto timbangan."] });
      return;
    }
    if (!aiValidated) {
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
        // Reset form
        setBeratKg("");
        setCatatan("");
        setFotoTimbangan(null);
        setFotoBuktiList([]);
        setAiValidated(false);
        setBeratAiKg(null);
        setTanggalSetor(new Date().toISOString().split("T")[0]);
        loadHistory();
      } else {
        if (result.errors?._form) {
          showFeedback("error", "Gagal!", result.errors._form[0]);
        } else if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    });
  };

  // ── Format helpers ────────────────────────────────────────────────────

  const formatTanggal = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    if (status === "diterima")
      return "bg-primary-100 text-primary-700 border-primary-200";
    if (status === "pending")
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary-100">
            <Recycle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Setor Sampah
            </h1>
            <p className="text-sm text-neutral-500">
              Input data setoran sampah Anda dan dapatkan poin reward
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── FORM PANEL ─────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 bg-primary-50/30">
              <h2 className="font-semibold text-neutral-900">
                Form Setor Sampah
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nama Setor — readonly */}
              <div>
                <label
                  htmlFor="namaSetor"
                  className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                >
                  Nama Setoran (otomatis)
                </label>
                <input
                  id="namaSetor"
                  type="text"
                  value={namaSetorPreview}
                  readOnly
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                />
              </div>

              {/* Jenis Sampah */}
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

              {/* Berat & Tanggal */}
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
                      setAiValidated(false); // reset validasi jika berat berubah
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

              {/* Foto Timbangan */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Foto Bukti Timbangan <span className="text-red-500">*</span>
                </span>
                <p className="text-xs text-neutral-500">
                  Wajib diambil menggunakan kamera. Foto akan otomatis mendapat
                  watermark tanggal & jam.
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

                    {/* Status validasi AI */}
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
                            ⚠ Isi berat (kg) terlebih dahulu sebelum validasi
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-50 hover:border-primary-400 text-primary-600 transition-all cursor-pointer"
                    >
                      <Camera className="w-8 h-8" />
                      <span className="font-semibold text-sm">
                        Ambil Foto Timbangan
                      </span>
                      <span className="text-xs text-primary-500">
                        Kamera kanan belakang akan digunakan
                      </span>
                    </button>
                    {formErrors.fotoTimbangan && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.fotoTimbangan[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Foto Bukti Tambahan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Foto Bukti Tambahan <span className="text-red-500">*</span>
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

              {/* Catatan */}
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

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || !aiValidated || fotoBuktiList.length < 1}
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

              {!aiValidated && fotoTimbangan && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠ Validasi foto timbangan dengan AI sebelum submit
                </p>
              )}
            </form>
          </div>
        </div>

        {/* ── HISTORY PANEL ──────────────────────────────── */}
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
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}
                        >
                          {item.status}
                        </span>
                        <span className="text-xs font-bold text-primary-600">
                          +{item.totalPoin} poin
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

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Feedback Modal */}
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

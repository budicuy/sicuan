"use client";

import imageCompression from "browser-image-compression";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Recycle,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  createSetorSampah,
  getMySetoran,
  validateFotoTimbangan,
} from "@/app/(bank-sampah)/setor-sampah/bank-sampah-setor-sampah/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import { checkAiDisabled } from "@/app/lib/settings-actions";
import type { SetorSampahItem } from "@/app/types";

function addWatermarkToImage(
  imageDataUrl: string,
  _timestamp: Date,
): Promise<string> {
  return Promise.resolve(imageDataUrl);
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
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors animate-fade-in"
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
  // ── Form Setor Saya ──
  const [jenisSampah, setJenisSampah] = useState("Karton");
  const [beratKg, setBeratKg] = useState("");
  const [tanggalSetor, setTanggalSetor] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [catatan, setCatatan] = useState("");

  const [isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<{
    jenisSampah: string;
    beratKg: string;
    fotoTimbangan: string | null;
    catatan: string;
    history: SetorSampahItem[];
    fotoBuktiList: string[];
    aiValidated: boolean;
    beratAiKg: number | null;
    requestManual: boolean;
    isWeightConfirmed: boolean;
    aiError: string;
  } | null>(null);

  const handleTourStart = () => {
    savedStateRef.current = {
      jenisSampah,
      beratKg,
      fotoTimbangan,
      catatan,
      history,
      fotoBuktiList,
      aiValidated,
      beratAiKg,
      requestManual,
      isWeightConfirmed,
      aiError,
    };
    setIsTourActive(true);
    setJenisSampah("Karton");
    setBeratKg("1.5");
    setFotoTimbangan("/sampel_1.png");
    setFotoBuktiList(["/sampel_1.png"]);
    setCatatan("");
    setAiValidated(true);
    setBeratAiKg(1.5);
    setRequestManual(false);
    setIsWeightConfirmed(true);
    setAiError("");
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    if (savedStateRef.current) {
      setJenisSampah(savedStateRef.current.jenisSampah);
      setBeratKg(savedStateRef.current.beratKg);
      setFotoTimbangan(savedStateRef.current.fotoTimbangan);
      setCatatan(savedStateRef.current.catatan);
      setHistory(savedStateRef.current.history);
      setFotoBuktiList(savedStateRef.current.fotoBuktiList);
      setAiValidated(savedStateRef.current.aiValidated);
      setBeratAiKg(savedStateRef.current.beratAiKg);
      setRequestManual(savedStateRef.current.requestManual);
      setIsWeightConfirmed(savedStateRef.current.isWeightConfirmed);
      setAiError(savedStateRef.current.aiError);
    }
  };

  const setorSteps = [
    {
      element: "#tour-bank-sampah-setor-foto",
      popover: {
        title: "Foto Timbangan & Deteksi AI",
        description:
          "Unggah foto timbangan Anda. AI akan mendeteksi berat dan kategori sampah secara otomatis.",
        side: "right" as const,
      },
    },
    {
      element: "#tour-bank-sampah-setor-submit",
      popover: {
        title: "Simulasi Kirim Setoran",
        description:
          "Klik tombol ini untuk mengirim setoran secara simulasi. Alur akan dialihkan ke mode pengiriman langsung tanpa masuk ke database riil.",
        side: "top" as const,
      },
    },
    {
      element: "#tour-bank-sampah-setor-history",
      popover: {
        title: "Riwayat Setoran Saya",
        description:
          "Setelah Anda menyimulasikan setoran, detail pengajuan baru Anda beserta status verifikasinya akan langsung muncul di panel ini.",
        side: "left" as const,
      },
    },
  ];

  const [showCamera, setShowCamera] = useState(false);
  const [fotoTimbangan, setFotoTimbangan] = useState<string | null>(null);
  const [isValidatingAI, setIsValidatingAI] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);
  const [beratAiKg, setBeratAiKg] = useState<number | null>(null);
  const [requestManual, setRequestManual] = useState(false);
  const [isAiDisabled, setIsAiDisabled] = useState(false);
  const [isWeightConfirmed, setIsWeightConfirmed] = useState(false);
  const [aiError, setAiError] = useState("");

  const [fotoBuktiList, setFotoBuktiList] = useState<string[]>([]);
  const buktiInputRef = useRef<HTMLInputElement>(null);
  const timbanganInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<SetorSampahItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // ── Shared Feedback Modal ──
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

  useEffect(() => {
    loadData();
    checkAiDisabled("bank-sampah").then((disabled) => {
      setIsAiDisabled(disabled);
      if (disabled) {
        setRequestManual(true);
      }
    });
  }, [loadData]);

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

  const runAiDetection = async (foto: string) => {
    setIsValidatingAI(true);
    setAiError("");
    setAiValidated(false);
    setIsWeightConfirmed(false);

    if (isTourActive) {
      setTimeout(() => {
        setIsValidatingAI(false);
        setAiValidated(true);
        setBeratAiKg(1.5);
        setBeratKg("1.5");
        setJenisSampah("Karton");
      }, 1000);
      return;
    }

    try {
      const result = await validateFotoTimbangan(foto);
      setIsValidatingAI(false);

      if (result.success) {
        setAiValidated(true);
        setBeratAiKg(result.berat);
        setBeratKg(String(result.berat));
        if (result.kategori) setJenisSampah(result.kategori);
      } else {
        setBeratAiKg(null);
        setBeratKg("");
        setAiError(result.message);
        showFeedback("error", "Validasi AI Gagal", result.message);
      }
    } catch (_err) {
      setIsValidatingAI(false);
      setBeratAiKg(null);
      setBeratKg("");
      setAiError("Terjadi kesalahan saat memproses gambar.");
      showFeedback("error", "Error", "Gagal memproses validasi AI.");
    }
  };

  const handleCameraCapture = async (rawDataUrl: string) => {
    setShowCamera(false);
    setAiValidated(false);
    setAiError("");
    setBeratAiKg(null);
    setBeratKg("");
    setIsWeightConfirmed(false);
    setRequestManual(isAiDisabled);

    if (isTourActive) {
      setFotoTimbangan("/sampel_1.png");
      runAiDetection("/sampel_1.png");
      return;
    }

    const withWatermark = await addWatermarkToImage(rawDataUrl, new Date());
    const compressed = await compressImage(withWatermark, 100 * 1024);
    setFotoTimbangan(compressed);

    if (isAiDisabled) {
      setRequestManual(true);
      return;
    }
    runAiDetection(compressed);
  };

  const handleTimbanganFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAiValidated(false);
    setAiError("");
    setBeratAiKg(null);
    setBeratKg("");
    setIsWeightConfirmed(false);
    setRequestManual(isAiDisabled);

    if (isTourActive) {
      setFotoTimbangan("/sampel_1.png");
      runAiDetection("/sampel_1.png");
      if (e.target) e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawDataUrl = ev.target?.result as string;
      const withWatermark = await addWatermarkToImage(rawDataUrl, new Date());
      const compressed = await compressImage(withWatermark, 100 * 1024);
      setFotoTimbangan(compressed);

      if (isAiDisabled) {
        setRequestManual(true);
        return;
      }
      runAiDetection(compressed);
    };
    reader.readAsDataURL(file);
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

    if (isTourActive) {
      document.dispatchEvent(new CustomEvent("close-tour-guide"));
      showFeedback(
        "success",
        "Setoran Berhasil! (Simulasi)",
        `Simulasi: Setoran sampah ${jenisSampah} (${beratKg || "1.00"} kg) Anda berhasil dicatat. Data Anda tidak disimpan ke database.`,
      );
      setBeratKg("");
      setCatatan("");
      setFotoTimbangan(null);
      setFotoBuktiList([]);
      setAiValidated(false);
      setRequestManual(isAiDisabled);
      setIsWeightConfirmed(false);
      setBeratAiKg(null);
      setAiError("");
      setHistory((prev) => [
        {
          id: Date.now(),
          nomorSetor: `SIMULASI-B-${Math.floor(1000 + Math.random() * 9000)}`,
          jenisSampah,
          beratKg: Number(beratKg) || 1.0,
          totalPoin: 0,
          tanggalSetor: new Date().toISOString().split("T")[0],
          status: "pending",
          createdAt: new Date(),
          metodeSetor: "langsung",
          catatan,
          totalKredit: (Number(beratKg) || 1.0) * 1000,
          fotoTimbangan: "/sampel_1.png",
        },
        ...prev,
      ]);
      return;
    }

    if (!fotoTimbangan) {
      setFormErrors({ fotoTimbangan: ["Wajib mengambil foto timbangan."] });
      return;
    }
    if (!isWeightConfirmed && !requestManual) {
      setFormErrors({
        fotoTimbangan: [
          "Anda harus mengonfirmasi berat yang dideteksi oleh AI terlebih dahulu.",
        ],
      });
      return;
    }
    if (requestManual && !beratKg) {
      setFormErrors({
        beratKg: ["Berat sampah harus diisi pada form manual."],
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
    formData.set("jenisSampah", jenisSampah);
    formData.set("beratKg", beratKg);
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
        setRequestManual(isAiDisabled);
        setIsWeightConfirmed(false);
        setBeratAiKg(null);
        setAiError("");
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
        steps={setorSteps}
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
              Setor Sampah Bank Sampah
            </h1>
            <p className="text-sm text-neutral-500">
              Kelola setoran sampah pribadi Bank Sampah Anda
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 bg-primary-50/30">
              <h2 className="font-semibold text-neutral-900">
                Form Setor Sampah
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="nomorSetor"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    Nomor Setoran
                  </label>
                  <input
                    type="text"
                    id="nomorSetor"
                    value={namaSetorPreview}
                    disabled
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-500 font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tanggalSetor"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    Tanggal Setor
                  </label>
                  <input
                    type="date"
                    id="tanggalSetor"
                    value={tanggalSetor}
                    disabled
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-400 focus:outline-none transition-all cursor-not-allowed"
                  />
                  <input
                    type="hidden"
                    name="tanggalSetor"
                    value={tanggalSetor}
                  />
                </div>
              </div>

              <input type="hidden" name="jenisSampah" value={jenisSampah} />
              <input type="hidden" name="beratKg" value={beratKg} />

              {/* ── FOTO TIMBANGAN & AI VALIDATION ── */}
              <div id="tour-bank-sampah-setor-foto" className="space-y-3">
                <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Foto Timbangan (Wajib)
                </span>

                {fotoTimbangan ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200 bg-black max-h-48">
                      <Image
                        src={fotoTimbangan}
                        alt="Foto timbangan"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFotoTimbangan(null);
                          setAiValidated(false);
                          setAiError("");
                          setBeratAiKg(null);
                          setBeratKg("");
                          setIsWeightConfirmed(false);
                          setRequestManual(isAiDisabled);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {isAiDisabled ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                        <p className="text-xs font-semibold text-amber-800">
                          Isi data sampah secara manual:
                        </p>
                        <div>
                          <label
                            htmlFor="manualJenisSampah"
                            className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                          >
                            Kategori Sampah{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="manualJenisSampah"
                            value={jenisSampah}
                            onChange={(e) => setJenisSampah(e.target.value)}
                            className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer font-semibold text-neutral-800"
                          >
                            <option value="Karton">Karton (Kardus)</option>
                            <option value="Etiket">Etiket (Plastik)</option>
                            <option value="Paper Cup">
                              Paper Cup (Gelas Pop Mie)
                            </option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="manualBeratKg"
                            className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                          >
                            Berat (kg) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              id="manualBeratKg"
                              type="number"
                              value={beratKg}
                              onChange={(e) => setBeratKg(e.target.value)}
                              step="0.001"
                              min="0.001"
                              placeholder="0.000"
                              className="w-full pl-3 pr-10 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all font-semibold"
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-xs text-neutral-400 font-bold pointer-events-none">
                              kg
                            </span>
                          </div>
                          {formErrors.beratKg && (
                            <p className="text-xs text-red-600 mt-1">
                              {formErrors.beratKg[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {isValidatingAI && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                            <p className="text-xs text-blue-700 font-medium">
                              AI sedang membaca berat dari foto timbangan...
                            </p>
                          </div>
                        )}

                        {aiValidated && (
                          <div className="space-y-2">
                            {!isWeightConfirmed ? (
                              <>
                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-primary-50 border border-primary-200">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                                    <p className="text-xs text-primary-700 font-medium">
                                      Hasil deteksi AI:
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between pl-6">
                                    <span className="text-xs text-primary-600">
                                      Berat
                                    </span>
                                    <span className="text-xs font-bold text-primary-800">
                                      {beratAiKg} kg
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between pl-6">
                                    <span className="text-xs text-primary-600">
                                      Kategori
                                    </span>
                                    <span className="text-xs font-bold text-primary-800">
                                      {jenisSampah}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (fotoTimbangan)
                                        runAiDetection(fotoTimbangan);
                                    }}
                                    disabled={isValidatingAI}
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-600 text-xs font-semibold transition-colors disabled:opacity-50"
                                  >
                                    Deteksi Ulang
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsWeightConfirmed(true);
                                      setBeratKg(String(beratAiKg));
                                    }}
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
                                  >
                                    Konfirmasi Berat
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-1 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <p className="text-xs text-emerald-700 font-medium">
                                      Dikonfirmasi ✓
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setIsWeightConfirmed(false)}
                                    className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                                  >
                                    Ubah
                                  </button>
                                </div>
                                <div className="flex items-center justify-between pl-6">
                                  <span className="text-xs text-emerald-600">
                                    Berat
                                  </span>
                                  <span className="text-xs font-bold text-emerald-800">
                                    {beratKg} kg
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pl-6">
                                  <span className="text-xs text-emerald-600">
                                    Kategori
                                  </span>
                                  <span className="text-xs font-bold text-emerald-800">
                                    {jenisSampah}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {aiError && (
                          <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                  Validasi Gagal
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed">
                                {aiError}
                              </p>
                              <p className="text-xs font-semibold text-red-600">
                                Silakan upload ulang foto timbangan yang lebih
                                jelas dan coba lagi.
                              </p>
                            </div>

                            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
                              <input
                                type="checkbox"
                                id="requestManual"
                                checked={requestManual}
                                onChange={(e) => {
                                  setRequestManual(e.target.checked);
                                  if (!e.target.checked) {
                                    setBeratKg("");
                                  }
                                }}
                                className="w-4 h-4 text-amber-600 border-neutral-300 rounded focus:ring-amber-500 cursor-pointer mt-0.5 shrink-0"
                              />
                              <div className="flex flex-col">
                                <label
                                  htmlFor="requestManual"
                                  className="text-xs text-amber-800 font-semibold cursor-pointer"
                                >
                                  Ajukan Validasi Manual ke Admin
                                </label>
                                <span className="text-[10px] text-amber-700 mt-0.5 leading-normal">
                                  💡 Berat dan kategori sampah akan diverifikasi
                                  oleh admin. Proses 1–2 hari kerja.
                                </span>
                              </div>
                            </div>

                            {requestManual && (
                              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                                <p className="text-xs font-semibold text-amber-800">
                                  Isi data sampah secara manual:
                                </p>
                                <div>
                                  <label
                                    htmlFor="manualJenisSampah"
                                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                                  >
                                    Kategori Sampah{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    id="manualJenisSampah"
                                    value={jenisSampah}
                                    onChange={(e) =>
                                      setJenisSampah(e.target.value)
                                    }
                                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer font-semibold text-neutral-800"
                                  >
                                    <option value="Karton">
                                      Karton (Kardus)
                                    </option>
                                    <option value="Etiket">
                                      Etiket (Plastik)
                                    </option>
                                    <option value="Paper Cup">
                                      Paper Cup (Gelas Pop Mie)
                                    </option>
                                  </select>
                                </div>
                                <div>
                                  <label
                                    htmlFor="manualBeratKg"
                                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                                  >
                                    Berat (kg){" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <input
                                      id="manualBeratKg"
                                      type="number"
                                      value={beratKg}
                                      onChange={(e) =>
                                        setBeratKg(e.target.value)
                                      }
                                      step="0.001"
                                      min="0.001"
                                      placeholder="0.000"
                                      className="w-full pl-3 pr-10 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all font-semibold"
                                    />
                                    <span className="absolute inset-y-0 right-3 flex items-center text-xs text-neutral-400 font-bold pointer-events-none">
                                      kg
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
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

                      <div className="relative flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400 text-neutral-600 transition-all cursor-pointer">
                        <Upload className="w-8 h-8 text-neutral-400" />
                        <span className="font-semibold text-sm">
                          Pilih File Foto
                        </span>
                        <span className="text-xs text-neutral-500">
                          Dari Galeri / File
                        </span>
                        <input
                          ref={timbanganInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleTimbanganFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {formErrors.fotoTimbangan && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.fotoTimbangan[0]}
                  </p>
                )}
              </div>

              {/* ── FOTO BUKTI TAMBAHAN ── */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Foto Bukti Tambahan (Minimal 1, Maksimal 3)
                  </span>
                  <span className="text-xs text-neutral-400">
                    {fotoBuktiList.length}/3 foto
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
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

              <div>
                <label
                  htmlFor="catatan"
                  className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                >
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  id="catatan"
                  name="catatan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-450 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <button
                  id="tour-bank-sampah-setor-submit"
                  type="submit"
                  disabled={
                    isPending ||
                    (!isWeightConfirmed && !requestManual) ||
                    (requestManual && !beratKg) ||
                    !fotoTimbangan ||
                    fotoBuktiList.length < 1
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : requestManual ? (
                    <>
                      <Upload className="w-4 h-4" />
                      Ajukan ke Admin (Manual)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Setoran Sampah
                    </>
                  )}
                </button>
                {!isWeightConfirmed && !requestManual && fotoTimbangan && (
                  <p className="text-xs text-amber-600 text-center">
                    ⚠ Konfirmasi berat hasil deteksi AI terlebih dahulu.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── RIWAYAT SETORAN SAYA ── */}
        <div
          id="tour-bank-sampah-setor-history"
          className="lg:col-span-2 space-y-4"
        >
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <h2 className="font-bold text-neutral-900 mb-1">Riwayat Setoran</h2>
            <p className="text-xs text-neutral-500 mb-4">
              10 setoran terakhir Anda
            </p>

            <div className="space-y-3.5 max-h-145 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 font-medium">
                    Belum ada setoran tercatat
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-neutral-150 bg-white hover:border-primary-200 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-xs text-neutral-900 truncate">
                        {item.nomorSetor}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 ${getStatusBadge(
                          item.status,
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-500 mb-1.5">
                      <div>
                        Jenis:{" "}
                        <span className="font-semibold text-neutral-800">
                          {item.jenisSampah}
                        </span>
                      </div>
                      <div className="text-right">
                        Berat:{" "}
                        <span className="font-semibold text-neutral-800">
                          {item.beratKg} kg
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-neutral-400">
                      Disetor: {formatTanggal(item.tanggalSetor)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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

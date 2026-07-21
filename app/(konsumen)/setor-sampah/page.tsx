"use client";

import imageCompression from "browser-image-compression";
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
import {
  createSetorSampah,
  getMySetoran,
  validateFotoTimbangan,
} from "@/app/(konsumen)/setor-sampah/action";
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

export default function KonsumenSetorSampah() {
  const [isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<{
    jenisSampah: string;
    beratKg: string;
    fotoTimbangan: string | null;
    catatan: string;
    aiValidated: boolean;
    beratAiKg: number | null;
    isWeightConfirmed: boolean;
    requestManual: boolean;
    fotoBuktiList: string[];
    history: SetorSampahItem[];
  } | null>(null);

  const handleTourStart = () => {
    savedStateRef.current = {
      jenisSampah,
      beratKg,
      fotoTimbangan,
      catatan,
      aiValidated,
      beratAiKg,
      isWeightConfirmed,
      requestManual,
      fotoBuktiList,
      history,
    };

    setIsTourActive(true);
    setJenisSampah("Etiket");
    setBeratKg("1.5");
    setFotoTimbangan("/sampel_1.png");
    setCatatan("");
    setAiValidated(true);
    setBeratAiKg(1.5);
    setIsWeightConfirmed(false);
    setFotoBuktiList([]);
    setHistory([
      {
        id: 999,
        nomorSetor: "SIMULASI-AWAL",
        jenisSampah: "Etiket",
        beratKg: 1.5,
        totalPoin: 30,
        tanggalSetor: new Date().toISOString().split("T")[0],
        status: "diterima",
        createdAt: new Date(),
        fotoTimbangan: "/sampel_1.png",
        catatan: "Setoran pertama demo",
        totalKredit: 0,
      },
    ]);
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    if (savedStateRef.current) {
      setJenisSampah(savedStateRef.current.jenisSampah);
      setBeratKg(savedStateRef.current.beratKg);
      setFotoTimbangan(savedStateRef.current.fotoTimbangan);
      setCatatan(savedStateRef.current.catatan);
      setAiValidated(savedStateRef.current.aiValidated);
      setBeratAiKg(savedStateRef.current.beratAiKg);
      setIsWeightConfirmed(savedStateRef.current.isWeightConfirmed);
      setRequestManual(savedStateRef.current.requestManual);
      setFotoBuktiList(savedStateRef.current.fotoBuktiList);
      setHistory(savedStateRef.current.history);
    }
  };

  const [jenisSampah, setJenisSampah] = useState("Etiket");
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
  const [isWeightConfirmed, setIsWeightConfirmed] = useState(false);
  const [requestManual, setRequestManual] = useState(false);
  const [isAiDisabled, setIsAiDisabled] = useState(false);

  const [fotoBuktiList, setFotoBuktiList] = useState<string[]>([]);
  const buktiInputRef = useRef<HTMLInputElement>(null);
  const timbanganInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<SetorSampahItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

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

  const setorSteps = [
    {
      element: "#tour-setor-foto-timbangan",
      popover: {
        title: "Ambil/Upload Foto Timbangan",
        description:
          "Ambil foto timbangan Anda menggunakan kamera atau unggah dari file. AI akan mendeteksi berat secara otomatis.",
        side: "right" as const,
      },
    },
    {
      element: "#tour-setor-konfirmasi-berat",
      popover: {
        title: "Konfirmasi Berat AI",
        description:
          "Periksa berat yang dideteksi oleh AI. Jika sudah benar, klik tombol 'Konfirmasi Berat' untuk melanjutkannya.",
        side: "top" as const,
      },
    },
    {
      element: "#tour-setor-foto-tambahan",
      popover: {
        title: "Tambah Foto Bukti Fisik",
        description:
          "Klik tombol 'Tambah' untuk mengunggah foto bukti kondisi sampah fisik Anda (Etiket).",
        side: "top" as const,
      },
    },
    {
      element: "#tour-setor-catatan",
      popover: {
        title: "Catatan Tambahan (Opsional)",
        description:
          "Tuliskan catatan tambahan mengenai setoran Anda jika ada.",
        side: "top" as const,
      },
    },
    {
      element: "#tour-setor-submit",
      popover: {
        title: "Simulasi Kirim Setoran",
        description:
          "Setelah mengonfirmasi berat AI dan mengunggah foto bukti, klik tombol ini untuk mengirim setoran.",
        side: "top" as const,
      },
    },
    {
      element: "#tour-setor-history",
      popover: {
        title: "Riwayat Setoran",
        description:
          "Setelah menekan kirim, Anda dapat melihat riwayat setoran Anda langsung masuk ke tabel ini secara instan.",
        side: "left" as const,
      },
    },
  ];

  const dateParts = tanggalSetor.split("-");
  const tahun = dateParts[0] || "2026";
  const bulan = dateParts[1] || "01";
  const tanggal = dateParts[2] || "01";
  const namaSetorPreview = `[OTOMATIS]/B/NDL/BJM/${tanggal}/${bulan}/${tahun}`;

  const loadData = useCallback(async () => {
    const historyRes = await getMySetoran({ page: 1, limit: 10 });
    setHistory(historyRes.data as SetorSampahItem[]);
  }, []);

  useEffect(() => {
    loadData();
    checkAiDisabled("konsumen").then((disabled) => {
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

  const runAiDetection = async (imgBase64: string) => {
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
      }, 1000);
      return;
    }

    try {
      const result = await validateFotoTimbangan(imgBase64);
      setIsValidatingAI(false);

      if (result.success) {
        setAiValidated(true);
        setBeratAiKg(result.berat);
        setBeratKg(String(result.berat));
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
    setIsWeightConfirmed(false);
    setRequestManual(false);

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
    setIsWeightConfirmed(false);
    setRequestManual(false);

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
    if (isTourActive) {
      if (fotoBuktiList.length >= 3) {
        showFeedback("error", "Batas Foto", "Maksimal 3 foto bukti tambahan.");
        return;
      }
      setFotoBuktiList((prev) => [...prev, "/sampel_1.png"]);
      if (buktiInputRef.current) buktiInputRef.current.value = "";
      return;
    }

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
    if (!isWeightConfirmed && !requestManual) {
      setFormErrors({
        fotoTimbangan: [
          "Anda harus mengonfirmasi berat AI atau mengajukan validasi manual terlebih dahulu.",
        ],
      });
      return;
    }
    if (requestManual && !beratKg) {
      setFormErrors({
        fotoTimbangan: ["Isi berat sampah secara manual terlebih dahulu."],
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
    formData.set("jenisSampah", jenisSampah);
    formData.set("beratKg", beratKg);
    if (beratAiKg !== null) formData.set("beratAiKg", String(beratAiKg));
    fotoBuktiList.forEach((b64) => {
      formData.append("fotoBuktiBase64[]", b64);
    });

    if (isTourActive) {
      startTransition(async () => {
        document.dispatchEvent(new CustomEvent("close-tour-guide"));
        showFeedback(
          "success",
          "Setoran Berhasil! (Simulasi)",
          `Simulasi: Setoran sampah ${jenisSampah} (${beratKg} kg) Anda telah disimulasikan. Data Anda tidak disimpan ke database.`,
        );
        // Reset form
        setBeratKg("");
        setCatatan("");
        setFotoTimbangan(null);
        setFotoBuktiList([]);
        setAiValidated(false);
        setIsWeightConfirmed(false);
        setBeratAiKg(null);
        setAiError("");
        setTanggalSetor(new Date().toISOString().split("T")[0]);

        // Add to history in memory
        setHistory((prev) => [
          {
            id: Date.now(),
            nomorSetor: `SIMULASI-${Math.floor(1000 + Math.random() * 9000)}`,
            jenisSampah,
            beratKg: Number(beratKg),
            totalPoin: Number(beratKg) * 20,
            tanggalSetor: new Date().toISOString().split("T")[0],
            status: "diterima",
            createdAt: new Date(),
            fotoTimbangan: "/sampel_1.png",
            catatan,
            totalKredit: 0,
          },
          ...prev.filter((item) => item.id !== 999), // Remove initial tour data if any
        ]);
      });
      return;
    }

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

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 lg:p-8">
      <TourGuide
        steps={setorSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary-100">
            <Recycle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Setor Sampah Konsumen
            </h1>
            <p className="text-sm text-neutral-500">
              Cukup ambil foto timbangan untuk otomatis mendeteksi berat sampah
              Etiket Anda dan dapatkan poin
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

              <input type="hidden" name="jenisSampah" value={jenisSampah} />
              <input type="hidden" name="beratKg" value={beratKg} />

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
                  value={tanggalSetor}
                  disabled
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-400 focus:outline-none transition-all cursor-not-allowed"
                />
                <input type="hidden" name="tanggalSetor" value={tanggalSetor} />
              </div>

              <div id="tour-setor-foto-timbangan" className="space-y-3">
                <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Foto Bukti Timbangan <span className="text-red-500">*</span>
                </span>
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
                          setBeratKg("");
                          setIsWeightConfirmed(false);
                          setRequestManual(isAiDisabled);
                          setJenisSampah("Etiket");
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
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Kategori Sampah
                          </span>
                          <span className="text-sm font-semibold text-neutral-800">
                            Etiket
                          </span>
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
                        </div>
                      </div>
                    ) : (
                      <>
                        {isValidatingAI && (
                          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                            <span className="text-xs text-neutral-600 font-medium">
                              Mendeteksi berat dengan AI...
                            </span>
                          </div>
                        )}

                        {aiValidated && (
                          <div className="space-y-3">
                            {!isWeightConfirmed ? (
                              <>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 border border-primary-200">
                                  <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                                  <p className="text-xs text-primary-700 font-medium">
                                    Berat terdeteksi AI:{" "}
                                    <span className="font-bold text-sm text-primary-800">
                                      {beratAiKg} kg
                                    </span>
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    id="tour-setor-konfirmasi-berat"
                                    type="button"
                                    onClick={() => setIsWeightConfirmed(true)}
                                    className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                                  >
                                    Konfirmasi Berat
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (fotoTimbangan)
                                        runAiDetection(fotoTimbangan);
                                    }}
                                    disabled={isValidatingAI}
                                    className="py-2.5 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-colors disabled:opacity-50"
                                  >
                                    Deteksi Ulang
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                                <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  Berat dikonfirmasi ({beratAiKg} kg)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsWeightConfirmed(false)}
                                  className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                                >
                                  Ubah
                                </button>
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
                                    setJenisSampah("Etiket");
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
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                    Kategori Sampah
                                  </span>
                                  <span className="text-sm font-semibold text-neutral-800">
                                    Etiket
                                  </span>
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

              <div id="tour-setor-foto-tambahan" className="space-y-3">
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

              <div id="tour-setor-catatan">
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
                id="tour-setor-submit"
                type="submit"
                disabled={
                  isPending ||
                  (!isWeightConfirmed && !requestManual) ||
                  (requestManual && !beratKg) ||
                  fotoBuktiList.length < 1
                }
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses Setoran...
                  </>
                ) : requestManual ? (
                  <>
                    <Upload className="w-4 h-4" />
                    Ajukan ke Admin (Manual)
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Submit Setoran
                  </>
                )}
              </button>

              {!isWeightConfirmed && !requestManual && fotoTimbangan && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠ Konfirmasi berat hasil deteksi AI atau ajukan validasi
                  manual sebelum submit
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div
            id="tour-setor-history"
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden sticky top-6"
          >
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
                        <span className="text-xs font-bold text-primary-600">
                          {`+${item.totalPoin} poin`}
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

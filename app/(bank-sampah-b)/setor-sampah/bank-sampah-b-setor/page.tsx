"use client";

import imageCompression from "browser-image-compression";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Factory,
  Loader2,
  Plus,
  Sparkles,
  Store,
  Truck,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  getWastePoints,
  submitJemputSampah,
  validateFotoTimbangan,
} from "@/app/(bank-sampah-b)/setor-sampah/bank-sampah-b-setor/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import { checkAiDisabled } from "@/app/lib/settings-actions";
import type { ActionState, JenisSumberSampah } from "@/app/types";

const tourSteps = [
  {
    element: "#tour-bank-b-header",
    popover: {
      title: "Jemput Sampah (Bank Sampah Tipe B)",
      description:
        "Formulir ini digunakan khusus untuk mencatat penjemputan sampah anorganik kemasan Indofood di lapangan dan langsung mendapatkan reward poin.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-sumber",
    popover: {
      title: "Pilih Sumber Sampah",
      description:
        "Tentukan dari mana sampah berasal: Warmindo, Karyawan, Factory Visit, atau Masyarakat.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-jenis",
    popover: {
      title: "Pilih Jenis Sampah",
      description:
        "Pilih kategori sampah yang dijemput: Karton, Etiket Plastik, atau Paper Cup.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-b-berat",
    popover: {
      title: "Timbangan & Deteksi AI",
      description:
        "Unggah foto timbangan Anda. AI akan secara otomatis mendeteksi berat sampah. Jika AI gagal mendeteksi, Anda dapat mengajukan validasi manual ke admin.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-b-bukti-opsional",
    popover: {
      title: "Foto Bukti Tambahan (Opsional)",
      description:
        "Untuk Bank Sampah Tipe B, foto bukti tambahan bersifat fleksibel dan opsional.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-b-submit",
    popover: {
      title: "Simpan Penjemputan",
      description:
        "Klik tombol ini untuk menyimpan setoran penjemputan. Poin reward akan langsung ditambahkan ke akun Anda.",
      side: "top" as const,
    },
  },
];

const SUMBER_OPTIONS: {
  id: JenisSumberSampah;
  label: string;
  desc: string;
  icon: typeof Store;
  color: string;
}[] = [
  {
    id: "Warmindo",
    label: "Warmindo",
    desc: "Warung makan Indomie binaan",
    icon: Store,
    color: "amber",
  },
  {
    id: "Karyawan",
    label: "Karyawan",
    desc: "Internal karyawan PT Indofood",
    icon: UserCheck,
    color: "blue",
  },
  {
    id: "Factory Visit",
    label: "Factory Visit",
    desc: "Kunjungan pabrik & edukasi industri",
    icon: Factory,
    color: "purple",
  },
  {
    id: "Masyarakat",
    label: "Masyarakat",
    desc: "Warga umum / komunitas sekitar",
    icon: Users,
    color: "emerald",
  },
];

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
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        setError(
          "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan di browser Anda.",
        );
      }
    };
    startCamera();

    return () => {
      activeStream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
    stream?.getTracks().forEach((track) => {
      track.stop();
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-700">
        <div className="p-4 flex items-center justify-between border-b border-neutral-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Ambil Foto Timbangan</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stream?.getTracks().forEach((track) => {
                track.stop();
              });
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="p-4 bg-red-950/60 border border-red-800 text-red-300 rounded-2xl text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <div className="p-4 border-t border-neutral-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              stream?.getTracks().forEach((track) => {
                track.stop();
              });
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 rounded-xl"
          >
            Batal
          </button>
          {!error && (
            <button
              type="button"
              onClick={capture}
              className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Ambil Foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BankSampahBSetorPage() {
  const [sumberSampah, setSumberSampah] =
    useState<JenisSumberSampah>("Warmindo");
  const [jenisSampah, setJenisSampah] = useState<
    "Karton" | "Etiket" | "Paper Cup"
  >("Karton");
  const [beratKg, setBeratKg] = useState<string>("");
  const [beratAiKg, setBeratAiKg] = useState<string>("");
  const [tanggalSetor, setTanggalSetor] = useState<string>(
    () => new Date().toISOString().split("T")[0],
  );
  const [catatan, setCatatan] = useState<string>("");
  const [fotoTimbangan, setFotoTimbangan] = useState<string>("");
  const [fotoBuktiTambahan, setFotoBuktiTambahan] = useState<string[]>([]);

  // Rates & Points
  const [wastePoints, setWastePoints] = useState<Record<string, number>>({});
  const [isAiDisabled, setIsAiDisabled] = useState(false);

  // States AI & Validasi Manual
  const [showCamera, setShowCamera] = useState(false);
  const [isValidatingAI, setIsValidatingAI] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);
  const [isWeightConfirmed, setIsWeightConfirmed] = useState(false);
  const [requestManual, setRequestManual] = useState(false);
  const [aiError, setAiError] = useState("");

  const [isSubmitting, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
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

  useEffect(() => {
    getWastePoints().then(setWastePoints);
    checkAiDisabled("bank-sampah-b").then((disabled) => {
      setIsAiDisabled(disabled);
      if (disabled) {
        setRequestManual(true);
      }
    });
  }, []);

  const pointPerKg = wastePoints[jenisSampah] || 0;
  const parsedBerat = Number.parseFloat(beratKg) || 0;
  const estimatedPoin = Math.floor(parsedBerat * pointPerKg);

  const runAiDetection = async (imgBase64: string) => {
    setIsValidatingAI(true);
    setAiError("");
    setAiValidated(false);
    setIsWeightConfirmed(false);

    try {
      const result = await validateFotoTimbangan(imgBase64);
      setIsValidatingAI(false);

      if (result.success && result.berat > 0) {
        setAiValidated(true);
        setBeratAiKg(String(result.berat));
        setBeratKg(String(result.berat));
      } else {
        setBeratAiKg("");
        setBeratKg("");
        setAiError(
          result.message ||
            "AI tidak dapat membaca angka timbangan. Pastikan foto timbangan jelas dan angka terlihat.",
        );
      }
    } catch (_err) {
      setIsValidatingAI(false);
      setBeratAiKg("");
      setBeratKg("");
      setAiError("Terjadi kendala saat membaca foto timbangan dengan AI.");
    }
  };

  const processTimbanganImage = async (dataUrlOrFile: File | string) => {
    try {
      let file: File;
      if (typeof dataUrlOrFile === "string") {
        const res = await fetch(dataUrlOrFile);
        const blob = await res.blob();
        file = new File([blob], "timbangan.jpg", { type: "image/jpeg" });
      } else {
        file = dataUrlOrFile;
      }

      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFotoTimbangan(base64);
        setAiValidated(false);
        setAiError("");
        setBeratAiKg("");
        setIsWeightConfirmed(false);
        setRequestManual(false);

        if (isAiDisabled) {
          setRequestManual(true);
        } else {
          runAiDetection(base64);
        }
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Gagal kompres gambar timbangan:", err);
    }
  };

  const handleFotoTimbanganUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processTimbanganImage(file);
  };

  const handleCameraCapture = (dataUrl: string) => {
    setShowCamera(false);
    processTimbanganImage(dataUrl);
  };

  const resetFotoTimbangan = () => {
    setFotoTimbangan("");
    setBeratAiKg("");
    setBeratKg("");
    setAiValidated(false);
    setIsWeightConfirmed(false);
    setRequestManual(false);
    setAiError("");
  };

  const handleBuktiTambahanUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - fotoBuktiTambahan.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImgs: string[] = [];

    for (const file of filesToProcess) {
      try {
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressed = await imageCompression(file, options);
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressed);
        });
        newImgs.push(base64);
      } catch (err) {
        console.error("Gagal memproses gambar tambahan:", err);
      }
    }

    setFotoBuktiTambahan((prev) => [...prev, ...newImgs]);
  };

  const removeBuktiTambahan = (index: number) => {
    setFotoBuktiTambahan((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!fotoTimbangan) {
      setFormErrors({ fotoTimbangan: ["Foto timbangan wajib diunggah."] });
      return;
    }

    if (!isWeightConfirmed && !requestManual) {
      setFormErrors({
        fotoTimbangan: [
          "Mohon konfirmasi berat hasil AI atau ajukan validasi manual ke admin terlebih dahulu.",
        ],
      });
      return;
    }

    if (requestManual && (!beratKg || Number.parseFloat(beratKg) <= 0)) {
      setFormErrors({
        beratKg: ["Isi berat sampah aktual secara manual terlebih dahulu."],
      });
      return;
    }

    if (!beratKg || Number.parseFloat(beratKg) <= 0) {
      setFormErrors({ beratKg: ["Berat sampah harus lebih besar dari 0 kg."] });
      return;
    }

    const formData = new FormData();
    formData.append("sumberSampah", sumberSampah);
    formData.append("jenisSampah", jenisSampah);
    formData.append("beratKg", beratKg);
    if (beratAiKg) formData.append("beratAiKg", beratAiKg);
    formData.append("tanggalSetor", tanggalSetor);
    formData.append("catatan", catatan);
    formData.append("fotoTimbangan", fotoTimbangan);
    formData.append(
      "requestManualValidation",
      requestManual ? "true" : "false",
    );

    for (const img of fotoBuktiTambahan) {
      formData.append("fotoBuktiTambahan", img);
    }

    startTransition(async () => {
      const res: ActionState = await submitJemputSampah(
        { success: false },
        formData,
      );

      if (res.success) {
        setFeedback({
          isOpen: true,
          type: "success",
          title: requestManual
            ? "Penjemputan Sampah Diajukan!"
            : "Penjemputan Berhasil Disimpan!",
          message:
            res.message ||
            (requestManual
              ? `Sampah ${jenisSampah} seberat ${beratKg} kg dari ${sumberSampah} berhasil diajukan untuk validasi manual Admin.`
              : `Sampah ${jenisSampah} seberat ${beratKg} kg dari ${sumberSampah} berhasil dicatat dan menghasilkan +${estimatedPoin} Poin.`),
        });
        // Reset form
        resetFotoTimbangan();
        setCatatan("");
        setFotoBuktiTambahan([]);
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        }
        setFeedback({
          isOpen: true,
          type: "error",
          title: "Gagal Menyimpan",
          message:
            res.errors?._form?.[0] ||
            "Terjadi kesalahan saat memproses data penjemputan sampah.",
        });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <TourGuide steps={tourSteps} />

      {/* Header Banner */}
      <div
        id="tour-bank-b-header"
        className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Truck className="w-3.5 h-3.5" />
              <span>Operasional Bank Sampah Tipe B</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pencatatan Jemput Sampah
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
              Catat limbah kemasan Indofood yang dijemput langsung dari
              lapangan. Dapatkan reward poin instan per kilogram setoran yang
              diterima.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
              Skema Reward
            </span>
            <div className="text-xl font-black text-white flex items-center justify-center gap-1 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Poin Instan</span>
            </div>
            <span className="text-[10px] text-emerald-200/80 mt-0.5 block">
              Sama seperti Konsumen
            </span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Sumber Sampah */}
        <div
          id="tour-bank-b-sumber"
          className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-black text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Pilih Sumber Sampah <span className="text-red-500">*</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Dari mana sampah kemasan ini dijemput?
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Wajib Dipilih
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUMBER_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = sumberSampah === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSumberSampah(opt.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? "bg-emerald-50/80 border-emerald-500 shadow-sm shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                      : "bg-neutral-50/60 border-neutral-200 hover:bg-neutral-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-neutral-600 border border-neutral-200"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <h4 className="text-xs font-black text-neutral-900">
                    {opt.label}
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
          {formErrors.sumberSampah && (
            <p className="text-xs text-red-600 mt-1">
              {formErrors.sumberSampah[0]}
            </p>
          )}
        </div>

        {/* Step 2: Jenis Sampah */}
        <div
          id="tour-bank-b-jenis"
          className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 font-black text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Jenis Sampah Kemasan <span className="text-red-500">*</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Pilih fraksi sampah Indofood yang disetor
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              {pointPerKg} Poin / kg
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "Karton",
                label: "Karton",
                desc: "Kardus & karton box Indofood",
              },
              {
                id: "Etiket",
                label: "Etiket Plastik",
                desc: "Plastik kemasan Indomie & bumbu",
              },
              {
                id: "Paper Cup",
                label: "Paper Cup",
                desc: "Gelas kertas Pop Mie / minuman",
              },
            ].map((item) => {
              const isSelected = jenisSampah === item.id;
              const rate = wastePoints[item.id] || 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setJenisSampah(item.id as typeof jenisSampah)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-teal-50/80 border-teal-600 shadow-sm ring-2 ring-teal-600/20"
                      : "bg-neutral-50/60 border-neutral-200 hover:bg-neutral-100/60"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-neutral-900">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      +{rate} Poin/kg
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Timbangan & Tanggal Penjemputan */}
        <div
          id="tour-bank-b-berat"
          className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-xs">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Timbangan &amp; Tanggal Penjemputan{" "}
                  <span className="text-red-500">*</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Unggah foto skala timbangan untuk deteksi otomatis berat
                  sampah oleh AI
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="input-tanggal-b"
              className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
            >
              Tanggal Penjemputan <span className="text-red-500">*</span>
            </label>
            <input
              id="input-tanggal-b"
              type="date"
              required
              value={tanggalSetor}
              onChange={(e) => setTanggalSetor(e.target.value)}
              className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Foto Timbangan Upload & Camera */}
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Foto Skala Timbangan <span className="text-red-500">*</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-medium">
                AI akan membaca angka berat secara otomatis
              </span>
            </div>

            {fotoTimbangan ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900 max-w-sm">
                  <Image
                    src={fotoTimbangan}
                    alt="Foto Timbangan"
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={resetFotoTimbangan}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status AI: Loading */}
                {isValidatingAI && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">
                        Mendeteksi berat dengan AI...
                      </p>
                      <p className="text-[11px] text-blue-700/80">
                        Memindai angka dan jarum skala timbangan dari gambar.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status AI: Berhasil */}
                {aiValidated && !requestManual && (
                  <div className="space-y-3">
                    {!isWeightConfirmed ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                            <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-950">
                              Berat Terdeteksi AI:{" "}
                              <span className="text-sm font-black text-emerald-700">
                                {beratAiKg} kg
                              </span>
                            </span>
                            <p className="text-[11px] text-emerald-700">
                              Apakah angka timbangan yang terdeteksi ini sudah
                              sesuai?
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsWeightConfirmed(true)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
                          >
                            Konfirmasi Berat ({beratAiKg} kg)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (fotoTimbangan) runAiDetection(fotoTimbangan);
                            }}
                            disabled={isValidatingAI}
                            className="px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-white text-neutral-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Deteksi Ulang
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200">
                        <span className="text-xs text-emerald-900 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                          Berat Dikonfirmasi: <strong>{beratAiKg} kg</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsWeightConfirmed(false)}
                          className="text-xs text-neutral-500 hover:text-neutral-800 underline font-medium cursor-pointer"
                        >
                          Ubah / Deteksi Ulang
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Status AI: Gagal */}
                {aiError && !aiValidated && !requestManual && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Deteksi AI Gagal
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">{aiError}</p>
                      <p className="text-xs font-semibold text-red-600">
                        Silakan coba deteksi ulang atau ajukan validasi manual
                        di bawah jika jarum/angka sulit terbaca.
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (fotoTimbangan) runAiDetection(fotoTimbangan);
                          }}
                          disabled={isValidatingAI}
                          className="px-3.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Coba Deteksi Ulang
                        </button>
                      </div>
                    </div>

                    {/* Checkbox Ajukan Validasi Manual ke Admin */}
                    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                      <input
                        type="checkbox"
                        id="requestManual"
                        checked={requestManual}
                        onChange={(e) => {
                          setRequestManual(e.target.checked);
                          if (!e.target.checked) setBeratKg("");
                        }}
                        className="w-4 h-4 text-amber-600 border-neutral-300 rounded focus:ring-amber-500 cursor-pointer mt-0.5 shrink-0"
                      />
                      <div className="flex flex-col">
                        <label
                          htmlFor="requestManual"
                          className="text-xs text-amber-900 font-bold cursor-pointer"
                        >
                          Ajukan Validasi Manual ke Admin
                        </label>
                        <span className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                          Jika AI gagal mendeteksi, centang opsi ini untuk
                          menginput berat secara manual. Berat akan divalidasi
                          oleh Admin dan poin dicairkan setelah disetujui.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Berat Manual (Hanya Tampil Jika Validasi Manual Aktif) */}
                {requestManual && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Input Berat Manual (Validasi Admin)
                      </span>
                      {!isAiDisabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestManual(false);
                            if (fotoTimbangan) runAiDetection(fotoTimbangan);
                          }}
                          className="text-[11px] text-amber-700 hover:text-amber-900 underline font-medium cursor-pointer"
                        >
                          Kembali ke Deteksi AI
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="manual-berat-b"
                        className="text-xs font-bold text-neutral-700 block"
                      >
                        Berat Sampah Aktual (kg){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative max-w-xs">
                        <input
                          id="manual-berat-b"
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={beratKg}
                          onChange={(e) => setBeratKg(e.target.value)}
                          placeholder="Contoh: 15.5"
                          className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                          KG
                        </span>
                      </div>
                      {formErrors.beratKg && (
                        <p className="text-xs text-red-600">
                          {formErrors.beratKg[0]}
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      💡 Status penjemputan akan disimpan sebagai{" "}
                      <strong>&apos;Pending&apos;</strong>. Admin akan memeriksa
                      foto timbangan dan mencairkan reward poin setelah
                      disetujui.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-emerald-500 bg-neutral-50/60 hover:bg-emerald-50/30 cursor-pointer transition-colors text-center group">
                  <Upload className="w-6 h-6 text-neutral-400 group-hover:text-emerald-600 mb-2" />
                  <span className="text-xs font-bold text-neutral-800">
                    Upload Foto Timbangan
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    PNG, JPG hingga 10MB (AI mendeteksi otomatis)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoTimbanganUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-emerald-500 bg-neutral-50/60 hover:bg-emerald-50/30 cursor-pointer transition-colors text-center group"
                >
                  <Camera className="w-6 h-6 text-neutral-400 group-hover:text-emerald-600 mb-2" />
                  <span className="text-xs font-bold text-neutral-800">
                    Buka Kamera Langsung
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    Potret layar/skala timbangan
                  </span>
                </button>
              </div>
            )}

            {formErrors.fotoTimbangan && (
              <p className="text-xs text-red-600">
                {formErrors.fotoTimbangan[0]}
              </p>
            )}
          </div>
        </div>

        {/* Step 4: Foto Bukti Tambahan (Opsional) & Catatan */}
        <div
          id="tour-bank-b-bukti-opsional"
          className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-black text-xs">
                4
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Foto Bukti Dokumentasi Lapangan
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    Opsional
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Foto saat penjemputan sampah (maks. 3 foto). Boleh
                  dikosongkan.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {fotoBuktiTambahan.map((img, idx) => (
              <div
                key={img}
                className="relative w-28 h-28 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900 group"
              >
                <Image
                  src={img}
                  alt={`Bukti ${idx + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeBuktiTambahan(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {fotoBuktiTambahan.length < 3 && (
              <label className="w-28 h-28 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-emerald-500 bg-neutral-50/60 hover:bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <Plus className="w-6 h-6 text-neutral-400 group-hover:text-emerald-600 mb-1" />
                <span className="text-[10px] font-bold text-neutral-600">
                  Tambah Foto
                </span>
                <span className="text-[8px] text-neutral-400">
                  ({fotoBuktiTambahan.length}/3)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBuktiTambahanUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-neutral-100">
            <label
              htmlFor="catatan-b"
              className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
            >
              Catatan Lokasi / Penjemputan (Opsional)
            </label>
            <textarea
              id="catatan-b"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Jemput sampah dari Warmindo Berkah, kemasan sudah dipadatkan."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Estimation & Submit Card */}
        <div
          id="tour-bank-b-submit"
          className="bg-neutral-900 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl"
        >
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              {requestManual
                ? "Estimasi Reward (Validasi Manual)"
                : "Estimasi Perolehan Reward"}
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-2">
              <span className="text-3xl font-black text-white">
                +{estimatedPoin}
              </span>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                {requestManual ? "Poin (Pending Admin)" : "Poin Langsung"}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {parsedBerat > 0 ? (
                <>
                  {parsedBerat} kg × {pointPerKg} poin/kg ({jenisSampah} dari{" "}
                  {sumberSampah})
                </>
              ) : (
                "Unggah foto timbangan untuk membaca berat sampah"
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Penjemputan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Penjemputan Sampah</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((f) => ({ ...f, isOpen: false }))}
      />
    </div>
  );
}

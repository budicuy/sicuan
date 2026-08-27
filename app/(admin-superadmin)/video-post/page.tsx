"use client";

import {
  CheckCircle2,
  FileVideo,
  Globe,
  Loader2,
  Power,
  Save,
  Upload,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getVideoPost,
  toggleVideoStatus,
  updateVideoPost,
} from "@/app/(admin-superadmin)/video-post/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { VideoBanner } from "@/app/components/shared/VideoBanner";
import type { VideoPost } from "@/app/types";

export default function VideoPostAdminPage() {
  const [video, setVideo] = useState<VideoPost | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState("");
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
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    setLoading(true);
    getVideoPost().then((res) => {
      if (res) {
        setVideo(res as VideoPost);
        setJudul(res.judul);
        setDeskripsi(res.deskripsi ?? "");
        setVideoUrl(res.videoUrl);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setUploadError("File harus berupa video (MP4, WebM, OGG, dll).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError(
        "Ukuran video terlalu besar (maksimal 20MB). Untuk video berukuran lebih besar, silakan gunakan tautan URL video langsung.",
      );
      return;
    }

    setVideoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setVideoBase64(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError("Gagal membaca file video.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setGlobalError("");

    const formData = new FormData();
    formData.set("judul", judul);
    formData.set("deskripsi", deskripsi);
    formData.set("isActive", video?.isActive ? "true" : "false");

    if (inputMode === "upload" && videoBase64) {
      formData.set("videoBase64", videoBase64);
    } else {
      formData.set("videoUrl", videoUrl);
    }

    startTransition(async () => {
      const result = await updateVideoPost({ success: false }, formData);

      if (result.success) {
        setVideoBase64(null);
        setVideoFileName("");
        showFeedback(
          "success",
          "Berhasil!",
          "Pengaturan video post berhasil diperbarui.",
        );
        refreshData();
      } else {
        if (result.errors?._form) {
          setGlobalError(result.errors._form[0]);
        } else if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    });
  };

  const handleToggleStatus = () => {
    if (!video) return;
    const newStatus = !video.isActive;

    startToggleTransition(async () => {
      const res = await toggleVideoStatus(newStatus);
      if (res.success) {
        setVideo((prev) => (prev ? { ...prev, isActive: newStatus } : null));
        showFeedback(
          "success",
          "Status Penayangan Diperbarui",
          `Penayangan video sekarang ${newStatus ? "Aktif" : "Dinonaktifkan"}.`,
        );
      } else {
        showFeedback("error", "Gagal", "Gagal mengubah status video.");
      }
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-400 text-xs flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        Memuat pengaturan video...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Pengaturan Video Post &amp; Edukasi
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola 1 video utama yang otomatis ditayangkan di halaman Login
              dan diputar di Dashboard Konsumen, Warmindo, &amp; Bank Sampah
            </p>
          </div>
        </div>

        {/* Toggle Status Penayangan */}
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isToggling}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
            video?.isActive
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-neutral-200 hover:bg-neutral-300 text-neutral-800"
          }`}
        >
          <Power className="w-4 h-4" />
          {video?.isActive ? "Status: Aktif Tayang" : "Status: Nonaktif"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Video Preview */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    video?.isActive
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-neutral-400"
                  }`}
                />
                <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                  Live Preview Video
                </h2>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  video?.isActive
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                    : "text-neutral-600 bg-neutral-100"
                }`}
              >
                {video?.isActive ? "Sedang Tayang" : "Tidak Tayang"}
              </span>
            </div>

            <p className="text-xs text-neutral-500">
              Pratinjau tampilan video yang dilihat oleh pengguna di halaman
              Login dan Dashboard.
            </p>
          </div>

          <div className="my-auto">
            {video?.videoUrl ? (
              <VideoBanner
                videoUrl={video.videoUrl}
                judul={video.judul}
                deskripsi={video.deskripsi}
                autoPlay
              />
            ) : (
              <div className="aspect-video rounded-2xl bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
                <FileVideo className="w-12 h-12 mb-2" />
                <p className="text-xs font-semibold">
                  Belum ada video yang dikonfigurasi
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Terakhir diperbarui:</span>
            <span className="font-semibold text-neutral-800">
              {video?.updatedAt
                ? new Date(video.updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </span>
          </div>
        </div>

        {/* Right Column: Edit / Replace Video Form */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              Perbarui Informasi &amp; Sumber Video
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ubah judul, deskripsi, atau ganti file video
            </p>
          </div>

          {globalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Judul Field */}
            <div>
              <label
                htmlFor="judulVideoInput"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Judul Video <span className="text-red-500">*</span>
              </label>
              <input
                id="judulVideoInput"
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                required
                placeholder="Contoh: Program Daur Ulang Kemasan Indofood SICUAN"
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
              />
              {formErrors.judul && (
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.judul[0]}
                </p>
              )}
            </div>

            {/* Deskripsi Field */}
            <div>
              <label
                htmlFor="deskripsiVideoInput"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Deskripsi Video (Opsional)
              </label>
              <textarea
                id="deskripsiVideoInput"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={3}
                placeholder="Keterangan singkat mengenai pesan atau informasi dalam video..."
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
              />
            </div>

            {/* Sumber Video Selector */}
            <div>
              <span className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Metode Penggantian Video <span className="text-red-500">*</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === "upload"
                      ? "bg-primary-50 border-primary-500 text-primary-700 shadow-xs"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File Video (MP4)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("url")}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === "url"
                      ? "bg-primary-50 border-primary-500 text-primary-700 shadow-xs"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Masukkan URL Video
                </button>
              </div>
            </div>

            {inputMode === "upload" ? (
              <div>
                <label
                  htmlFor="videoFileInput"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Pilih File Video Baru (MP4 / WebM)
                </label>
                <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-5 text-center bg-neutral-50 hover:bg-neutral-100/70 transition-colors">
                  <input
                    id="videoFileInput"
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="videoFileInput"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileVideo className="w-8 h-8 text-neutral-400" />
                    <span className="text-xs font-bold text-primary-600">
                      {videoFileName
                        ? videoFileName
                        : "Klik untuk Pilih File Video Baru"}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Maksimum ukuran file: 20MB (Format: MP4 / WebM)
                    </span>
                  </label>
                </div>
                {uploadError && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">
                    {uploadError}
                  </p>
                )}
                {videoBase64 && (
                  <p className="text-xs text-emerald-600 mt-1.5 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> File video siap
                    diunggah saat disimpan.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label
                  htmlFor="videoUrlInput"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Direct Video URL (.mp4 / video link)
                </label>
                <input
                  id="videoUrlInput"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan &amp; Mengunggah Video...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Video</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

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

"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileVideo,
  Globe,
  ImageIcon,
  Loader2,
  Plus,
  Power,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  addMediaSlide,
  checkIsSuperadmin,
  deleteMediaSlide,
  getAllMediaSlider,
  moveMediaSlideOrder,
  toggleMediaSlideStatus,
} from "@/app/(admin-superadmin)/video-post/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { MediaSlider } from "@/app/components/shared/MediaSlider";
import type { VideoPost } from "@/app/types";

export default function MediaSliderAdminPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [mediaType, setMediaType] = useState<"video" | "gambar">("video");
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");

  const [isAdding, startAddTransition] = useTransition();
  const [actionPendingId, setActionPendingId] = useState<number | null>(null);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

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
    getAllMediaSlider().then((res) => {
      setSlides(res as VideoPost[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    checkIsSuperadmin().then((isSuper) => {
      if (!isSuper) {
        router.replace("/dashboard/admin-dashboard");
      } else {
        refreshData();
      }
    });
  }, [refreshData, router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");
    if (!file) return;

    if (mediaType === "video") {
      if (!file.type.startsWith("video/")) {
        setFileError("File harus berupa video (MP4, WebM, OGG, dll).");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setFileError(
          "Ukuran video terlalu besar (maksimal 20MB). Silakan gunakan video yang lebih kecil atau link URL.",
        );
        return;
      }
    } else {
      if (!file.type.startsWith("image/")) {
        setFileError("File harus berupa gambar (JPG, PNG, WebP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError("Ukuran foto terlalu besar (maksimal 5MB).");
        return;
      }
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setFileError("Gagal membaca file.");
    };
    reader.readAsDataURL(file);
  };

  const handleAddSlide = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFileError("");

    const formData = new FormData();
    formData.set("tipe", mediaType);

    if (inputMode === "upload") {
      if (!fileBase64) {
        setFileError("Silakan pilih file terlebih dahulu.");
        return;
      }
      formData.set("fileBase64", fileBase64);
    } else {
      if (!urlInput.trim()) {
        setFileError("Silakan masukkan URL media.");
        return;
      }
      formData.set("urlInput", urlInput.trim());
    }

    startAddTransition(async () => {
      const result = await addMediaSlide({ success: false }, formData);

      if (result.success) {
        setFileBase64(null);
        setFileName("");
        setUrlInput("");
        showFeedback(
          "success",
          "Berhasil!",
          `Slide ${mediaType === "video" ? "Video" : "Foto"} berhasil ditambahkan ke slider.`,
        );
        refreshData();
      } else {
        const errMsg =
          result.errors?.mediaUrl?.[0] ||
          result.errors?._form?.[0] ||
          "Gagal menambahkan media.";
        showFeedback("error", "Gagal", errMsg);
      }
    });
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    setActionPendingId(id);
    toggleMediaSlideStatus(id, !currentStatus).then((res) => {
      setActionPendingId(null);
      if (res.success) {
        setSlides((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, isActive: !currentStatus } : s,
          ),
        );
      } else {
        showFeedback("error", "Gagal", "Gagal mengubah status slide.");
      }
    });
  };

  const handleMoveOrder = (id: number, direction: "up" | "down") => {
    setActionPendingId(id);
    moveMediaSlideOrder(id, direction).then((res) => {
      setActionPendingId(null);
      if (res.success) {
        refreshData();
      } else {
        showFeedback("error", "Gagal", "Gagal mengubah urutan slide.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    startDeleteTransition(async () => {
      const res = await deleteMediaSlide(deleteTargetId);
      setDeleteTargetId(null);
      if (res.success) {
        showFeedback(
          "success",
          "Dihapus",
          "Slide berhasil dihapus dari slider.",
        );
        refreshData();
      } else {
        showFeedback("error", "Gagal", "Gagal menghapus slide media.");
      }
    });
  };

  const activeSlides = slides.filter((s) => s.isActive);

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-400 text-xs flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        Memuat pengaturan media slider...
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
              Pengaturan Media Slider (Foto &amp; Video)
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola slide foto dan video Media Slider yang dapat digeser di
              halaman Login dan Dashboard
            </p>
          </div>
        </div>

        <div className="px-4 py-2 bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{activeSlides.length} Slide Aktif Tayang</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Media Slider Preview */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                  Live Preview Media Slider
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase text-emerald-700 bg-emerald-50 border border-emerald-200">
                Responsive Auto Height
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Pratinjau tampilan slider seperti yang dilihat pengguna. Coba
              geser slide menggunakan tombol panah atau geser dengan mouse /
              layar sentuh.
            </p>
          </div>

          <div className="my-auto py-2">
            {activeSlides.length > 0 ? (
              <MediaSlider items={activeSlides} autoPlay />
            ) : (
              <div className="aspect-video rounded-2xl bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
                <FileVideo className="w-12 h-12 mb-2" />
                <p className="text-xs font-semibold">
                  Belum ada slide media yang aktif
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Total Media Tersimpan:</span>
            <span className="font-semibold text-neutral-800">
              {slides.length} Slide (
              {slides.filter((s) => s.tipe === "video").length} Video,{" "}
              {slides.filter((s) => s.tipe === "gambar").length} Foto)
            </span>
          </div>
        </div>

        {/* Right Column: Form Tambah Media Baru */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              Tambah Media ke Slider
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Upload video edukasi atau foto banner tanpa teks judul &amp;
              deskripsi
            </p>
          </div>

          <form onSubmit={handleAddSlide} className="space-y-4">
            {/* Tipe Media: Video vs Foto */}
            <div>
              <span className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Jenis Media <span className="text-red-500">*</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaType("video");
                    setFileBase64(null);
                    setFileName("");
                    setFileError("");
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mediaType === "video"
                      ? "bg-primary-50 border-primary-500 text-primary-700 shadow-xs"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Video className="w-4 h-4" /> Video (MP4 / WebM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaType("gambar");
                    setFileBase64(null);
                    setFileName("");
                    setFileError("");
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mediaType === "gambar"
                      ? "bg-primary-50 border-primary-500 text-primary-700 shadow-xs"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" /> Foto (JPG / PNG / WebP)
                </button>
              </div>
            </div>

            {/* Metode Sumber: Upload File vs Direct URL */}
            <div>
              <span className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Metode Input <span className="text-red-500">*</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === "upload"
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("url")}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === "url"
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Direct URL
                </button>
              </div>
            </div>

            {/* Input Content based on mode */}
            {inputMode === "upload" ? (
              <div>
                <label
                  htmlFor="mediaFileInput"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Pilih File {mediaType === "video" ? "Video" : "Foto"}
                </label>
                <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-5 text-center bg-neutral-50 hover:bg-neutral-100/70 transition-colors">
                  <input
                    id="mediaFileInput"
                    type="file"
                    accept={
                      mediaType === "video"
                        ? "video/mp4,video/webm,video/ogg"
                        : "image/jpeg,image/png,image/webp"
                    }
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="mediaFileInput"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {mediaType === "video" ? (
                      <FileVideo className="w-8 h-8 text-neutral-400" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-400" />
                    )}
                    <span className="text-xs font-bold text-primary-600">
                      {fileName
                        ? fileName
                        : `Pilih File ${mediaType === "video" ? "Video" : "Foto"} Baru`}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {mediaType === "video"
                        ? "Maksimal 20MB (MP4, WebM)"
                        : "Maksimal 5MB (JPG, PNG, WebP)"}
                    </span>
                  </label>
                </div>
                {fileError && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">
                    {fileError}
                  </p>
                )}
                {fileBase64 && (
                  <p className="text-xs text-emerald-600 mt-1.5 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> File siap
                    ditambahkan ke slider.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label
                  htmlFor="mediaUrlInput"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Direct URL{" "}
                  {mediaType === "video" ? "Video (.mp4)" : "Foto (.jpg/.png)"}
                </label>
                <input
                  id="mediaUrlInput"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={
                    mediaType === "video"
                      ? "https://example.com/video.mp4"
                      : "https://example.com/photo.jpg"
                  }
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menambahkan ke Slider...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tambah ke Slider</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Slide Items List Table */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              Daftar Urutan Slide Media
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Atur urutan tampilan, aktifkan/nonaktifkan slide, atau hapus media
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-600">
            {slides.length} Slide Total
          </span>
        </div>

        <div className="space-y-3">
          {slides.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs">
              Belum ada slide media yang ditambahkan.
            </div>
          ) : (
            slides.map((slide, index) => {
              const url = slide.mediaUrl || slide.videoUrl || "";
              const isVideo = slide.tipe === "video";

              return (
                <div
                  key={slide.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    slide.isActive
                      ? "bg-neutral-50/70 border-neutral-200"
                      : "bg-neutral-100/60 border-dashed border-neutral-300 opacity-60"
                  }`}
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-neutral-200 text-neutral-700 font-black text-xs flex items-center justify-center shrink-0">
                      #{index + 1}
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="w-16 h-10 rounded-xl overflow-hidden bg-neutral-900 shrink-0 relative flex items-center justify-center">
                      {isVideo ? (
                        <FileVideo className="w-5 h-5 text-white/80" />
                      ) : (
                        <Image
                          src={url}
                          alt="Thumbnail Slide"
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            isVideo
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isVideo ? "Video" : "Foto"}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            slide.isActive
                              ? "text-emerald-600"
                              : "text-neutral-500"
                          }`}
                        >
                          {slide.isActive ? "Aktif Tayang" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-mono truncate max-w-xs sm:max-w-md mt-1">
                        {url}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions (Move, Toggle, Delete) */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0 || actionPendingId === slide.id}
                      onClick={() => handleMoveOrder(slide.id, "up")}
                      className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 disabled:opacity-30 cursor-pointer shadow-xs transition-colors"
                      title="Geser ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={
                        index === slides.length - 1 ||
                        actionPendingId === slide.id
                      }
                      onClick={() => handleMoveOrder(slide.id, "down")}
                      className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 disabled:opacity-30 cursor-pointer shadow-xs transition-colors"
                      title="Geser ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Active */}
                    <button
                      type="button"
                      disabled={actionPendingId === slide.id}
                      onClick={() =>
                        handleToggleStatus(slide.id, slide.isActive)
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                        slide.isActive
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{slide.isActive ? "Aktif" : "Nonaktif"}</span>
                    </button>

                    {/* Delete Slide */}
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(slide.id)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer transition-colors"
                      title="Hapus Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-neutral-200 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Hapus Slide Media?
              </h3>
              <p className="text-xs text-neutral-500">
                Slide ini akan dihapus permanen dari slider carousel.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
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

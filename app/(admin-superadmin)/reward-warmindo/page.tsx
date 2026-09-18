"use client";

import imageCompression from "browser-image-compression";
import {
  Coins,
  Gift,
  ImageIcon,
  Package,
  Ticket,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createRewardWarmindo,
  deleteRewardWarmindo,
  getRewardWarmindo,
  updateRewardWarmindo,
} from "@/app/(admin-superadmin)/reward-warmindo/action";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { getCurrentUser } from "@/app/lib/auth-actions";
import type { ActionState, RewardWarmindo } from "@/app/types";

export default function RewardWarmindoPage() {
  const [userRole, setUserRole] = useState<string | null>(null);

  // Reward states
  const [rewardData, setRewardData] = useState<RewardWarmindo[]>([]);
  const [rewardTotal, setRewardTotal] = useState(0);
  const [rewardPage, setRewardPage] = useState(1);
  const [rewardLimit, setRewardLimit] = useState(50);
  const [rewardSearch, setRewardSearch] = useState("");
  const [rewardFilters, setRewardFilters] = useState<Record<string, string>>({
    kategori: "",
    status: "",
  });
  const [editingReward, setEditingReward] = useState<RewardWarmindo | null>(
    null,
  );
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [selectedKategoriForm, setSelectedKategoriForm] = useState<
    "barang" | "uang" | "voucher"
  >("barang");
  const [confirmDeleteReward, setConfirmDeleteReward] =
    useState<RewardWarmindo | null>(null);
  const [isDeletingReward, setIsDeletingReward] = useState(false);

  // Image states
  const [rewardImageBase64, setRewardImageBase64] = useState<string | null>(
    null,
  );
  const [existingRewardImage, setExistingRewardImage] = useState<string | null>(
    null,
  );
  const [imageUploadError, setImageUploadError] = useState("");
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  // Common transition & feedback
  const [isPending, startTransition] = useTransition();
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

  const refreshReward = useCallback(() => {
    getRewardWarmindo({
      page: rewardPage,
      limit: rewardLimit,
      search: rewardSearch,
      kategori: rewardFilters.kategori,
      status: rewardFilters.status,
    }).then((res) => {
      setRewardData(res.data);
      setRewardTotal(res.total);
    });
  }, [rewardPage, rewardLimit, rewardSearch, rewardFilters]);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setUserRole(u.role);
    });
  }, []);

  useEffect(() => {
    refreshReward();
  }, [refreshReward]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageUploadError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageUploadError("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    setIsCompressingImage(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        setRewardImageBase64(reader.result as string);
        setIsCompressingImage(false);
      };
      reader.readAsDataURL(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setRewardImageBase64(reader.result as string);
        setIsCompressingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setRewardImageBase64(null);
    setExistingRewardImage(null);
    setImageUploadError("");
  };

  const handleOpenAddReward = () => {
    setEditingReward(null);
    setSelectedKategoriForm("barang");
    setRewardImageBase64(null);
    setExistingRewardImage(null);
    setImageUploadError("");
    setFormErrors({});
    setGlobalError("");
    setRewardModalOpen(true);
  };

  const handleOpenEditReward = (item: RewardWarmindo) => {
    setEditingReward(item);
    setSelectedKategoriForm(item.kategori as "barang" | "uang" | "voucher");
    setRewardImageBase64(null);
    setExistingRewardImage(item.gambar || null);
    setImageUploadError("");
    setFormErrors({});
    setGlobalError("");
    setRewardModalOpen(true);
  };

  const handleRewardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setGlobalError("");
    const formData = new FormData(e.currentTarget);
    const finalImageValue = rewardImageBase64 || existingRewardImage || "";
    formData.set("gambar", finalImageValue);

    startTransition(async () => {
      let result: ActionState;
      if (editingReward) {
        result = await updateRewardWarmindo(
          editingReward.id,
          { success: false },
          formData,
        );
      } else {
        result = await createRewardWarmindo({ success: false }, formData);
      }

      if (result.success) {
        setRewardModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          editingReward
            ? `Reward "${editingReward.nama}" berhasil diperbarui.`
            : "Reward baru untuk Warmindo berhasil ditambahkan.",
        );
        refreshReward();
      } else {
        if (result.errors?._form) {
          setGlobalError(result.errors._form[0]);
        } else if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    });
  };

  const handleConfirmDeleteReward = async () => {
    if (!confirmDeleteReward) return;
    setIsDeletingReward(true);
    const res = await deleteRewardWarmindo(confirmDeleteReward.id);
    setIsDeletingReward(false);
    setConfirmDeleteReward(null);
    if (res.success) {
      showFeedback(
        "success",
        "Berhasil!",
        `Reward "${confirmDeleteReward.nama}" berhasil dihapus.`,
      );
      refreshReward();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus reward.",
      );
    }
  };

  const rewardColumns: Column<RewardWarmindo>[] = [
    {
      header: "Nama Reward",
      sortKey: "nama",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-14 h-10 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
            {item.gambar ? (
              /* biome-ignore lint/performance/noImgElement: dynamic user-uploaded image */
              <img
                src={item.gambar}
                alt={item.nama}
                className="w-full h-full object-cover"
              />
            ) : item.kategori === "uang" ? (
              <Coins className="w-5 h-5 text-emerald-600" />
            ) : item.kategori === "voucher" ? (
              <Ticket className="w-5 h-5 text-amber-600" />
            ) : (
              <Package className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <div>
            <span className="font-bold text-neutral-900 text-sm block">
              {item.nama}
            </span>
            {item.deskripsi && (
              <span className="text-xs text-neutral-500 line-clamp-1">
                {item.deskripsi}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Kategori",
      sortKey: "kategori",
      render: (item) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            item.kategori === "uang"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : item.kategori === "voucher"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          {item.kategori === "uang"
            ? "Uang Tunai"
            : item.kategori === "voucher"
              ? "Voucher"
              : "Barang Fisik"}
        </span>
      ),
    },
    {
      header: "Poin Dibutuhkan",
      sortKey: "poin",
      render: (item) => (
        <span className="font-mono text-xs text-neutral-900 font-black bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
          {item.poin.toLocaleString("id-ID")} Poin
        </span>
      ),
    },
    {
      header: "Nilai / Stok",
      render: (item) => (
        <div className="text-xs">
          {item.kategori === "uang" && item.nominalUang ? (
            <span className="font-bold text-emerald-600 block">
              Rp {item.nominalUang.toLocaleString("id-ID")}
            </span>
          ) : (
            <span className="text-neutral-600">Stok: {item.stok} unit</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            item.status === "aktif"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  const rewardTableFilters: TableFilter<RewardWarmindo>[] = [
    {
      id: "kategori",
      label: "Kategori",
      options: [
        { label: "Semua Kategori", value: "" },
        { label: "Barang", value: "barang" },
        { label: "Voucher", value: "voucher" },
        { label: "Uang Tunai", value: "uang" },
      ],
    },
    {
      id: "status",
      label: "Status",
      options: [
        { label: "Semua Status", value: "" },
        { label: "Aktif", value: "aktif" },
        { label: "Nonaktif", value: "nonaktif" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Master Data Reward Warmindo
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Atur katalog reward barang fisik dan uang tunai khusus penukaran
              poin mitra Warmindo
            </p>
          </div>
        </div>
      </div>

      {/* Content: DataTable */}
      <div className="space-y-4">
        <DataTable
          data={rewardData}
          columns={rewardColumns}
          totalItems={rewardTotal}
          currentPage={rewardPage}
          pageSize={rewardLimit}
          onPageChange={setRewardPage}
          onPageSizeChange={(e) => {
            setRewardLimit(Number(e.target.value));
            setRewardPage(1);
          }}
          search={rewardSearch}
          onSearchChange={(val) => {
            setRewardSearch(val);
            setRewardPage(1);
          }}
          filters={rewardTableFilters}
          filterValues={rewardFilters}
          onFilterChange={(id, val) => {
            setRewardFilters((prev) => ({ ...prev, [id]: val }));
            setRewardPage(1);
          }}
          searchPlaceholder="Cari nama atau deskripsi reward..."
          onAdd={handleOpenAddReward}
          addLabel="Tambah Reward Baru"
          onEdit={handleOpenEditReward}
          onDelete={
            userRole === "superadmin"
              ? (item) => setConfirmDeleteReward(item)
              : undefined
          }
        />
      </div>

      {/* Form Modal: Add/Edit Reward */}
      <FormModal
        isOpen={rewardModalOpen}
        onClose={() => setRewardModalOpen(false)}
        title={
          editingReward
            ? `Edit Reward: ${editingReward.nama}`
            : "Tambah Reward Warmindo Baru"
        }
        onSubmit={handleRewardSubmit}
        isPending={isPending}
        globalError={globalError}
      >
        <div>
          <label
            htmlFor="namaReward"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Nama Reward
          </label>
          <input
            id="namaReward"
            type="text"
            name="nama"
            required
            defaultValue={editingReward?.nama ?? ""}
            placeholder="Contoh: CHOPSTICKS atau WAIST BAG"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
          />
          {formErrors.nama && (
            <p className="text-red-600 text-xs mt-1">{formErrors.nama[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="kategoriReward"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Kategori Reward
          </label>
          <select
            id="kategoriReward"
            name="kategori"
            value={selectedKategoriForm}
            onChange={(e) =>
              setSelectedKategoriForm(
                e.target.value as "barang" | "uang" | "voucher",
              )
            }
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
          >
            <option value="barang">
              Barang Fisik (Merchandise, Alat, dll)
            </option>
            <option value="voucher">
              Voucher (Voucher Belanja, Diskon, Pulsa/Token, dll)
            </option>
            <option value="uang">Uang Tunai (Transfer / Pencairan)</option>
          </select>
          {formErrors.kategori && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.kategori[0]}
            </p>
          )}
        </div>

        <div>
          <span className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
            Foto / Gambar Barang Reward
          </span>
          {rewardImageBase64 || existingRewardImage ? (
            <div className="relative w-full aspect-video rounded-xl border border-neutral-200 overflow-hidden bg-neutral-100 group">
              {/* biome-ignore lint/performance/noImgElement: dynamic user-uploaded image */}
              <img
                src={rewardImageBase64 || existingRewardImage || ""}
                alt="Preview Reward"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="cursor-pointer bg-white/90 hover:bg-white text-neutral-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  Ganti Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isCompressingImage || isPending}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isCompressingImage || isPending}
                  className="cursor-pointer bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-neutral-300 hover:border-primary-500 rounded-xl cursor-pointer bg-neutral-50 hover:bg-primary-50/20 transition-all p-4 text-center group">
              {isCompressingImage ? (
                <div className="flex flex-col items-center gap-2 text-primary-600">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">
                    Memproses gambar...
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 group-hover:bg-primary-100 text-neutral-500 group-hover:text-primary-600 flex items-center justify-center transition-colors mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-neutral-700 group-hover:text-primary-700">
                    Klik untuk unggah gambar barang
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">
                    Format JPG, PNG, atau WEBP (Rasio 16:9, otomatis dikompresi)
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isCompressingImage || isPending}
              />
            </label>
          )}
          {imageUploadError && (
            <p className="text-red-600 text-xs mt-1">{imageUploadError}</p>
          )}
          <p className="text-[11px] text-neutral-500 mt-1">
            * Gambar ini akan ditampilkan pada katalog penukaran reward mitra
            Warmindo.
          </p>
        </div>

        <div>
          <label
            htmlFor="poinReward"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Poin yang Dibutuhkan untuk Menukar
          </label>
          <input
            id="poinReward"
            type="number"
            name="poin"
            required
            defaultValue={editingReward?.poin ?? 100}
            placeholder="Contoh: 100"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
          />
          {formErrors.poin && (
            <p className="text-red-600 text-xs mt-1">{formErrors.poin[0]}</p>
          )}
        </div>

        {selectedKategoriForm === "uang" && (
          <div>
            <label
              htmlFor="nominalUang"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Nominal Uang Tunai (Rp)
            </label>
            <input
              id="nominalUang"
              type="number"
              name="nominalUang"
              required
              defaultValue={editingReward?.nominalUang ?? ""}
              placeholder="Contoh: 50000"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
            />
            {formErrors.nominalUang && (
              <p className="text-red-600 text-xs mt-1">
                {formErrors.nominalUang[0]}
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="stokReward"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Stok Tersedia
          </label>
          <input
            id="stokReward"
            type="number"
            name="stok"
            required
            defaultValue={editingReward?.stok ?? 1}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
          />
          {formErrors.stok && (
            <p className="text-red-600 text-xs mt-1">{formErrors.stok[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="deskripsiReward"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Deskripsi / Ketentuan Reward
          </label>
          <textarea
            id="deskripsiReward"
            name="deskripsi"
            rows={2}
            defaultValue={editingReward?.deskripsi ?? ""}
            placeholder="Keterangan spesifikasi barang atau proses transfer uang..."
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
          />
          {formErrors.deskripsi && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.deskripsi[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="statusReward"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Status
          </label>
          <select
            id="statusReward"
            name="status"
            defaultValue={editingReward?.status ?? "aktif"}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
          >
            <option value="aktif">Aktif (Tersedia untuk ditukar)</option>
            <option value="nonaktif">Nonaktif (Disembunyikan)</option>
          </select>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteReward}
        onClose={() => setConfirmDeleteReward(null)}
        onConfirm={handleConfirmDeleteReward}
        message={`Apakah Anda yakin ingin menghapus reward "${confirmDeleteReward?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        isPending={isDeletingReward}
      />

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

"use client";

import { Award, Coins, Gift, Package, Star } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createRewardWarmindo,
  deleteRewardWarmindo,
  getPoinWarmindo,
  getRewardWarmindo,
  updatePoinWarmindo,
  updateRewardWarmindo,
} from "@/app/(admin-superadmin)/poin-warmindo/action";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { getCurrentUser } from "@/app/lib/auth-actions";
import type {
  ActionState,
  PoinSampahWarmindo,
  RewardWarmindo,
} from "@/app/types";

export default function PoinWarmindoPage() {
  const [activeTab, setActiveTab] = useState<"poin" | "reward">("poin");
  const [userRole, setUserRole] = useState<string | null>(null);

  // Tab 1 (Poin) states
  const [poinData, setPoinData] = useState<PoinSampahWarmindo[]>([]);
  const [poinTotal, setPoinTotal] = useState(0);
  const [poinPage, setPoinPage] = useState(1);
  const [poinLimit, setPoinLimit] = useState(50);
  const [poinSearch, setPoinSearch] = useState("");
  const [editingPoin, setEditingPoin] = useState<PoinSampahWarmindo | null>(
    null,
  );
  const [poinModalOpen, setPoinModalOpen] = useState(false);

  // Tab 2 (Reward) states
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
    "barang" | "uang"
  >("barang");
  const [confirmDeleteReward, setConfirmDeleteReward] =
    useState<RewardWarmindo | null>(null);
  const [isDeletingReward, setIsDeletingReward] = useState(false);

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

  const refreshPoin = useCallback(() => {
    getPoinWarmindo({
      page: poinPage,
      limit: poinLimit,
      search: poinSearch,
    }).then((res) => {
      setPoinData(res.data);
      setPoinTotal(res.total);
    });
  }, [poinPage, poinLimit, poinSearch]);

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
    if (activeTab === "poin") {
      refreshPoin();
    } else {
      refreshReward();
    }
  }, [activeTab, refreshPoin, refreshReward]);

  // Handle Tab 1 Form
  const handleOpenEditPoin = (item: PoinSampahWarmindo) => {
    setEditingPoin(item);
    setFormErrors({});
    setGlobalError("");
    setPoinModalOpen(true);
  };

  const handlePoinSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setGlobalError("");
    if (!editingPoin) return;

    const formData = new FormData(e.currentTarget);
    formData.set("jenisSampah", editingPoin.jenisSampah);

    startTransition(async () => {
      const result = await updatePoinWarmindo(
        editingPoin.id,
        { success: false },
        formData,
      );
      if (result.success) {
        setPoinModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          `Konversi poin untuk "${editingPoin.jenisSampah}" berhasil diperbarui.`,
        );
        refreshPoin();
      } else {
        if (result.errors?._form) {
          setGlobalError(result.errors._form[0]);
        } else if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    });
  };

  // Handle Tab 2 Form
  const handleOpenAddReward = () => {
    setEditingReward(null);
    setSelectedKategoriForm("barang");
    setFormErrors({});
    setGlobalError("");
    setRewardModalOpen(true);
  };

  const handleOpenEditReward = (item: RewardWarmindo) => {
    setEditingReward(item);
    setSelectedKategoriForm(item.kategori as "barang" | "uang");
    setFormErrors({});
    setGlobalError("");
    setRewardModalOpen(true);
  };

  const handleRewardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setGlobalError("");
    const formData = new FormData(e.currentTarget);

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

  // Columns Tab 1: Poin
  const poinColumns: Column<PoinSampahWarmindo>[] = [
    {
      header: "Jenis Sampah",
      sortKey: "jenisSampah",
      render: (item) => (
        <span className="font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-md text-xs inline-flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" />
          {item.jenisSampah}
        </span>
      ),
    },
    {
      header: "Tarif Poin per 100 Gram",
      sortKey: "poinPer100Gram",
      render: (item) => (
        <span className="font-mono text-xs text-neutral-900 font-bold bg-amber-50 text-amber-900 px-2.5 py-1 border border-amber-200 rounded-md">
          {item.poinPer100Gram} Poin / 100g
        </span>
      ),
    },
    {
      header: "Ekuivalen per Kilogram (1 Kg)",
      render: (item) => (
        <span className="font-mono text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-md">
          {item.poinPer100Gram * 10} Poin / Kg
        </span>
      ),
    },
  ];

  // Columns Tab 2: Reward
  const rewardColumns: Column<RewardWarmindo>[] = [
    {
      header: "Nama Reward",
      sortKey: "nama",
      render: (item) => (
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
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          {item.kategori === "uang" ? "Uang Tunai" : "Barang Fisik"}
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
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Master Data Poin & Reward Warmindo
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Atur konversi tarif poin per 100 gram sampah serta katalog reward
              (Barang & Uang) khusus mitra Warmindo
            </p>
          </div>
        </div>
      </div>

      {/* 2 Tabs Navigation */}
      <div className="flex border-b border-neutral-200 gap-2 bg-neutral-50/50 p-1.5 rounded-2xl border">
        <button
          type="button"
          onClick={() => setActiveTab("poin")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === "poin"
              ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/80"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Star className="w-4 h-4 text-amber-500" />
          Tab 1: Atur Poin Warmindo
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reward")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === "reward"
              ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/80"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Gift className="w-4 h-4 text-primary-600" />
          Tab 2: Atur Reward Warmindo
        </button>
      </div>

      {/* Tab 1 Content: Atur Poin */}
      {activeTab === "poin" && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <Coins className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Informasi Skema Poin Warmindo:</span>
              <p className="mt-0.5 text-amber-800">
                Secara default, seluruh kategori sampah dihitung sebesar{" "}
                <strong>10 poin per 100 gram</strong> (setara dengan 100 poin
                per 1 kg). Admin dapat menyesuaikan tarif poin masing-masing
                kategori sampah di bawah ini.
              </p>
            </div>
          </div>

          <DataTable
            data={poinData}
            columns={poinColumns}
            totalItems={poinTotal}
            currentPage={poinPage}
            pageSize={poinLimit}
            onPageChange={setPoinPage}
            onPageSizeChange={(e) => {
              setPoinLimit(Number(e.target.value));
              setPoinPage(1);
            }}
            search={poinSearch}
            onSearchChange={(val) => {
              setPoinSearch(val);
              setPoinPage(1);
            }}
            searchPlaceholder="Cari jenis sampah..."
            onEdit={handleOpenEditPoin}
          />
        </div>
      )}

      {/* Tab 2 Content: Atur Reward */}
      {activeTab === "reward" && (
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
      )}

      {/* Form Modal: Edit Poin (Tab 1) */}
      <FormModal
        isOpen={poinModalOpen}
        onClose={() => setPoinModalOpen(false)}
        title={`Edit Tarif Poin: ${editingPoin?.jenisSampah}`}
        onSubmit={handlePoinSubmit}
        isPending={isPending}
        globalError={globalError}
      >
        <div>
          <label
            htmlFor="jenisSampahInputDisabled"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Jenis Sampah
          </label>
          <input
            id="jenisSampahInputDisabled"
            type="text"
            disabled
            defaultValue={editingPoin?.jenisSampah}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-100 text-neutral-600 font-semibold"
          />
        </div>

        <div>
          <label
            htmlFor="poinPer100Gram"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Poin per 100 Gram
          </label>
          <input
            id="poinPer100Gram"
            type="number"
            name="poinPer100Gram"
            required
            defaultValue={editingPoin?.poinPer100Gram ?? 10}
            placeholder="Contoh: 10"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
          />
          <p className="text-[11px] text-neutral-500 mt-1">
            * 10 poin/100g = 100 poin per 1 kilogram sampah.
          </p>
          {formErrors.poinPer100Gram && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.poinPer100Gram[0]}
            </p>
          )}
        </div>
      </FormModal>

      {/* Form Modal: Add/Edit Reward (Tab 2) */}
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
            placeholder="Contoh: Uang Tunai Rp 50.000 atau Kaos Eksklusif"
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
              setSelectedKategoriForm(e.target.value as "barang" | "uang")
            }
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
          >
            <option value="barang">
              Barang Fisik (Merchandise, Alat, dll)
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
            defaultValue={editingReward?.poin ?? ""}
            placeholder="Contoh: 500"
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
            defaultValue={editingReward?.stok ?? 100}
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

"use client";

import { Award, Coins, Package } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getPoinWarmindo,
  updatePoinWarmindo,
} from "@/app/(admin-superadmin)/poin-warmindo/action";
import { type Column, DataTable } from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { PoinSampahWarmindo } from "@/app/types";

const poinWarmindoTourSteps = [
  {
    element: "#tour-admin-poin-warmindo-header",
    popover: {
      title: "Master Tarif Poin Warmindo",
      description:
        "Halaman untuk mengatur nilai konversi poin reward yang berhak didapatkan mitra Warmindo dari setiap gram kemasan sampah Indofood yang mereka kumpulkan dan setorkan.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-poin-warmindo-info",
    popover: {
      title: "Pedoman Standar Konversi Poin",
      description:
        "Panduan skema dasar: Standar konversi acuan sistem adalah 10 poin per 100 gram (ekuivalen 100 poin per 1 Kg sampah). Anda dapat menyesuaikan tarif tiap jenis material di tabel.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-poin-warmindo-table",
    popover: {
      title: "Tabel Konfigurasi Tarif Poin",
      description:
        "Tabel yang memuat jenis sampah (Karton, Etiket, Paper Cup) beserta tarif poin aktif per 100 gram dan per kilogram. Gunakan tombol 'Edit' di baris tabel untuk mengubah tarif poin sesuai kebijakan reward terbaru.",
      side: "top" as const,
    },
  },
];

export default function PoinWarmindoPage() {
  // Poin states
  const [poinData, setPoinData] = useState<PoinSampahWarmindo[]>([]);
  const [poinTotal, setPoinTotal] = useState(0);
  const [poinPage, setPoinPage] = useState(1);
  const [poinLimit, setPoinLimit] = useState(50);
  const [poinSearch, setPoinSearch] = useState("");
  const [editingPoin, setEditingPoin] = useState<PoinSampahWarmindo | null>(
    null,
  );
  const [poinModalOpen, setPoinModalOpen] = useState(false);

  // Transition & feedback
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

  useEffect(() => {
    refreshPoin();
  }, [refreshPoin]);

  // Handle Edit Poin Form
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

  // Columns: Poin
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

  return (
    <div className="space-y-6">
      <TourGuide steps={poinWarmindoTourSteps} />

      {/* Header Banner */}
      <div
        id="tour-admin-poin-warmindo-header"
        className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden print:hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Master Data Poin Warmindo
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Atur konversi tarif poin per 100 gram sampah khusus mitra Warmindo
            </p>
          </div>
        </div>
      </div>

      {/* Content: Atur Poin */}
      <div className="space-y-4">
        <div
          id="tour-admin-poin-warmindo-info"
          className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5"
        >
          <Coins className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Informasi Skema Poin Warmindo:</span>
            <p className="mt-0.5 text-amber-800">
              Secara default, seluruh kategori sampah dihitung sebesar{" "}
              <strong>10 poin per 100 gram</strong> (setara dengan 100 poin per
              1 kg). Admin dapat menyesuaikan tarif poin masing-masing kategori
              sampah di bawah ini.
            </p>
          </div>
        </div>

        <div id="tour-admin-poin-warmindo-table">
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
      </div>

      {/* Form Modal: Edit Poin */}
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

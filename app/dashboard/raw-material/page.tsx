"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/DataTable";
import { FeedbackModal } from "@/app/components/FeedbackModal";
import { FormModal } from "@/app/components/FormModal";
import {
  deleteRawMaterial,
  getRawMaterial,
  getRawMaterialByPeriod,
  saveRawMaterial,
} from "./action";

interface RawMaterial {
  id: number;
  periode: string;
  kategori: string;
  klasifikasi: string;
  beratKg: number;
  beratGram: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function RawMaterialPage() {
  const [data, setData] = useState<RawMaterial[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    kategori: "",
    klasifikasi: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRaw, setEditingRaw] = useState<RawMaterial | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState("");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [formValues, setFormValues] = useState({
    etiket_cn: 0,
    etiket_gn: 0,
    etiket_nn: 0,
    karton_cn: 0,
    karton_gn: 0,
    karton_nn: 0,
    cup_cn: 0,
  });
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
  const [confirmDelete, setConfirmDelete] = useState<RawMaterial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    getRawMaterial({
      page: currentPage,
      limit: pageSize,
      search,
      kategori: filterValues.kategori,
      klasifikasi: filterValues.klasifikasi,
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data as RawMaterial[]);
      setTotalItems(res.total);
    });
  }, [currentPage, pageSize, search, filterValues, sortBy, sortOrder]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const formatNumber = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);

  // Konversi YYYY-MM-DD → "Januari 2026"
  const formatPeriode = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
    });

  const handleOpenAddModal = () => {
    setEditingRaw(null);
    setFormErrors({});
    setGlobalError("");
    setFormValues({
      etiket_cn: 0,
      etiket_gn: 0,
      etiket_nn: 0,
      karton_cn: 0,
      karton_gn: 0,
      karton_nn: 0,
      cup_cn: 0,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: RawMaterial) => {
    setEditingRaw(item);
    setFormErrors({});
    setGlobalError("");
    startTransition(async () => {
      const records = await getRawMaterialByPeriod(item.periode);
      setFormValues({
        etiket_cn:
          records.find(
            (r) =>
              r.kategori === "Etiket" && r.klasifikasi === "Cup Noodle (CN)",
          )?.beratGram ?? 0,
        etiket_gn:
          records.find(
            (r) =>
              r.kategori === "Etiket" && r.klasifikasi === "Glass Noodle (GN)",
          )?.beratGram ?? 0,
        etiket_nn:
          records.find(
            (r) =>
              r.kategori === "Etiket" && r.klasifikasi === "Normal Noodle (NN)",
          )?.beratGram ?? 0,
        karton_cn:
          records.find(
            (r) =>
              r.kategori === "Karton" && r.klasifikasi === "Cup Noodle (CN)",
          )?.beratGram ?? 0,
        karton_gn:
          records.find(
            (r) =>
              r.kategori === "Karton" && r.klasifikasi === "Glass Noodle (GN)",
          )?.beratGram ?? 0,
        karton_nn:
          records.find(
            (r) =>
              r.kategori === "Karton" && r.klasifikasi === "Normal Noodle (NN)",
          )?.beratGram ?? 0,
        cup_cn:
          records.find(
            (r) => r.kategori === "Cup" && r.klasifikasi === "Cup Noodle (CN)",
          )?.beratGram ?? 0,
      });
      setModalOpen(true);
    });
  };

  const handleDelete = (item: RawMaterial) => {
    setConfirmDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    const res = await deleteRawMaterial(confirmDelete.id);
    setIsDeleting(false);
    setConfirmDelete(null);
    if (res.success) {
      showFeedback(
        "success",
        "Berhasil!",
        `Seluruh data raw material periode "${confirmDelete.periode}" berhasil dihapus.`,
      );
      refreshData();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus data raw material.",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setGlobalError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveRawMaterial({ success: false }, formData);
      if (result.success) {
        setModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          editingRaw
            ? `Data raw material periode "${formData.get("periode")}" berhasil diperbarui.`
            : "Data raw material baru berhasil ditambahkan untuk satu periode.",
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

  // ── Kolom tabel ───────────────────────────────────────────────────────────

  const columns: Column<RawMaterial>[] = [
    {
      header: "Periode",
      sortKey: "periode",
      grouped: true, // ← dirender sekali per grup dengan rowSpan
      render: (item) => (
        <span className="font-bold text-neutral-900 text-sm">
          {formatPeriode(item.periode)}
        </span>
      ),
    },
    {
      header: "Kategori",
      sortKey: "kategori",
      render: (item) => {
        const isCup = item.kategori === "Cup";
        const isEtiket = item.kategori === "Etiket";
        return (
          <span
            className={`font-semibold px-2 py-0.5 rounded text-[10px] border uppercase ${
              isCup
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : isEtiket
                  ? "text-blue-700 bg-blue-50 border-blue-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
            }`}
          >
            {item.kategori}
          </span>
        );
      },
    },
    {
      header: "Klasifikasi",
      sortKey: "klasifikasi",
      render: (item) => (
        <span className="text-neutral-700 font-medium">{item.klasifikasi}</span>
      ),
    },
    {
      header: "Berat (GR)",
      sortKey: "beratGram",
      render: (item) => (
        <span className="text-neutral-950 font-semibold font-mono text-xs">
          {formatNumber(item.beratGram)} gr
        </span>
      ),
    },
    {
      header: "Berat (KG)",
      sortKey: "beratKg",
      render: (item) => (
        <span className="text-neutral-600 font-semibold font-mono text-xs">
          {item.beratKg.toFixed(4)} kg
        </span>
      ),
    },
  ];

  const filters: TableFilter<RawMaterial>[] = [
    {
      id: "kategori",
      label: "Semua Kategori",
      options: [
        { label: "Cup", value: "Cup" },
        { label: "Etiket", value: "Etiket" },
        { label: "Karton", value: "Karton" },
      ],
      filterFn: (item, val) => item.kategori === val,
    },
    {
      id: "klasifikasi",
      label: "Semua Klasifikasi",
      options: [
        { label: "Cup Noodle (CN)", value: "Cup Noodle (CN)" },
        { label: "Glass Noodle (GN)", value: "Glass Noodle (GN)" },
        { label: "Normal Noodle (NN)", value: "Normal Noodle (NN)" },
      ],
      filterFn: (item, val) => item.klasifikasi === val,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Daftar Berat Standar
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola dan pantau berat standardisasi bahan baku hasil daur ulang
            limbah anorganik per periode.
          </p>
        </div>
      </div>

      {/* Tabel dengan grouping per periode */}
      <DataTable
        data={data}
        columns={columns}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(e) => {
          setPageSize(Number(e.target.value));
          setCurrentPage(1);
        }}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(id, val) => {
          setFilterValues((prev) => ({ ...prev, [id]: val }));
          setCurrentPage(1);
        }}
        searchPlaceholder="Cari kategori, klasifikasi, periode..."
        onAdd={handleOpenAddModal}
        addLabel="Tambah Raw Material"
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        groupByFn={(item) => item.periode}
      />

      {/* CRUD Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingRaw
            ? "Edit Master Data Raw Material"
            : "Input Master Data Raw Material"
        }
        onSubmit={handleSubmit}
        isPending={isPending}
        globalError={globalError}
      >
        {editingRaw && (
          <input type="hidden" name="oldPeriode" value={editingRaw.periode} />
        )}

        <div>
          <label
            htmlFor="periode-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Periode (Bulan &amp; Tahun)
          </label>
          <input
            id="periode-input"
            type="month"
            name="periode"
            required
            defaultValue={
              editingRaw?.periode
                ? editingRaw.periode.substring(0, 7) // ambil YYYY-MM dari YYYY-MM-DD
                : ""
            }
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800 font-medium"
          />
          {formErrors.periode && (
            <p className="text-red-600 text-xs mt-1">{formErrors.periode[0]}</p>
          )}
        </div>

        {/* Kategori: Etiket */}
        <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Kategori: Etiket (GR)
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                {
                  id: "etiket-nn-input",
                  name: "etiket_nn",
                  label: "Normal Noodle (NN)",
                  key: "etiket_nn",
                },
                {
                  id: "etiket-gn-input",
                  name: "etiket_gn",
                  label: "Glass Noodle (GN)",
                  key: "etiket_gn",
                },
                {
                  id: "etiket-cn-input",
                  name: "etiket_cn",
                  label: "Cup Noodle (CN)",
                  key: "etiket_cn",
                },
              ] as const
            ).map(({ id, name, label, key }) => (
              <div key={name}>
                <label
                  htmlFor={id}
                  className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1"
                >
                  {label}
                </label>
                <input
                  id={id}
                  type="number"
                  step="any"
                  name={name}
                  value={formValues[key]}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Kategori: Karton */}
        <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Kategori: Karton (GR)
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                {
                  id: "karton-nn-input",
                  name: "karton_nn",
                  label: "Normal Noodle (NN)",
                  key: "karton_nn",
                },
                {
                  id: "karton-gn-input",
                  name: "karton_gn",
                  label: "Glass Noodle (GN)",
                  key: "karton_gn",
                },
                {
                  id: "karton-cn-input",
                  name: "karton_cn",
                  label: "Cup Noodle (CN)",
                  key: "karton_cn",
                },
              ] as const
            ).map(({ id, name, label, key }) => (
              <div key={name}>
                <label
                  htmlFor={id}
                  className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1"
                >
                  {label}
                </label>
                <input
                  id={id}
                  type="number"
                  step="any"
                  name={name}
                  value={formValues[key]}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Kategori: Cup */}
        <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Kategori: Cup (GR)
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="cup-cn-input"
                className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1"
              >
                Cup Noodle (CN)
              </label>
              <input
                id="cup-cn-input"
                type="number"
                step="any"
                name="cup_cn"
                value={formValues.cup_cn}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    cup_cn: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
              />
            </div>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Periode"
        message={`Apakah Anda yakin ingin menghapus seluruh data raw material untuk periode "${confirmDelete?.periode}"? Semua kategori dalam periode ini akan ikut terhapus.`}
        isPending={isDeleting}
      />

      {/* Feedback */}
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

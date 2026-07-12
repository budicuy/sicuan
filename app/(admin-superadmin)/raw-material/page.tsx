"use client";

import { Recycle } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  deleteRawMaterial,
  getRawMaterial,
  getRawMaterialByPeriod,
  saveRawMaterial,
} from "@/app/(admin-superadmin)/raw-material/action";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { getCurrentUser } from "@/app/lib/auth-actions";
import type { DisplayRow, RawMaterial } from "@/app/types";

/** Expand 1 baris DB → 7 baris tampilan */
function expandToDisplayRows(raw: RawMaterial): DisplayRow[] {
  const make = (
    suffix: string,
    kategori: DisplayRow["kategori"],
    klasifikasi: DisplayRow["klasifikasi"],
    gram: number,
  ): DisplayRow => ({
    // id = sourceId (number) agar DataTable puas; _key unik per baris display
    id: raw.id,
    _key: `${raw.id}-${suffix}`,
    periode: raw.periode,
    kategori,
    klasifikasi,
    beratGram: gram,
    beratKg: gram / 1000,
  });

  return [
    make("cup-cn", "Cup", "Cup Noodle (CN)", raw.cupCnGram),
    make("etiket-nn", "Etiket", "Normal Noodle (NN)", raw.etiketNnGram),
    make("etiket-gn", "Etiket", "Glass Noodle (GN)", raw.etiketGnGram),
    make("etiket-cn", "Etiket", "Cup Noodle (CN)", raw.etiketCnGram),
    make("karton-nn", "Karton", "Normal Noodle (NN)", raw.kartonNnGram),
    make("karton-gn", "Karton", "Glass Noodle (GN)", raw.kartonGnGram),
    make("karton-cn", "Karton", "Cup Noodle (CN)", raw.kartonCnGram),
  ];
}

const INITIAL_FORM = {
  etiket_nn: 0,
  etiket_gn: 0,
  etiket_cn: 0,
  karton_nn: 0,
  karton_gn: 0,
  karton_cn: 0,
  cup_cn: 0,
};

export default function RawMaterialPage() {
  // Data DB (1 baris per bulan)
  const [data, setData] = useState<RawMaterial[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
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
  const [formValues, setFormValues] = useState(INITIAL_FORM);
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
  const [confirmDelete, setConfirmDelete] = useState<DisplayRow | null>(null);
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
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data as RawMaterial[]);
      setTotalItems(res.total);
    });
  }, [currentPage, pageSize, search, sortBy, sortOrder]);

  useEffect(() => {
    refreshData();
    getCurrentUser().then((user) => {
      if (user) setUserRole(user.role);
    });
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

  // ── Format helpers ────────────────────────────────────────────────────────

  const formatGram = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);

  const formatKg = (val: number) => {
    const rounded = Number(val.toFixed(4));
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(rounded);
  };

  const formatPeriode = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
    });

  // ── Modal handlers ────────────────────────────────────────────────────────

  const handleOpenAddModal = () => {
    setEditingRaw(null);
    setFormErrors({});
    setGlobalError("");
    setFormValues(INITIAL_FORM);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: DisplayRow) => {
    // Cari data asli dari array data berdasarkan id (= sourceId)
    const source = data.find((d) => d.id === item.id) ?? null;
    setEditingRaw(source);
    setFormErrors({});
    setGlobalError("");

    startTransition(async () => {
      const records = await getRawMaterialByPeriod(item.periode);
      const record = records[0];
      if (record) {
        setFormValues({
          etiket_nn: record.etiketNnGram,
          etiket_gn: record.etiketGnGram,
          etiket_cn: record.etiketCnGram,
          karton_nn: record.kartonNnGram,
          karton_gn: record.kartonGnGram,
          karton_cn: record.kartonCnGram,
          cup_cn: record.cupCnGram,
        });
      }
      setModalOpen(true);
    });
  };

  const handleDelete = (item: DisplayRow) => {
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
        `Seluruh data raw material periode "${formatPeriode(confirmDelete.periode)}" berhasil dihapus.`,
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

  // ── Expand DB rows → display rows ────────────────────────────────────────
  const displayData = data.flatMap(expandToDisplayRows);

  // ── Kolom tabel (tampilan lama) ───────────────────────────────────────────

  const columns: Column<DisplayRow>[] = [
    {
      header: "Periode",
      sortKey: "periode",
      grouped: true, // render sekali per grup dengan rowSpan
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
          {formatGram(item.beratGram)} gr
        </span>
      ),
    },
    {
      header: "Berat (KG)",
      sortKey: "beratKg",
      render: (item) => (
        <span className="text-neutral-600 font-semibold font-mono text-xs">
          {formatKg(item.beratKg)} kg
        </span>
      ),
    },
  ];

  const filters: TableFilter<DisplayRow>[] = [
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

  // ── Form input helpers ────────────────────────────────────────────────────

  type FormKey = keyof typeof INITIAL_FORM;

  const ETIKET_FIELDS: { id: string; name: FormKey; label: string }[] = [
    { id: "etiket-nn-input", name: "etiket_nn", label: "Normal Noodle (NN)" },
    { id: "etiket-gn-input", name: "etiket_gn", label: "Glass Noodle (GN)" },
    { id: "etiket-cn-input", name: "etiket_cn", label: "Cup Noodle (CN)" },
  ];

  const KARTON_FIELDS: { id: string; name: FormKey; label: string }[] = [
    { id: "karton-nn-input", name: "karton_nn", label: "Normal Noodle (NN)" },
    { id: "karton-gn-input", name: "karton_gn", label: "Glass Noodle (GN)" },
    { id: "karton-cn-input", name: "karton_cn", label: "Cup Noodle (CN)" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden mb-8 print:hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-md shrink-0">
            <Recycle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Master Data Raw Material
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola acuan berat standar pengeluaran bahan baku pabrik Indofood
              per periode
            </p>
          </div>
        </div>
      </div>

      {/* Tabel dengan grouping per periode — tampilan sama seperti sebelumnya */}
      <DataTable
        data={displayData}
        columns={columns}
        totalItems={totalItems * 7}
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
        onDelete={userRole === "superadmin" ? handleDelete : undefined}
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

        {/* Periode */}
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
              editingRaw?.periode ? editingRaw.periode.substring(0, 7) : ""
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
            {ETIKET_FIELDS.map(({ id, name, label }) => (
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
                  value={formValues[name]}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      [name]: Number(e.target.value),
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
            {KARTON_FIELDS.map(({ id, name, label }) => (
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
                  value={formValues[name]}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      [name]: Number(e.target.value),
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
        message={`Apakah Anda yakin ingin menghapus seluruh data raw material untuk periode "${confirmDelete ? formatPeriode(confirmDelete.periode) : ""}"? Semua kategori dalam periode ini akan ikut terhapus.`}
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

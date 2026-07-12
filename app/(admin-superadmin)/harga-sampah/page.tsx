"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  createHargaSampah,
  deleteHargaSampah,
  getHargaSampah,
  updateHargaSampah,
} from "@/app/(admin-superadmin)/harga-sampah/action";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import { getCurrentUser } from "@/app/lib/auth-actions";
import type { ActionState, HargaSampah } from "@/app/types";

const hargaSteps = [
  {
    element: "#tour-admin-harga-header",
    popover: {
      title: "Master Data Harga Sampah",
      description:
        "Di sini Admin/Superadmin dapat mengatur skema rentang berat setoran beserta harga tebus rupiah flat yang diperoleh nasabah.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-harga-table",
    popover: {
      title: "Tabel Skema Harga",
      description:
        "Tabel ini mendaftarkan seluruh skema harga per-kategori sampah (Karton, Etiket, Paper Cup) yang aktif dalam sistem.",
      side: "top" as const,
    },
  },
];

export default function HargaSampahPage() {
  const [data, setData] = useState<HargaSampah[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");

  const [_isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<{
    data: HargaSampah[];
    totalItems: number;
  } | null>(null);

  const handleTourStart = () => {
    savedStateRef.current = {
      data,
      totalItems,
    };
    setIsTourActive(true);
    setData([
      {
        id: 1,
        jenisSampah: "Karton",
        minBerat: 1,
        maxBerat: 10,
        harga: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        jenisSampah: "Karton",
        minBerat: 11,
        maxBerat: 50,
        harga: 750,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        jenisSampah: "Etiket",
        minBerat: 1,
        maxBerat: 10,
        harga: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    setTotalItems(3);
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    if (savedStateRef.current) {
      setData(savedStateRef.current.data);
      setTotalItems(savedStateRef.current.totalItems);
    }
  };
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    jenisSampah: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHarga, setEditingHarga] = useState<HargaSampah | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState("");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
  const [confirmDelete, setConfirmDelete] = useState<HargaSampah | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    getHargaSampah({
      page: currentPage,
      limit: pageSize,
      search,
      jenisSampah: filterValues.jenisSampah,
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data as HargaSampah[]);
      setTotalItems(res.total);
    });
  }, [currentPage, pageSize, search, filterValues, sortBy, sortOrder]);

  useEffect(() => {
    refreshData();
    getCurrentUser().then((user) => {
      if (user) {
        setUserRole(user.role);
      }
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

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleOpenAddModal = () => {
    setEditingHarga(null);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: HargaSampah) => {
    setEditingHarga(item);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleDelete = (item: HargaSampah) => {
    setConfirmDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    const res = await deleteHargaSampah(confirmDelete.id);
    setIsDeleting(false);
    setConfirmDelete(null);
    if (res.success) {
      showFeedback(
        "success",
        "Berhasil!",
        `Skema harga untuk "${confirmDelete.jenisSampah}" dengan range ${confirmDelete.minBerat}-${confirmDelete.maxBerat ?? "∞"} kg berhasil dihapus.`,
      );
      refreshData();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus skema harga.",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setGlobalError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result: ActionState;
      if (editingHarga) {
        result = await updateHargaSampah(
          editingHarga.id,
          { success: false },
          formData,
        );
      } else {
        result = await createHargaSampah({ success: false }, formData);
      }

      if (result.success) {
        setModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          editingHarga
            ? `Skema harga "${editingHarga.jenisSampah}" berhasil diperbarui.`
            : "Skema harga baru berhasil ditambahkan.",
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

  const columns: Column<HargaSampah>[] = [
    {
      header: "Jenis Sampah",
      sortKey: "jenisSampah",
      render: (item) => (
        <span className="font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded text-xs">
          {item.jenisSampah}
        </span>
      ),
    },
    {
      header: "Min. Berat (Kg)",
      sortKey: "minBerat",
      render: (item) => (
        <span className="text-neutral-600 font-mono text-xs font-semibold">
          {item.minBerat} Kg
        </span>
      ),
    },
    {
      header: "Max. Berat (Kg)",
      sortKey: "maxBerat",
      render: (item) => (
        <span className="text-neutral-600 font-mono text-xs font-semibold">
          {item.maxBerat !== null ? `${item.maxBerat} Kg` : "∞"}
        </span>
      ),
    },
    {
      header: "Harga Tebus Flat",
      sortKey: "harga",
      render: (item) => (
        <span className="px-1 text-neutral-950 font-semibold font-mono text-xs">
          {formatRupiah(item.harga)}
        </span>
      ),
    },
  ];

  const filters: TableFilter<HargaSampah>[] = [
    {
      id: "jenisSampah",
      label: "Filter Jenis Sampah",
      options: [
        { label: "Paper Cup", value: "Paper Cup" },
        { label: "Etiket (Plastik)", value: "Etiket" },
        { label: "Karton", value: "Karton" },
      ],
      filterFn: (item, val) => item.jenisSampah === val,
    },
  ];

  return (
    <div className="space-y-6">
      <TourGuide
        pageKey="admin_harga"
        steps={hargaSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      <div
        id="tour-admin-harga-header"
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Master Data Harga Sampah (Range)
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola data master rentang berat setoran beserta harga tebus rupiah
            flat yang didapatkan nasabah.
          </p>
        </div>
      </div>

      <DataTable
        id="tour-admin-harga-table"
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
        searchPlaceholder="Cari berdasarkan jenis sampah..."
        onAdd={handleOpenAddModal}
        addLabel="Tambah Skema Harga"
        onEdit={handleOpenEditModal}
        onDelete={userRole === "superadmin" ? handleDelete : undefined}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* CRUD Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingHarga ? "Edit Skema Harga Range" : "Tambah Skema Harga Range"
        }
        onSubmit={handleSubmit}
        isPending={isPending}
        globalError={globalError}
      >
        {!editingHarga ? (
          <div className="p-3.5 bg-primary-50 rounded-xl border border-primary-200">
            <p className="text-xs text-primary-800 font-semibold leading-relaxed">
              💡 Info: Skema harga baru akan otomatis ditambahkan ke 3 kategori
              sekaligus (Paper Cup, Etiket, Karton).
            </p>
            <input type="hidden" name="jenisSampah" value="Karton" />
          </div>
        ) : (
          <div>
            <label
              htmlFor="jenisSampah-select"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Jenis Sampah
            </label>
            <select
              id="jenisSampah-select"
              name="jenisSampah"
              defaultValue={editingHarga?.jenisSampah || "Paper Cup"}
              disabled={true}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-100 focus:outline-none transition-all text-neutral-500 cursor-not-allowed"
            >
              <option value="Paper Cup">Paper Cup</option>
              <option value="Etiket">Etiket</option>
              <option value="Karton">Karton</option>
            </select>
            <input
              type="hidden"
              name="jenisSampah"
              value={editingHarga?.jenisSampah}
            />
            {formErrors.jenisSampah && (
              <p className="text-red-600 text-xs mt-1">
                {formErrors.jenisSampah[0]}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="minBerat-input"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Berat Min (Kg)
            </label>
            <input
              id="minBerat-input"
              type="number"
              step="any"
              name="minBerat"
              required
              defaultValue={editingHarga?.minBerat ?? ""}
              placeholder="e.g. 1"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono text-neutral-800"
            />
            {formErrors.minBerat && (
              <p className="text-red-600 text-xs mt-1">
                {formErrors.minBerat[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maxBerat-input"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Berat Max (Kg) - Opsional
            </label>
            <input
              id="maxBerat-input"
              type="number"
              step="any"
              name="maxBerat"
              defaultValue={editingHarga?.maxBerat ?? ""}
              placeholder="Kosongkan untuk range > Min"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono text-neutral-800"
            />
            {formErrors.maxBerat && (
              <p className="text-red-600 text-xs mt-1">
                {formErrors.maxBerat[0]}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="harga-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Harga Tebus Flat (Rp)
          </label>
          <input
            id="harga-input"
            type="number"
            name="harga"
            required
            defaultValue={editingHarga?.harga ?? ""}
            placeholder="e.g. 25000"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono text-neutral-800"
          />
          {formErrors.harga && (
            <p className="text-red-600 text-xs mt-1">{formErrors.harga[0]}</p>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        message={`Apakah Anda yakin ingin menghapus skema harga "${confirmDelete?.jenisSampah}" untuk range berat ${confirmDelete?.minBerat}-${confirmDelete?.maxBerat ?? "∞"} kg? Tindakan ini tidak dapat dibatalkan.`}
        isPending={isDeleting}
      />

      {/* CRUD Feedback */}
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

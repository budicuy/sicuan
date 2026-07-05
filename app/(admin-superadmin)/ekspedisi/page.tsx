"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  type ActionState,
  createEkspedisi,
  deleteEkspedisi,
  getEkspedisi,
  updateEkspedisi,
} from "@/app/(admin-superadmin)/ekspedisi/action";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { getCurrentUser } from "@/app/lib/auth-actions";

interface Ekspedisi {
  id: number;
  namaVendor: string;
  noTelepon: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function EkspedisiPage() {
  const [data, setData] = useState<Ekspedisi[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEkspedisi, setEditingEkspedisi] = useState<Ekspedisi | null>(
    null,
  );
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
  const [confirmDelete, setConfirmDelete] = useState<Ekspedisi | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    getEkspedisi({
      page: currentPage,
      limit: pageSize,
      search,
      status: filterValues.status,
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data as Ekspedisi[]);
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

  const getStatusBadge = (status: string) => {
    return status === "Aktif"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const handleOpenAddModal = () => {
    setEditingEkspedisi(null);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: Ekspedisi) => {
    setEditingEkspedisi(item);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleDelete = (item: Ekspedisi) => {
    setConfirmDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    const res = await deleteEkspedisi(confirmDelete.id);
    setIsDeleting(false);
    setConfirmDelete(null);
    if (res.success) {
      showFeedback(
        "success",
        "Berhasil!",
        `Vendor "${confirmDelete.namaVendor}" berhasil dihapus.`,
      );
      refreshData();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus ekspedisi.",
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
      if (editingEkspedisi) {
        result = await updateEkspedisi(
          editingEkspedisi.id,
          { success: false },
          formData,
        );
      } else {
        result = await createEkspedisi({ success: false }, formData);
      }

      if (result.success) {
        setModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          editingEkspedisi
            ? `Data vendor "${editingEkspedisi.namaVendor}" berhasil diperbarui.`
            : "Vendor ekspedisi baru berhasil ditambahkan.",
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

  const columns: Column<Ekspedisi>[] = [
    {
      header: "Nama Vendor Ekspedisi",
      sortKey: "namaVendor",
      render: (item) => (
        <span className="font-semibold text-neutral-900">
          {item.namaVendor}
        </span>
      ),
    },
    {
      header: "Nomor Telepon Vendor",
      sortKey: "noTelepon",
      render: (item) => (
        <span className="text-neutral-600 font-mono text-xs">
          {item.noTelepon}
        </span>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      render: (item) => (
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  const filters: TableFilter<Ekspedisi>[] = [
    {
      id: "status",
      label: "Filter Status",
      options: [
        { label: "Aktif", value: "Aktif" },
        { label: "Nonaktif", value: "Nonaktif" },
      ],
      filterFn: (item, val) => item.status === val,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Master Data Ekspedisi
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola daftar vendor penyedia jasa ekspedisi untuk pengiriman sampah
            dari mitra Warmiendo.
          </p>
        </div>
      </div>

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
        searchPlaceholder="Cari vendor ekspedisi..."
        onAdd={handleOpenAddModal}
        addLabel="Tambah Vendor"
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
          editingEkspedisi ? "Edit Vendor Ekspedisi" : "Tambah Vendor Ekspedisi"
        }
        onSubmit={handleSubmit}
        isPending={isPending}
        globalError={globalError}
      >
        <div>
          <label
            htmlFor="namaVendor-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Nama Vendor Ekspedisi
          </label>
          <input
            id="namaVendor-input"
            type="text"
            name="namaVendor"
            required
            defaultValue={editingEkspedisi?.namaVendor || ""}
            placeholder="e.g. JNE Express"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
          />
          {formErrors.namaVendor && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.namaVendor[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="noTelepon-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Nomor Telepon Vendor
          </label>
          <input
            id="noTelepon-input"
            type="text"
            name="noTelepon"
            required
            defaultValue={editingEkspedisi?.noTelepon || ""}
            placeholder="e.g. 02129278888"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono text-neutral-800"
          />
          {formErrors.noTelepon && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.noTelepon[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="status-select"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Status Vendor
          </label>
          <select
            id="status-select"
            name="status"
            defaultValue={editingEkspedisi?.status || "Aktif"}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850"
          >
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
          {formErrors.status && (
            <p className="text-red-600 text-xs mt-1">{formErrors.status[0]}</p>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        message={`Apakah Anda yakin ingin menghapus vendor "${confirmDelete?.namaVendor}"? Tindakan ini tidak dapat dibatalkan.`}
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

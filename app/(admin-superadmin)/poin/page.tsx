"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createPoinSampah,
  deletePoinSampah,
  getPoinSampah,
  updatePoinSampah,
} from "@/app/(admin-superadmin)/poin/action";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import { type Column, DataTable } from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { getCurrentUser } from "@/app/lib/auth-actions";
import type { ActionState, PoinSampah } from "@/app/types";

export default function PoinPage() {
  const [data, setData] = useState<PoinSampah[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPoin, setEditingPoin] = useState<PoinSampah | null>(null);
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
  const [confirmDelete, setConfirmDelete] = useState<PoinSampah | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    getPoinSampah({
      page: currentPage,
      limit: pageSize,
      search,
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data as PoinSampah[]);
      setTotalItems(res.total);
    });
  }, [currentPage, pageSize, search, sortBy, sortOrder]);

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

  const handleOpenAddModal = () => {
    setEditingPoin(null);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: PoinSampah) => {
    setEditingPoin(item);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleDelete = (item: PoinSampah) => {
    setConfirmDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    const res = await deletePoinSampah(confirmDelete.id);
    setIsDeleting(false);
    setConfirmDelete(null);
    if (res.success) {
      showFeedback(
        "success",
        "Berhasil!",
        `Master poin untuk "${confirmDelete.jenisSampah}" berhasil dihapus.`,
      );
      refreshData();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus master poin.",
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
      if (editingPoin) {
        result = await updatePoinSampah(
          editingPoin.id,
          { success: false },
          formData,
        );
      } else {
        result = await createPoinSampah({ success: false }, formData);
      }

      if (result.success) {
        setModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          editingPoin
            ? `Master poin "${editingPoin.jenisSampah}" berhasil diperbarui.`
            : "Master poin baru berhasil ditambahkan.",
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

  const columns: Column<PoinSampah>[] = [
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
      header: "Poin Konversi / Kg",
      sortKey: "pointPerKg",
      render: (item) => (
        <span className="font-mono text-xs text-neutral-900 font-semibold bg-neutral-50 px-2 py-1 border border-neutral-200 rounded">
          {item.pointPerKg} Poin
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Master Data Poin Konversi Sampah
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola data master poin konversi per kg yang didapatkan nasabah dari
            tiap jenis sampah anorganik.
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
        searchPlaceholder="Cari berdasarkan jenis sampah..."
        onAdd={handleOpenAddModal}
        addLabel="Tambah Master Poin"
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
        title={editingPoin ? "Edit Master Poin" : "Tambah Master Poin"}
        onSubmit={handleSubmit}
        isPending={isPending}
        globalError={globalError}
      >
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
            defaultValue={editingPoin?.jenisSampah || "Paper Cup"}
            disabled={!!editingPoin}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850 disabled:bg-neutral-100 disabled:text-neutral-500"
          >
            <option value="Paper Cup">Paper Cup</option>
            <option value="Etiket">Etiket</option>
            <option value="Karton">Karton</option>
          </select>
          {formErrors.jenisSampah && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.jenisSampah[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="pointPerKg-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Poin Konversi / Kg
          </label>
          <input
            id="pointPerKg-input"
            type="number"
            name="pointPerKg"
            required
            defaultValue={editingPoin?.pointPerKg ?? ""}
            placeholder="e.g. 30"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono text-neutral-800"
          />
          {formErrors.pointPerKg && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.pointPerKg[0]}
            </p>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        message={`Apakah Anda yakin ingin menghapus master poin untuk "${confirmDelete?.jenisSampah}"? Tindakan ini tidak dapat dibatalkan.`}
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

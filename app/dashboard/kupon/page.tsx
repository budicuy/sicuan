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
  type ActionState,
  createKupon,
  deleteKupon,
  getKupon,
  updateKupon,
} from "./action";

interface Kupon {
  id: number;
  nama: string;
  deskripsi: string;
  poin: number;
  tier: "silver" | "gold" | "diamond";
  colorCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function KuponPage() {
  const [data, setData] = useState<Kupon[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    tier: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKupon, setEditingKupon] = useState<Kupon | null>(null);
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
  const [confirmDelete, setConfirmDelete] = useState<Kupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    getKupon({
      page: currentPage,
      limit: pageSize,
      search,
      tier: filterValues.tier,
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data as Kupon[]);
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

  const handleOpenAddModal = () => {
    setEditingKupon(null);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: Kupon) => {
    setEditingKupon(item);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleDelete = (item: Kupon) => {
    setConfirmDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    const res = await deleteKupon(confirmDelete.id);
    setIsDeleting(false);
    setConfirmDelete(null);
    if (res.success) {
      showFeedback(
        "success",
        "Berhasil!",
        `Kupon "${confirmDelete.nama}" berhasil dihapus.`,
      );
      refreshData();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus kupon.",
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
      if (editingKupon) {
        result = await updateKupon(
          editingKupon.id,
          { success: false },
          formData,
        );
      } else {
        result = await createKupon({ success: false }, formData);
      }
      if (result.success) {
        setModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          editingKupon
            ? `Kupon "${editingKupon.nama}" berhasil diperbarui.`
            : "Kupon baru berhasil ditambahkan.",
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

  const tierBadge = (tier: string) => {
    const base =
      "font-semibold px-2 py-0.5 rounded text-[10px] border uppercase ";
    switch (tier) {
      case "silver":
        return (
          <span className={`${base}text-gray-700 bg-gray-50 border-gray-200`}>
            {tier}
          </span>
        );
      case "gold":
        return (
          <span
            className={`${base}text-amber-700 bg-amber-50 border-amber-200`}
          >
            {tier}
          </span>
        );
      case "diamond":
        return (
          <span className={`${base}text-sky-700 bg-sky-50 border-sky-200`}>
            {tier}
          </span>
        );
      default:
        return <span className={base}>{tier}</span>;
    }
  };

  const columns: Column<Kupon>[] = [
    {
      header: "Nama Kupon",
      sortKey: "nama",
      render: (item) => (
        <span className="font-semibold text-neutral-900 text-sm">
          {item.nama}
        </span>
      ),
    },
    {
      header: "Deskripsi",
      sortKey: "deskripsi",
      render: (item) => (
        <span className="text-neutral-700 font-medium">{item.deskripsi}</span>
      ),
    },
    {
      header: "Tier",
      sortKey: "tier",
      render: (item) => tierBadge(item.tier),
    },
    {
      header: "Poin",
      sortKey: "poin",
      render: (item) => (
        <span className="text-neutral-950 font-semibold font-mono text-xs">
          {Number(item.poin).toLocaleString("id-ID")} poin
        </span>
      ),
    },
    {
      header: "Warna",
      sortKey: "colorCode",
      render: (item) => (
        <span className="inline-flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full border border-neutral-200"
            style={{ backgroundColor: item.colorCode }}
          />
          <span className="text-neutral-700 font-mono text-xs">
            {item.colorCode}
          </span>
        </span>
      ),
    },
  ];

  const filters: TableFilter<Kupon>[] = [
    {
      id: "tier",
      label: "Filter Tier",
      options: [
        { label: "Silver", value: "silver" },
        { label: "Gold", value: "gold" },
        { label: "Diamond", value: "diamond" },
      ],
      filterFn: (item, val) => item.tier === val,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Master Data Kupon
            <span className="text-xs text-neutral-500 font-bold ml-2">
              TIER: SILVER • GOLD • DIAMOND
            </span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola kupon yang bisa ditukar dengan poin nasabah.
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
        searchPlaceholder="Cari nama atau deskripsi kupon..."
        onAdd={handleOpenAddModal}
        addLabel="Tambah Kupon"
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingKupon ? "Edit Kupon" : "Tambah Kupon"}
        onSubmit={handleSubmit}
        isPending={isPending}
        globalError={globalError}
      >
        <div>
          <label
            htmlFor="nama-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Nama Kupon
          </label>
          <input
            id="nama-input"
            type="text"
            name="nama"
            required
            defaultValue={editingKupon?.nama ?? ""}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
          />
          {formErrors.nama && (
            <p className="text-red-600 text-xs mt-1">{formErrors.nama[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="deskripsi-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Deskripsi
          </label>
          <textarea
            id="deskripsi-input"
            name="deskripsi"
            required
            defaultValue={editingKupon?.deskripsi ?? ""}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
            rows={2}
          />
          {formErrors.deskripsi && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.deskripsi[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="tier-select"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Tier
            </label>
            <select
              id="tier-select"
              name="tier"
              required
              defaultValue={editingKupon?.tier ?? "silver"}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
            >
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="diamond">Diamond</option>
            </select>
            {formErrors.tier && (
              <p className="text-red-600 text-xs mt-1">{formErrors.tier[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="poin-input"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Poin Penukaran
            </label>
            <input
              id="poin-input"
              type="number"
              step="any"
              name="poin"
              required
              defaultValue={editingKupon?.poin ?? ""}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono text-neutral-800"
            />
            {formErrors.poin && (
              <p className="text-red-600 text-xs mt-1">{formErrors.poin[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="colorCode-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Warna
          </label>
          <div className="flex items-center gap-3">
            <input
              id="colorCode-input"
              type="color"
              name="colorCode"
              required
              defaultValue={editingKupon?.colorCode ?? "#9ca3af"}
              className="h-10 w-10 cursor-pointer rounded-lg border border-neutral-200 bg-white p-0"
            />
            <input
              id="colorCode-text"
              type="text"
              name="colorCode"
              required
              defaultValue={editingKupon?.colorCode ?? "#9ca3af"}
              placeholder="#9ca3af"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono text-neutral-800"
            />
          </div>
          {formErrors.colorCode && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.colorCode[0]}
            </p>
          )}
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        message={`Apakah Anda yakin ingin menghapus kupon "${confirmDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        isPending={isDeleting}
      />

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





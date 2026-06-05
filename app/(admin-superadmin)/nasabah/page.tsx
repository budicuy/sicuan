"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import {
  type ActionState,
  createNasabah,
  deleteNasabah,
  getAvailableUsers,
  getNasabah,
  updateNasabah,
} from "./action";

interface Nasabah {
  id: number;
  userId: number;
  nik: string | null;
  tanggalLahir: string | null;
  noTelepon: string | null;
  alamat: string | null;
  jenisBank: string | null;
  noRekening: string | null;
  user: {
    name: string;
    username: string;
    role: string;
  };
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function NasabahPage() {
  const [data, setData] = useState<Nasabah[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    role: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNasabah, setEditingNasabah] = useState<Nasabah | null>(null);
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
  const [confirmDelete, setConfirmDelete] = useState<Nasabah | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    getNasabah({
      page: currentPage,
      limit: pageSize,
      search,
      role: filterValues.role,
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data as Nasabah[]);
      setTotalItems(res.total);
    });
    getAvailableUsers().then((res) => setAvailableUsers(res as User[]));
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

  const _getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "superadmin":
        return "bg-red-100 text-red-700 border-red-200";
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "warmiendo":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "bank-sampah":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const handleOpenAddModal = () => {
    setEditingNasabah(null);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (nasabahItem: Nasabah) => {
    setEditingNasabah(nasabahItem);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleDelete = (nasabahItem: Nasabah) => {
    setConfirmDelete(nasabahItem);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    const res = await deleteNasabah(confirmDelete.id);
    setIsDeleting(false);
    setConfirmDelete(null);
    if (res.success) {
      showFeedback(
        "success",
        "Berhasil!",
        `Profil nasabah "${confirmDelete.user?.name || ""}" berhasil dihapus.`,
      );
      refreshData();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus profil nasabah",
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
      if (editingNasabah) {
        result = await updateNasabah(
          editingNasabah.id,
          { success: false },
          formData,
        );
      } else {
        result = await createNasabah({ success: false }, formData);
      }

      if (result.success) {
        setModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          editingNasabah
            ? "Profil nasabah berhasil diperbarui."
            : "Profil nasabah baru berhasil ditambahkan.",
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

  const columns: Column<Nasabah>[] = [
    {
      header: "Nama Lengkap",
      sortKey: "name",
      render: (n) => (
        <div>
          <div className="font-semibold text-neutral-900">{n.user?.name}</div>
          <div className="text-[10px] text-neutral-500 font-medium uppercase mt-0.5 tracking-wider">
            Role: <span className="lowercase">{n.user?.role}</span>
          </div>
        </div>
      ),
    },
    {
      header: "NIK",
      sortKey: "nik",
      render: (n) => (
        <span className="text-neutral-600 font-mono text-xs">
          {n.nik || "-"}
        </span>
      ),
    },
    {
      header: "No. Telepon",
      sortKey: "noTelepon",
      render: (n) => (
        <span className="text-neutral-600">{n.noTelepon || "-"}</span>
      ),
    },
    {
      header: "Alamat",
      sortKey: "alamat",
      render: (n) => (
        <span className="text-neutral-600 max-w-xs truncate block">
          {n.alamat || "-"}
        </span>
      ),
    },
    {
      header: "Rekening Bank",
      sortKey: "jenisBank",
      render: (n) =>
        n.jenisBank ? (
          <div className="text-xs">
            <span className="font-bold text-neutral-800 bg-neutral-100 border border-neutral-200/60 px-1.5 py-0.5 rounded text-[9px] mr-1 uppercase">
              {n.jenisBank}
            </span>
            <span className="font-mono text-neutral-600">
              {n.noRekening || "-"}
            </span>
          </div>
        ) : (
          <span className="text-neutral-400">-</span>
        ),
    },
  ];

  const filters: TableFilter<Nasabah>[] = [
    {
      id: "role",
      label: "Filter Tipe Nasabah",
      options: [
        { label: "Konsumen", value: "konsumen" },
        { label: "Warmiendo", value: "warmiendo" },
      ],
      filterFn: (item, val) => item.user?.role?.toLowerCase() === val,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Master Data Nasabah Bank
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola profil nasabah, nomor identitas (NIK), nomor telepon, alamat,
            dan nomor rekening penampung reward.
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
        searchPlaceholder="Cari nasabah berdasarkan nama, NIK, atau no telp..."
        onAdd={handleOpenAddModal}
        addLabel="Tambah Profil Nasabah"
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNasabah ? "Edit Profil Nasabah" : "Tambah Profil Nasabah"}
        onSubmit={handleSubmit}
        isPending={isPending}
        globalError={globalError}
      >
        <div>
          <label
            htmlFor="userId-select"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Hubungkan dengan Akun User
          </label>
          <select
            id="userId-select"
            name="userId"
            required
            defaultValue={editingNasabah?.userId || ""}
            disabled={!!editingNasabah}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
          >
            <option value="" disabled>
              -- Pilih Akun User --
            </option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
          {formErrors.userId && (
            <p className="text-red-600 text-xs mt-1">{formErrors.userId[0]}</p>
          )}
          {editingNasabah && (
            <input type="hidden" name="userId" value={editingNasabah.userId} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="nik-input"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              NIK
            </label>
            <input
              id="nik-input"
              type="text"
              name="nik"
              defaultValue={editingNasabah?.nik || ""}
              placeholder="Nomor NIK Kependudukan"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono"
            />
            {formErrors.nik && (
              <p className="text-red-600 text-xs mt-1">{formErrors.nik[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="tanggalLahir-input"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Tanggal Lahir
            </label>
            <input
              id="tanggalLahir-input"
              type="date"
              name="tanggalLahir"
              defaultValue={editingNasabah?.tanggalLahir || ""}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all"
            />
            {formErrors.tanggalLahir && (
              <p className="text-red-600 text-xs mt-1">
                {formErrors.tanggalLahir[0]}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="jenisBank-input"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Jenis Bank
            </label>
            <input
              id="jenisBank-input"
              type="text"
              name="jenisBank"
              defaultValue={editingNasabah?.jenisBank || ""}
              placeholder="e.g. BCA, Mandiri, BRI"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all uppercase"
            />
            {formErrors.jenisBank && (
              <p className="text-red-600 text-xs mt-1">
                {formErrors.jenisBank[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="noRekening-input"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Nomor Rekening
            </label>
            <input
              id="noRekening-input"
              type="text"
              name="noRekening"
              defaultValue={editingNasabah?.noRekening || ""}
              placeholder="e.g. 1234567890"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono"
            />
            {formErrors.noRekening && (
              <p className="text-red-600 text-xs mt-1">
                {formErrors.noRekening[0]}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="noTelepon-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Nomor Telepon
          </label>
          <input
            id="noTelepon-input"
            type="text"
            name="noTelepon"
            defaultValue={editingNasabah?.noTelepon || ""}
            placeholder="e.g. 081234567890"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all"
          />
          {formErrors.noTelepon && (
            <p className="text-red-600 text-xs mt-1">
              {formErrors.noTelepon[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="alamat-input"
            className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
          >
            Alamat Lengkap
          </label>
          <textarea
            id="alamat-input"
            name="alamat"
            defaultValue={editingNasabah?.alamat || ""}
            placeholder="Masukkan alamat lengkap..."
            rows={3}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all resize-none"
          />
          {formErrors.alamat && (
            <p className="text-red-600 text-xs mt-1">{formErrors.alamat[0]}</p>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        message={`Apakah Anda yakin ingin menghapus profil nasabah "${confirmDelete?.user?.name}"? Tindakan ini tidak dapat dibatalkan.`}
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

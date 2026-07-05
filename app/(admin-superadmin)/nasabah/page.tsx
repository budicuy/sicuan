"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  type ActionState,
  createNasabah,
  deleteNasabah,
  getNasabah,
  updateNasabah,
} from "@/app/(admin-superadmin)/nasabah/action";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { getCurrentUser } from "@/app/lib/auth-actions";

interface NasabahWithUser {
  id: number;
  userId: number;
  nik: string | null;
  tanggalLahir: string | null;
  noTelepon: string | null;
  email: string | null;
  alamat: string | null;
  jenisBank: string | null;
  noRekening: string | null;
  poin: number;
  kredit: number;
  user: {
    name: string;
    username: string;
    role: string;
    status: string;
  };
}

export default function NasabahPage() {
  const [data, setData] = useState<NasabahWithUser[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    role: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNasabah, setEditingNasabah] = useState<NasabahWithUser | null>(
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
  const [confirmDelete, setConfirmDelete] = useState<NasabahWithUser | null>(
    null,
  );
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
      setData(res.data as NasabahWithUser[]);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-50 text-red-700 border-red-200";
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "warmiendo":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "bank-sampah":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "Aktif"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const handleOpenAddModal = () => {
    setEditingNasabah(null);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: NasabahWithUser) => {
    setEditingNasabah(item);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleDelete = (item: NasabahWithUser) => {
    setConfirmDelete(item);
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
        `Nasabah "${confirmDelete.user?.name || ""}" berhasil dihapus.`,
      );
      refreshData();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus data nasabah",
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
            ? "Data nasabah berhasil diperbarui."
            : "Nasabah baru berhasil ditambahkan.",
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

  const columns: Column<NasabahWithUser>[] = [
    {
      header: "Nama & Akun",
      sortKey: "name",
      render: (n) => (
        <div>
          <div className="font-semibold text-neutral-900">{n.user?.name}</div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
            @{n.user?.username}
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      sortKey: "role",
      render: (n) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadge(n.user?.role)}`}
        >
          {n.user?.role}
        </span>
      ),
    },
    {
      header: "Status",
      render: (n) => (
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(n.user?.status)}`}
        >
          {n.user?.status}
        </span>
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

  const filters: TableFilter<NasabahWithUser>[] = [
    {
      id: "role",
      label: "Filter Role",
      options: [
        { label: "Konsumen", value: "konsumen" },
        { label: "Warmiendo", value: "warmiendo" },
        { label: "Bank Sampah", value: "bank-sampah" },
        { label: "Admin", value: "admin" },
        { label: "Superadmin", value: "superadmin" },
      ],
      filterFn: (item, val) => item.user?.role?.toLowerCase() === val,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Master Data Nasabah
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola akun login dan profil nasabah secara bersamaan dalam satu
            tampilan.
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
        searchPlaceholder="Cari berdasarkan nama, username, NIK, atau no telp..."
        onAdd={handleOpenAddModal}
        addLabel="Tambah Nasabah"
        onEdit={handleOpenEditModal}
        onDelete={userRole === "superadmin" ? handleDelete : undefined}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNasabah ? "Edit Data Nasabah" : "Tambah Nasabah Baru"}
        onSubmit={handleSubmit}
        isPending={isPending}
        globalError={globalError}
      >
        {/* Hidden userId for edit mode */}
        {editingNasabah && (
          <input type="hidden" name="userId" value={editingNasabah.userId} />
        )}

        {/* ───── Section: Akun Login ───── */}
        <div className="pb-3 mb-3 border-b border-neutral-100">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
            Akun Login
          </p>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="name-input"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Nama Lengkap
              </label>
              <input
                id="name-input"
                type="text"
                name="name"
                required
                defaultValue={editingNasabah?.user?.name || ""}
                placeholder="e.g. Budi Santoso"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
              />
              {formErrors.name && (
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.name[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="username-input"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Username
              </label>
              <input
                id="username-input"
                type="text"
                name="username"
                required
                defaultValue={editingNasabah?.user?.username || ""}
                placeholder="e.g. budi.santoso"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all font-mono text-neutral-800"
              />
              {formErrors.username && (
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.username[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Password{" "}
                {editingNasabah && (
                  <span className="text-neutral-400 capitalize">
                    (Kosongkan jika tidak diubah)
                  </span>
                )}
              </label>
              <input
                id="password-input"
                type="password"
                name="password"
                required={!editingNasabah}
                placeholder={editingNasabah ? "••••••••" : "Masukkan password"}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
              />
              {formErrors.password && (
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.password[0]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="role-select"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Role Akun
                </label>
                <select
                  id="role-select"
                  name="role"
                  defaultValue={editingNasabah?.user?.role || "konsumen"}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
                >
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="konsumen">Konsumen</option>
                  <option value="warmiendo">Warmiendo</option>
                  <option value="bank-sampah">Bank Sampah</option>
                </select>
                {formErrors.role && (
                  <p className="text-red-600 text-xs mt-1">
                    {formErrors.role[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="status-select"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Status Akun
                </label>
                <select
                  id="status-select"
                  name="status"
                  defaultValue={editingNasabah?.user?.status || "Aktif"}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
                {formErrors.status && (
                  <p className="text-red-600 text-xs mt-1">
                    {formErrors.status[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ───── Section: Data Profil Nasabah ───── */}
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
            Profil Nasabah
          </p>

          <div className="space-y-3">
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
                  <p className="text-red-600 text-xs mt-1">
                    {formErrors.nik[0]}
                  </p>
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
                htmlFor="email-input"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Email
              </label>
              <input
                id="email-input"
                type="email"
                name="email"
                defaultValue={editingNasabah?.email || ""}
                placeholder="e.g. budi@email.com"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all"
              />
              {formErrors.email && (
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.email[0]}
                </p>
              )}
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
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.alamat[0]}
                </p>
              )}
            </div>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        message={`Apakah Anda yakin ingin menghapus nasabah "${confirmDelete?.user?.name}"? Akun login dan seluruh data profil akan dihapus permanen.`}
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

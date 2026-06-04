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
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "./action";

interface User {
  id: number;
  name: string;
  username: string;
  role: "superadmin" | "admin" | "konsumen" | "warmiendo" | "bank-sampah";
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    role: "",
    status: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    getUsers({
      page: currentPage,
      limit: pageSize,
      search,
      role: filterValues.role,
      status: filterValues.status,
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data as User[]);
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
    setEditingUser(null);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setConfirmDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    const res = await deleteUser(confirmDelete.id);
    setIsDeleting(false);
    setConfirmDelete(null);
    if (res.success) {
      showFeedback(
        "success",
        "Berhasil!",
        `User "${confirmDelete.name}" berhasil dihapus.`,
      );
      refreshData();
    } else {
      showFeedback(
        "error",
        "Gagal!",
        res.errors?._form?.[0] || "Gagal menghapus user.",
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
      if (editingUser) {
        result = await updateUser(editingUser.id, { success: false }, formData);
      } else {
        result = await createUser({ success: false }, formData);
      }

      if (result.success) {
        setModalOpen(false);
        showFeedback(
          "success",
          "Berhasil!",
          editingUser
            ? `Data user "${editingUser.name}" berhasil diperbarui.`
            : "User baru berhasil ditambahkan ke sistem.",
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

  const columns: Column<User>[] = [
    {
      header: "Nama",
      sortKey: "name",
      render: (user) => (
        <div>
          <div className="font-semibold text-neutral-900">{user.name}</div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
            @{user.username}
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      sortKey: "role",
      render: (user) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadge(user.role)}`}
        >
          {user.role}
        </span>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      render: (user) => (
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(user.status)}`}
        >
          {user.status}
        </span>
      ),
    },
  ];

  const filters: TableFilter<User>[] = [
    {
      id: "role",
      label: "Filter Role",
      options: [
        { label: "Superadmin", value: "superadmin" },
        { label: "Admin", value: "admin" },
        { label: "Konsumen", value: "konsumen" },
        { label: "Warmiendo", value: "warmiendo" },
        { label: "Bank Sampah", value: "bank-sampah" },
      ],
      filterFn: (user, val) => user.role === val,
    },
    {
      id: "status",
      label: "Filter Status",
      options: [
        { label: "Aktif", value: "Aktif" },
        { label: "Nonaktif", value: "Nonaktif" },
      ],
      filterFn: (user, val) => user.status === val,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Master Data User
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola data akun pengguna, role hak akses, dan status keaktifan
            user.
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
        searchPlaceholder="Cari nama, username, atau role..."
        onAdd={handleOpenAddModal}
        addLabel="Tambah User"
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* CRUD Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Edit Data User" : "Tambah User Baru"}
        onSubmit={handleSubmit}
        isPending={isPending}
        globalError={globalError}
      >
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
            defaultValue={editingUser?.name || ""}
            placeholder="e.g. Budi Santoso"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
          />
          {formErrors.name && (
            <p className="text-red-600 text-xs mt-1">{formErrors.name[0]}</p>
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
            defaultValue={editingUser?.username || ""}
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
            {editingUser && (
              <span className="text-neutral-400 capitalize">
                (Kosongkan jika tidak diubah)
              </span>
            )}
          </label>
          <input
            id="password-input"
            type="password"
            name="password"
            required={!editingUser}
            placeholder={editingUser ? "••••••••" : "Masukkan password baru"}
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
              defaultValue={editingUser?.role || "konsumen"}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850"
            >
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="konsumen">Konsumen</option>
              <option value="warmiendo">Warmiendo</option>
              <option value="bank-sampah">Bank Sampah</option>
            </select>
            {formErrors.role && (
              <p className="text-red-600 text-xs mt-1">{formErrors.role[0]}</p>
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
              defaultValue={editingUser?.status || "Aktif"}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850"
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
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        message={`Apakah Anda yakin ingin menghapus user "${confirmDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
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

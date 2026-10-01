"use client";

import { Recycle, Truck } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createEkspedisi,
  deleteEkspedisi,
  getBankSampahBList,
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
import { TourGuide } from "@/app/components/shared/TourGuide";
import { getCurrentUser } from "@/app/lib/auth-actions";
import type { ActionState, Ekspedisi } from "@/app/types";

const ekspedisiTourSteps = [
  {
    element: "#tour-admin-ekspedisi-header",
    popover: {
      title: "Master Data Ekspedisi Logistik",
      description:
        "Selamat datang di halaman Master Data Ekspedisi! Di sini Administrator dan Superadmin dapat mengelola seluruh mitra penyedia armada pengiriman (seperti GoSend, GrabExpress, Logistik Internal, dsb) yang bertugas menjemput dan mengangkut sampah terpilah dari mitra Warmindo menuju Bank Sampah atau pabrik daur ulang Indofood.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-ekspedisi-search",
    popover: {
      title: "Pencarian Vendor Cepat",
      description:
        "Ketikkan nama vendor ekspedisi atau nomor telepon pada kotak pencarian ini untuk menemukan data mitra logistik secara langsung tanpa harus menelusuri daftar satu per satu.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-ekspedisi-filter",
    popover: {
      title: "Filter Status Operasional Vendor",
      description:
        "Gunakan menu dropdown filter ini untuk menyaring daftar vendor berdasarkan statusnya: 'Aktif' untuk vendor yang saat ini siap menerima order penjemputan sampah, atau 'Nonaktif' untuk vendor yang kerjasamanya sedang dijeda.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-ekspedisi-add",
    popover: {
      title: "Pendaftaran Vendor Baru",
      description:
        "Klik tombol 'Tambah Vendor' ini untuk mendaftarkan mitra jasa ekspedisi reguler baru (seperti GoSend/Grab) atau mendaftarkan armada Bank Sampah Tipe B yang terhubung langsung dengan akun mitranya.",
      side: "left" as const,
    },
  },
  {
    element: "#tour-admin-ekspedisi-table",
    popover: {
      title: "Tabel Informasi Mitra Vendor",
      description:
        "Tabel ini memuat rincian lengkap vendor: Nama Vendor Ekspedisi, Nomor Telepon/Kontak untuk koordinasi penjemputan limbah daur ulang, serta Status Keaktifan (hijau untuk Aktif dan merah untuk Nonaktif).",
      side: "top" as const,
    },
  },
  {
    element: "#tour-admin-ekspedisi-actions",
    popover: {
      title: "Aksi Pengelolaan & Hak Akses",
      description:
        "Pada kolom Aksi di setiap baris vendor, klik ikon pensil (Edit) untuk memperbarui rincian vendor seperti perubahan nomor telepon atau status. Khusus akun Superadmin, tersedia juga ikon tempat sampah (Hapus) untuk menghapus vendor jika diperlukan.",
      side: "left" as const,
    },
  },
];

export default function EkspedisiPage() {
  const [data, setData] = useState<Ekspedisi[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [_isTourActive, setIsTourActive] = useState(false);

  const handleTourStart = () => {
    setIsTourActive(true);
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
  };
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
    tipe: "",
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

  // State Ekspedisi Bank Sampah Tipe B
  const [bankSampahBList, setBankSampahBList] = useState<
    Array<{
      id: number;
      name: string;
      username: string;
      noTelepon?: string | null;
      alamat?: string | null;
    }>
  >([]);
  const [tipeVendor, setTipeVendor] = useState<"reguler" | "bank-sampah-b">(
    "reguler",
  );
  const [selectedBankSampahId, setSelectedBankSampahId] = useState<string>("");
  const [formNamaVendor, setFormNamaVendor] = useState<string>("");
  const [formNoTelepon, setFormNoTelepon] = useState<string>("");

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
      tipe: filterValues.tipe,
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
    getBankSampahBList().then(setBankSampahBList);
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
    setTipeVendor("reguler");
    setSelectedBankSampahId("");
    setFormNamaVendor("");
    setFormNoTelepon("");
    setFormErrors({});
    setGlobalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: Ekspedisi) => {
    setEditingEkspedisi(item);
    const itemTipe =
      item.tipe === "bank-sampah-b" ? "bank-sampah-b" : "reguler";
    setTipeVendor(itemTipe);
    setSelectedBankSampahId(item.bankSampahId ? String(item.bankSampahId) : "");
    setFormNamaVendor(item.namaVendor);
    setFormNoTelepon(item.noTelepon);
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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 text-xs sm:text-sm">
              {item.namaVendor}
            </span>
            {item.tipe === "bank-sampah-b" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Recycle className="w-3 h-3 text-emerald-600" />
                Bank Sampah Tipe B
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                <Truck className="w-3 h-3 text-neutral-500" />
                Vendor Reguler
              </span>
            )}
          </div>
          {item.bankSampah?.alamat && (
            <span className="text-[11px] text-neutral-500 block">
              📍 {item.bankSampah.alamat}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Nomor Telepon Vendor",
      sortKey: "noTelepon",
      render: (item) => (
        <span className="text-neutral-600 font-mono text-xs font-semibold">
          {item.noTelepon || "-"}
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
    {
      id: "tipe",
      label: "Tipe Vendor",
      options: [
        { label: "Vendor Reguler", value: "reguler" },
        { label: "Bank Sampah Tipe B", value: "bank-sampah-b" },
      ],
      filterFn: (item, val) => item.tipe === val,
    },
  ];

  return (
    <div className="space-y-6">
      <TourGuide
        steps={ekspedisiTourSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      <div
        id="tour-admin-ekspedisi-header"
        className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden mb-8 print:hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-md shrink-0">
            <Truck className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Master Data Ekspedisi
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola daftar vendor penyedia jasa ekspedisi untuk pengiriman
              sampah dari mitra Warmindo
            </p>
          </div>
        </div>
      </div>

      <DataTable
        id="tour-admin-ekspedisi-table-root"
        searchId="tour-admin-ekspedisi-search"
        filterId="tour-admin-ekspedisi-filter"
        addButtonId="tour-admin-ekspedisi-add"
        tableContainerId="tour-admin-ekspedisi-table"
        actionsHeaderId="tour-admin-ekspedisi-actions"
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
        <div className="space-y-4">
          {/* Pilihan Jenis / Tipe Vendor */}
          <div>
            <span className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
              Jenis Vendor Ekspedisi <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTipeVendor("reguler");
                  if (!editingEkspedisi) {
                    setSelectedBankSampahId("");
                    setFormNamaVendor("");
                    setFormNoTelepon("");
                  }
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  tipeVendor === "reguler"
                    ? "border-primary-500 bg-primary-50/60 ring-2 ring-primary-500/10"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      tipeVendor === "reguler"
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-neutral-800">
                    Vendor Reguler
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  Gojek, Grab, GoSend, Internal dsb.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipeVendor("bank-sampah-b");
                  if (bankSampahBList.length > 0 && !selectedBankSampahId) {
                    const first = bankSampahBList[0];
                    setSelectedBankSampahId(String(first.id));
                    setFormNamaVendor(`Bank Sampah Tipe B - ${first.name}`);
                    setFormNoTelepon(first.noTelepon || "");
                  }
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  tipeVendor === "bank-sampah-b"
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/10"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      tipeVendor === "bank-sampah-b"
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <Recycle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-neutral-800">
                    Bank Sampah Tipe B
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  Armada jemput sampah SiCuan
                </span>
              </button>
            </div>
            <input type="hidden" name="tipe" value={tipeVendor} />
            <input
              type="hidden"
              name="bankSampahId"
              value={selectedBankSampahId}
            />
          </div>

          {/* Jika Bank Sampah Tipe B: Dropdown Pilihan Akun Bank Sampah B */}
          {tipeVendor === "bank-sampah-b" && (
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2 animate-in fade-in duration-200">
              <label
                htmlFor="selectBankB"
                className="block text-xs font-bold text-emerald-900"
              >
                Pilih Akun Bank Sampah Tipe B{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="selectBankB"
                value={selectedBankSampahId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedBankSampahId(id);
                  const found = bankSampahBList.find(
                    (b) => String(b.id) === id,
                  );
                  if (found) {
                    setFormNamaVendor(`Bank Sampah Tipe B - ${found.name}`);
                    setFormNoTelepon(found.noTelepon || "");
                  }
                }}
                required
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-neutral-800 font-medium"
              >
                <option value="">-- Pilih Akun Bank Sampah Tipe B --</option>
                {bankSampahBList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.username}) {b.alamat ? `— ${b.alamat}` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-700">
                Pilih akun mitra Bank Sampah Tipe B di atas. Data nama vendor
                dan kontak telepon akan otomatis terisi serta terhubung
                langsung.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="namaVendor-input"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Nama Vendor Ekspedisi <span className="text-red-500">*</span>
            </label>
            <input
              id="namaVendor-input"
              type="text"
              name="namaVendor"
              required
              value={formNamaVendor}
              onChange={(e) => setFormNamaVendor(e.target.value)}
              placeholder="e.g. Bank Sampah Banjarbaru / JNE"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800 font-medium"
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
              Nomor Telepon Vendor <span className="text-red-500">*</span>
            </label>
            <input
              id="noTelepon-input"
              type="text"
              name="noTelepon"
              required
              value={formNoTelepon}
              onChange={(e) => setFormNoTelepon(e.target.value)}
              placeholder="e.g. 08123456789"
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
              Status Operasional Vendor
            </label>
            <select
              id="status-select"
              name="status"
              defaultValue={editingEkspedisi?.status || "Aktif"}
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

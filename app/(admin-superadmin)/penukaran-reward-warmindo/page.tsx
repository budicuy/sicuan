"use client";

import imageCompression from "browser-image-compression";
import {
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Gift,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  approvePenukaranReward,
  getPenukaranRewardList,
  rejectPenukaranReward,
} from "@/app/(admin-superadmin)/penukaran-reward-warmindo/action";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import type { PenukaranRewardWarmindo } from "@/app/types";

type PenukaranWithUser = PenukaranRewardWarmindo & {
  user?: {
    id: number;
    name: string;
    username: string;
    role: string;
  } | null;
};

export default function PenukaranRewardWarmindoPage() {
  const [data, setData] = useState<PenukaranWithUser[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
    kategori: "",
  });

  // Modal Action States
  const [selectedItemForApprove, setSelectedItemForApprove] =
    useState<PenukaranWithUser | null>(null);
  const [selectedItemForReject, setSelectedItemForReject] =
    useState<PenukaranWithUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // Transfer Proof Upload State
  const [buktiTransferBase64, setBuktiTransferBase64] = useState<string | null>(
    null,
  );
  const [uploadError, setUploadError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState("");
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const refreshData = useCallback(() => {
    getPenukaranRewardList({
      page: currentPage,
      limit: pageSize,
      search,
      status: filterValues.status,
      kategori: filterValues.kategori,
    }).then((res) => {
      setData(res.data as PenukaranWithUser[]);
      setTotalItems(res.total);
    });
  }, [currentPage, pageSize, search, filterValues]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    setIsCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        setBuktiTransferBase64(reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setBuktiTransferBase64(reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenApproveModal = (item: PenukaranWithUser) => {
    setSelectedItemForApprove(item);
    setBuktiTransferBase64(null);
    setUploadError("");
    setGlobalError("");
  };

  const handleApproveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItemForApprove) return;
    setGlobalError("");

    const formData = new FormData(e.currentTarget);
    if (buktiTransferBase64) {
      formData.set("buktiTransfer", buktiTransferBase64);
    }

    startTransition(async () => {
      const result = await approvePenukaranReward(
        selectedItemForApprove.id,
        { success: false },
        formData,
      );

      if (result.success) {
        setSelectedItemForApprove(null);
        showFeedback(
          "success",
          "Pengajuan Disetujui!",
          `Penukaran reward "${selectedItemForApprove.namaReward}" berhasil diselesaikan.`,
        );
        refreshData();
      } else {
        setGlobalError(
          result.errors?._form?.[0] || "Gagal menyetujui penukaran reward.",
        );
      }
    });
  };

  const handleRejectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItemForReject || !rejectReason.trim()) return;

    startTransition(async () => {
      const result = await rejectPenukaranReward(
        selectedItemForReject.id,
        rejectReason,
      );

      if (result.success) {
        setSelectedItemForReject(null);
        setRejectReason("");
        showFeedback(
          "success",
          "Pengajuan Ditolak",
          `Pengajuan ditolak dan sejumlah ${selectedItemForReject.poinDipotong} poin telah dikembalikan ke saldo mitra.`,
        );
        refreshData();
      } else {
        showFeedback(
          "error",
          "Gagal",
          result.errors?._form?.[0] || "Gagal menolak pengajuan.",
        );
      }
    });
  };

  const columns: Column<PenukaranWithUser>[] = [
    {
      header: "Tanggal",
      sortKey: "createdAt",
      render: (item) => (
        <span className="text-xs text-neutral-600 font-medium">
          {new Date(item.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "Mitra Warmindo",
      render: (item) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">
            {item.user?.name ?? `User #${item.userId}`}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            @{item.user?.username ?? "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Reward & Poin",
      render: (item) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">
            {item.namaReward}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                item.kategori === "uang"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {item.kategori === "uang" ? "Uang Tunai" : "Barang"}
            </span>
            <span className="text-[10px] font-mono font-bold text-neutral-700">
              {item.poinDipotong} Poin
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Detail Penerima / Transfer",
      render: (item) => (
        <div className="text-xs max-w-52">
          {item.kategori === "uang" ? (
            <div>
              <div className="font-bold text-emerald-700">
                Rp {item.nominalUang?.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-neutral-800">
                {item.jenisBank} - {item.noRekening}
              </div>
              <div className="text-[10px] text-neutral-500">
                a.n. {item.atasNama}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[11px] text-neutral-700 font-medium line-clamp-2">
                {item.alamatPengiriman || "Alamat sesuai profil"}
              </div>
              {item.nomorResi && (
                <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                  Resi: {item.nomorResi}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      render: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              item.status === "berhasil"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : item.status === "ditolak"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {item.status === "berhasil" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : item.status === "ditolak" ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {item.status}
          </span>
          {item.buktiTransfer && (
            <button
              type="button"
              onClick={() => setViewProofUrl(item.buktiTransfer)}
              className="text-[10px] text-primary-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0"
            >
              <Eye className="w-3 h-3" /> Bukti Transfer
            </button>
          )}
        </div>
      ),
    },
    {
      header: "Aksi",
      render: (item) =>
        item.status === "pending" || item.status === "diproses" ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenApproveModal(item)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
              title="Setujui dan Selesaikan"
            >
              <Check className="w-3.5 h-3.5" /> Proses
            </button>
            <button
              type="button"
              onClick={() => setSelectedItemForReject(item)}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
              title="Tolak Pengajuan"
            >
              <X className="w-3.5 h-3.5" /> Tolak
            </button>
          </div>
        ) : (
          <span className="text-neutral-400 text-xs italic">Selesai</span>
        ),
    },
  ];

  const filters: TableFilter<PenukaranWithUser>[] = [
    {
      id: "status",
      label: "Status",
      options: [
        { label: "Semua Status", value: "" },
        { label: "Pending", value: "pending" },
        { label: "Berhasil", value: "berhasil" },
        { label: "Ditolak", value: "ditolak" },
      ],
    },
    {
      id: "kategori",
      label: "Kategori Reward",
      options: [
        { label: "Semua Kategori", value: "" },
        { label: "Uang Tunai", value: "uang" },
        { label: "Barang", value: "barang" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Persetujuan Penukaran Reward Warmindo
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola dan proses pengajuan penukaran reward (Uang Tunai & Barang)
              dari mitra Warmindo
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
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
        searchPlaceholder="Cari nama mitra, rekening, atau catatan..."
      />

      {/* Modal Approve / Selesaikan */}
      {selectedItemForApprove && (
        <FormModal
          isOpen={!!selectedItemForApprove}
          onClose={() => setSelectedItemForApprove(null)}
          title={`Proses Penukaran: ${selectedItemForApprove.namaReward}`}
          onSubmit={handleApproveSubmit}
          isPending={isPending}
          globalError={globalError}
        >
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-neutral-500">Pemohon:</span>
              <span className="font-bold text-neutral-900">
                {selectedItemForApprove.user?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Poin Ditukar:</span>
              <span className="font-bold text-neutral-900">
                {selectedItemForApprove.poinDipotong} Poin
              </span>
            </div>
            {selectedItemForApprove.kategori === "uang" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Nominal Transfer:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    Rp{" "}
                    {selectedItemForApprove.nominalUang?.toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Rekening Tujuan:</span>
                  <span className="font-mono font-bold text-neutral-800">
                    {selectedItemForApprove.jenisBank} -{" "}
                    {selectedItemForApprove.noRekening} (a.n.{" "}
                    {selectedItemForApprove.atasNama})
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-neutral-500">Alamat Pengiriman:</span>
                <span className="font-medium text-neutral-800 text-right max-w-xs">
                  {selectedItemForApprove.alamatPengiriman || "Sesuai profil"}
                </span>
              </div>
            )}
          </div>

          {selectedItemForApprove.kategori === "uang" ? (
            <div>
              <label
                htmlFor="buktiTransferInput"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Upload Bukti Transfer Bank (Opsional)
              </label>
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-4 text-center bg-neutral-50 hover:bg-neutral-100/70 transition-colors">
                <input
                  id="buktiTransferInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="buktiTransferInput"
                  className="cursor-pointer flex flex-col items-center gap-1.5"
                >
                  <Upload className="w-6 h-6 text-neutral-400" />
                  <span className="text-xs font-bold text-primary-600">
                    {buktiTransferBase64
                      ? "Ganti Gambar Bukti"
                      : "Pilih Foto / Screenshot Bukti Transfer"}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Format: JPG, PNG, WEBP (maks. 5MB)
                  </span>
                </label>
              </div>

              {isCompressing && (
                <p className="text-xs text-blue-600 mt-1">
                  Mengompres gambar...
                </p>
              )}
              {uploadError && (
                <p className="text-xs text-red-600 mt-1">{uploadError}</p>
              )}

              {buktiTransferBase64 && (
                <div className="mt-2 relative w-32 h-32 rounded-lg overflow-hidden border">
                  {/* biome-ignore lint/performance/noImgElement: transfer proof preview */}
                  <img
                    src={buktiTransferBase64}
                    alt="Preview Transfer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setBuktiTransferBase64(null)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label
                htmlFor="nomorResiInput"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Nomor Resi / Kurir Pengiriman
              </label>
              <input
                id="nomorResiInput"
                type="text"
                name="nomorResi"
                placeholder="Contoh: JNE-8829102849 atau Diambil Langsung"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="catatanAdminInput"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Catatan untuk Mitra (Opsional)
            </label>
            <textarea
              id="catatanAdminInput"
              name="catatanAdmin"
              rows={2}
              placeholder="Contoh: Dana telah ditransfer ke BCA atau Paket sedang dikirim..."
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
            />
          </div>
        </FormModal>
      )}

      {/* Modal Reject */}
      {selectedItemForReject && (
        <FormModal
          isOpen={!!selectedItemForReject}
          onClose={() => setSelectedItemForReject(null)}
          title="Tolak Pengajuan Reward"
          onSubmit={handleRejectSubmit}
          isPending={isPending}
          submitLabel="Konfirmasi Tolak"
        >
          <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-800">
            <span className="font-bold">Perhatian:</span> Menolak pengajuan akan
            secara otomatis mengembalikan{" "}
            <strong>{selectedItemForReject.poinDipotong} poin</strong> ke akun
            mitra.
          </div>

          <div>
            <label
              htmlFor="alasanPenolakanInput"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="alasanPenolakanInput"
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Nomor rekening tidak aktif / Stok barang sedang habis..."
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
            />
          </div>
        </FormModal>
      )}

      {/* View Proof Image Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-neutral-900">
                Bukti Transfer Pembayaran
              </h3>
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg border bg-neutral-100 flex items-center justify-center">
              {/* biome-ignore lint/performance/noImgElement: transfer proof modal view */}
              <img
                src={viewProofUrl}
                alt="Bukti Transfer"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
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

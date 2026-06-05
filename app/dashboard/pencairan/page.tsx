"use client";

import {
  Camera,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/DataTable";
import { FeedbackModal } from "@/app/components/FeedbackModal";
import {
  approveDisbursement,
  getAllDisbursementsForAdmin,
  rejectDisbursement,
} from "../pencairan-dana/action";

interface DisbursementItem {
  id: number;
  userId: number;
  jumlah: number;
  jenisBank: string;
  noRekening: string;
  status: string;
  buktiTransfer: string | null;
  createdAt: Date;
  user: {
    name: string;
    username: string;
    role: string;
  };
}

export default function PencairanAdminPage() {
  const [items, setItems] = useState<DisbursementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Action states
  const [verifyRequest, setVerifyRequest] = useState<DisbursementItem | null>(
    null,
  );
  const [rejectRequest, setRejectRequest] = useState<DisbursementItem | null>(
    null,
  );
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // File upload state for approval
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [isPending, startTransition] = useTransition();

  // DataTable states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
    role: "",
  });

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

  const showFeedback = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setFeedback({ isOpen: true, type, title, message });
    },
    [],
  );

  const loadData = useCallback(() => {
    setLoading(true);
    getAllDisbursementsForAdmin()
      .then((res) => {
        setItems(res as DisbursementItem[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal mengambil data pencairan:", err);
        showFeedback("error", "Error", "Gagal memuat data pencairan dana.");
        setLoading(false);
      });
  }, [showFeedback]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle image upload and convert to base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("File yang diunggah harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Ukuran gambar maksimal adalah 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.onerror = () => {
      setImageError("Gagal membaca file.");
    };
    reader.readAsDataURL(file);
  };

  const handleApprove = () => {
    if (!verifyRequest) return;
    if (!uploadedImage) {
      setImageError("Bukti foto pencairan transfer wajib diunggah.");
      return;
    }

    startTransition(async () => {
      const res = await approveDisbursement(verifyRequest.id, uploadedImage);
      if (res.success) {
        showFeedback("success", "Pencairan Disetujui", res.message);
        setVerifyRequest(null);
        setUploadedImage(null);
        loadData();
      } else {
        showFeedback("error", "Persetujuan Gagal", res.message);
      }
    });
  };

  const handleReject = () => {
    if (!rejectRequest) return;

    startTransition(async () => {
      const res = await rejectDisbursement(rejectRequest.id);
      if (res.success) {
        showFeedback("success", "Pencairan Ditolak", res.message);
        setRejectRequest(null);
        loadData();
      } else {
        showFeedback("error", "Penolakan Gagal", res.message);
      }
    });
  };

  const formatTanggal = (dateVal: Date) => {
    const d = new Date(dateVal);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "warmiendo":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "bank-sampah":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "berhasil":
        return "bg-emerald-50 text-emerald-700 border-emerald-250";
      case "ditolak":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatRoleName = (role?: string) => {
    if (!role) return "Mitra";
    if (role === "bank-sampah") return "Bank Sampah";
    if (role === "warmiendo") return "Warmiendo";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // DataTable columns definition
  const columns: Column<DisbursementItem>[] = [
    {
      header: "Nama Mitra",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-neutral-800 block">
              {item.user.name}
            </span>
            <span
              className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider mt-1 ${getRoleBadgeColor(item.user.role)}`}
            >
              {formatRoleName(item.user.role)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Rekening Tujuan",
      render: (item) => (
        <div>
          <div className="font-bold text-neutral-800">{item.jenisBank}</div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
            {item.noRekening}
          </div>
        </div>
      ),
    },
    {
      header: "Nominal",
      render: (item) => (
        <span className="font-extrabold text-neutral-800 text-sm">
          Rp {item.jumlah.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      header: "Tanggal Pengajuan",
      render: (item) => formatTanggal(item.createdAt),
    },
    {
      header: "Status",
      render: (item) => (
        <span
          className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${getStatusBadgeColor(item.status)}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      header: "Aksi / Bukti",
      render: (item) => (
        <div className="flex justify-center items-center gap-2">
          {item.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => setVerifyRequest(item)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-xs border-0 cursor-pointer"
              >
                Verifikasi
              </button>
              <button
                type="button"
                onClick={() => setRejectRequest(item)}
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
              >
                Tolak
              </button>
            </>
          ) : item.buktiTransfer ? (
            <button
              type="button"
              onClick={() => setViewProofUrl(item.buktiTransfer)}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Bukti Transfer
            </button>
          ) : (
            <span className="text-neutral-400 italic text-[11px]">-</span>
          )}
        </div>
      ),
    },
  ];

  // DataTable filters
  const filters: TableFilter<DisbursementItem>[] = [
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
      id: "role",
      label: "Peranan",
      options: [
        { label: "Semua Peranan", value: "" },
        { label: "Warmiendo", value: "warmiendo" },
        { label: "Bank Sampah", value: "bank-sampah" },
      ],
    },
  ];

  // Client-side filtering & pagination
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(search.toLowerCase()) ||
      item.user.username.toLowerCase().includes(search.toLowerCase()) ||
      item.jenisBank.toLowerCase().includes(search.toLowerCase()) ||
      item.noRekening.includes(search);

    const matchesStatus =
      !filterValues.status || item.status === filterValues.status;
    const matchesRole =
      !filterValues.role || item.user.role === filterValues.role;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">
          Memuat data verifikasi pencairan...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          Verifikasi Pencairan Dana
        </h1>
        <p className="text-xs text-neutral-500">
          Proses pencairan dana manual dari mitra Warmiendo dan Bank Sampah.
          Bukti foto transfer wajib dilampirkan.
        </p>
      </div>

      {/* Main Table using Shared DataTable */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden p-6">
        <DataTable
          data={paginatedItems}
          columns={columns}
          totalItems={filteredItems.length}
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
          searchPlaceholder="Cari nama, bank, atau rekening..."
          filters={filters}
          filterValues={filterValues}
          onFilterChange={(filterId, value) => {
            setFilterValues({ ...filterValues, [filterId]: value });
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Verification Modal (Uploader) */}
      {verifyRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden p-6 relative animate-in zoom-in-95 duration-200 space-y-5">
            <button
              type="button"
              onClick={() => {
                setVerifyRequest(null);
                setUploadedImage(null);
                setImageError("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-150">
              <CreditCard className="w-5.5 h-5.5 text-primary-600" />
              <h3 className="text-base font-bold text-neutral-800">
                Verifikasi Pencairan Dana
              </h3>
            </div>

            {/* Request info */}
            <div className="p-4 bg-neutral-50 border border-neutral-200/50 rounded-2xl space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Mitra:</span>
                <span className="font-bold text-neutral-800">
                  {verifyRequest.user.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tujuan Transfer:</span>
                <span className="font-bold text-neutral-800">
                  {verifyRequest.jenisBank} — {verifyRequest.noRekening}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-200/60 pt-1.5 mt-1">
                <span>Jumlah Pencairan:</span>
                <span className="font-extrabold text-primary-600 text-sm">
                  Rp {verifyRequest.jumlah.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Photo upload field */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Unggah Bukti Transfer (Wajib)
              </span>

              {uploadedImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-[200px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* biome-ignore lint/performance/noImgElement: Base64 data url preview is used */}
                  <img
                    src={uploadedImage}
                    alt="Bukti Transfer"
                    className="max-h-[200px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all border-0 cursor-pointer"
                    title="Hapus foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl border-2 border-dashed border-neutral-300 hover:border-primary-500/50 transition-all p-6 text-center bg-neutral-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 text-neutral-500">
                    <div className="p-3 bg-white rounded-full w-fit mx-auto shadow-xs border border-neutral-100">
                      <Camera className="w-6 h-6 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-700">
                        Pilih Foto Bukti Transfer
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Maksimal ukuran file 5MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {imageError && (
                <p className="text-[11px] font-semibold text-red-600">
                  {imageError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setVerifyRequest(null);
                  setUploadedImage(null);
                  setImageError("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer bg-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending || !uploadedImage}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1 border-0 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Setujui &amp; Kirim</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={!!rejectRequest}
        onClose={() => setRejectRequest(null)}
        onConfirm={handleReject}
        message={`Apakah Anda yakin ingin menolak pengajuan pencairan dana senilai Rp ${rejectRequest?.jumlah.toLocaleString("id-ID")} untuk mitra "${rejectRequest?.user.name}"? Saldo akan otomatis dikembalikan ke kredit mitra.`}
        isPending={isPending}
      />

      {/* View Proof Image Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden p-6 relative animate-in zoom-in-95 duration-200 space-y-4">
            <button
              type="button"
              onClick={() => setViewProofUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-neutral-800 pb-2 border-b border-neutral-150 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-600" />
              Bukti Foto Transfer Pencairan
            </h3>

            <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-[400px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* biome-ignore lint/performance/noImgElement: R2 remote proof image preview is used */}
              <img
                src={viewProofUrl}
                alt="Bukti Transfer"
                className="max-h-[400px] object-contain w-full"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer"
              >
                Tutup
              </button>
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

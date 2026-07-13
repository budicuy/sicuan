"use client";

import imageCompression from "browser-image-compression";
import {
  Banknote,
  Camera,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  approveDisbursement,
  approveDisbursementCash,
  deletePencairan,
  getAllDisbursementsForAdmin,
  getBuktiPembayaranByPencairanId,
  getBuktiPembayaranPdfBase64,
  getCurrentUserRole,
  rejectDisbursement,
  type UpdatePencairanPayload,
  updatePencairan,
} from "@/app/(admin-superadmin)/pencairan-dana/action";
import { BuktiPembayaranModal } from "@/app/(admin-superadmin)/pencairan-dana/BuktiPembayaranModal";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { DisbursementItem } from "@/app/types";

const pencairanSteps = [
  {
    element: "#tour-admin-pencairan-header",
    popover: {
      title: "Halaman Verifikasi Pencairan Dana",
      description:
        "Di sini Admin memproses pengajuan pencairan dana dari mitra Warmindo dan Bank Sampah. Setiap pengajuan harus diverifikasi atau ditolak.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-pencairan-table",
    popover: {
      title: "Daftar Pengajuan Pencairan",
      description:
        "Tabel ini menampilkan seluruh pengajuan pencairan dana dari mitra beserta metode pembayaran (tunai/transfer), nominal, dan statusnya.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-admin-pencairan-action",
    popover: {
      title: "Aksi Verifikasi",
      description:
        "Klik tombol 'Proses' untuk menyetujui pengajuan atau 'Tolak' untuk menolak. Pada mode tour ini adalah simulasi dan tidak akan mengubah data nyata.",
      side: "left" as const,
    },
  },
];

export default function PencairanAdminPage() {
  const [items, setItems] = useState<DisbursementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");

  const [isTourActive, setIsTourActive] = useState(false);
  const savedItemsRef = useRef<DisbursementItem[]>([]);

  const demoPencairanItem: DisbursementItem = {
    id: 99901,
    userId: 9901,
    jumlah: 200000,
    metodePembayaran: "transfer",
    jenisBank: "BNI",
    noRekening: "123456xxx",
    keterangan: "Pencairan Demo Tour",
    status: "pending",
    buktiTransfer: null,
    ttdPenyerahUrl: null,
    periodeBulan: null,
    periodeTahun: null,
    createdAt: new Date(),
    user: {
      name: "Warmindo Demo",
      username: "warmindo_demo",
      role: "warmindo",
    },
  };

  const handleTourStart = () => {
    savedItemsRef.current = items;
    setIsTourActive(true);
    if (items.filter((i) => i.status === "pending").length === 0) {
      setItems([demoPencairanItem, ...items]);
    }
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    setItems(savedItemsRef.current);
  };

  // Modals / Action states
  const [verifyRequest, setVerifyRequest] = useState<DisbursementItem | null>(
    null,
  );
  const [rejectRequest, setRejectRequest] = useState<DisbursementItem | null>(
    null,
  );
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [buktiPembayaranItem, setBuktiPembayaranItem] =
    useState<DisbursementItem | null>(null);
  const [existingDocId, setExistingDocId] = useState<number | null>(null);

  // Superadmin: Edit & Delete states
  const [deleteRequest, setDeleteRequest] = useState<DisbursementItem | null>(
    null,
  );
  const [editRequest, setEditRequest] = useState<DisbursementItem | null>(null);
  const [editForm, setEditForm] = useState<UpdatePencairanPayload>({});
  const [isEditPending, startEditTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  // File upload state for approval
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // DataTable states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
    role: "",
    metode: "",
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

  // Fetch role user untuk guard superadmin di client
  useEffect(() => {
    getCurrentUserRole().then((role) => {
      if (role) setUserRole(role);
    });
  }, []);

  const handleOpenEditModal = (item: DisbursementItem) => {
    setEditRequest(item);
    setEditForm({
      jumlah: item.jumlah,
      metodePembayaran: item.metodePembayaran as "transfer" | "tunai" | "qris",
      jenisBank: item.jenisBank,
      noRekening: item.noRekening,
      keterangan: item.keterangan,
      status: item.status as "pending" | "berhasil" | "ditolak",
    });
  };

  const handleEdit = () => {
    if (!editRequest) return;
    startEditTransition(async () => {
      const res = await updatePencairan(editRequest.id, editForm);
      if (res.success) {
        showFeedback("success", "Berhasil Diperbarui", res.message);
        setEditRequest(null);
        loadData();
      } else {
        showFeedback("error", "Gagal Memperbarui", res.message);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteRequest) return;
    startDeleteTransition(async () => {
      const res = await deletePencairan(deleteRequest.id);
      if (res.success) {
        showFeedback("success", "Berhasil Dihapus", res.message);
        setDeleteRequest(null);
        loadData();
      } else {
        showFeedback("error", "Gagal Menghapus", res.message);
      }
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("File yang diunggah harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setIsCompressing(false);
      };
      reader.onerror = () => {
        setImageError("Gagal membaca file.");
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApprove = () => {
    if (!verifyRequest) return;

    // Tour mode: simulate success
    if (isTourActive && verifyRequest.id === 99901) {
      setItems((prev) =>
        prev.map((i) => (i.id === 99901 ? { ...i, status: "berhasil" } : i)),
      );
      setVerifyRequest(null);
      setUploadedImage(null);
      document.dispatchEvent(new CustomEvent("close-tour-guide"));
      showFeedback(
        "success",
        "[SIMULASI] Pencairan Disetujui",
        "Ini adalah simulasi tour. Data nyata tidak berubah.",
      );
      return;
    }

    // Cash: approve without photo
    if (verifyRequest.metodePembayaran === "tunai") {
      startTransition(async () => {
        const res = await approveDisbursementCash(verifyRequest.id);
        if (res.success) {
          showFeedback("success", "Pencairan Disetujui", res.message);
          setVerifyRequest(null);
          loadData();
        } else {
          showFeedback("error", "Persetujuan Gagal", res.message);
        }
      });
      return;
    }

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

    // Tour mode: simulate reject
    if (isTourActive && rejectRequest.id === 99901) {
      setItems((prev) =>
        prev.map((i) => (i.id === 99901 ? { ...i, status: "ditolak" } : i)),
      );
      setRejectRequest(null);
      document.dispatchEvent(new CustomEvent("close-tour-guide"));
      showFeedback(
        "success",
        "[SIMULASI] Pencairan Ditolak",
        "Ini adalah simulasi tour. Data nyata tidak berubah.",
      );
      return;
    }

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

  const handleOpenBuktiPembayaran = async (item: DisbursementItem) => {
    // Check if document already exists
    const existing = await getBuktiPembayaranByPencairanId(item.id);
    if (existing) {
      handleDownloadPdf(existing.id);
    } else {
      setExistingDocId(null);
      setBuktiPembayaranItem(item);
    }
  };

  const handleDownloadPdf = async (docId: number) => {
    try {
      const res = await getBuktiPembayaranPdfBase64(docId);
      if (res.success && res.pdfBase64) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${res.pdfBase64}`;
        link.download = res.fileName || "Bukti-Pembayaran.pdf";
        link.click();
      } else {
        showFeedback(
          "error",
          "Gagal Mengunduh",
          res.message || "Gagal mengunduh dokumen PDF.",
        );
      }
    } catch (error) {
      console.error("Gagal mengunduh PDF:", error);
      showFeedback(
        "error",
        "Gagal Mengunduh",
        "Terjadi kesalahan saat mengunduh PDF.",
      );
    }
  };

  const _handleDownloadExistingDoc = (docId: number) => {
    handleDownloadPdf(docId);
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
      case "warmindo":
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

  const getMetodeBadge = (metode: string) => {
    switch (metode) {
      case "tunai":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">
            <Banknote className="w-2.5 h-2.5" />
            Tunai
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded-full border bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-wider">
            <CreditCard className="w-2.5 h-2.5" />
            Transfer
          </span>
        );
    }
  };

  const formatRoleName = (role?: string) => {
    if (!role) return "Mitra";
    if (role === "bank-sampah") return "Bank Sampah";
    if (role === "warmindo") return "Warmindo";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

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
      header: "Metode",
      render: (item) => getMetodeBadge(item.metodePembayaran),
    },
    {
      header: "Rekening / Ket.",
      render: (item) => (
        <div>
          {item.metodePembayaran !== "tunai" ? (
            <>
              <div className="font-bold text-neutral-800">
                {item.jenisBank ?? "-"}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {item.noRekening ?? "-"}
              </div>
            </>
          ) : (
            <span className="text-[10px] text-neutral-500 italic">
              Pencairan Tunai
            </span>
          )}
          {item.keterangan && (
            <div
              className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-30"
              title={item.keterangan}
            >
              {item.keterangan}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Nominal",
      render: (item) => (
        <div>
          <span className="font-extrabold text-neutral-800 text-sm block">
            Rp {item.jumlah.toLocaleString("id-ID")}
          </span>
          {item.biayaTambahan && item.biayaTambahan > 0 ? (
            <>
              <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                + Tambahan: Rp {item.biayaTambahan.toLocaleString("id-ID")}
              </div>
              {item.catatanBiayaTambahan && (
                <div
                  className="text-[9px] text-neutral-400 italic max-w-32 truncate"
                  title={item.catatanBiayaTambahan}
                >
                  ({item.catatanBiayaTambahan})
                </div>
              )}
            </>
          ) : null}
        </div>
      ),
    },
    {
      header: "Tanggal",
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
      header: "Aksi / Dokumen",
      render: (item) => (
        <div className="flex flex-col items-center gap-1.5">
          {/* Tombol aksi utama (semua role admin) */}
          <div className="flex flex-wrap justify-center items-center gap-1.5">
            {item.status === "pending" ? (
              <>
                <span
                  id={
                    item.id === 99901
                      ? "tour-admin-pencairan-action"
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleOpenBuktiPembayaran(item)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-xs border-0 cursor-pointer flex items-center gap-1"
                  >
                    <CreditCard className="w-3 h-3" />
                    Proses
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => setRejectRequest(item)}
                  className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                >
                  Tolak
                </button>
              </>
            ) : item.status === "berhasil" ? (
              <>
                {item.buktiTransfer && (
                  <button
                    type="button"
                    onClick={() => setViewProofUrl(item.buktiTransfer ?? null)}
                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    Bukti
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenBuktiPembayaran(item)}
                  className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer border-0"
                >
                  <FileText className="w-3 h-3" />
                  Cetak PDF
                </button>
              </>
            ) : (
              <span className="text-neutral-400 italic text-[11px]">
                Ditolak
              </span>
            )}
          </div>

          {/* Tombol Edit & Hapus — khusus superadmin */}
          {userRole === "superadmin" && item.id !== 99901 && (
            <div className="flex items-center gap-1 pt-1 border-t border-neutral-100 w-full justify-center">
              <button
                type="button"
                onClick={() => handleOpenEditModal(item)}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-2.5 h-2.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteRequest(item)}
                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-2.5 h-2.5" />
                Hapus
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

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
        { label: "Warmindo", value: "warmindo" },
        { label: "Bank Sampah", value: "bank-sampah" },
      ],
    },
    {
      id: "metode",
      label: "Metode",
      options: [
        { label: "Semua Metode", value: "" },
        { label: "Tunai", value: "tunai" },
        { label: "Transfer", value: "transfer" },
      ],
    },
  ];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(search.toLowerCase()) ||
      item.user.username.toLowerCase().includes(search.toLowerCase()) ||
      (item.jenisBank ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (item.noRekening ?? "").includes(search);

    const matchesStatus =
      !filterValues.status || item.status === filterValues.status;
    const matchesRole =
      !filterValues.role || item.user.role === filterValues.role;
    const matchesMetode =
      !filterValues.metode || item.metodePembayaran === filterValues.metode;

    return matchesSearch && matchesStatus && matchesRole && matchesMetode;
  });

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <TourGuide
        steps={pencairanSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      {/* Header Title */}
      <div id="tour-admin-pencairan-header">
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          Verifikasi Pencairan Dana
        </h1>
        <p className="text-xs text-neutral-500">
          Proses pencairan dana dari mitra Warmindo dan Bank Sampah. Bukti foto
          transfer wajib dilampirkan untuk metode transfer. Untuk tunai, cukup
          setujui dan buat dokumen bukti pembayaran.
        </p>
      </div>

      {/* Main Table */}
      <div
        id="tour-admin-pencairan-table"
        className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden p-6"
      >
        {loading ? (
          <div className="py-24 text-center bg-white rounded-2xl">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">
              Memuat data verifikasi pencairan...
            </p>
          </div>
        ) : (
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
        )}
      </div>

      {/* Verification Modal */}
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
                <span>Metode:</span>
                {getMetodeBadge(verifyRequest.metodePembayaran)}
              </div>
              {verifyRequest.metodePembayaran !== "tunai" && (
                <div className="flex justify-between">
                  <span>Tujuan Transfer:</span>
                  <span className="font-bold text-neutral-800">
                    {verifyRequest.jenisBank} — {verifyRequest.noRekening}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-200/60 pt-1.5 mt-1">
                <span>Jumlah Pencairan:</span>
                <span className="font-extrabold text-primary-600 text-sm">
                  Rp {verifyRequest.jumlah.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Conditional: cash = no photo required */}
            {verifyRequest.metodePembayaran === "tunai" ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Banknote className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-emerald-800 text-xs">
                  <span className="font-bold">Pencairan Tunai</span>
                  <p>
                    Tidak perlu upload bukti transfer. Setujui pencairan ini dan
                    buat dokumen Bukti Pembayaran sebagai arsip resmi.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                  Unggah Bukti Transfer (Wajib)
                </span>
                {isCompressing ? (
                  <div className="relative rounded-2xl border border-neutral-200 bg-neutral-50/50 h-50 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    <p className="text-xs font-semibold text-neutral-500">
                      Mengompresi gambar...
                    </p>
                  </div>
                ) : uploadedImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-50 flex items-center justify-center">
                    <Image
                      src={uploadedImage}
                      alt="Bukti Transfer"
                      width={400}
                      height={400}
                      className="max-h-50 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all border-0 cursor-pointer"
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
                          Maksimal ukuran file 5MB (akan dikompresi otomatis)
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
            )}

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
                disabled={
                  isPending ||
                  isCompressing ||
                  (verifyRequest.metodePembayaran !== "tunai" && !uploadedImage)
                }
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1 border-0 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {verifyRequest.metodePembayaran === "tunai"
                    ? "Setujui Pencairan"
                    : "Setujui & Kirim"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bukti Pembayaran Modal (create new) */}
      {buktiPembayaranItem && existingDocId === null && (
        <BuktiPembayaranModal
          item={buktiPembayaranItem}
          onClose={() => setBuktiPembayaranItem(null)}
          onSuccess={(docId) => {
            setBuktiPembayaranItem(null);
            showFeedback(
              "success",
              "Dokumen Dibuat",
              "Dokumen berhasil disimpan. Mengunduh PDF...",
            );
            // Trigger download
            setTimeout(() => {
              handleDownloadPdf(docId);
            }, 500);
            loadData();
          }}
        />
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
            <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-100 flex items-center justify-center">
              <Image
                src={viewProofUrl}
                alt="Bukti Transfer"
                className="max-h-100 object-contain w-full"
                width={400}
                height={400}
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

      {/* ── SUPERADMIN: Modal Edit Pencairan ─────────────────────────── */}
      {editRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden p-6 relative animate-in zoom-in-95 duration-200 space-y-5">
            <button
              type="button"
              onClick={() => setEditRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-150">
              <Pencil className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-neutral-800">
                Edit Data Pencairan
              </h3>
              <span className="ml-auto text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                SUPERADMIN
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {/* Jumlah */}
              <div>
                <label
                  htmlFor="edit-jumlah"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Jumlah (Rp)
                </label>
                <input
                  id="edit-jumlah"
                  type="number"
                  value={editForm.jumlah ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      jumlah: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label
                  htmlFor="edit-metode"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Metode Pembayaran
                </label>
                <select
                  id="edit-metode"
                  value={editForm.metodePembayaran ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      metodePembayaran: e.target.value as
                        | "transfer"
                        | "tunai"
                        | "qris",
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                >
                  <option value="transfer">Transfer</option>
                  <option value="tunai">Tunai</option>
                </select>
              </div>

              {/* Jenis Bank */}
              <div>
                <label
                  htmlFor="edit-jenis-bank"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Jenis Bank
                </label>
                <input
                  id="edit-jenis-bank"
                  type="text"
                  value={editForm.jenisBank ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, jenisBank: e.target.value }))
                  }
                  placeholder="Contoh: BCA, BNI, Mandiri"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>

              {/* No. Rekening */}
              <div>
                <label
                  htmlFor="edit-no-rekening"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  No. Rekening
                </label>
                <input
                  id="edit-no-rekening"
                  type="text"
                  value={editForm.noRekening ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, noRekening: e.target.value }))
                  }
                  placeholder="Nomor rekening tujuan"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="edit-status"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="edit-status"
                  value={editForm.status ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      status: e.target.value as
                        | "pending"
                        | "berhasil"
                        | "ditolak",
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                >
                  <option value="pending">Pending</option>
                  <option value="berhasil">Berhasil</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </div>

              {/* Keterangan */}
              <div>
                <label
                  htmlFor="edit-keterangan"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Keterangan
                </label>
                <textarea
                  id="edit-keterangan"
                  value={editForm.keterangan ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, keterangan: e.target.value }))
                  }
                  rows={2}
                  placeholder="Keterangan tambahan (opsional)"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditRequest(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer bg-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={isEditPending}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 border-0 cursor-pointer"
              >
                {isEditPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPERADMIN: Confirm Hapus Pencairan ──────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteRequest}
        onClose={() => setDeleteRequest(null)}
        onConfirm={handleDelete}
        message={`Apakah Anda yakin ingin menghapus data pencairan senilai Rp ${deleteRequest?.jumlah.toLocaleString("id-ID")} milik "${deleteRequest?.user.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`}
        isPending={isDeletePending}
      />
    </div>
  );
}

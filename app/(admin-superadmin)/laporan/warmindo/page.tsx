"use client";

import imageCompression from "browser-image-compression";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Layers,
  Loader2,
  Pencil,
  Printer,
  Scale,
  Trash2,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState, useTransition } from "react";
import { getAllActiveEkspedisi } from "@/app/(admin-superadmin)/ekspedisi/action";
import type { UpdateSetorPayload } from "@/app/(admin-superadmin)/laporan/warmindo/action";
import {
  deleteSetorSampah,
  getCurrentUserRole,
  getMySetoran,
  updateSetorSampah,
  updateSetorSampahStatus,
} from "@/app/(admin-superadmin)/laporan/warmindo/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import { DataTable } from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { SetorSampahItem } from "@/app/types";

const warmindoSteps = [
  {
    element: "#tour-admin-setoran-warmindo-header",
    popover: {
      title: "Setoran Warmindo",
      description:
        "Halaman ini menampilkan historis dan daftar setoran sampah dari seluruh mitra Warmindo. Admin memverifikasi setoran sebelum diserahkan ke ekspedisi.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-setoran-warmindo-summary",
    popover: {
      title: "Rangkuman Setoran Warmindo",
      description:
        "Kartu ini menampilkan total jumlah setoran dan total berat keseluruhan sampah dari Warmindo yang telah masuk ke sistem.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-setoran-warmindo-table",
    popover: {
      title: "Daftar Setoran Masuk",
      description:
        "Tabel ini mendaftarkan seluruh setoran Warmindo. Setoran berstatus 'Pending' dapat diverifikasi melalui tombol Validasi di kolom Aksi.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-admin-setoran-warmindo-action",
    popover: {
      title: "Aksi Validasi Setoran",
      description:
        "Klik 'Validasi' untuk membuka detail setoran Warmindo dan memutuskan tindakan selanjutnya (Verifikasi, Tolak, atau Serahkan ke Ekspedisi).",
      side: "left" as const,
    },
  },
];

export default function LaporanWarmindoPage() {
  const [data, setData] = useState<SetorSampahItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalBerat, setTotalBerat] = useState(0);
  const [_totalPoin, setTotalPoin] = useState(0);
  const [_totalKredit, setTotalKredit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isTourActive, setIsTourActive] = useState(false);

  const handleTourStart = () => {
    setIsTourActive(true);
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
  };

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filters state
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    jenisSampah: "",
    status: "",
  });

  // Modal detail state
  const [selectedItem, setSelectedItem] = useState<SetorSampahItem | null>(
    null,
  );
  const [userRole, setUserRole] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [ekspedisiList, setEkspedisiList] = useState<
    { id: number; namaVendor: string; noTelepon: string }[]
  >([]);
  const [selectedEkspedisiId, setSelectedEkspedisiId] = useState<string>("");
  const [_selectedEkspedisiMap, _setSelectedEkspedisiMap] = useState<
    Record<number, string>
  >({});
  const [selectedImageLightBox, setSelectedImageLightBox] = useState<
    string | null
  >(null);

  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear(),
  );

  // Superadmin: Edit & Delete
  const [deleteRequest, setDeleteRequest] = useState<SetorSampahItem | null>(
    null,
  );
  const [editRequest, setEditRequest] = useState<SetorSampahItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateSetorPayload>({});
  const [isTimbanganCleared, setIsTimbanganCleared] = useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();
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
  ) => setFeedback({ isOpen: true, type, title, message });

  const handleOpenEdit = (item: SetorSampahItem) => {
    setEditRequest(item);
    setIsTimbanganCleared(false);
    setEditForm({
      jenisSampah: item.jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      beratKg: item.beratKg,
      tanggalSetor: item.tanggalSetor,
      catatan: item.catatan,
      status: item.status as
        | "pending"
        | "diverifikasi"
        | "diserahkan"
        | "diterima"
        | "ditolak",
      fotoBuktiTambahanUrls: item.fotoBuktiTambahan || [],
      newFotoBuktiTambahanBase64: [],
    });
  };

  const handleRemoveFotoTimbangan = () => {
    setIsTimbanganCleared(true);
    setEditForm((f) => ({
      ...f,
      fotoTimbanganBase64: undefined,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm((f) => ({
          ...f,
          fotoTimbanganBase64: reader.result as string,
        }));
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Gagal mengompres gambar:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm((f) => ({
          ...f,
          fotoTimbanganBase64: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readFiles = async () => {
      const base64s: string[] = [
        ...(editForm.newFotoBuktiTambahanBase64 || []),
      ];
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      for (const file of Array.from(files)) {
        try {
          const compressed = await imageCompression(file, options);
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(compressed);
          });
          base64s.push(base64);
        } catch (err) {
          console.error("Gagal mengompres gambar tambahan:", err);
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          base64s.push(base64);
        }
      }
      setEditForm((f) => ({ ...f, newFotoBuktiTambahanBase64: base64s }));
    };
    readFiles();
  };

  const handleRemoveExistingBukti = (url: string) => {
    setEditForm((f) => ({
      ...f,
      fotoBuktiTambahanUrls: (f.fotoBuktiTambahanUrls || []).filter(
        (u) => u !== url,
      ),
    }));
  };

  const handleRemoveNewBukti = (idx: number) => {
    setEditForm((f) => ({
      ...f,
      newFotoBuktiTambahanBase64: (f.newFotoBuktiTambahanBase64 || []).filter(
        (_, i) => i !== idx,
      ),
    }));
  };

  const handleEdit = () => {
    if (!editRequest) return;
    const hasTimbangan =
      editForm.fotoTimbanganBase64 ||
      (!isTimbanganCleared && editRequest?.fotoTimbangan);
    if (!hasTimbangan) {
      showFeedback("error", "Validasi Gagal", "Foto timbangan wajib diunggah.");
      return;
    }
    const totalAdditional =
      (editForm.fotoBuktiTambahanUrls?.length || 0) +
      (editForm.newFotoBuktiTambahanBase64?.length || 0);
    if (totalAdditional < 1) {
      showFeedback(
        "error",
        "Validasi Gagal",
        "Foto bukti tambahan minimal harus 1 gambar.",
      );
      return;
    }
    if (totalAdditional > 3) {
      showFeedback(
        "error",
        "Validasi Gagal",
        "Foto bukti tambahan maksimal 3 gambar.",
      );
      return;
    }
    startEditTransition(async () => {
      const res = await updateSetorSampah(editRequest.id, editForm);
      setEditRequest(null);
      if (res.success) {
        showFeedback("success", "Berhasil Diperbarui", res.message);
        loadData();
      } else {
        showFeedback("error", "Gagal", res.message);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteRequest) return;
    startDeleteTransition(async () => {
      const res = await deleteSetorSampah(deleteRequest.id);
      setDeleteRequest(null);
      if (res.success) {
        showFeedback("success", "Berhasil Dihapus", res.message);
        loadData();
      } else {
        showFeedback("error", "Gagal", res.message);
      }
    });
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMySetoran({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        jenisSampah: filterValues.jenisSampah,
        status: filterValues.status,
        sortBy,
        sortOrder,
        roleTarget: "warmindo",
        selectedYear,
      });
      setData(res.data as SetorSampahItem[]);
      setTotalItems(res.total);
      setTotalBerat(res.totalBerat);
      setTotalPoin(res.totalPoin);
      setTotalKredit(res.totalKredit);
    } catch (err) {
      console.error("Gagal memuat data laporan warmindo:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchQuery,
    filterValues,
    sortBy,
    sortOrder,
    selectedYear,
  ]);

  const loadUserRole = useCallback(async () => {
    try {
      const role = await getCurrentUserRole();
      setUserRole(role);
    } catch (err) {
      console.error("Gagal mengambil role user:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadUserRole();
    getAllActiveEkspedisi().then((res) => {
      setEkspedisiList(res);
      if (res.length > 0) {
        setSelectedEkspedisiId(String(res[0].id));
      }
    });
  }, [loadData, loadUserRole]);

  const handleStatusUpdate = async (
    id: number,
    status: "pending" | "diverifikasi" | "diserahkan" | "diterima" | "ditolak",
    ekspedisiId?: number,
  ) => {
    // Tour mode: simulate action
    if (isTourActive && id === 99903) {
      setData((prev) =>
        prev.map((item) => (item.id === 99903 ? { ...item, status } : item)),
      );
      if (selectedItem?.id === 99903) setSelectedItem(null);
      document.dispatchEvent(new CustomEvent("close-tour-guide"));
      return;
    }

    setUpdatingId(id);
    try {
      const res = await updateSetorSampahStatus(
        id,
        status,
        ekspedisiId,
        "warmindo",
      );
      if (res.success) {
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem((prev) => {
            if (!prev) return null;
            const chosenEks =
              ekspedisiList.find((e) => e.id === ekspedisiId) || null;
            return {
              ...prev,
              status,
              ekspedisiId: ekspedisiId || prev.ekspedisiId,
              ekspedisi: chosenEks || prev.ekspedisi,
            };
          });
        }
        loadData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error("Gagal memperbarui status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const formatTanggal = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    if (status === "diterima") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Diterima
        </span>
      );
    }
    if (status === "diverifikasi") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          <Truck className="w-3.5 h-3.5" />
          Diverifikasi
        </span>
      );
    }
    if (status === "diserahkan") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Truck className="w-3.5 h-3.5" />
          Diserahkan
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3.5 h-3.5" />
        Ditolak
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      header: "Nomor Setor / Deskripsi",
      sortKey: "nomorSetor",
      render: (item: SetorSampahItem) => (
        <div className="max-w-xs">
          <div className="font-semibold text-neutral-900 truncate">
            {item.nomorSetor}
          </div>
          {item.catatan && (
            <div className="text-xs text-neutral-400 mt-0.5 truncate">
              Catatan: {item.catatan}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Nasabah",
      render: (item: SetorSampahItem) => (
        <span className="font-semibold text-neutral-700 whitespace-nowrap">
          {item.user ? item.user.name : "Saya"}
        </span>
      ),
    },
    {
      header: "Kategori Sampah",
      sortKey: "jenisSampah",
      render: (item: SetorSampahItem) => (
        <span className="font-semibold text-neutral-700">
          {item.jenisSampah}
        </span>
      ),
    },
    {
      header: "Berat",
      sortKey: "beratKg",
      render: (item: SetorSampahItem) => (
        <span className="font-semibold text-neutral-800">
          {item.beratKg} kg
        </span>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      render: (item: SetorSampahItem) => getStatusBadge(item.status),
    },
    {
      header: "Metode",
      render: (item: SetorSampahItem) =>
        item.metodeSetor === "langsung" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            🚶 Langsung
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
            <Truck className="w-3 h-3" /> Ekspedisi
          </span>
        ),
    },
    {
      header: "Aksi",
      render: (item: SetorSampahItem) => {
        const isPendingEkspedisi =
          item.status === "pending" && item.metodeSetor === "ekspedisi";

        if (userRole !== "admin" && userRole !== "superadmin") {
          return (
            <button
              type="button"
              onClick={() => setSelectedItem(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-primary-50 text-neutral-700 rounded-lg text-xs font-semibold border border-neutral-200 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Detail
            </button>
          );
        }

        if (!isPendingEkspedisi) {
          return (
            <button
              type="button"
              onClick={() => setSelectedItem(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-primary-50 text-neutral-700 rounded-lg text-xs font-semibold border border-neutral-200 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Detail
            </button>
          );
        }

        // If pending ekspedisi, show "Validasi" button
        return (
          <span
            id={
              item.id === data[0]?.id
                ? "tour-admin-setoran-warmindo-action"
                : undefined
            }
          >
            <button
              type="button"
              onClick={() => setSelectedItem(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-xs border-0 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Validasi
            </button>
          </span>
        );
      },
    },
  ];

  // Superadmin aksi tambahan (edit & hapus) dirender terpisah per-baris via wrapper
  const renderSuperadminActions = (item: SetorSampahItem) =>
    userRole === "superadmin" ? (
      <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-neutral-100 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => handleOpenEdit(item)}
          className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-200 cursor-pointer transition-all"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button
          type="button"
          onClick={() => setDeleteRequest(item)}
          className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold border border-red-200 cursor-pointer transition-all"
        >
          <Trash2 className="w-3 h-3" /> Hapus
        </button>
      </div>
    ) : null;

  // Wrap kolom Aksi agar superadmin lihat tombol tambahan
  const columnsWithSuperadmin = columns.map((col) =>
    col.header !== "Aksi"
      ? col
      : {
          ...col,
          render: (item: SetorSampahItem) => (
            <div>
              {col.render(item)}
              {renderSuperadminActions(item)}
            </div>
          ),
        },
  );

  const filters = [
    {
      id: "jenisSampah",
      label: "Semua Sampah",
      options: [
        { label: "Karton", value: "Karton" },
        { label: "Etiket", value: "Etiket" },
        { label: "Paper Cup", value: "Paper Cup" },
      ],
    },
    {
      id: "status",
      label: "Semua Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Diterima", value: "diterima" },
        { label: "Ditolak", value: "ditolak" },
      ],
    },
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterId]: value,
    }));
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <TourGuide
        pageKey="admin_setoran_warmindo"
        steps={warmindoSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      {/* Header */}
      <div
        id="tour-admin-setoran-warmindo-header"
        className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden mb-8 print:hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-md shrink-0">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Laporan Setoran Warmindo
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Historis dan verifikasi aktivitas setoran sampah kategori Warmindo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Year Selector Only */}
          <div className="flex items-center gap-3 bg-neutral-50 p-2 rounded-2xl border border-neutral-200 shrink-0 w-full md:w-auto">
            <div className="flex flex-col gap-0.5 min-w-20">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block pl-1">
                Tahun
              </span>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-750 shadow-2xs text-center w-full font-mono"
                min={2020}
                max={2100}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-sm transition-colors cursor-pointer shadow-2xs h-[52px]"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Rangkuman Kartu */}
      <div
        id="tour-admin-setoran-warmindo-summary"
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 print:grid-cols-2 print:gap-4"
      >
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Total Setoran
          </div>
          <div className="text-3xl font-extrabold text-neutral-900">
            <AnimatedCounter value={totalItems} />
            <span className="text-sm font-semibold text-neutral-400 ml-1">
              kali
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Total Berat Sampah
          </div>
          <div className="text-3xl font-extrabold text-primary-600">
            <AnimatedCounter value={totalBerat} decimals={2} />
            <span className="text-sm font-semibold text-primary-400 ml-1">
              kg
            </span>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div id="tour-admin-setoran-warmindo-table" className="print:hidden">
        {isLoading ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">
              Memuat data setoran warmindo...
            </p>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columnsWithSuperadmin}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            search={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Cari nomor setor atau nasabah..."
            filters={filters}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Print View */}
      <div className="hidden print:block">
        <table className="w-full text-left border-collapse border border-neutral-200">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              <th className="p-3 border">Nomor Setor</th>
              <th className="p-3 border">Nasabah</th>
              <th className="p-3 border">Jenis</th>
              <th className="p-3 border">Berat</th>
              <th className="p-3 border">Kredit</th>
              <th className="p-3 border">Tanggal</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="text-sm">
                <td className="p-3 border font-semibold">{item.nomorSetor}</td>
                <td className="p-3 border">
                  {item.user ? item.user.name : "Saya"}
                </td>
                <td className="p-3 border">{item.jenisSampah}</td>
                <td className="p-3 border">{item.beratKg} kg</td>
                <td className="p-3 border text-neutral-400">-</td>
                <td className="p-3 border">
                  {formatTanggal(item.tanggalSetor)}
                </td>
                <td className="p-3 border capitalize">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Detail Transaksi Setoran
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedItem.nomorSetor}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Side: Metadata & Catatan (5 cols) */}
                <div className="md:col-span-5 space-y-5">
                  <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200/60 space-y-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Informasi Setoran
                    </h4>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-200/50 text-neutral-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">
                          Nasabah
                        </span>
                        <span className="font-semibold text-neutral-800 text-sm leading-tight">
                          {selectedItem.user ? selectedItem.user.name : "Saya"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-200/50 text-neutral-600">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">
                          Tanggal Setor
                        </span>
                        <span className="font-semibold text-neutral-800 text-sm leading-tight">
                          {formatTanggal(selectedItem.tanggalSetor)}
                        </span>
                      </div>
                    </div>

                    {!(
                      selectedItem.metodeSetor === "ekspedisi" &&
                      selectedItem.status === "pending"
                    ) && (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-neutral-200/50 text-neutral-600">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs text-neutral-500 block">
                              Jenis Sampah
                            </span>
                            <span className="font-semibold text-neutral-800 text-sm leading-tight">
                              {selectedItem.jenisSampah}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-neutral-200/50 text-neutral-600">
                            <Scale className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs text-neutral-500 block">
                              Berat Sampah
                            </span>
                            <span className="font-extrabold text-neutral-900 text-base">
                              {selectedItem.beratKg} kg
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-200/50 text-neutral-600">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">
                          Metode Setor
                        </span>
                        <span className="font-semibold text-neutral-800 text-sm capitalize">
                          {selectedItem.metodeSetor || "Langsung"}
                        </span>
                      </div>
                    </div>

                    {selectedItem.metodeSetor === "ekspedisi" && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-neutral-200/50 text-neutral-600">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs text-neutral-500 block">
                            Ekspedisi Penjemput
                          </span>
                          <span className="font-semibold text-neutral-800 text-sm leading-tight">
                            {selectedItem.ekspedisi
                              ? `${selectedItem.ekspedisi.namaVendor} (${selectedItem.ekspedisi.noTelepon})`
                              : "Belum ditugaskan"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-200/50 text-neutral-600">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">
                          Status Verifikasi
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(selectedItem.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Catatan Card */}
                  <div className="bg-primary-50/40 rounded-2xl p-5 border border-primary-100/50 shadow-2xs">
                    <h4 className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <ClipboardList className="w-4 h-4" />
                      Catatan Tambahan
                    </h4>
                    <p className="text-neutral-700 text-sm leading-relaxed italic bg-white/60 p-3 rounded-xl border border-primary-50">
                      {selectedItem.catatan || "Tidak ada catatan tambahan."}
                    </p>
                  </div>
                </div>

                {/* Right Side: Foto-foto Bukti & Panel Aksi (7 cols) */}
                <div className="md:col-span-7 space-y-5">
                  {/* Foto Timbangan */}
                  {!(
                    selectedItem.metodeSetor === "ekspedisi" &&
                    selectedItem.status === "pending"
                  ) && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                        Foto Bukti Timbangan
                      </span>
                      {selectedItem.fotoTimbangan ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImageLightBox(selectedItem.fotoTimbangan)
                          }
                          className="relative aspect-video w-full rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-64 cursor-zoom-in block p-0 group shadow-xs hover:border-primary-400 hover:shadow-sm transition-all"
                          title="Klik zoom foto timbangan"
                        >
                          <Image
                            src={selectedItem.fotoTimbangan}
                            alt="Foto timbangan detail"
                            fill
                            className="object-contain group-hover:scale-102 transition-all duration-300"
                            unoptimized
                          />
                        </button>
                      ) : (
                        <div className="py-8 text-center bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl">
                          <span className="text-sm text-neutral-400">
                            Tidak ada foto bukti timbangan.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Foto Bukti Tambahan */}
                  {!(
                    selectedItem.metodeSetor === "ekspedisi" &&
                    selectedItem.status === "pending"
                  ) && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                        Foto Bukti Tambahan
                      </span>
                      {selectedItem.fotoBuktiTambahan &&
                      selectedItem.fotoBuktiTambahan.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {selectedItem.fotoBuktiTambahan.map((imgUrl, idx) => (
                            <button
                              key={imgUrl}
                              type="button"
                              onClick={() => setSelectedImageLightBox(imgUrl)}
                              className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 cursor-zoom-in p-0 block group shadow-2xs hover:border-primary-400 hover:shadow-xs transition-all"
                              title="Klik zoom foto bukti tambahan"
                            >
                              <Image
                                src={imgUrl}
                                alt={`Bukti Tambahan ${idx + 1}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-all duration-300"
                                unoptimized
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl">
                          <span className="text-sm text-neutral-400">
                            Tidak ada foto bukti tambahan.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ekspedisi Verification Actions for Admin */}
                  {(userRole === "admin" || userRole === "superadmin") &&
                    selectedItem.metodeSetor === "ekspedisi" && (
                      <div className="p-4 bg-primary-50/40 border border-primary-150 rounded-xl space-y-4 shadow-2xs">
                        <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 uppercase tracking-wider">
                          <Truck className="w-4 h-4 text-primary-600" />
                          Panel Kontrol Ekspedisi (Admin)
                        </h4>

                        {selectedItem.status === "pending" && (
                          <div className="space-y-3">
                            <p className="text-xs text-neutral-500">
                              Pilih vendor ekspedisi yang akan ditugaskan untuk
                              menjemput sampah di lokasi Warmindo:
                            </p>
                            <div className="flex flex-col gap-3">
                              <select
                                value={selectedEkspedisiId}
                                onChange={(e) =>
                                  setSelectedEkspedisiId(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-600"
                              >
                                {ekspedisiList.length === 0 ? (
                                  <option value="">
                                    Tidak ada vendor ekspedisi aktif
                                  </option>
                                ) : (
                                  ekspedisiList.map((e) => (
                                    <option key={e.id} value={e.id}>
                                      {e.namaVendor} ({e.noTelepon})
                                    </option>
                                  ))
                                )}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    updatingId === selectedItem.id ||
                                    !selectedEkspedisiId
                                  }
                                  onClick={async () => {
                                    await handleStatusUpdate(
                                      selectedItem.id,
                                      "diverifikasi",
                                      Number(selectedEkspedisiId),
                                    );
                                    setSelectedItem(null);
                                  }}
                                  className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs border-0 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                                >
                                  {updatingId === selectedItem.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Setujui &amp; Tugaskan
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingId === selectedItem.id}
                                  onClick={async () => {
                                    await handleStatusUpdate(
                                      selectedItem.id,
                                      "ditolak",
                                    );
                                    setSelectedItem(null);
                                  }}
                                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                                >
                                  Tolak
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedItem.status === "diverifikasi" && (
                          <div className="space-y-2 text-xs">
                            <p className="text-neutral-600 font-semibold">
                              Status: Menunggu mitra Warmindo menyerahkan sampah
                              ke kurir ({selectedItem.ekspedisi?.namaVendor}).
                            </p>
                            <button
                              type="button"
                              disabled={updatingId === selectedItem.id}
                              onClick={async () => {
                                await handleStatusUpdate(
                                  selectedItem.id,
                                  "ditolak",
                                );
                                setSelectedItem(null);
                              }}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl cursor-pointer transition-all"
                            >
                              Batalkan / Tolak
                            </button>
                          </div>
                        )}

                        {selectedItem.status === "diserahkan" && (
                          <div className="space-y-3">
                            <p className="text-xs text-neutral-600 font-semibold">
                              Status: Sampah sedang dalam perjalanan oleh kurir
                              ke Bank Sampah tujuan.
                            </p>
                            <p className="text-[11px] text-neutral-500 leading-relaxed bg-neutral-50 rounded-xl p-3 border border-neutral-150">
                              ℹ️ Validasi berat aktual, jenis sampah, dan
                              penerimaan fisik akan dilakukan secara langsung
                              oleh mitra Bank Sampah penerima.
                            </p>
                            <button
                              type="button"
                              disabled={updatingId === selectedItem.id}
                              onClick={async () => {
                                await handleStatusUpdate(
                                  selectedItem.id,
                                  "ditolak",
                                );
                                setSelectedItem(null);
                              }}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                            >
                              Batalkan / Tolak Setoran
                            </button>
                          </div>
                        )}

                        {(selectedItem.status === "diterima" ||
                          selectedItem.status === "ditolak") && (
                          <p className="text-xs text-neutral-500 font-semibold">
                            Proses selesai. Status akhir:{" "}
                            <span className="capitalize font-bold text-neutral-700">
                              {selectedItem.status}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  {/* Panel khusus "Datang Langsung" */}
                  {(userRole === "admin" || userRole === "superadmin") &&
                    selectedItem.metodeSetor === "langsung" &&
                    selectedItem.status === "pending" && (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-xl space-y-3 shadow-2xs">
                        <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Mitra Datang Langsung
                        </h4>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                          Mitra Warmindo ini memilih untuk datang langsung ke
                          Bank Sampah.{" "}
                          <strong>Tidak perlu verifikasi ekspedisi.</strong>
                        </p>
                        <p className="text-[11px] text-neutral-500 leading-relaxed bg-white rounded-xl p-3 border border-neutral-150">
                          ℹ️ Validasi berat aktual, jenis sampah, dan penerimaan
                          fisik akan dilakukan secara langsung oleh mitra Bank
                          Sampah penerima ketika mitra tiba di lokasi.
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL OVERLAY */}
      {selectedImageLightBox && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-black/80 backdrop-blur-sm cursor-zoom-out border-0"
            onClick={() => setSelectedImageLightBox(null)}
            aria-label="Tutup gambar"
          />
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center z-10 pointer-events-none">
            <div className="relative w-full h-[80vh] pointer-events-auto">
              <button
                type="button"
                onClick={() => setSelectedImageLightBox(null)}
                className="absolute -top-12 right-0 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <Image
                src={selectedImageLightBox}
                alt="Bukti foto diperbesar"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
      {/* SUPERADMIN: Modal Edit Setoran */}
      {editRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-100 p-6 relative animate-in zoom-in-95 duration-200 space-y-4">
            <button
              type="button"
              onClick={() => setEditRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
              <Pencil className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-neutral-800">
                Edit Setoran
              </h3>
              <span className="ml-auto text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                SUPERADMIN
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label
                  htmlFor="edit-setor-jenis-w"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Jenis Sampah
                </label>
                <select
                  id="edit-setor-jenis-w"
                  value={editForm.jenisSampah ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      jenisSampah: e.target.value as
                        | "Karton"
                        | "Etiket"
                        | "Paper Cup",
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                >
                  <option value="Karton">Karton</option>
                  <option value="Etiket">Etiket</option>
                  <option value="Paper Cup">Paper Cup</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-setor-berat-w"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Berat (kg)
                </label>
                <input
                  id="edit-setor-berat-w"
                  type="number"
                  step="0.01"
                  value={editForm.beratKg ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      beratKg: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-setor-tanggal-w"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Tanggal Setor
                </label>
                <input
                  id="edit-setor-tanggal-w"
                  type="date"
                  value={editForm.tanggalSetor ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, tanggalSetor: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-setor-status-w"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="edit-setor-status-w"
                  value={editForm.status ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      status: e.target.value as
                        | "pending"
                        | "diverifikasi"
                        | "diserahkan"
                        | "diterima"
                        | "ditolak",
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                >
                  <option value="pending">Pending</option>
                  <option value="diverifikasi">Diverifikasi</option>
                  <option value="diserahkan">Diserahkan</option>
                  <option value="diterima">Diterima</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-setor-foto-w"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Foto Timbangan
                </label>
                <div className="space-y-2">
                  {editForm.fotoTimbanganBase64 ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-48 shadow-xs group">
                      <Image
                        src={editForm.fotoTimbanganBase64}
                        alt="Preview baru"
                        fill
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFotoTimbangan}
                        className="absolute top-1.5 right-1.5 bg-red-650/90 text-white hover:bg-red-750 rounded-full p-1 shadow-sm border-0 cursor-pointer"
                        aria-label="Hapus foto timbangan baru"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : !isTimbanganCleared && editRequest?.fotoTimbangan ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-48 shadow-xs group">
                      <Image
                        src={editRequest.fotoTimbangan}
                        alt="Preview sekarang"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFotoTimbangan}
                        className="absolute top-1.5 right-1.5 bg-red-650/90 text-white hover:bg-red-750 rounded-full p-1 shadow-sm border-0 cursor-pointer"
                        aria-label="Hapus foto timbangan sekarang"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <input
                      id="edit-setor-foto-w"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                    />
                  )}
                </div>
              </div>
              {/* Foto Bukti Tambahan */}
              <div>
                <label
                  htmlFor="edit-setor-foto-tambahan-w"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Foto Tambahan
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {/* Foto Tambahan Lama (Existing) */}
                  {(editForm.fotoBuktiTambahanUrls || []).map((url) => (
                    <div
                      key={url}
                      className="relative aspect-video w-full rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-24 shadow-xs group"
                    >
                      <Image
                        src={url}
                        alt="Bukti tambahan"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingBukti(url)}
                        className="absolute top-1 right-1 bg-red-650/90 text-white hover:bg-red-750 rounded-full p-1 shadow-sm border-0 cursor-pointer"
                        aria-label="Hapus foto tambahan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Foto Tambahan Baru (Base64) */}
                  {(editForm.newFotoBuktiTambahanBase64 || []).map(
                    (base64, idx) => (
                      <div
                        key={`new-${base64.substring(0, 30)}-${idx}`}
                        className="relative aspect-video w-full rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-24 shadow-xs group"
                      >
                        <Image
                          src={base64}
                          alt="Bukti tambahan baru"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewBukti(idx)}
                          className="absolute top-1 right-1 bg-red-650/90 text-white hover:bg-red-750 rounded-full p-1 shadow-sm border-0 cursor-pointer"
                          aria-label="Batalkan foto tambahan baru"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ),
                  )}
                </div>
                {(editForm.fotoBuktiTambahanUrls || []).length +
                  (editForm.newFotoBuktiTambahanBase64 || []).length <
                  3 && (
                  <input
                    id="edit-setor-foto-tambahan-w"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleAdditionalFilesChange}
                    className="block w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-setor-catatan-w"
                  className="block text-xs font-bold text-neutral-700 mb-1"
                >
                  Catatan
                </label>
                <textarea
                  id="edit-setor-catatan-w"
                  value={editForm.catatan ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, catatan: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 resize-none"
                />
              </div>
            </div>
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
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border-0 cursor-pointer"
              >
                {isEditPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPERADMIN: ConfirmModal Hapus */}
      <ConfirmModal
        isOpen={!!deleteRequest}
        onClose={() => setDeleteRequest(null)}
        onConfirm={handleDelete}
        message={`Hapus setoran "${deleteRequest?.nomorSetor}" milik "${deleteRequest?.user?.name ?? "nasabah"}" secara permanen? Tindakan ini tidak dapat dibatalkan.`}
        isPending={isDeletePending}
        variant="danger"
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((p) => ({ ...p, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}

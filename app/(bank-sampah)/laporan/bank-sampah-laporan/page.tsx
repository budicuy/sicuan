"use client";

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
  Printer,
  Scale,
  User,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCurrentUserRole,
  getMySetoran,
  updateSetorSampahStatus,
} from "@/app/(bank-sampah)/laporan/bank-sampah-laporan/action";
import { DataTable } from "@/app/components/shared/DataTable";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { SetorSampahItem } from "@/app/types";

const laporanSteps = [
  {
    element: "#tour-bank-sampah-laporan-summary",
    popover: {
      title: "Rangkuman Kartu",
      description:
        "Menampilkan total kali setoran yang dilakukan beserta total akumulasi berat sampah (Kg) yang Anda kontribusikan.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-sampah-laporan-table",
    popover: {
      title: "Tabel Data Laporan Setoran",
      description:
        "Di sini Anda dapat melihat rincian detail seluruh riwayat setoran, memfilter berdasarkan jenis/status, serta memantau status pengiriman kurir ekspedisi.",
      side: "top" as const,
    },
  },
];

export default function LaporanBankSampahPage() {
  const [data, setData] = useState<SetorSampahItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalBerat, setTotalBerat] = useState(0);
  const [_totalPoin, setTotalPoin] = useState(0);
  const [_totalKredit, setTotalKredit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [_isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<{
    data: SetorSampahItem[];
    totalItems: number;
    totalBerat: number;
  } | null>(null);

  const handleTourStart = () => {
    savedStateRef.current = {
      data,
      totalItems,
      totalBerat,
    };
    setIsTourActive(true);
    setData([
      {
        id: 1,
        nomorSetor: "SIMULASI-B01",
        jenisSampah: "Karton",
        beratKg: 15.0,
        totalPoin: 300,
        tanggalSetor: new Date().toISOString().split("T")[0],
        status: "pending",
        createdAt: new Date(),
        fotoTimbangan: "/sampel_1.png",
        metodeSetor: "ekspedisi",
        catatan: "Setoran Karton Demo",
        totalKredit: 0,
      },
      {
        id: 2,
        nomorSetor: "SIMULASI-B02",
        jenisSampah: "Etiket",
        beratKg: 10.0,
        totalPoin: 200,
        tanggalSetor: new Date().toISOString().split("T")[0],
        status: "diterima",
        createdAt: new Date(),
        fotoTimbangan: "/sampel_1.png",
        metodeSetor: "ekspedisi",
        catatan: "Setoran Etiket Demo",
        totalKredit: 0,
      },
    ]);
    setTotalItems(2);
    setTotalBerat(25.0);
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    if (savedStateRef.current) {
      setData(savedStateRef.current.data);
      setTotalItems(savedStateRef.current.totalItems);
      setTotalBerat(savedStateRef.current.totalBerat);
    }
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
  const [selectedImageLightBox, setSelectedImageLightBox] = useState<
    string | null
  >(null);

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
        roleTarget: "bank-sampah",
      });
      setData(res.data as SetorSampahItem[]);
      setTotalItems(res.total);
      setTotalBerat(res.totalBerat);
      setTotalPoin(res.totalPoin);
      setTotalKredit(res.totalKredit);
    } catch (err) {
      console.error("Gagal memuat data laporan bank sampah:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, filterValues, sortBy, sortOrder]);

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
  }, [loadData, loadUserRole]);

  const handleStatusUpdate = async (
    id: number,
    status: "pending" | "diterima" | "ditolak",
  ) => {
    setUpdatingId(id);
    try {
      const res = await updateSetorSampahStatus(
        id,
        status,
        undefined,
        "bank-sampah",
      );
      if (res.success) {
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status,
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
      header: "Aksi",
      render: (item: SetorSampahItem) => {
        const isPending = item.status === "pending";
        const isCompleted =
          item.status === "diterima" || item.status === "ditolak";

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

        if (isCompleted) {
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

        if (isPending) {
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={updatingId === item.id}
                onClick={() => handleStatusUpdate(item.id, "diterima")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs border-0 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1"
              >
                {updatingId === item.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Terima
              </button>
              <button
                type="button"
                disabled={updatingId === item.id}
                onClick={() => handleStatusUpdate(item.id, "ditolak")}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg border-0 cursor-pointer disabled:opacity-50 transition-all"
              >
                Tolak
              </button>
            </div>
          );
        }

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
      },
    },
  ];

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
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-100">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Laporan Setoran Bank Sampah
            </h1>
            <p className="text-sm text-neutral-500">
              Historis dan verifikasi aktivitas setoran sampah kategori Bank
              Sampah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      <TourGuide
        steps={laporanSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      {/* Rangkuman Kartu */}
      <div
        id="tour-bank-sampah-laporan-summary"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 max-w-3xl gap-6 mb-8 print:grid-cols-2 print:gap-4"
      >
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Total Setoran
          </div>
          <div className="text-3xl font-extrabold text-neutral-900">
            {totalItems}
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
            {totalBerat.toFixed(2)}
            <span className="text-sm font-semibold text-primary-400 ml-1">
              kg
            </span>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div id="tour-bank-sampah-laporan-table" className="print:hidden">
        {isLoading ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">
              Memuat data setoran bank sampah...
            </p>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
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

                {/* Right Side: Foto-foto Bukti (7 cols) */}
                <div className="md:col-span-7 space-y-5">
                  {/* Foto Timbangan */}
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

                  {/* Foto Bukti Tambahan */}
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
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
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
    </div>
  );
}

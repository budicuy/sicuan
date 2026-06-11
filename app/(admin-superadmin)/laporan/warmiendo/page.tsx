"use client";

import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  Printer,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { getAllActiveEkspedisi } from "@/app/(admin-superadmin)/ekspedisi/action";
import {
  getCurrentUserRole,
  getMySetoran,
  updateSetorSampahStatus,
} from "@/app/(admin-superadmin)/laporan/warmiendo/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import { DataTable } from "@/app/components/shared/DataTable";

interface SetorSampahItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  totalPoin: number;
  totalKredit?: number;
  tanggalSetor: string;
  status: string;
  createdAt: Date;
  fotoTimbangan: string;
  fotoBuktiTambahan?: string[] | null;
  catatan: string | null;
  metodeSetor?: string;
  ekspedisiId?: number | null;
  ekspedisi?: { id: number; namaVendor: string; noTelepon: string } | null;
  user?: {
    name: string;
    username: string;
    role: string;
  } | null;
}

export default function LaporanWarmiendoPage() {
  const [data, setData] = useState<SetorSampahItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalBerat, setTotalBerat] = useState(0);
  const [_totalPoin, setTotalPoin] = useState(0);
  const [totalKredit, setTotalKredit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
  const [selectedEkspedisiMap, setSelectedEkspedisiMap] = useState<
    Record<number, string>
  >({});
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
        roleTarget: "warmiendo",
      });
      setData(res.data as SetorSampahItem[]);
      setTotalItems(res.total);
      setTotalBerat(res.totalBerat);
      setTotalPoin(res.totalPoin);
      setTotalKredit(res.totalKredit);
    } catch (err) {
      console.error("Gagal memuat data laporan warmiendo:", err);
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
    setUpdatingId(id);
    try {
      const res = await updateSetorSampahStatus(
        id,
        status,
        ekspedisiId,
        "warmiendo",
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
      header: "Berat",
      sortKey: "beratKg",
      render: (item: SetorSampahItem) => (
        <span className="font-semibold text-neutral-800">
          {item.beratKg} kg
        </span>
      ),
    },
    {
      header: "Reward",
      render: (item: SetorSampahItem) => (
        <span className="font-bold text-primary-600">
          +Rp {(item.totalKredit ?? 0).toLocaleString("id-ID")}
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
        const isEkspedisi = item.metodeSetor === "ekspedisi";
        const isPending = item.status === "pending";
        const isDiverifikasi = item.status === "diverifikasi";
        const isDiserahkan = item.status === "diserahkan";
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

        if (isEkspedisi) {
          if (isPending) {
            const currentCourierId =
              selectedEkspedisiMap[item.id] ||
              (ekspedisiList[0] ? String(ekspedisiList[0].id) : "");
            return (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={currentCourierId}
                  onChange={(e) =>
                    setSelectedEkspedisiMap({
                      ...selectedEkspedisiMap,
                      [item.id]: e.target.value,
                    })
                  }
                  className="px-2 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-600 text-neutral-800 cursor-pointer min-w-30"
                >
                  {ekspedisiList.length === 0 ? (
                    <option value="">Tidak ada kurir</option>
                  ) : (
                    ekspedisiList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.namaVendor}
                      </option>
                    ))
                  )}
                </select>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={updatingId === item.id || !currentCourierId}
                    onClick={() =>
                      handleStatusUpdate(
                        item.id,
                        "diverifikasi",
                        Number(currentCourierId),
                      )
                    }
                    className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-lg shadow-xs border-0 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
                  >
                    {updatingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Tugaskan
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
              </div>
            );
          }

          if (isDiverifikasi) {
            return (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-neutral-500 whitespace-nowrap bg-neutral-100 px-2 py-1 rounded">
                  Menunggu penyerahan...
                </span>
                <button
                  type="button"
                  disabled={updatingId === item.id}
                  onClick={() => handleStatusUpdate(item.id, "ditolak")}
                  className="px-2.5 py-1.5 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-lg border-0 cursor-pointer disabled:opacity-50 transition-all"
                >
                  Tolak
                </button>
              </div>
            );
          }

          if (isDiserahkan) {
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
                  Terima Sampah &amp; Cairkan
                </button>
                <button
                  type="button"
                  disabled={updatingId === item.id}
                  onClick={() => handleStatusUpdate(item.id, "ditolak")}
                  className="px-2.5 py-1.5 bg-red-655 hover:bg-red-700 text-white font-bold text-xs rounded-lg border-0 cursor-pointer disabled:opacity-50 transition-all"
                >
                  Tolak
                </button>
              </div>
            );
          }
        }

        // Direct/langsung
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
              Laporan Setoran Warmiendo
            </h1>
            <p className="text-sm text-neutral-500">
              Historis dan verifikasi aktivitas setoran sampah kategori
              Warmiendo
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

      {/* Rangkuman Kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4">
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

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Total Kredit Diperoleh
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            Rp <AnimatedCounter value={totalKredit} />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div className="print:hidden">
        {isLoading ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">
              Memuat data setoran warmiendo...
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
                <td className="p-3 border text-primary-600">
                  Rp {(item.totalKredit ?? 0).toLocaleString("id-ID")}
                </td>
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
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
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
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500 block text-xs">
                    Nasabah
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {selectedItem.user ? selectedItem.user.name : "Saya"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs">
                    Tanggal Setor
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {formatTanggal(selectedItem.tanggalSetor)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs">
                    Jenis Sampah
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {selectedItem.jenisSampah}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs">
                    Status Verifikasi
                  </span>
                  <div className="mt-1">
                    {(userRole === "admin" || userRole === "superadmin") &&
                    selectedItem.metodeSetor !== "ekspedisi" ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedItem.status}
                          disabled={updatingId === selectedItem.id}
                          onChange={(e) =>
                            handleStatusUpdate(
                              selectedItem.id,
                              e.target.value as
                                | "pending"
                                | "diverifikasi"
                                | "diserahkan"
                                | "diterima"
                                | "ditolak",
                            )
                          }
                          className="px-2.5 py-1 border border-neutral-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:border-primary-600 text-neutral-800 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="diterima">Diterima</option>
                          <option value="ditolak">Ditolak</option>
                        </select>
                        {updatingId === selectedItem.id && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" />
                        )}
                      </div>
                    ) : (
                      getStatusBadge(selectedItem.status)
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs">
                    Berat Timbangan
                  </span>
                  <span className="font-bold text-neutral-800 text-lg">
                    {selectedItem.beratKg} kg
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs">
                    Reward diperoleh
                  </span>
                  <span className="font-bold text-neutral-800 text-lg">
                    +Rp{" "}
                    {(selectedItem.totalKredit ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs">
                    Metode Setor
                  </span>
                  <span className="font-semibold text-neutral-800 capitalize">
                    {selectedItem.metodeSetor || "Langsung"}
                  </span>
                </div>
                {selectedItem.metodeSetor === "ekspedisi" && (
                  <div>
                    <span className="text-neutral-500 block text-xs">
                      Ekspedisi Penjemput
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {selectedItem.ekspedisi
                        ? `${selectedItem.ekspedisi.namaVendor} (${selectedItem.ekspedisi.noTelepon})`
                        : "Belum ditugaskan"}
                    </span>
                  </div>
                )}
              </div>

              {/* Catatan */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold block mb-1">
                  Catatan Tambahan
                </span>
                <p className="text-sm text-neutral-700 italic">
                  {selectedItem.catatan || "Tidak ada catatan tambahan."}
                </p>
              </div>

              {/* Foto Timbangan */}
              <div className="space-y-2">
                <span className="text-xs text-neutral-500 font-semibold block">
                  Foto Bukti Timbangan
                </span>
                {selectedItem.fotoTimbangan ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageLightBox(selectedItem.fotoTimbangan)
                    }
                    className="relative aspect-video w-full rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-64 cursor-zoom-in block p-0 group"
                    title="Klik zoom foto timbangan"
                  >
                    <Image
                      src={selectedItem.fotoTimbangan}
                      alt="Foto timbangan detail"
                      fill
                      className="object-contain group-hover:scale-102 transition-all"
                      unoptimized
                    />
                  </button>
                ) : (
                  <span className="text-sm text-neutral-400">
                    Tidak ada foto bukti timbangan.
                  </span>
                )}
              </div>

              {/* Foto Bukti Tambahan */}
              <div className="space-y-2">
                <span className="text-xs text-neutral-500 font-semibold block">
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
                        className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 cursor-zoom-in p-0 block group w-full"
                        title="Klik zoom foto bukti tambahan"
                      >
                        <Image
                          src={imgUrl}
                          alt={`Bukti Tambahan ${idx + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-all"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-neutral-400">
                    Tidak ada foto bukti tambahan.
                  </span>
                )}
              </div>

              {/* Ekspedisi Verification Actions for Admin */}
              {(userRole === "admin" || userRole === "superadmin") &&
                selectedItem.metodeSetor === "ekspedisi" && (
                  <div className="p-4 bg-primary-50/40 border border-primary-150 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <Truck className="w-4 h-4 text-primary-600" />
                      Panel Kontrol Ekspedisi (Admin)
                    </h4>

                    {selectedItem.status === "pending" && (
                      <div className="space-y-3">
                        <p className="text-xs text-neutral-500">
                          Pilih vendor ekspedisi yang akan ditugaskan untuk
                          menjemput sampah di lokasi Warmiendo:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            value={selectedEkspedisiId}
                            onChange={(e) =>
                              setSelectedEkspedisiId(e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-600"
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
                              onClick={() =>
                                handleStatusUpdate(
                                  selectedItem.id,
                                  "diverifikasi",
                                  Number(selectedEkspedisiId),
                                )
                              }
                              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs border-0 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1"
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
                              onClick={() =>
                                handleStatusUpdate(selectedItem.id, "ditolak")
                              }
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs border-0 cursor-pointer disabled:opacity-50 transition-all"
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
                          Status: Menunggu mitra Warmiendo menyerahkan sampah ke
                          kurir ({selectedItem.ekspedisi?.namaVendor}).
                        </p>
                        <button
                          type="button"
                          disabled={updatingId === selectedItem.id}
                          onClick={() =>
                            handleStatusUpdate(selectedItem.id, "ditolak")
                          }
                          className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-0 cursor-pointer transition-all"
                        >
                          Batalkan / Tolak
                        </button>
                      </div>
                    )}

                    {selectedItem.status === "diserahkan" && (
                      <div className="space-y-3">
                        <p className="text-xs text-neutral-600 font-semibold">
                          Status: Kurir telah mengambil sampah. Konfirmasi jika
                          sampah sudah Anda terima dengan benar di pusat:
                        </p>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            disabled={updatingId === selectedItem.id}
                            onClick={() =>
                              handleStatusUpdate(selectedItem.id, "diterima")
                            }
                            className="px-4 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs border-0 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1"
                          >
                            {updatingId === selectedItem.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Konfirmasi Sampah Diterima &amp; Cairkan Saldo
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === selectedItem.id}
                            onClick={() =>
                              handleStatusUpdate(selectedItem.id, "ditolak")
                            }
                            className="px-4 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-0 cursor-pointer disabled:opacity-50 transition-all"
                          >
                            Tolak / Gagal
                          </button>
                        </div>
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

"use client";

import {
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Loader2,
  Printer,
  Recycle,
  Search,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { getMySetoran } from "../setor-sampah/action";

interface SetorSampahItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  totalPoin: number;
  tanggalSetor: string;
  status: string;
  createdAt: Date;
  fotoTimbangan: string;
  catatan: string | null;
}

export default function LaporanPage() {
  const [data, setData] = useState<SetorSampahItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMySetoran({ page: 1, limit: 100 });
      setData(res.data as SetorSampahItem[]);
    } catch (err) {
      console.error("Gagal memuat data laporan:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter & Search Logic
  const filteredData = data.filter((item) => {
    const matchesJenis =
      filterJenis === "Semua" ||
      item.jenisSampah.toLowerCase() === filterJenis.toLowerCase();
    const matchesStatus =
      filterStatus === "Semua" ||
      item.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      item.nomorSetor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.catatan?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesJenis && matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totalBerat = filteredData.reduce((sum, item) => sum + item.beratKg, 0);
  const totalPoin = filteredData.reduce((sum, item) => sum + item.totalPoin, 0);

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
              Laporan Aktivitas Setoran
            </h1>
            <p className="text-sm text-neutral-500">
              Daftar historis dan rangkuman aktivitas setoran sampah Anda
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Total Setoran
          </div>
          <div className="text-3xl font-extrabold text-neutral-900">
            {filteredData.length}
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

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Total Poin Diperoleh
          </div>
          <div className="text-3xl font-extrabold text-amber-500">
            +{totalPoin}
            <span className="text-sm font-semibold text-amber-400 ml-1">
              poin
            </span>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 mb-6 print:hidden">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nomor setoran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary-600 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Filter className="w-4 h-4" />
              <span>Filter:</span>
            </div>

            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-600"
            >
              <option value="Semua">Semua Sampah</option>
              <option value="Karton">Karton</option>
              <option value="Etiket">Etiket</option>
              <option value="Paper Cup">Paper Cup</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-600"
            >
              <option value="Semua">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="diterima">Diterima</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Memuat data laporan...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-24 text-center">
            <Recycle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm font-medium">
              Tidak ada data setoran yang cocok dengan filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Nomor Setor / Deskripsi</th>
                  <th className="px-6 py-4">Foto Timbangan</th>
                  <th className="px-6 py-4">Jenis</th>
                  <th className="px-6 py-4">Berat</th>
                  <th className="px-6 py-4">Poin</th>
                  <th className="px-6 py-4">Tanggal Setor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/30 transition-colors text-sm"
                  >
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-neutral-900 truncate">
                        {item.nomorSetor}
                      </div>
                      {item.catatan && (
                        <div className="text-xs text-neutral-400 mt-0.5 truncate">
                          Catatan: {item.catatan}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.fotoTimbangan ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
                          <Image
                            src={item.fotoTimbangan}
                            alt="Bukti timbangan"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-700">
                      {item.jenisSampah}
                    </td>
                    <td className="px-6 py-4 font-semibold text-neutral-800">
                      {item.beratKg} kg
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-600">
                      +{item.totalPoin}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                      {formatTanggal(item.tanggalSetor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

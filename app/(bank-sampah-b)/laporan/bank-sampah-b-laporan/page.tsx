"use client";

import { Eye, FileText, Scale, Sparkles, Truck, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { getMySetoranB } from "@/app/(bank-sampah-b)/setor-sampah/bank-sampah-b-setor/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { SetorSampahItem } from "@/app/types";

const tourSteps = [
  {
    element: "#tour-bank-b-lap-header",
    popover: {
      title: "Laporan Penjemputan Sampah",
      description:
        "Halaman ini mencatat seluruh histori penjemputan limbah kemasan Indofood oleh Bank Sampah Tipe B.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-lap-summary",
    popover: {
      title: "Ringkasan Total",
      description:
        "Melihat akumulasi total transaksi, total berat sampah (kg), dan akumulasi reward poin yang berhasil dikumpulkan.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-lap-table",
    popover: {
      title: "Tabel Data Penjemputan",
      description:
        "Daftar detail setoran sampah. Anda dapat memfilter berdasarkan jenis sampah maupun sumber sampah.",
      side: "top" as const,
    },
  },
];

export default function BankSampahBLaporanPage() {
  const [data, setData] = useState<SetorSampahItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalBerat, setTotalBerat] = useState(0);
  const [totalPoin, setTotalPoin] = useState(0);
  const [_isLoading, setIsLoading] = useState(true);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    jenisSampah: "",
    sumberSampah: "",
  });

  // Modal Detail
  const [selectedItem, setSelectedItem] = useState<SetorSampahItem | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMySetoranB({
        page: currentPage,
        limit: pageSize,
        search,
        jenisSampah: filterValues.jenisSampah,
        sumberSampah: filterValues.sumberSampah,
      });
      setData(res.data);
      setTotalItems(res.total);
      setTotalBerat(res.totalBerat);
      setTotalPoin(res.totalPoin);
    } catch (error) {
      console.error("Gagal memuat laporan penjemputan:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, filterValues]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<SetorSampahItem>[] = [
    {
      header: "No. Setor",
      sortKey: "nomorSetor",
      render: (item) => (
        <span className="font-mono font-bold text-neutral-900 text-xs">
          {item.nomorSetor}
        </span>
      ),
    },
    {
      header: "Tanggal",
      sortKey: "tanggalSetor",
      render: (item) => (
        <span className="text-neutral-600 text-xs">{item.tanggalSetor}</span>
      ),
    },
    {
      header: "Sumber Sampah",
      render: (item) => (
        <span className="font-bold text-neutral-800 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full text-[10px] tracking-wide">
          {item.sumberSampah || "-"}
        </span>
      ),
    },
    {
      header: "Jenis Sampah",
      sortKey: "jenisSampah",
      render: (item) => (
        <span className="font-bold text-neutral-800 text-xs">
          {item.jenisSampah}
        </span>
      ),
    },
    {
      header: "Berat (kg)",
      sortKey: "beratKg",
      render: (item) => (
        <span className="font-black text-neutral-900 text-xs">
          {item.beratKg} kg
        </span>
      ),
    },
    {
      header: "Poin Reward",
      render: (item) => (
        <span className="font-black text-emerald-600 text-xs">
          +{item.totalPoin} Poin
        </span>
      ),
    },
    {
      header: "Dokumentasi",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          {item.fotoTimbangan && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Timbangan
            </span>
          )}
          {item.fotoBuktiTambahan && item.fotoBuktiTambahan.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              +{item.fotoBuktiTambahan.length} Foto
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Aksi",
      render: (item) => (
        <button
          type="button"
          onClick={() => setSelectedItem(item)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Detail</span>
        </button>
      ),
    },
  ];

  const filters: TableFilter<SetorSampahItem>[] = [
    {
      id: "sumberSampah",
      label: "Sumber Sampah",
      options: [
        { label: "Warmindo", value: "Warmindo" },
        { label: "Karyawan", value: "Karyawan" },
        { label: "Factory Visit", value: "Factory Visit" },
        { label: "Masyarakat", value: "Masyarakat" },
      ],
      filterFn: (item, val) => item.sumberSampah === val,
    },
    {
      id: "jenisSampah",
      label: "Jenis Sampah",
      options: [
        { label: "Karton", value: "Karton" },
        { label: "Etiket", value: "Etiket" },
        { label: "Paper Cup", value: "Paper Cup" },
      ],
      filterFn: (item, val) => item.jenisSampah === val,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <TourGuide steps={tourSteps} />

      {/* Header */}
      <div
        id="tour-bank-b-lap-header"
        className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Laporan Penjemputan Sampah
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Histori dan rekam jejak operasional penjemputan Bank Sampah Tipe B
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        id="tour-bank-b-lap-summary"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Total Setoran
            </span>
            <div className="text-2xl font-black text-neutral-900 mt-1">
              <AnimatedCounter value={totalItems} />
              <span className="text-xs font-semibold text-neutral-500 ml-1.5">
                transaksi
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Total Berat Terkumpul
            </span>
            <div className="text-2xl font-black text-neutral-900 mt-1">
              <AnimatedCounter value={Math.round(totalBerat * 100) / 100} />
              <span className="text-xs font-semibold text-neutral-500 ml-1.5">
                kg
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Total Reward Diperoleh
            </span>
            <div className="text-2xl font-black text-neutral-900 mt-1">
              <AnimatedCounter value={totalPoin} />
              <span className="text-xs font-semibold text-amber-600 ml-1.5 font-bold">
                POIN
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div id="tour-bank-b-lap-table">
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
          searchPlaceholder="Cari nomor setor atau catatan penjemputan..."
          filters={filters}
          filterValues={filterValues}
          onFilterChange={(id, val) => {
            setFilterValues((prev) => ({ ...prev, [id]: val }));
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Modal Detail Penjemputan */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    Detail Penjemputan Sampah
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    {selectedItem.nomorSetor}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Sumber Sampah
                  </span>
                  <span className="font-bold text-neutral-800 text-xs">
                    {selectedItem.sumberSampah || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Tanggal Jemput
                  </span>
                  <span className="font-bold text-neutral-800 text-xs">
                    {selectedItem.tanggalSetor}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Jenis Sampah
                  </span>
                  <span className="font-bold text-neutral-800 text-xs">
                    {selectedItem.jenisSampah}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Berat Aktual
                  </span>
                  <span className="font-black text-neutral-900 text-xs">
                    {selectedItem.beratKg} kg
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Reward Diterima
                  </span>
                  <span className="text-base font-black text-emerald-900">
                    +{selectedItem.totalPoin} POIN
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 border border-emerald-300">
                  Diterima Instan
                </span>
              </div>

              {selectedItem.catatan && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                    Catatan Lokasi
                  </span>
                  <p className="text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
                    {selectedItem.catatan}
                  </p>
                </div>
              )}

              {/* Foto Timbangan */}
              {selectedItem.fotoTimbangan && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                    Foto Skala Timbangan
                  </span>
                  <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900 h-44">
                    <Image
                      src={selectedItem.fotoTimbangan}
                      alt="Foto Timbangan"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Foto Dokumentasi Tambahan (Opsional) */}
              {selectedItem.fotoBuktiTambahan &&
                selectedItem.fotoBuktiTambahan.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                      Foto Dokumentasi Lapangan (
                      {selectedItem.fotoBuktiTambahan.length})
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedItem.fotoBuktiTambahan.map((img, i) => (
                        <div
                          key={img}
                          className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900"
                        >
                          <Image
                            src={img}
                            alt={`Dokumentasi ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end bg-neutral-50/50">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

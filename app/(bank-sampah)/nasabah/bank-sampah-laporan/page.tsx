"use client";

import { Coins, FileText, Scale, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getLaporanSetoranNasabah,
  type SetoranReportItem,
} from "@/app/(bank-sampah)/nasabah/bank-sampah-laporan/action";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";

export default function LaporanSetoranNasabahPage() {
  const [data, setData] = useState<SetoranReportItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    role: "",
    jenisSampah: "",
  });

  const [summary, setSummary] = useState({
    totalBerat: 0,
    totalKredit: 0,
  });

  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const refreshData = useCallback(() => {
    getLaporanSetoranNasabah({
      page: currentPage,
      limit: pageSize,
      search,
      role: filterValues.role,
      jenisSampah: filterValues.jenisSampah,
      sortBy,
      sortOrder,
    }).then((res) => {
      setData(res.data);
      setTotalItems(res.total);
      setSummary({
        totalBerat: res.totalBerat,
        totalKredit: res.totalKredit,
      });
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

  const formatTanggal = (dateStr: string) => {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const columns: Column<SetoranReportItem>[] = [
    {
      header: "Nomor Setor",
      sortKey: "nomorSetor",
      render: (item) => (
        <span className="font-semibold text-neutral-800 text-xs">
          {item.nomorSetor}
        </span>
      ),
    },
    {
      header: "Nasabah",
      sortKey: "name",
      render: (item) => (
        <div>
          <div className="font-semibold text-neutral-900">
            {item.user?.name || "Nasabah dihapus"}
          </div>
          <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5">
            Role:{" "}
            <span className="lowercase">{item.user?.role || "unknown"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Jenis Sampah",
      sortKey: "jenisSampah",
      render: (item) => (
        <span className="font-medium text-neutral-800 text-xs bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/50">
          {item.jenisSampah}
        </span>
      ),
    },
    {
      header: "Berat",
      sortKey: "beratKg",
      render: (item) => (
        <span className="text-neutral-600 font-semibold">
          {item.beratKg} kg
        </span>
      ),
    },
    {
      header: "Total Kredit",
      sortKey: "totalPoin",
      render: (item) => (
        <span className="font-bold text-primary-600 font-mono">
          Rp {item.totalPoin.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      header: "Tanggal Setor",
      sortKey: "tanggalSetor",
      render: (item) => (
        <span className="text-neutral-500 text-xs">
          {formatTanggal(item.tanggalSetor)}
        </span>
      ),
    },
  ];

  const filters: TableFilter<SetoranReportItem>[] = [
    {
      id: "role",
      label: "Tipe Nasabah",
      options: [
        { label: "Konsumen", value: "konsumen" },
        { label: "Warmiendo", value: "warmiendo" },
      ],
      filterFn: (item, val) => item.user?.role?.toLowerCase() === val,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600" />
            Laporan Setoran Nasabah
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Pantau dan analisis seluruh data transaksi setoran sampah serta
            penyaluran kredit uang milik nasabah Anda.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Berat */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-primary-50 rounded-xl">
            <Scale className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Total Berat Sampah
            </span>
            <span className="text-2xl font-bold text-neutral-900 font-mono block mt-0.5">
              {summary.totalBerat.toLocaleString("id-ID")}{" "}
              <span className="text-sm font-semibold text-neutral-500">kg</span>
            </span>
          </div>
        </div>

        {/* Card 2: Total Uang */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <Coins className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Total Kredit Terdistribusi
            </span>
            <span className="text-2xl font-bold text-emerald-600 font-mono block mt-0.5">
              Rp {summary.totalKredit.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Card 3: Total Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Total Transaksi Setoran
            </span>
            <span className="text-2xl font-bold text-neutral-900 font-mono block mt-0.5">
              {totalItems.toLocaleString("id-ID")}{" "}
              <span className="text-sm font-semibold text-neutral-500">
                Transaksi
              </span>
            </span>
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
        searchPlaceholder="Cari berdasarkan nomor setor atau nama nasabah..."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </div>
  );
}

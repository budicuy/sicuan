"use client";

import {
  Calendar,
  Coins,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  Recycle,
  Scale,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createSetoranNasabah,
  getNasabahSuggestions,
  getRiwayatSetoran,
} from "@/app/(bank-sampah)/nasabah/bank-sampah-setor/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";

interface NasabahItem {
  id: number;
  userId: number;
  name: string;
  role: string;
}

interface SetoranHistoryItem {
  id: number;
  nomorSetor: string;
  userId: number;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  catatan: string | null;
  totalPoin: number; // This represents the Rupiah cash amount
  status: string;
  createdAt: Date;
  user: {
    name: string;
    role: string;
  } | null;
}

export default function BankSampahSetorNasabahPage() {
  const [suggestions, setSuggestions] = useState<NasabahItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [history, setHistory] = useState<SetoranHistoryItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const [jenisSampah, setJenisSampah] = useState("Karton");
  const [beratKg, setBeratKg] = useState("");
  const [hargaPerKg, setHargaPerKg] = useState("");
  const [tanggalSetor, setTanggalSetor] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [catatan, setCatatan] = useState("");

  // Searchable select states
  const [selectedNasabah, setSelectedNasabah] = useState("");
  const [selectedNasabahName, setSelectedNasabahName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadData = useCallback(() => {
    getRiwayatSetoran().then((res) =>
      setHistory(res.data as SetoranHistoryItem[]),
    );
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time search query from DB with 300ms debounce
  useEffect(() => {
    if (!dropdownOpen) return;

    setLoadingSuggestions(true);
    const delayDebounceFn = setTimeout(() => {
      getNasabahSuggestions(searchTerm)
        .then((res) => {
          setSuggestions(res as NasabahItem[]);
          setLoadingSuggestions(false);
        })
        .catch((err) => {
          console.error("Error fetching suggestions:", err);
          setLoadingSuggestions(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dropdownOpen]);

  // Handle click outside to close the custom searchable select
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".searchable-select-container")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createSetoranNasabah({ success: false }, formData);

      if (result.success) {
        showFeedback(
          "success",
          "Setoran Berhasil!",
          "Setoran sampah nasabah berhasil dicatat dan nominal uang (kredit) langsung ditambahkan ke saldo nasabah.",
        );
        // Reset form
        setBeratKg("");
        setHargaPerKg("");
        setCatatan("");
        setSelectedNasabah("");
        setSelectedNasabahName("");
        setSearchTerm("");
        setSuggestions([]);
        setTanggalSetor(new Date().toISOString().split("T")[0]);
        loadData();
      } else {
        if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    });
  };

  const formatTanggal = (dateStr: string) => {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Recycle className="w-7 h-7 text-primary-600" />
            Setor Sampah Nasabah
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Input setoran sampah secara langsung untuk nasabah Bank Sampah Anda.
            Nominal uang (kredit) akan dihitung berdasarkan harga per kg yang
            dimasukkan secara manual.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form Input Setoran */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 bg-primary-50/30 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-neutral-800 text-sm uppercase tracking-wider">
                Form Input Setoran
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Custom Searchable Select for Nasabah (Real-time DB Query) */}
              <div className="relative searchable-select-container">
                <label
                  htmlFor="userId-display"
                  className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                >
                  Pilih Nasabah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="userId-display"
                    type="text"
                    placeholder="Ketik nama untuk mencari nasabah..."
                    value={dropdownOpen ? searchTerm : selectedNasabahName}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setDropdownOpen(true);
                      setSearchTerm("");
                    }}
                    required={!selectedNasabah}
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850"
                  />
                  {/* Hidden input to pass value in form submission */}
                  <input type="hidden" name="userId" value={selectedNasabah} />

                  {loadingSuggestions && (
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                    </div>
                  )}
                </div>

                {dropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-neutral-500">
                        {loadingSuggestions
                          ? "Mencari nasabah..."
                          : "Nasabah tidak ditemukan"}
                      </div>
                    ) : (
                      suggestions.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setSelectedNasabah(String(n.userId));
                            setSelectedNasabahName(`${n.name} (${n.role})`);
                            setDropdownOpen(false);
                            setSearchTerm("");
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors border-0 bg-transparent cursor-pointer font-medium text-neutral-800"
                        >
                          {n.name}{" "}
                          <span className="text-xs text-neutral-500 uppercase">
                            ({n.role})
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {formErrors.userId && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.userId[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="jenisSampah"
                  className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                >
                  Jenis Sampah <span className="text-red-500">*</span>
                </label>
                <select
                  id="jenisSampah"
                  name="jenisSampah"
                  value={jenisSampah}
                  onChange={(e) => setJenisSampah(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850"
                >
                  <option value="Karton">Karton</option>
                  <option value="Etiket">Etiket</option>
                  <option value="Paper Cup">Paper Cup</option>
                </select>
                {formErrors.jenisSampah && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.jenisSampah[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="beratKg"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    Berat (kg) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="beratKg"
                      type="number"
                      name="beratKg"
                      value={beratKg}
                      onChange={(e) => setBeratKg(e.target.value)}
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      className="w-full pl-3 pr-8 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850 font-semibold"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-neutral-400 text-xs font-bold">
                        kg
                      </span>
                    </div>
                  </div>
                  {formErrors.beratKg && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.beratKg[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="hargaPerKg"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    Harga / kg (Rp) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-neutral-400 text-xs font-bold">
                        Rp
                      </span>
                    </div>
                    <input
                      id="hargaPerKg"
                      type="number"
                      name="hargaPerKg"
                      value={hargaPerKg}
                      onChange={(e) => setHargaPerKg(e.target.value)}
                      min="0"
                      required
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850 font-semibold"
                    />
                  </div>
                  {formErrors.hargaPerKg && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.hargaPerKg[0]}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="tanggalSetor"
                  className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                >
                  Tanggal Setor <span className="text-red-500">*</span>
                </label>
                <input
                  id="tanggalSetor"
                  type="date"
                  name="tanggalSetor"
                  value={tanggalSetor}
                  onChange={(e) => setTanggalSetor(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-850"
                />
                {formErrors.tanggalSetor && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.tanggalSetor[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="catatan"
                  className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                >
                  Catatan Tambahan
                </label>
                <textarea
                  id="catatan"
                  name="catatan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Opsional, misal kondisi sampah..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all resize-none text-neutral-850"
                />
                {formErrors.catatan && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.catatan[0]}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-md shadow-primary-600/10 hover:shadow-primary-600/20 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menyimpan Setoran...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Simpan Setoran</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Tabel Riwayat Setoran */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-neutral-500" />
              <h2 className="font-bold text-neutral-800 text-sm uppercase tracking-wider">
                Riwayat Setoran Nasabah
              </h2>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/60 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Nasabah</th>
                    <th className="px-6 py-3.5">Jenis &amp; Berat</th>
                    <th className="px-6 py-3.5">Tanggal</th>
                    <th className="px-6 py-3.5">Total Kredit</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {history.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-neutral-400"
                      >
                        Belum ada riwayat setoran nasabah.
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr
                        key={h.id}
                        className="hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-neutral-900">
                            {h.user?.name || "Nasabah dihapus"}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5">
                            Role:{" "}
                            <span className="lowercase">
                              {h.user?.role || "unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-800">
                            {h.jenisSampah}
                          </div>
                          <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                            <Scale className="w-3.5 h-3.5" />
                            {h.beratKg} kg
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-600">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            {formatTanggal(h.tanggalSetor)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary-600 font-mono flex items-center gap-1">
                            <Coins className="w-4 h-4 text-primary-600 shrink-0" />
                            Rp {h.totalPoin.toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                            Diterima
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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

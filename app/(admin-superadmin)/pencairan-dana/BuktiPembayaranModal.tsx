"use client";

import imageCompression from "browser-image-compression";
import {
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  type CreateBuktiPembayaranInput,
  createBuktiPembayaran,
  getNasabahProfileAndMonthlyWaste,
} from "@/app/(admin-superadmin)/pencairan-dana/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import type { DataSampahItem } from "@/db/schema/bukti-pembayaran";

const JENIS_SAMPAH_OPTIONS = [
  "Karton",
  "Paper Cup",
  "Etiket",
  "Plastik Kemasan",
];
const BULAN_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const KATEGORI_OPTIONS = [
  { value: "bank_sampah_induk", label: "Bank Sampah Induk" },
  { value: "tps_3r", label: "TPS 3R" },
  { value: "bank_sampah_unit", label: "Bank Sampah Unit" },
];

interface DisbursementItem {
  id: number;
  userId: number;
  jumlah: number;
  jenisBank: string | null;
  noRekening: string | null;
  status: string;
  metodePembayaran: string;
  keterangan: string | null;
  ttdPenyerahUrl: string | null;
  createdAt: Date;
  user: { name: string; username: string; role: string };
}

interface Props {
  item: DisbursementItem;
  nasabahData?: {
    idPelanggan: string;
    namaBankSampah: string;
    alamat?: string | null;
    noTelepon?: string | null;
  };
  onClose: () => void;
  onSuccess: (docId: number) => void;
}

export function BuktiPembayaranModal({
  item,
  nasabahData,
  onClose,
  onSuccess,
}: Props) {
  const thisYear = new Date().getFullYear();
  const thisMonth = BULAN_OPTIONS[new Date().getMonth()];

  // Form state
  const [namaBankSampah, setNamaBankSampah] = useState(
    nasabahData?.namaBankSampah ?? item.user.name,
  );
  const [idPelanggan, setIdPelanggan] = useState(
    nasabahData?.idPelanggan ?? `SPK-${String(item.userId).padStart(3, "0")}`,
  );
  const [alamat, setAlamat] = useState(nasabahData?.alamat ?? "");
  const [noTelepon, setNoTelepon] = useState(nasabahData?.noTelepon ?? "");
  const [periodeBulan, setPeriodeBulan] = useState(thisMonth);
  const [periodeTahun, setPeriodeTahun] = useState(thisYear);
  const [kategoriSumber, setKategoriSumber] = useState("bank_sampah_induk");
  const [dataSampah, setDataSampah] = useState<DataSampahItem[]>([
    { jenis: "Karton", beratKg: 0, terlampir: true },
  ]);
  const [tarifDasar, setTarifDasar] = useState(item.jumlah);
  const [biayaTambahan, setBiayaTambahan] = useState(0);
  const [keterangan, setKeterangan] = useState(item.keterangan ?? "");
  const [namaPenyerah, setNamaPenyerah] = useState(item.user.name);
  const [jabatanPenyerah, setJabatanPenyerah] = useState(
    "PT. Indofood CBP Sukses Makmur Tbk,",
  );
  const [namaPenerima, setNamaPenerima] = useState("");
  const [jabatanPenerima, setJabatanPenerima] = useState(
    "Direktur Bank Sampah Bjb / TPS 3R",
  );

  // Admin TTD upload
  const [ttdAdminBase64, setTtdAdminBase64] = useState<string | null>(null);
  const [ttdError, setTtdError] = useState("");
  const [isCompressingTtd, setIsCompressingTtd] = useState(false);

  useEffect(() => {
    // Automatically pre-populate profile (address, phone, customer ID) and monthly waste data
    getNasabahProfileAndMonthlyWaste(
      item.userId,
      periodeTahun,
      periodeBulan,
    ).then((res) => {
      if (res.success && res.data) {
        if (res.data.alamat) setAlamat(res.data.alamat);
        if (res.data.noTelepon) setNoTelepon(res.data.noTelepon);
        if (res.data.idPelanggan) setIdPelanggan(res.data.idPelanggan);
        if (res.data.namaBankSampah) setNamaBankSampah(res.data.namaBankSampah);
        if (res.data.dataSampah && res.data.dataSampah.length > 0) {
          setDataSampah(res.data.dataSampah);
        } else {
          setDataSampah([{ jenis: "Karton", beratKg: 0, terlampir: true }]);
        }
      }
    });
  }, [item.userId, periodeBulan, periodeTahun]);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showFeedback = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setFeedback({ isOpen: true, type, title, message });
    },
    [],
  );

  const totalBeratKg = dataSampah.reduce((sum, s) => sum + (s.beratKg || 0), 0);
  const totalTagihan = tarifDasar + biayaTambahan;

  const handleTtdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setTtdError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTtdError("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }
    setIsCompressingTtd(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        setTtdAdminBase64(reader.result as string);
        setIsCompressingTtd(false);
      };
      reader.onerror = () => {
        setTtdError("Gagal membaca file.");
        setIsCompressingTtd(false);
      };
      reader.readAsDataURL(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setTtdAdminBase64(reader.result as string);
        setIsCompressingTtd(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSampahRow = () => {
    setDataSampah([
      ...dataSampah,
      { jenis: "Karton", beratKg: 0, terlampir: true },
    ]);
  };

  const removeSampahRow = (i: number) => {
    setDataSampah(dataSampah.filter((_, idx) => idx !== i));
  };

  const updateSampah = (
    i: number,
    field: keyof DataSampahItem,
    value: string | number | boolean,
  ) => {
    const updated = [...dataSampah];
    // biome-ignore lint/suspicious/noExplicitAny: dynamic field update
    (updated[i] as any)[field] = value;
    setDataSampah(updated);
  };

  const handleSubmit = () => {
    if (!ttdAdminBase64) {
      setTtdError("Tanda tangan admin wajib diunggah sebelum membuat dokumen.");
      return;
    }

    const input: CreateBuktiPembayaranInput = {
      pencairanDanaId: item.id,
      userId: item.userId,
      namaBankSampah,
      idPelanggan,
      nama: item.user.name,
      alamat,
      noTelepon,
      periodeBulan,
      periodeTahun,
      kategoriSumber,
      dataSampah,
      totalBeratKg,
      tarifDasar,
      biayaTambahan,
      totalTagihan,
      metodePembayaran: item.metodePembayaran,
      keterangan,
      ttdPenerimaBase64: ttdAdminBase64,
      namaPenyerah,
      jabatanPenyerah,
      namaPenerima,
      jabatanPenerima,
    };

    startTransition(async () => {
      const res = await createBuktiPembayaran(input);
      if (res.success && res.docId) {
        showFeedback("success", "Dokumen Dibuat", res.message);
        onSuccess(res.docId);
      } else {
        showFeedback("error", "Gagal Membuat Dokumen", res.message);
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-primary-600" />
              <div>
                <h3 className="text-base font-bold text-neutral-800">
                  Buat Dokumen Bukti Pembayaran
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Untuk: {item.user.name} — Rp{" "}
                  {item.jumlah.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* I. Identitas */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-100 pb-2">
                I. Identitas Pelanggan
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    Nama Bank Sampah
                  </span>
                  <input
                    type="text"
                    value={namaBankSampah}
                    onChange={(e) => setNamaBankSampah(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    ID Pelanggan
                  </span>
                  <input
                    type="text"
                    value={idPelanggan}
                    onChange={(e) => setIdPelanggan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    Alamat
                  </span>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                    placeholder="Alamat lengkap"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    No. Telepon
                  </span>
                  <input
                    type="text"
                    value={noTelepon}
                    onChange={(e) => setNoTelepon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>
              </div>
            </section>

            {/* II. Periode */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-100 pb-2">
                II. Periode & Kategori
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    Bulan
                  </span>
                  <select
                    value={periodeBulan}
                    onChange={(e) => setPeriodeBulan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  >
                    {BULAN_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    Tahun
                  </span>
                  <input
                    type="number"
                    value={periodeTahun}
                    onChange={(e) => setPeriodeTahun(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    Kategori Sumber
                  </span>
                  <select
                    value={kategoriSumber}
                    onChange={(e) => setKategoriSumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  >
                    {KATEGORI_OPTIONS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* III. Data Berat Sampah */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  III. Data Berat Sampah
                </h4>
                <button
                  type="button"
                  onClick={addSampahRow}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-700 border-0 bg-transparent cursor-pointer px-2 py-1 rounded-lg hover:bg-primary-50 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Jenis
                </button>
              </div>

              {dataSampah.map((s, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: dynamic form rows
                  key={`sampah-row-${i}`}
                  className="flex items-center gap-2"
                >
                  <select
                    value={s.jenis}
                    onChange={(e) => updateSampah(i, "jenis", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  >
                    {JENIS_SAMPAH_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={s.beratKg}
                      onChange={(e) =>
                        updateSampah(
                          i,
                          "beratKg",
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full pl-3 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                      placeholder="0.00"
                    />
                    <span className="absolute right-2.5 inset-y-0 flex items-center text-[10px] text-neutral-400 font-bold">
                      kg
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-neutral-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.terlampir}
                      onChange={(e) =>
                        updateSampah(i, "terlampir", e.target.checked)
                      }
                      className="rounded"
                    />
                    Terlampir
                  </label>
                  {dataSampah.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSampahRow(i)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700">
                  Total Berat
                </span>
                <span className="text-sm font-black text-primary-600">
                  {totalBeratKg.toFixed(2)} kg
                </span>
              </div>
            </section>

            {/* V. Rincian Pembayaran */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-100 pb-2">
                V. Rincian Pembayaran
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    Tarif Dasar (Rp)
                  </span>
                  <input
                    type="number"
                    value={tarifDasar}
                    onChange={(e) => setTarifDasar(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                    Biaya Tambahan (Rp)
                  </span>
                  <input
                    type="number"
                    value={biayaTambahan}
                    onChange={(e) => setBiayaTambahan(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  />
                </div>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl border border-primary-200 flex items-center justify-between">
                <span className="text-xs font-bold text-primary-700">
                  Total Tagihan
                </span>
                <span className="text-sm font-black text-primary-700">
                  Rp {totalTagihan.toLocaleString("id-ID")}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                  Metode Pembayaran
                </span>
                <div className="px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-700 capitalize">
                  {item.metodePembayaran === "tunai"
                    ? "✓ Tunai"
                    : "✓ Transfer Bank"}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                  Keterangan / Catatan
                </span>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </section>

            {/* TTD */}
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-100 pb-2">
                Tanda Tangan
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {/* TTD Mitra (already uploaded) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
                    TTD Mitra (Diserahkan Oleh)
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      value={namaPenyerah}
                      onChange={(e) => setNamaPenyerah(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                      placeholder="Nama penyerah"
                    />
                    <input
                      type="text"
                      value={jabatanPenyerah}
                      onChange={(e) => setJabatanPenyerah(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                      placeholder="Jabatan"
                    />
                  </div>
                  {item.ttdPenyerahUrl ? (
                    <div className="rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 h-20 flex items-center justify-center">
                      {/* biome-ignore lint/performance/noImgElement: TTD preview */}
                      <img
                        src={item.ttdPenyerahUrl}
                        alt="TTD Mitra"
                        className="max-h-20 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 h-20 flex items-center justify-center">
                      <p className="text-[10px] text-amber-600 font-semibold text-center px-3">
                        TTD mitra belum diunggah
                      </p>
                    </div>
                  )}
                </div>

                {/* TTD Admin */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                    TTD Admin (Diterima Oleh) *
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      value={namaPenerima}
                      onChange={(e) => setNamaPenerima(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                      placeholder="Nama penerima/direktur"
                    />
                    <input
                      type="text"
                      value={jabatanPenerima}
                      onChange={(e) => setJabatanPenerima(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                      placeholder="Jabatan"
                    />
                  </div>

                  {isCompressingTtd ? (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 h-20 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                      <span className="text-[10px] text-neutral-500">
                        Mengompresi...
                      </span>
                    </div>
                  ) : ttdAdminBase64 ? (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 h-20 flex items-center justify-center">
                      {/* biome-ignore lint/performance/noImgElement: TTD preview */}
                      <img
                        src={ttdAdminBase64}
                        alt="TTD Admin"
                        className="max-h-20 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setTtdAdminBase64(null)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-xl border-2 border-dashed border-red-300 hover:border-primary-500/50 transition-all bg-red-50/30">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTtdUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="p-4 text-center space-y-1">
                        <Camera className="w-5 h-5 text-red-400 mx-auto" />
                        <p className="text-[10px] font-bold text-red-500">
                          Upload TTD Admin (Wajib)
                        </p>
                      </div>
                    </div>
                  )}
                  {ttdError && (
                    <p className="text-[11px] font-semibold text-red-600">
                      {ttdError}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-neutral-100 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer bg-white"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || isCompressingTtd || !ttdAdminBase64}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 border-0 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Buat &amp; Simpan Dokumen</span>
            </button>
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
    </>
  );
}

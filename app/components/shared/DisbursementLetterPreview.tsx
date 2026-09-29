"use client";

import { Camera, FileText, X, ZoomIn } from "lucide-react";
import { useState } from "react";
import { terbilang } from "@/app/lib/terbilang";

interface DataSampahItem {
  jenis: string;
  beratKg: number;
}

export interface SetoranDetailPreviewItem {
  id?: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  fotoTimbangan?: string | null;
  fotoBuktiTambahan?: string[];
}

type KategoriSumber = "bank-sampah-induk" | "tps-3r" | "bank-sampah-unit";

interface DisbursementLetterPreviewProps {
  data: {
    user: {
      name: string;
      role: string;
    };
    idPelanggan?: string;
    alamat?: string | null;
    noTelepon?: string | null;
    dataSampah?: DataSampahItem[];
    totalBeratKg?: number;
  } | null;
  customAmount: string;
  metode: string;
  keterangan: string;
  ttdBase64: string | null;
  kategoriSumber?: KategoriSumber | KategoriSumber[];
  ttdAdminBase64?: string | null;
  biayaTambahan?: number;
  catatanBiayaTambahan?: string | null;
  setoranDetail?: SetoranDetailPreviewItem[];
  nomorDokumen?: string;
  periodeBulan?: string;
  periodeTahun?: number;
}

export function DisbursementLetterPreview({
  data,
  customAmount,
  metode,
  keterangan,
  ttdBase64,
  kategoriSumber = "bank-sampah-induk",
  ttdAdminBase64,
  biayaTambahan = 0,
  catatanBiayaTambahan = null,
  setoranDetail = [],
  nomorDokumen = "(Draft - Otomatis Dibuat Admin)",
  periodeBulan,
  periodeTahun,
}: DisbursementLetterPreviewProps) {
  const [activeTab, setActiveTab] = useState<"surat" | "lampiran">("surat");
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    title: string;
  } | null>(null);

  const isWarmindo = data?.user.role === "warmindo";
  const labelJabatan = isWarmindo
    ? "Pengelola Warmindo"
    : "Pimpinan Bank Sampah";

  const totalPhotos = setoranDetail.reduce((acc, item) => {
    let count = 0;
    if (item.fotoTimbangan) count++;
    if (item.fotoBuktiTambahan?.length) count += item.fotoBuktiTambahan.length;
    return acc + count;
  }, 0);

  const hasCategory = (cat: KategoriSumber) => {
    if (isWarmindo) {
      return cat === "tps-3r";
    }
    if (!kategoriSumber) return false;
    if (Array.isArray(kategoriSumber)) {
      return kategoriSumber.includes(cat);
    }
    return kategoriSumber === cat;
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("surat")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "surat"
              ? "bg-white text-neutral-800 shadow-xs"
              : "text-neutral-500 hover:text-neutral-700 bg-transparent"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Surat Bukti Pembayaran</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lampiran")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "lampiran"
              ? "bg-white text-emerald-800 shadow-xs"
              : "text-neutral-500 hover:text-neutral-700 bg-transparent"
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Lampiran Detail &amp; Foto Setoran ({setoranDetail.length})
          </span>
        </button>
      </div>

      {/* Tab 1: Surat Kuitansi Fisik */}
      {activeTab === "surat" && (
        <div className="border border-neutral-200 rounded-xl p-4 sm:p-6 bg-neutral-50/50 font-serif text-[11px] text-neutral-800 space-y-4 overflow-x-auto">
          {/* Kop Surat */}
          <div className="text-center space-y-0.5">
            <div className="border-t-2 border-neutral-800" />
            <div className="border-t border-neutral-800" />
            <h2 className="text-center text-xs font-black underline tracking-wide py-0.5">
              BUKTI PEMBAYARAN &amp; JASA PENGELOLAAN SAMPAH
            </h2>
            <div className="border-t-2 border-neutral-800" />
          </div>

          {/* Info Dokumen */}
          <div className="flex justify-between items-start pt-1 font-bold text-[10px] text-neutral-600 flex-wrap gap-1">
            <div>No. Dokumen : {nomorDokumen}</div>
            <div>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* I. Identitas */}
          <div className="space-y-1">
            <h4 className="font-bold border-b border-neutral-200 pb-0.5 text-neutral-700 text-[10px] uppercase">
              I. Identitas Pelanggan
            </h4>
            <table className="w-full text-left">
              <tbody>
                <tr>
                  <td className="w-36 py-0.5 text-neutral-500">
                    {isWarmindo ? "Nama Warmindo" : "Nama Bank Sampah"}
                  </td>
                  <td className="w-3 py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5 font-semibold text-neutral-800">
                    {isWarmindo ? "Warmindo" : "Bank Sampah"} {data?.user.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-neutral-500">Nama</td>
                  <td className="py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5 font-semibold text-neutral-800">
                    {data?.user.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-neutral-500">Alamat</td>
                  <td className="py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5 text-neutral-800">
                    {data?.alamat || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-neutral-500">No. Telepon/HP</td>
                  <td className="py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5 text-neutral-800">
                    {data?.noTelepon || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* II. Periode */}
          <div className="space-y-1">
            <h4 className="font-bold border-b border-neutral-200 pb-0.5 text-neutral-700 text-[10px] uppercase">
              II. Periode &amp; Detail Pengelolaan
            </h4>
            <table className="w-full text-left">
              <tbody>
                <tr>
                  <td className="w-36 py-0.5 text-neutral-500">
                    Periode Layanan
                  </td>
                  <td className="w-3 py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5 text-neutral-800">
                    Bulan{" "}
                    {periodeBulan ||
                      new Date().toLocaleDateString("id-ID", {
                        month: "long",
                      })}{" "}
                    {periodeTahun || new Date().getFullYear()}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-neutral-500">Kategori Sumber</td>
                  <td className="py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5">
                    <div className="flex flex-wrap gap-3 text-neutral-700">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={hasCategory("bank-sampah-induk")}
                          readOnly
                          className="rounded"
                        />{" "}
                        Bank Sampah Induk
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={hasCategory("tps-3r")}
                          readOnly
                          className="rounded"
                        />{" "}
                        TPS 3R
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={hasCategory("bank-sampah-unit")}
                          readOnly
                          className="rounded"
                        />{" "}
                        Bank Sampah Unit
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* III. Data Berat */}
          <div className="space-y-1">
            <h4 className="font-bold border-b border-neutral-200 pb-0.5 text-neutral-700 text-[10px] uppercase">
              III. Data Berat Sampah (Bulanan)
            </h4>
            {data?.dataSampah && data.dataSampah.length > 0 ? (
              <div className="space-y-0.5 max-w-sm">
                {data.dataSampah.map((item, index) => (
                  <div key={item.jenis} className="flex justify-between">
                    <div className="w-5 text-neutral-400">{index + 1}.</div>
                    <div className="flex-1 text-neutral-700">{item.jenis}</div>
                    <div className="w-20 text-right text-neutral-800 font-mono">
                      {item.beratKg.toFixed(2)} kg
                    </div>
                  </div>
                ))}
                <div className="border-t border-dashed border-neutral-400 pt-0.5 mt-0.5 flex justify-between font-bold">
                  <div className="w-5" />
                  <div className="flex-1 text-neutral-700">TOTAL BERAT</div>
                  <div className="w-20 text-right text-neutral-800 font-mono">
                    {(data.totalBeratKg || 0).toFixed(2)} kg
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-neutral-400 italic text-[10px]">
                Tidak ada data setoran sampah bulan ini.
              </div>
            )}
          </div>

          {/* IV. Lampiran */}
          <div className="space-y-1">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-0.5">
              <h4 className="font-bold text-neutral-700 text-[10px] uppercase">
                IV. Lampiran Dokumen
              </h4>
              {setoranDetail.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("lampiran")}
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-sans font-bold underline cursor-pointer border-0 bg-transparent"
                >
                  Buka Lampiran ({setoranDetail.length} Setoran) →
                </button>
              )}
            </div>
            {data?.dataSampah && data.dataSampah.length > 0 ? (
              data.dataSampah.map((item, index) => (
                <div
                  key={item.jenis}
                  className="flex items-center justify-between max-w-sm"
                >
                  <div className="text-neutral-700">
                    {index + 1}. Dok. foto timbangan &amp; fisik {item.jenis}
                  </div>
                  <div className="font-bold text-[10px] text-emerald-600">
                    ✓ Terlampir
                  </div>
                </div>
              ))
            ) : (
              <div className="text-neutral-400 italic text-[10px]">
                Tidak ada dokumentasi terlampir.
              </div>
            )}
          </div>

          {/* V. Rincian Pembayaran */}
          <div className="space-y-1">
            <h4 className="font-bold border-b border-neutral-200 pb-0.5 text-neutral-700 text-[10px] uppercase">
              V. Rincian Pembayaran
            </h4>
            <table className="w-full text-left">
              <tbody>
                <tr>
                  <td className="w-36 py-0.5 text-neutral-500">
                    Tarif Dasar Pengelolaan
                  </td>
                  <td className="w-3 py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5 font-mono text-neutral-800">
                    Rp{" "}
                    {Math.max(
                      0,
                      (Number(customAmount) || 0) - biayaTambahan,
                    ).toLocaleString("id-ID")}
                    ,00
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-neutral-500">Biaya Tambahan</td>
                  <td className="py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5 font-mono text-neutral-800">
                    Rp {biayaTambahan.toLocaleString("id-ID")},00
                  </td>
                </tr>
                {biayaTambahan > 0 && catatanBiayaTambahan && (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-[10px] text-neutral-500 italic py-0.5 pl-2"
                    >
                      * Catatan: {catatanBiayaTambahan}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-neutral-300 font-bold">
                  <td className="py-1 text-neutral-700">TOTAL TAGIHAN</td>
                  <td className="py-1 text-neutral-400">:</td>
                  <td className="py-1 text-primary-700 font-mono">
                    Rp {(Number(customAmount) || 0).toLocaleString("id-ID")}
                    ,00
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-neutral-500">TERBILANG</td>
                  <td className="py-0.5 text-neutral-400">:</td>
                  <td className="py-0.5 font-bold italic text-neutral-600">
                    {terbilang(Number(customAmount) || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex flex-wrap items-center gap-4 pt-1 font-bold text-[10px] text-neutral-700">
              <span>Metode :</span>
              <label className="flex items-center gap-1 font-normal">
                <input
                  type="checkbox"
                  checked={metode === "tunai"}
                  readOnly
                  className="rounded"
                />{" "}
                Tunai
              </label>
              <label className="flex items-center gap-1 font-normal">
                <input
                  type="checkbox"
                  checked={metode === "transfer"}
                  readOnly
                  className="rounded"
                />{" "}
                Transfer Bank
              </label>
            </div>
            <div className="pt-0.5 text-neutral-700 text-[10px]">
              <span className="font-bold">Keterangan : </span>
              <span className="italic">{keterangan || "-"}</span>
            </div>
          </div>

          {/* Tanda Tangan */}
          <div className="flex justify-between pt-3">
            {/* Kiri - Diserahkan Oleh: PT. Indofood Sukses Makmur Tbk. */}
            <div className="w-40 text-center space-y-1">
              <p className="text-[10px] text-neutral-500">Diserahkan Oleh,</p>
              <div className="h-14 flex items-center justify-center">
                {ttdAdminBase64 ? (
                  // biome-ignore lint/performance/noImgElement: Admin TTD preview
                  <img
                    src={ttdAdminBase64}
                    alt="Tanda Tangan Admin"
                    className="max-h-12 object-contain"
                  />
                ) : metode === "tunai" ? (
                  <div className="text-[9px] text-emerald-700 font-semibold italic border border-dashed border-emerald-300 px-2 py-1 rounded-lg bg-emerald-50">
                    Tanda Tangan Fisik di Tempat
                  </div>
                ) : (
                  <div className="text-[9px] text-neutral-400 italic border border-dashed border-neutral-300 px-3 py-1 rounded-lg bg-neutral-50">
                    Menunggu Approval
                  </div>
                )}
              </div>
              <p className="font-bold underline text-[10px] text-neutral-800">
                (PT. Indofood Sukses Makmur Tbk.)
              </p>
              <p className="text-[9px] text-neutral-500 leading-tight">
                Pimpinan Perusahaan
              </p>
            </div>

            {/* Kanan - Diterima Oleh: Bank Sampah / Mitra */}
            <div className="w-40 text-center space-y-1">
              <p className="text-[10px] text-neutral-500">Diterima Oleh,</p>
              <div className="h-14 flex items-center justify-center">
                {ttdBase64 ? (
                  // biome-ignore lint/performance/noImgElement: TTD preview
                  <img
                    src={ttdBase64}
                    alt="Tanda Tangan Pengaju"
                    className="max-h-12 object-contain"
                  />
                ) : metode === "tunai" ? (
                  <div className="text-[9px] text-emerald-700 font-semibold italic border border-dashed border-emerald-300 px-2 py-1 rounded-lg bg-emerald-50">
                    Tanda Tangan Fisik di Tempat
                  </div>
                ) : (
                  <div className="text-[9px] text-neutral-400 italic border border-dashed border-neutral-300 px-3 py-1 rounded-lg bg-neutral-50">
                    Belum Diunggah
                  </div>
                )}
              </div>
              <p className="font-bold underline text-[10px] text-neutral-800">
                ({data?.user.name})
              </p>
              <p className="text-[9px] text-neutral-500 leading-tight">
                {labelJabatan}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Lampiran Detail & Foto Setoran (Foto di Kiri, Detail di Kanan, Ringkasan di Paling Bawah) */}
      {activeTab === "lampiran" && (
        <div className="border border-neutral-200 rounded-xl p-4 sm:p-6 bg-neutral-50/50 text-[11px] text-neutral-800 space-y-4">
          <div className="text-center space-y-0.5 font-serif">
            <div className="border-t-2 border-neutral-800" />
            <div className="border-t border-neutral-800" />
            <h2 className="text-center text-xs font-black underline tracking-wide py-0.5">
              LAMPIRAN DETAIL &amp; DOKUMENTASI SETORAN SAMPAH
            </h2>
            <div className="border-t-2 border-neutral-800" />
          </div>

          <div className="flex justify-between items-start font-serif font-bold text-[10px] text-neutral-600 flex-wrap gap-1">
            <div>No. Dokumen : {nomorDokumen}</div>
            <div>
              Periode: {periodeBulan || "-"} {periodeTahun || ""}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Setiap kartu setoran menampilkan foto timbangan di sisi kiri dan
                detail transaksi di sisi kanan, serta tabel ringkasan data di
                bagian paling bawah.
              </span>
            </div>
            <span className="font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 text-[11px]">
              {totalPhotos} Foto ({setoranDetail.length} Setoran)
            </span>
          </div>

          {/* Looping Kartu Setoran */}
          {setoranDetail.length > 0 ? (
            <div className="space-y-4">
              {setoranDetail.map((item, idx) => (
                <div
                  key={item.nomorSetor}
                  className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs"
                >
                  {/* Card Header */}
                  <div className="bg-neutral-100/80 px-4 py-2 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-neutral-800 text-xs font-serif">
                        Setoran #{idx + 1} — No. {item.nomorSetor}
                      </span>
                      <span className="px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-md font-bold text-[10px]">
                        {item.jenisSampah}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-600 font-mono">
                      Tanggal Setor:{" "}
                      <span className="font-bold text-neutral-800">
                        {new Date(item.tanggalSetor).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Sisi Kiri = Foto Timbangan, Sisi Kanan = Detail Setoran */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                    {/* ── SISI KIRI (md:col-span-6): Foto Timbangan di Dalam Card ── */}
                    <div className="md:col-span-6 bg-neutral-50 rounded-xl border border-neutral-200 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-1 mb-2.5">
                          <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Foto Timbangan
                          </h5>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {item.beratKg.toFixed(2)} kg
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={!item.fotoTimbangan}
                          onClick={() => {
                            if (item.fotoTimbangan) {
                              setLightboxImage({
                                src: item.fotoTimbangan,
                                title: `Foto Timbangan - Setoran #${idx + 1} (${item.nomorSetor})`,
                              });
                            }
                          }}
                          className={`w-full h-44 rounded-lg border border-neutral-200 bg-white flex items-center justify-center overflow-hidden relative group p-1 ${
                            item.fotoTimbangan
                              ? "cursor-pointer hover:border-emerald-400 transition-colors"
                              : ""
                          }`}
                        >
                          {item.fotoTimbangan ? (
                            <>
                              {/* biome-ignore lint/performance/noImgElement: photo preview */}
                              <img
                                src={item.fotoTimbangan}
                                alt={`Foto Timbangan ${item.nomorSetor}`}
                                className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-neutral-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-semibold">
                                <ZoomIn className="w-4 h-4" />
                                <span>Klik untuk Perbesar</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">
                              Foto timbangan tidak tersedia
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ── SISI KANAN (md:col-span-6): Detail Setoran Tersebut ── */}
                    <div className="md:col-span-6 bg-neutral-50 rounded-xl border border-neutral-200 p-3.5 flex flex-col justify-between">
                      <div>
                        <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 pb-1 mb-2.5">
                          Detail Transaksi Setoran
                        </h5>
                        <table className="w-full text-left text-xs">
                          <tbody>
                            <tr>
                              <td className="w-24 py-1 text-neutral-500">
                                No. Setoran
                              </td>
                              <td className="w-3 py-1 text-neutral-400">:</td>
                              <td className="py-1 font-semibold text-neutral-800">
                                {item.nomorSetor}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1 text-neutral-500">Tanggal</td>
                              <td className="py-1 text-neutral-400">:</td>
                              <td className="py-1 text-neutral-800">
                                {new Date(item.tanggalSetor).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1 text-neutral-500">Jenis</td>
                              <td className="py-1 text-neutral-400">:</td>
                              <td className="py-1 font-semibold text-neutral-800">
                                {item.jenisSampah}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1 text-neutral-500">
                                Berat Timbangan
                              </td>
                              <td className="py-1 text-neutral-400">:</td>
                              <td className="py-1 font-mono font-bold text-neutral-900">
                                {item.beratKg.toFixed(2)} kg
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1 text-neutral-500">Status</td>
                              <td className="py-1 text-neutral-400">:</td>
                              <td className="py-1 text-emerald-700 font-bold">
                                ✓ Terverifikasi (Diterima)
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1 text-neutral-500">
                                Dokumentasi
                              </td>
                              <td className="py-1 text-neutral-400">:</td>
                              <td className="py-1 text-neutral-700">
                                {item.fotoTimbangan
                                  ? "Foto Timbangan Terlampir"
                                  : "Tanpa Foto"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── DI PALING BAWAH: RINGKASAN DATA SETORAN SAMPAH ── */}
              <div className="mt-8 border border-neutral-300 rounded-xl bg-white p-5 space-y-3 font-serif">
                <div className="border-b border-neutral-300 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-neutral-800">
                    RINGKASAN DATA SETORAN SAMPAH :
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-sans">
                    Total {setoranDetail.length} Transaksi Terverifikasi
                  </span>
                </div>

                <div className="overflow-x-auto border border-neutral-200 rounded-lg font-sans">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-bold">
                        <th className="py-1.5 px-2 text-center w-10">No</th>
                        <th className="py-1.5 px-3">Tanggal Setor</th>
                        <th className="py-1.5 px-3">Nomor Setoran</th>
                        <th className="py-1.5 px-3">Jenis Sampah</th>
                        <th className="py-1.5 px-3 text-right">Berat (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {setoranDetail.map((item, idx) => (
                        <tr
                          key={`rekap-${item.nomorSetor}`}
                          className="hover:bg-neutral-50"
                        >
                          <td className="py-1 px-2 text-center text-neutral-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-1 px-3">
                            {new Date(item.tanggalSetor).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="py-1 px-3 font-semibold text-neutral-800">
                            {item.nomorSetor}
                          </td>
                          <td className="py-1 px-3">{item.jenisSampah}</td>
                          <td className="py-1 px-3 text-right font-mono font-semibold">
                            {item.beratKg.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-100 font-bold border-t border-neutral-300">
                        <td colSpan={4} className="py-2 px-3 text-right">
                          TOTAL BERAT ({setoranDetail.length} Setoran) :
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-primary-700 text-xs">
                          {(data?.totalBeratKg || 0).toFixed(2)} kg
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <p className="text-[10px] text-neutral-500 italic pt-1 font-serif">
                  * Seluruh data transaksi di atas telah diverifikasi dengan
                  bukti fisik foto timbangan dan sampah yang terlampir pada
                  dokumen ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-neutral-400 italic">
              Tidak ada data setoran detail untuk periode ini.
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal Zoom for Clear Inspection */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <button
            type="button"
            aria-label="Tutup pratinjau"
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs w-full h-full border-0 cursor-default"
            onClick={() => setLightboxImage(null)}
          />
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-3 w-full z-10">
            <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-100">
              <h4 className="text-sm font-bold text-neutral-800">
                {lightboxImage.title}
              </h4>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer border-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] w-full overflow-hidden flex items-center justify-center bg-neutral-50 rounded-2xl p-2 border border-neutral-100">
              {/* biome-ignore lint/performance/noImgElement: Lightbox preview */}
              <img
                src={lightboxImage.src}
                alt={lightboxImage.title}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

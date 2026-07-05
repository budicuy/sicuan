"use client";

import { terbilang } from "@/app/lib/terbilang";

interface DataSampahItem {
  jenis: string;
  beratKg: number;
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
  kategoriSumber?: KategoriSumber;
  ttdAdminBase64?: string | null;
}

export function DisbursementLetterPreview({
  data,
  customAmount,
  metode,
  keterangan,
  ttdBase64,
  kategoriSumber = "bank-sampah-induk",
  ttdAdminBase64,
}: DisbursementLetterPreviewProps) {
  const isWarmiendo = data?.user.role === "warmiendo";
  const labelJabatan = isWarmiendo
    ? "Pengelola Warmiendo"
    : "Pimpinan Bank Sampah";

  return (
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
        <div>No. Dokumen : (Draft - Otomatis Dibuat Admin)</div>
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
                {isWarmiendo ? "Nama Warmiendo" : "Nama Bank Sampah"}
              </td>
              <td className="w-3 py-0.5 text-neutral-400">:</td>
              <td className="py-0.5 font-semibold text-neutral-800">
                {isWarmiendo ? "Warmiendo" : "Bank Sampah"} {data?.user.name}
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
              <td className="py-0.5 text-neutral-800">{data?.alamat || "-"}</td>
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
              <td className="w-36 py-0.5 text-neutral-500">Periode Layanan</td>
              <td className="w-3 py-0.5 text-neutral-400">:</td>
              <td className="py-0.5 text-neutral-800">
                Bulan{" "}
                {new Date().toLocaleDateString("id-ID", {
                  month: "long",
                })}{" "}
                {new Date().getFullYear()}
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
                      checked={
                        isWarmiendo
                          ? false
                          : kategoriSumber === "bank-sampah-induk"
                      }
                      readOnly
                      className="rounded"
                    />{" "}
                    Bank Sampah Induk
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={isWarmiendo ? true : kategoriSumber === "tps-3r"}
                      readOnly
                      className="rounded"
                    />{" "}
                    TPS 3R
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={
                        isWarmiendo
                          ? false
                          : kategoriSumber === "bank-sampah-unit"
                      }
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
        <h4 className="font-bold border-b border-neutral-200 pb-0.5 text-neutral-700 text-[10px] uppercase">
          IV. Lampiran Dokumen
        </h4>
        {data?.dataSampah && data.dataSampah.length > 0 ? (
          data.dataSampah.map((item, index) => (
            <div
              key={item.jenis}
              className="flex items-center justify-between max-w-sm"
            >
              <div className="text-neutral-700">
                {index + 1}. Dok. foto timbangan {item.jenis}
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
                Rp {(Number(customAmount) || 0).toLocaleString("id-ID")}
                ,00
              </td>
            </tr>
            <tr>
              <td className="py-0.5 text-neutral-500">
                Biaya Tambahan Per Kg/Ton
              </td>
              <td className="py-0.5 text-neutral-400">:</td>
              <td className="py-0.5 font-mono text-neutral-800">Rp 0,00</td>
            </tr>
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
        <div className="w-40 text-center space-y-1">
          <p className="text-[10px] text-neutral-500">Diserahkan Oleh,</p>
          <div className="h-14 flex items-center justify-center">
            {ttdBase64 ? (
              // biome-ignore lint/performance/noImgElement: TTD preview
              <img
                src={ttdBase64}
                alt="Tanda Tangan Pengaju"
                className="max-h-12 object-contain"
              />
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
        <div className="w-40 text-center space-y-1">
          <p className="text-[10px] text-neutral-500">Diterima Oleh,</p>
          <div className="h-14 flex items-center justify-center">
            {ttdAdminBase64 ? (
              // biome-ignore lint/performance/noImgElement: Admin TTD preview
              <img
                src={ttdAdminBase64}
                alt="Tanda Tangan Admin"
                className="max-h-12 object-contain"
              />
            ) : (
              <div className="text-[9px] text-neutral-400 italic border border-dashed border-neutral-300 px-3 py-1 rounded-lg bg-neutral-50">
                Menunggu Approval
              </div>
            )}
          </div>
          <div className="mt-1" />
          <p className="font-bold underline text-[10px] text-neutral-800">
            (PT. Indofood CBP Sukses Makmur Tbk,)
          </p>
          <p className="text-[9px] text-neutral-500 leading-tight">
            Pimpinan Perusahaan
          </p>
        </div>
      </div>
    </div>
  );
}

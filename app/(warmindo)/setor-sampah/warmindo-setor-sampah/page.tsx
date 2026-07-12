"use client";

import { Clock, Loader2, Recycle, Truck, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  createSetorSampah,
  getBankSampahList,
  getMySetoran,
  handoverSetorSampahToEkspedisi,
} from "@/app/(warmindo)/setor-sampah/warmindo-setor-sampah/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { SetorSampahItem } from "@/app/types";

export default function WarmindoSetorSampah() {
  const [jenisSampah, setJenisSampah] = useState("Karton");
  const [beratKg, setBeratKg] = useState("");
  const [tanggalSetor, _setTanggalSetor] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [catatan, setCatatan] = useState("");

  const [isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<{
    jenisSampah: string;
    beratKg: string;
    selectedBankSampahId: string;
    catatan: string;
    history: SetorSampahItem[];
  } | null>(null);

  const handleTourStart = () => {
    savedStateRef.current = {
      jenisSampah,
      beratKg,
      selectedBankSampahId,
      catatan,
      history,
    };
    setIsTourActive(true);
    setJenisSampah("Karton");
    setBeratKg("");
    setCatatan("");
    if (bankSampahList.length === 0) {
      setBankSampahList([
        {
          id: 999,
          name: "Bank Sampah Demo",
          username: "banksampah_demo",
          alamat: "Jl. Demo No. 1, Banjarmasin",
        },
      ]);
      setSelectedBankSampahId("999");
    } else {
      setSelectedBankSampahId(String(bankSampahList[0].id));
    }
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    if (savedStateRef.current) {
      setJenisSampah(savedStateRef.current.jenisSampah);
      setBeratKg(savedStateRef.current.beratKg);
      setSelectedBankSampahId(savedStateRef.current.selectedBankSampahId);
      setCatatan(savedStateRef.current.catatan);
      setHistory(savedStateRef.current.history);
    }
  };

  const setorSteps = [
    {
      element: "#tour-warmindo-setor-tujuan",
      popover: {
        title: "Pilih Tujuan Bank Sampah",
        description:
          "Pilih cabang Bank Sampah tujuan yang akan menjadi tempat verifikasi akhir sampah Anda.",
        side: "right" as const,
      },
    },
    {
      element: "#tour-warmindo-setor-catatan",
      popover: {
        title: "Catatan (Opsional)",
        description:
          "Tuliskan catatan tambahan mengenai kondisi sampah jika ada.",
        side: "top" as const,
      },
    },
    {
      element: "#tour-warmindo-setor-submit",
      popover: {
        title: "Simulasi Kirim Setoran",
        description:
          "Klik tombol ini untuk mengirim setoran secara simulasi. Alur akan dialihkan ke mode pengiriman ekspedisi tanpa masuk ke database riil.",
        side: "top" as const,
      },
    },
    {
      element: "#tour-warmindo-setor-history",
      popover: {
        title: "Riwayat Setoran",
        description:
          "Setelah Anda menyimulasikan setoran, detail pengajuan baru Anda beserta status ekspedisinya akan langsung muncul di panel ini.",
        side: "left" as const,
      },
    },
  ];

  const [bankSampahList, setBankSampahList] = useState<
    { id: number; name: string; username: string; alamat: string | null }[]
  >([]);
  const [selectedBankSampahId, setSelectedBankSampahId] = useState("");
  const [metodeSetor, setMetodeSetor] = useState<"ekspedisi" | "langsung">(
    "ekspedisi",
  );

  const [history, setHistory] = useState<SetorSampahItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [_formErrors, setFormErrors] = useState<Record<string, string[]>>({});

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

  const dateParts = tanggalSetor.split("-");
  const tahun = dateParts[0] || "2026";
  const bulan = dateParts[1] || "01";
  const tanggal = dateParts[2] || "01";
  const namaSetorPreview = `[OTOMATIS]/W/NDL/BJM/${tanggal}/${bulan}/${tahun}`;

  const activeEkspedisiSetoran = history.find(
    (item) =>
      item.metodeSetor === "ekspedisi" &&
      ["pending", "diverifikasi", "diserahkan"].includes(item.status),
  );

  const activeLangsungSetoran = history.find(
    (item) => item.metodeSetor === "langsung" && item.status === "pending",
  );

  const loadData = useCallback(async () => {
    const historyRes = await getMySetoran({ page: 1, limit: 10 });
    setHistory(historyRes.data as SetorSampahItem[]);
  }, []);

  useEffect(() => {
    loadData();
    getBankSampahList().then((res) => {
      setBankSampahList(res);
      if (res.length > 0) {
        setSelectedBankSampahId(String(res[0].id));
      }
    });
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    if (!selectedBankSampahId) {
      setFormErrors({ _form: ["Tujuan Bank Sampah wajib dipilih."] });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("bankSampahId", selectedBankSampahId);
    formData.set("metodeSetor", metodeSetor);
    formData.set("requestManualValidation", "false");

    if (isTourActive) {
      startTransition(async () => {
        document.dispatchEvent(new CustomEvent("close-tour-guide"));
        showFeedback(
          "success",
          "Setoran Berhasil! (Simulasi)",
          `Simulasi: Setoran sampah ${jenisSampah} (${beratKg || "10.00"} kg) Anda via ${metodeSetor === "langsung" ? "datang langsung" : "ekspedisi"} telah diajukan. Data Anda tidak disimpan ke database.`,
        );
        setBeratKg("");
        setCatatan("");
        setHistory((prev) => [
          {
            id: Date.now(),
            nomorSetor: `SIMULASI-W-${Math.floor(1000 + Math.random() * 9000)}`,
            jenisSampah,
            beratKg: Number(beratKg) || 10.0,
            totalPoin: 0,
            tanggalSetor: new Date().toISOString().split("T")[0],
            status: "pending",
            createdAt: new Date(),
            metodeSetor,
            catatan,
            totalKredit: (Number(beratKg) || 10.0) * 1000,
            fotoTimbangan: "/sampel_1.png",
          },
          ...prev,
        ]);
      });
      return;
    }

    startTransition(async () => {
      const result = await createSetorSampah({ success: false }, formData);
      if (result.success) {
        showFeedback(
          "success",
          "Setoran Berhasil!",
          metodeSetor === "langsung"
            ? "Pengajuan setoran sampah Anda telah berhasil dibuat. Silakan datang langsung ke alamat Bank Sampah tujuan untuk penimbangan dan validasi fisik."
            : "Pengajuan setoran sampah Anda telah berhasil dibuat. Silakan tunggu verifikasi admin untuk penunjukan kurir ekspedisi.",
        );
        setBeratKg("");
        setCatatan("");
        loadData();
      } else {
        if (result.errors?._form) {
          showFeedback("error", "Gagal!", result.errors._form[0]);
        } else if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    });
  };

  const formatTanggal = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    if (status === "diterima")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "diverifikasi")
      return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "diserahkan")
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (status === "pending")
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 lg:p-8">
      <TourGuide
        pageKey="warmindo_setor"
        steps={setorSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary-100">
            <Recycle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Setor Sampah Warmindo
            </h1>
            <p className="text-sm text-neutral-500">
              Input data setoran sampah Anda — datang langsung ke Bank Sampah
              atau via ekspedisi
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 bg-primary-50/30">
              <h2 className="font-semibold text-neutral-900">
                Form Setor Sampah
              </h2>
            </div>

            {activeEkspedisiSetoran ? (
              // Panel: Ada pengiriman ekspedisi aktif (3-step flow)
              <div className="p-6 space-y-6">
                <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
                  <Truck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800">
                      Ada Pengiriman Ekspedisi Aktif
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Anda sedang memiliki setoran via ekspedisi yang sedang
                      diproses. Form pengajuan baru akan dikunci hingga proses
                      selesai.
                    </p>
                  </div>
                </div>

                <div className="relative pl-6 border-l-2 border-neutral-150 space-y-6">
                  {/* Step 1: Diajukan */}
                  <div className="relative">
                    <span className="absolute -left-7.75 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white bg-amber-500 text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div className="text-xs">
                      <p className="font-bold text-neutral-800">
                        Pengajuan Setoran
                      </p>
                      <p className="text-neutral-500 mt-0.5">
                        Menunggu verifikasi Admin untuk penjemputan sampah.
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Diajukan:{" "}
                        {new Date(
                          activeEkspedisiSetoran.createdAt,
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Diverifikasi (Courier Assigned) */}
                  <div className="relative">
                    <span
                      className={`absolute -left-7.75 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                        ["diverifikasi", "diserahkan"].includes(
                          activeEkspedisiSetoran.status,
                        )
                          ? "bg-sky-500 text-white"
                          : "bg-neutral-200 text-neutral-400"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div className="text-xs">
                      <p className="font-bold text-neutral-800">
                        Verifikasi & Penjadwalan Kurir
                      </p>
                      <p className="text-neutral-500 mt-0.5">
                        {activeEkspedisiSetoran.status === "pending"
                          ? "Menunggu penunjukan kurir oleh bank sampah."
                          : `Kurir ditunjuk: ${activeEkspedisiSetoran.ekspedisi?.namaVendor || "Ekspedisi"} (${activeEkspedisiSetoran.ekspedisi?.noTelepon || ""})`}
                      </p>
                      {activeEkspedisiSetoran.status === "diverifikasi" && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              startTransition(async () => {
                                const res =
                                  await handoverSetorSampahToEkspedisi(
                                    activeEkspedisiSetoran.id,
                                  );
                                if (res.success) {
                                  showFeedback(
                                    "success",
                                    "Berhasil!",
                                    res.message,
                                  );
                                  loadData();
                                } else {
                                  showFeedback("error", "Gagal!", res.message);
                                }
                              });
                            }}
                            disabled={isPending}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-[11px] shadow-sm flex items-center gap-1.5 border-0 cursor-pointer transition-all"
                          >
                            {isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Truck className="w-3.5 h-3.5" />
                            )}
                            Serahkan Sampah ke Ekspedisi
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Diserahkan */}
                  <div className="relative">
                    <span
                      className={`absolute -left-7.75 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                        activeEkspedisiSetoran.status === "diserahkan"
                          ? "bg-indigo-500 text-white"
                          : "bg-neutral-200 text-neutral-400"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div className="text-xs">
                      <p className="font-bold text-neutral-800">
                        Sampah dalam Perjalanan
                      </p>
                      <p className="text-neutral-500 mt-0.5">
                        Sampah sedang diantar oleh kurir ke gudang pusat. Saldo
                        akan otomatis bertambah setelah sampah selesai
                        diverifikasi diterima oleh admin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeLangsungSetoran ? (
              // Panel: Datang langsung — menunggu konfirmasi penerimaan Bank Sampah
              <div className="p-6 space-y-5 animate-in fade-in duration-300">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                  <Upload className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800">
                      Setoran Datang Langsung Diajukan
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Harap datang langsung ke Bank Sampah tujuan dengan membawa
                      sampah Anda. Tidak ada kurir yang perlu dijadwalkan.
                    </p>
                  </div>
                </div>

                <div className="relative pl-6 border-l-2 border-neutral-150 space-y-6">
                  {/* Step 1: Diajukan */}
                  <div className="relative">
                    <span className="absolute -left-7.75 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white bg-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div className="text-xs">
                      <p className="font-bold text-neutral-800">
                        Pengajuan Dikirim
                      </p>
                      <p className="text-neutral-500 mt-0.5">
                        Setoran Anda telah tercatat. Datanglah ke Bank Sampah
                        dengan membawa sampah secara langsung.
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Diajukan:{" "}
                        {new Date(
                          activeLangsungSetoran.createdAt,
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Menunggu konfirmasi admin */}
                  <div className="relative">
                    <span className="absolute -left-7.75 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white bg-neutral-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div className="text-xs">
                      <p className="font-bold text-neutral-800">
                        Konfirmasi Penerimaan
                      </p>
                      <p className="text-neutral-500 mt-0.5">
                        Admin Bank Sampah akan mengkonfirmasi penerimaan setelah
                        sampah diserahkan langsung. Saldo akan otomatis
                        bertambah setelah dikonfirmasi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label
                    htmlFor="nomorSetor"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    NOMOR SETOR OTOMATIS
                  </label>
                  <input
                    id="nomorSetor"
                    type="text"
                    value={namaSetorPreview}
                    readOnly
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                  />
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
                    value={tanggalSetor}
                    disabled
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-400 focus:outline-none transition-all cursor-not-allowed"
                  />
                  <input
                    type="hidden"
                    name="tanggalSetor"
                    value={tanggalSetor}
                  />
                </div>

                <div id="tour-warmindo-setor-tujuan">
                  <label
                    htmlFor="bankSampahId"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    Tujuan Bank Sampah <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="bankSampahId"
                    name="bankSampahId"
                    value={selectedBankSampahId}
                    onChange={(e) => setSelectedBankSampahId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-650 focus:ring-primary-600/10 transition-all"
                  >
                    {bankSampahList.length === 0 ? (
                      <option value="">Memuat data Bank Sampah...</option>
                    ) : (
                      bankSampahList.map((bs) => (
                        <option key={bs.id} value={bs.id}>
                          {bs.name} ({bs.username})
                        </option>
                      ))
                    )}
                  </select>

                  {/* Metode Setor Pilihan */}
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Metode Setoran
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          metodeSetor === "ekspedisi"
                            ? "border-primary-500 bg-primary-50"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="metodeSetorUI"
                          value="ekspedisi"
                          checked={metodeSetor === "ekspedisi"}
                          onChange={() => setMetodeSetor("ekspedisi")}
                          className="sr-only"
                        />
                        <Truck
                          className={`w-4 h-4 shrink-0 ${metodeSetor === "ekspedisi" ? "text-primary-600" : "text-neutral-400"}`}
                        />
                        <span
                          className={`text-xs font-semibold ${metodeSetor === "ekspedisi" ? "text-primary-700" : "text-neutral-600"}`}
                        >
                          Via Ekspedisi
                        </span>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          metodeSetor === "langsung"
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="metodeSetorUI"
                          value="langsung"
                          checked={metodeSetor === "langsung"}
                          onChange={() => setMetodeSetor("langsung")}
                          className="sr-only"
                        />
                        <Upload
                          className={`w-4 h-4 shrink-0 ${metodeSetor === "langsung" ? "text-emerald-600" : "text-neutral-400"}`}
                        />
                        <span
                          className={`text-xs font-semibold ${metodeSetor === "langsung" ? "text-emerald-700" : "text-neutral-600"}`}
                        >
                          Datang Langsung
                        </span>
                      </label>
                    </div>

                    {/* Informasi alamat jika datang langsung */}
                    {metodeSetor === "langsung" &&
                      (() => {
                        const selected = bankSampahList.find(
                          (bs) => String(bs.id) === selectedBankSampahId,
                        );
                        return selected ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1 animate-in fade-in duration-200">
                            <p className="font-bold">
                              📍 Alamat Bank Sampah Tujuan:
                            </p>
                            <p className="font-semibold text-emerald-900">
                              {selected.name}
                            </p>
                            {selected.alamat ? (
                              <p className="text-emerald-700">
                                {selected.alamat}
                              </p>
                            ) : (
                              <p className="text-emerald-600 italic">
                                Alamat belum tersedia. Hubungi Bank Sampah
                                terkait.
                              </p>
                            )}
                            <p className="text-emerald-600 mt-1 pt-1 border-t border-emerald-200">
                              Harap datang langsung dengan membawa sampah Anda.
                              Admin tidak perlu memverifikasi ekspedisi untuk
                              metode ini.
                            </p>
                          </div>
                        ) : null;
                      })()}

                    {/* Info ekspedisi */}
                    {metodeSetor === "ekspedisi" && (
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Sampah akan dijemput oleh kurir ekspedisi setelah
                        diverifikasi Admin.
                      </p>
                    )}
                  </div>
                </div>

                <div id="tour-warmindo-setor-catatan">
                  <label
                    htmlFor="catatan"
                    className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5"
                  >
                    Catatan Tambahan (opsional)
                  </label>
                  <textarea
                    id="catatan"
                    name="catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={3}
                    placeholder="Catatan kondisi sampah, dll..."
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all resize-none"
                  />
                </div>

                <button
                  id="tour-warmindo-setor-submit"
                  type="submit"
                  disabled={isPending || !selectedBankSampahId}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors border-0 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses Setoran...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit Setoran
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div id="tour-warmindo-setor-history" className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-neutral-100 bg-primary-50/30">
              <h2 className="font-semibold text-neutral-900">
                Riwayat Setoran
              </h2>
            </div>

            <div className="divide-y divide-neutral-100 max-h-[calc(100vh-280px)] overflow-y-auto">
              {history.length === 0 ? (
                <div className="py-12 text-center">
                  <Recycle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">
                    Belum ada riwayat setoran
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-4 hover:bg-neutral-50 transition-colors bg-sky-50/35 border-l-4 border-sky-400"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {item.nomorSetor}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-500">
                            {item.jenisSampah}
                          </span>
                          <span className="text-neutral-300">·</span>
                          <span className="text-xs font-semibold text-neutral-700">
                            {item.beratKg} kg
                          </span>
                        </div>
                        {item.metodeSetor === "langsung" ? (
                          <div className="flex items-center gap-1.5 mt-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] w-fit font-semibold border border-emerald-100">
                            <Upload className="w-3 h-3 text-emerald-600" />
                            Datang Langsung
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] w-fit font-semibold border border-amber-100">
                            <Truck className="w-3 h-3 text-amber-600" />
                            Ekspedisi
                            {item.ekspedisi
                              ? `: ${item.ekspedisi.namaVendor}`
                              : " (Menunggu kurir)"}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-neutral-400">
                            {formatTanggal(item.tanggalSetor)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
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

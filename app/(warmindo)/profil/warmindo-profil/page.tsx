"use client";

import {
  ExternalLink,
  Info,
  Key,
  Loader2,
  Lock,
  MapPin,
  Navigation,
  Save,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  getProfileData,
  updatePassword,
  updateProfileData,
} from "@/app/(warmindo)/profil/warmindo-profil/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { ProfileData } from "@/app/types";

const profilSteps = [
  {
    element: "#tour-warmindo-profil-tabs",
    popover: {
      title: "Menu Tab Profil",
      description:
        "Pilih tab 'Informasi Profil' untuk melengkapi data diri, atau beralih ke 'Ubah Password' untuk menjaga keamanan akun Anda.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-warmindo-profil-form",
    popover: {
      title: "Data Profil Saya & Titik Lokasi",
      description:
        "Isi data diri, rekening bank, titik koordinat GPS usaha, serta link Google Maps untuk mempermudah penjemputan sampah.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-warmindo-profil-save",
    popover: {
      title: "Simpan Pembaruan",
      description:
        "Klik tombol ini untuk menyimpan pembaruan informasi profil Anda.",
      side: "top" as const,
    },
  },
];

export default function ProfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [_loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Lokasi & Google Maps state
  const [latVal, setLatVal] = useState<string>("");
  const [lngVal, setLngVal] = useState<string>("");
  const [mapsUrlVal, setMapsUrlVal] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<typeof profile | null>(null);

  const handleTourStart = () => {
    savedStateRef.current = profile;
    setIsTourActive(true);
    setProfile({
      id: 999,
      name: "nama lengkap demo",
      username: "username demo",
      nik: "637101xxxxxxx",
      noTelepon: "0882022xxxxx",
      email: "demo@gmail.com",
      noRekening: "123456xxx",
      jenisBank: "BNI",
      status: "aktif",
      alamat: "Jl. A. Yani No. 99 (Demo)",
      role: "warmindo",
      tanggalLahir: "1990-01-01",
      latitude: -3.32426,
      longitude: 114.59102,
      googleMapsUrl: "https://maps.google.com/?q=-3.32426,114.59102",
    });
    setLatVal("-3.32426");
    setLngVal("114.59102");
    setMapsUrlVal("https://maps.google.com/?q=-3.32426,114.59102");
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    const prev = savedStateRef.current;
    setProfile(prev as typeof profile);
    if (prev) {
      setLatVal(
        prev.latitude !== null && prev.latitude !== undefined
          ? String(prev.latitude)
          : "",
      );
      setLngVal(
        prev.longitude !== null && prev.longitude !== undefined
          ? String(prev.longitude)
          : "",
      );
      setMapsUrlVal(prev.googleMapsUrl || "");
    }
  };

  // Transition hooks for server actions
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  // Errors state
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>(
    {},
  );
  const [passwordErrors, setPasswordErrors] = useState<
    Record<string, string[]>
  >({});

  // Password fields
  const [passwordFields, setPasswordFields] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  const showFeedback = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setFeedback({ isOpen: true, type, title, message });
    },
    [],
  );

  const loadProfile = useCallback(() => {
    setLoading(true);
    getProfileData().then((res) => {
      if (res.success && res.data) {
        setProfile(res.data as ProfileData);
      } else {
        showFeedback(
          "error",
          "Gagal Memuat",
          res.message || "Gagal mengambil data profil.",
        );
      }
      setLoading(false);
    });
  }, [showFeedback]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) {
      setLatVal(
        profile.latitude !== null && profile.latitude !== undefined
          ? String(profile.latitude)
          : "",
      );
      setLngVal(
        profile.longitude !== null && profile.longitude !== undefined
          ? String(profile.longitude)
          : "",
      );
      setMapsUrlVal(profile.googleMapsUrl || "");
    }
  }, [profile]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showFeedback(
        "error",
        "Geolocation Tidak Didukung",
        "Browser Anda tidak mendukung deteksi lokasi otomatis.",
      );
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatVal(lat.toFixed(6));
        setLngVal(lng.toFixed(6));
        if (!mapsUrlVal) {
          setMapsUrlVal(`https://www.google.com/maps?q=${lat},${lng}`);
        }
        setIsDetectingLocation(false);
        showFeedback(
          "success",
          "Lokasi Terdeteksi",
          `Titik koordinat berhasil didapatkan: ${lat.toFixed(5)}, ${lng.toFixed(5)}.`,
        );
      },
      (err) => {
        setIsDetectingLocation(false);
        showFeedback(
          "error",
          "Gagal Mendeteksi Lokasi",
          err.message || "Mohon izinkan akses lokasi pada peramban Anda.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleGenerateMapsLink = () => {
    if (latVal && lngVal) {
      setMapsUrlVal(`https://www.google.com/maps?q=${latVal},${lngVal}`);
      showFeedback(
        "success",
        "Tautan Dibuat",
        "Tautan Google Maps berhasil dibuat dari titik koordinat.",
      );
    }
  };

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileErrors({});

    if (isTourActive) {
      document.dispatchEvent(new CustomEvent("close-tour-guide"));
      showFeedback(
        "success",
        "Profil Diperbarui! (Simulasi)",
        "Detail profil demo Anda berhasil diperbarui di memori lokal.",
      );
      return;
    }

    const formData = new FormData(e.currentTarget);
    startProfileTransition(async () => {
      const res = await updateProfileData(
        { success: false, message: "" },
        formData,
      );
      if (res.success) {
        showFeedback(
          "success",
          "Profil Diperbarui",
          "Detail profil Anda berhasil disimpan.",
        );
        loadProfile();
      } else {
        let errorMsg = res.message || "Gagal memperbarui profil.";
        if (res.errors) {
          setProfileErrors(res.errors);
          errorMsg = Object.values(res.errors).flat().join(". ");
        }
        showFeedback("error", "Pembaruan Gagal", errorMsg);
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordErrors({});

    const formData = new FormData(e.currentTarget);
    startPasswordTransition(async () => {
      const res = await updatePassword(
        { success: false, message: "" },
        formData,
      );
      if (res.success) {
        showFeedback(
          "success",
          "Password Diperbarui",
          "Password Anda berhasil diperbarui.",
        );
        setPasswordFields({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        let errorMsg = res.message || "Gagal memperbarui password.";
        if (res.errors) {
          setPasswordErrors(res.errors);
          errorMsg = Object.values(res.errors).flat().join(". ");
        }
        showFeedback("error", "Pembaruan Gagal", errorMsg);
      }
    });
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "superadmin":
        return "bg-red-100 text-red-700 border-red-200";
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "warmindo":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "bank-sampah":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const formatRoleName = (role?: string) => {
    if (!role) return "Nasabah";
    if (role === "bank-sampah") return "Bank Sampah";
    if (role === "warmindo") return "Warmindo";
    if (role === "konsumen") return "Konsumen";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <TourGuide
        steps={profilSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      {/* Profil Header Card */}
      <div className="relative overflow-hidden bg-linear-to-r from-primary-900 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-[-30%] right-[-10%] w-[45%] h-[150%] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-3xl shadow-lg border border-white/10 shrink-0">
            {profile ? profile.name?.slice(0, 2).toUpperCase() || "US" : "-"}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {profile?.name ?? "-"}
            </h1>
            <p className="text-primary-200 text-sm">
              @{profile?.username ?? "-"}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getRoleBadgeColor(profile?.role)}`}
              >
                {profile ? formatRoleName(profile.role) : "-"}
              </span>
              <span className="text-[10px] font-semibold bg-white/10 text-white px-2.5 py-0.5 rounded-full border border-white/10">
                Status: {profile ? profile.status || "Aktif" : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div
        id="tour-warmindo-profil-tabs"
        className="flex border-b border-neutral-200"
      >
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer border-0 bg-transparent ${
            activeTab === "profile"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <User className="w-4 h-4" />
          Informasi Profil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer border-0 bg-transparent ${
            activeTab === "password"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Lock className="w-4 h-4" />
          Ubah Password
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "profile" ? (
        <form
          key={profile ? profile.id : "loading"}
          id="tour-warmindo-profil-form"
          onSubmit={handleProfileSubmit}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-200/60 space-y-6"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-neutral-800">
              Detail Informasi Akun
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Nama Lengkap
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={profile?.name || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Nama Lengkap Anda"
              />
              {profileErrors.name && (
                <p className="text-[11px] font-semibold text-red-600">
                  {profileErrors.name[0]}
                </p>
              )}
            </div>

            {/* Username (Read Only) */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Username / ID Pengguna
              </span>
              <div className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-sm text-neutral-500 cursor-not-allowed select-none">
                {profile?.username}
              </div>
              <p className="text-[9px] text-neutral-400">
                Username tidak dapat diubah.
              </p>
            </div>

            {/* NIK */}
            <div className="space-y-1.5">
              <label
                htmlFor="nik"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                NIK (Nomor Induk Kependudukan)
              </label>
              <input
                id="nik"
                name="nik"
                type="text"
                maxLength={16}
                defaultValue={profile?.nik || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="16 Digit NIK"
              />
              {profileErrors.nik && (
                <p className="text-[11px] font-semibold text-red-600">
                  {profileErrors.nik[0]}
                </p>
              )}
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-1.5">
              <label
                htmlFor="tanggalLahir"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Tanggal Lahir
              </label>
              <div className="relative">
                <input
                  id="tanggalLahir"
                  name="tanggalLahir"
                  type="date"
                  defaultValue={profile?.tanggalLahir || ""}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                />
              </div>
              {profileErrors.tanggalLahir && (
                <p className="text-[11px] font-semibold text-red-600">
                  {profileErrors.tanggalLahir[0]}
                </p>
              )}
            </div>

            {/* No Telepon */}
            <div className="space-y-1.5">
              <label
                htmlFor="noTelepon"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Nomor Telepon / WhatsApp
              </label>
              <input
                id="noTelepon"
                name="noTelepon"
                type="tel"
                defaultValue={profile?.noTelepon || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Contoh: 081234567890"
              />
              {profileErrors.noTelepon && (
                <p className="text-[11px] font-semibold text-red-600">
                  {profileErrors.noTelepon[0]}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={profile?.email || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Contoh: nama@domain.com"
              />
              {profileErrors.email && (
                <p className="text-[11px] font-semibold text-red-600">
                  {profileErrors.email[0]}
                </p>
              )}
            </div>

            {/* Alamat */}
            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor="alamat"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Alamat Tinggal
              </label>
              <textarea
                id="alamat"
                name="alamat"
                rows={3}
                defaultValue={profile?.alamat || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all resize-none"
                placeholder="Alamat lengkap RT/RW, Kecamatan, Kota"
              />
              {profileErrors.alamat && (
                <p className="text-[11px] font-semibold text-red-600">
                  {profileErrors.alamat[0]}
                </p>
              )}
            </div>

            {/* Jenis Bank */}
            <div className="space-y-1.5">
              <label
                htmlFor="jenisBank"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Nama / Jenis Bank
              </label>
              <input
                id="jenisBank"
                name="jenisBank"
                type="text"
                defaultValue={profile?.jenisBank || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Contoh: BCA, BRI, Mandiri"
              />
              {profileErrors.jenisBank && (
                <p className="text-[11px] font-semibold text-red-600">
                  {profileErrors.jenisBank[0]}
                </p>
              )}
            </div>

            {/* No Rekening */}
            <div className="space-y-1.5">
              <label
                htmlFor="noRekening"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Nomor Rekening
              </label>
              <input
                id="noRekening"
                name="noRekening"
                type="text"
                defaultValue={profile?.noRekening || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Nomor rekening penerima transfer"
              />
              {profileErrors.noRekening && (
                <p className="text-[11px] font-semibold text-red-600">
                  {profileErrors.noRekening[0]}
                </p>
              )}
            </div>

            {/* ── Titik Lokasi & Link Google Maps ── */}
            <div className="pt-4 border-t border-neutral-100 md:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">
                      Titik Lokasi & Google Maps
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Tentukan koordinat operasional dan tautan peta lokasi
                      usaha Warmindo Anda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                >
                  {isDetectingLocation ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {isDetectingLocation
                    ? "Mendeteksi GPS..."
                    : "Ambil Lokasi Saat Ini"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Latitude */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="latitude"
                    className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                  >
                    Latitude (Garis Lintang)
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={latVal}
                    onChange={(e) => setLatVal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all font-mono"
                    placeholder="Contoh: -3.32426"
                  />
                  {profileErrors.latitude && (
                    <p className="text-[11px] font-semibold text-red-600">
                      {profileErrors.latitude[0]}
                    </p>
                  )}
                </div>

                {/* Longitude */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="longitude"
                    className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                  >
                    Longitude (Garis Bujur)
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={lngVal}
                    onChange={(e) => setLngVal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all font-mono"
                    placeholder="Contoh: 114.59102"
                  />
                  {profileErrors.longitude && (
                    <p className="text-[11px] font-semibold text-red-600">
                      {profileErrors.longitude[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Link Google Maps */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="googleMapsUrl"
                    className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                  >
                    Tautan / Link Google Maps
                  </label>
                  {latVal && lngVal && (
                    <button
                      type="button"
                      onClick={handleGenerateMapsLink}
                      className="text-[11px] font-bold text-primary-600 hover:underline cursor-pointer bg-transparent border-0 p-0"
                    >
                      Salin Koordinat ke Tautan
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="googleMapsUrl"
                      name="googleMapsUrl"
                      type="url"
                      value={mapsUrlVal}
                      onChange={(e) => setMapsUrlVal(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                      placeholder="https://maps.app.goo.gl/... atau https://maps.google.com/?q=..."
                    />
                  </div>
                  {(mapsUrlVal || (latVal && lngVal)) && (
                    <a
                      href={
                        mapsUrlVal ||
                        `https://www.google.com/maps?q=${latVal},${lngVal}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border border-neutral-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-primary-600" />
                      Buka Peta
                    </a>
                  )}
                </div>
                {profileErrors.googleMapsUrl && (
                  <p className="text-[11px] font-semibold text-red-600">
                    {profileErrors.googleMapsUrl[0]}
                  </p>
                )}
                <p className="text-[11px] text-neutral-400">
                  Tautan Google Maps membantu armada penjemput sampah menemukan
                  lokasi mitra Warmindo Anda secara presisi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100">
            <button
              id="tour-warmindo-profil-save"
              type="submit"
              disabled={isProfilePending}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
            >
              {isProfilePending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-200/60 space-y-6"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Key className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-neutral-800">
              Ubah Kata Sandi Akun
            </h2>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-amber-800 text-xs">
              <span className="font-bold">Keamanan Password</span>
              <p className="leading-relaxed">
                Demi kenyamanan dan keamanan akun Anda, pastikan untuk
                menggunakan password minimal 6 karakter dengan kombinasi angka
                dan huruf.
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            {/* Password Lama */}
            <div className="space-y-1.5">
              <label
                htmlFor="oldPassword"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Kata Sandi Lama
              </label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                required
                value={passwordFields.oldPassword}
                onChange={(e) =>
                  setPasswordFields({
                    ...passwordFields,
                    oldPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Masukkan kata sandi lama Anda"
              />
              {passwordErrors.oldPassword && (
                <p className="text-[11px] font-semibold text-red-600">
                  {passwordErrors.oldPassword[0]}
                </p>
              )}
            </div>

            {/* Password Baru */}
            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Kata Sandi Baru
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={passwordFields.newPassword}
                onChange={(e) =>
                  setPasswordFields({
                    ...passwordFields,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Kata sandi baru minimal 6 karakter"
              />
              {passwordErrors.newPassword && (
                <p className="text-[11px] font-semibold text-red-600">
                  {passwordErrors.newPassword[0]}
                </p>
              )}
            </div>

            {/* Konfirmasi Password Baru */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
              >
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={passwordFields.confirmPassword}
                onChange={(e) =>
                  setPasswordFields({
                    ...passwordFields,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Masukkan ulang kata sandi baru"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-[11px] font-semibold text-red-600">
                  {passwordErrors.confirmPassword[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={isPasswordPending}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Ubah Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}

"use client";

import { Info, Key, Loader2, Lock, Save, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  getProfileData,
  updatePassword,
  updateProfileData,
} from "@/app/(konsumen)/profil/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { ProfileData } from "@/app/types";

const profilSteps = [
  {
    element: "#tour-profil-tabs",
    popover: {
      title: "Tab Pengaturan",
      description:
        "Pilih tab 'Detail Profil' untuk mengelola data diri dan rekening bank, atau 'Ubah Password' untuk mengganti kata sandi akun.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-profil-form",
    popover: {
      title: "Form Data Diri & Rekening",
      description:
        "Lengkapi data profil diri Anda. Pastikan informasi NIK, Alamat, serta Rekening Bank terisi secara akurat untuk mempermudah proses pencairan saldo atau reward.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-profil-save",
    popover: {
      title: "Simpan Perubahan",
      description:
        "Klik tombol 'Simpan Perubahan' setelah Anda memperbarui data profil Anda agar tersimpan secara permanen di server.",
      side: "top" as const,
    },
  },
];

export default function ProfilPage() {
  const savedProfileRef = useRef<ProfileData | null>(null);

  const handleTourStart = () => {
    savedProfileRef.current = profile;
    setActiveTab("profile");
    setProfile({
      id: 999,
      name: "nama lengkap demo",
      email: "demo@gmail.com",
      nik: "637101xxxxxxx",
      noTelepon: "0882022xxxxx",
      alamat: "Jl. Sudirman No. 45, Jakarta",
      jenisBank: "BNI",
      noRekening: "123456xxx",
      poin: 250,
      kredit: 0,
      role: "konsumen",
      status: "aktif",
      username: "username demo",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  };

  const handleTourEnd = () => {
    setProfile(savedProfileRef.current);
  };

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

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

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileErrors({});

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">
          Memuat profil pengguna...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <TourGuide
        pageKey="profil"
        steps={profilSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />
      {/* Header Info Card */}
      <div className="relative overflow-hidden bg-linear-to-r from-primary-900 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-[-30%] right-[-10%] w-[45%] h-[150%] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-3xl shadow-lg border border-white/10 shrink-0">
            {profile?.name?.slice(0, 2).toUpperCase() || "US"}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {profile?.name}
            </h1>
            <p className="text-primary-200 text-sm">@{profile?.username}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getRoleBadgeColor(profile?.role)}`}
              >
                {formatRoleName(profile?.role)}
              </span>
              <span className="text-[10px] font-semibold bg-white/10 text-white px-2.5 py-0.5 rounded-full border border-white/10">
                Status: {profile?.status || "Aktif"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div id="tour-profil-tabs" className="flex border-b border-neutral-200">
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
          id="tour-profil-form"
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
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100">
            <button
              id="tour-profil-save"
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

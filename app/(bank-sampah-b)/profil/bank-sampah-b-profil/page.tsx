"use client";

import {
  ExternalLink,
  Key,
  Loader2,
  Lock,
  Save,
  Truck,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getProfileData,
  updatePassword,
  updateProfileData,
} from "@/app/(bank-sampah)/profil/bank-sampah-profil/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { DynamicLocationPickerMap } from "@/app/components/shared/maps/DynamicMaps";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { ProfileData } from "@/app/types";

const profilSteps = [
  {
    element: "#tour-bank-b-profil-tabs",
    popover: {
      title: "Tab Pengaturan Akun",
      description:
        "Gunakan tab ini untuk berpindah antara formulir pembaruan 'Informasi Profil' dan formulir 'Ubah Password' akun Bank Sampah Tipe B.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-profil-form",
    popover: {
      title: "Data Identitas Mitra",
      description:
        "Formulir ini memuat identitas Bank Sampah Anda: Nama Lengkap, Nomor Kontak, Alamat operasional, dan NIK.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-b-profil-location",
    popover: {
      title: "Titik Koordinat Peta",
      description:
        "Tentukan titik koordinat GPS fisik pangkalan penjemputan Anda melalui peta interaktif atau tombol 'Gunakan Lokasi Saya'.",
      side: "top" as const,
    },
  },
];

export default function BankSampahBProfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Lokasi koordinat state
  const [latVal, setLatVal] = useState<string>("");
  const [lngVal, setLngVal] = useState<string>("");

  // Transisi submit
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  // Feedback Modal
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

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const showFeedback = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setFeedback({ isOpen: true, type, title, message });
    },
    [],
  );

  const loadProfile = useCallback(async () => {
    try {
      const res = await getProfileData();
      if (res.success && res.data) {
        setProfile(res.data);
        if (res.data.latitude !== null && res.data.latitude !== undefined) {
          setLatVal(String(res.data.latitude));
        }
        if (res.data.longitude !== null && res.data.longitude !== undefined) {
          setLngVal(String(res.data.longitude));
        }
      } else {
        showFeedback("error", "Gagal", res.message || "Gagal memuat profil");
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Kesalahan", "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set("latitude", latVal);
    formData.set("longitude", lngVal);

    startProfileTransition(async () => {
      const res = await updateProfileData({ success: false }, formData);
      if (res.success) {
        showFeedback(
          "success",
          "Profil Diperbarui",
          "Data profil Bank Sampah Tipe B berhasil disimpan.",
        );
        loadProfile();
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        }
        showFeedback(
          "error",
          "Gagal Memperbarui",
          res.message || "Periksa kembali isian formulir Anda.",
        );
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    startPasswordTransition(async () => {
      const res = await updatePassword({ success: false }, formData);
      if (res.success) {
        showFeedback(
          "success",
          "Password Diperbarui",
          "Kata sandi akun Anda berhasil diganti.",
        );
        (e.target as HTMLFormElement).reset();
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        }
        showFeedback(
          "error",
          "Gagal",
          res.message || "Gagal memperbarui kata sandi.",
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const parsedLat = latVal ? Number.parseFloat(latVal) : null;
  const parsedLng = lngVal ? Number.parseFloat(lngVal) : null;
  const hasValidCoords =
    parsedLat !== null &&
    parsedLng !== null &&
    !Number.isNaN(parsedLat) &&
    !Number.isNaN(parsedLng);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <TourGuide steps={profilSteps} />

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Profil Bank Sampah Tipe B
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola informasi identitas operasional dan keamanan akun Anda
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        id="tour-bank-b-profil-tabs"
        className="flex border-b border-neutral-200/80 gap-6"
      >
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "profile"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          <User className="w-4 h-4" />
          Informasi Profil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "password"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          <Lock className="w-4 h-4" />
          Ubah Password
        </button>
      </div>

      {/* Form Content */}
      {activeTab === "profile" ? (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div
            id="tour-bank-b-profil-form"
            className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4"
          >
            <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Identitas Mitra
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prof-nama-b"
                  className="text-xs font-bold text-neutral-600 block mb-1"
                >
                  Nama Lengkap / Unit <span className="text-red-500">*</span>
                </label>
                <input
                  id="prof-nama-b"
                  type="text"
                  name="name"
                  required
                  defaultValue={profile?.name || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.name[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prof-username-b"
                  className="text-xs font-bold text-neutral-600 block mb-1"
                >
                  Username Login
                </label>
                <input
                  id="prof-username-b"
                  type="text"
                  disabled
                  value={profile?.username || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="prof-telp-b"
                  className="text-xs font-bold text-neutral-600 block mb-1"
                >
                  No. Telepon / WhatsApp
                </label>
                <input
                  id="prof-telp-b"
                  type="tel"
                  name="noTelepon"
                  defaultValue={profile?.noTelepon || ""}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="prof-email-b"
                  className="text-xs font-bold text-neutral-600 block mb-1"
                >
                  Alamat Email
                </label>
                <input
                  id="prof-email-b"
                  type="email"
                  name="email"
                  defaultValue={profile?.email || ""}
                  placeholder="banksampah@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="prof-alamat-b"
                  className="text-xs font-bold text-neutral-600 block mb-1"
                >
                  Alamat Lengkap Operasional
                </label>
                <textarea
                  id="prof-alamat-b"
                  rows={2}
                  name="alamat"
                  defaultValue={profile?.alamat || ""}
                  placeholder="Alamat kantor / gudang penjemputan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Lokasi Peta Koordinat */}
          <div
            id="tour-bank-b-profil-location"
            className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Titik Lokasi GPS
                </h3>
                <p className="text-xs text-neutral-500">
                  Tandai lokasi pangkalan Bank Sampah Tipe B pada peta
                </p>
              </div>
              {hasValidCoords && (
                <a
                  href={`https://www.google.com/maps?q=${latVal},${lngVal}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Google Maps</span>
                </a>
              )}
            </div>

            <DynamicLocationPickerMap
              latitude={parsedLat}
              longitude={parsedLng}
              onChange={(lat, lng) => {
                setLatVal(String(lat));
                setLngVal(String(lng));
              }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProfilePending}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              {isProfilePending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Ubah Password Akun
            </h3>

            <div className="space-y-4 max-w-md">
              <div>
                <label
                  htmlFor="prof-oldpass-b"
                  className="text-xs font-bold text-neutral-600 block mb-1"
                >
                  Password Saat Ini <span className="text-red-500">*</span>
                </label>
                <input
                  id="prof-oldpass-b"
                  type="password"
                  name="oldPassword"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="prof-newpass-b"
                  className="text-xs font-bold text-neutral-600 block mb-1"
                >
                  Password Baru <span className="text-red-500">*</span>
                </label>
                <input
                  id="prof-newpass-b"
                  type="password"
                  name="newPassword"
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="prof-confirmpass-b"
                  className="text-xs font-bold text-neutral-600 block mb-1"
                >
                  Konfirmasi Password Baru{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="prof-confirmpass-b"
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPasswordPending}
              className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              {isPasswordPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              <span>Perbarui Password</span>
            </button>
          </div>
        </form>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((f) => ({ ...f, isOpen: false }))}
      />
    </div>
  );
}

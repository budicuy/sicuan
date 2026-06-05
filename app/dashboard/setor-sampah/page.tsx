"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUserRole } from "./action";
import { BankSampahSetorSampah } from "./bank-sampah";
import { KonsumenSetorSampah } from "./konsumen";
import { WarmiendoSetorSampah } from "./warmiendo";

export default function SetorSampahPage() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      try {
        const userRole = await getCurrentUserRole();
        setRole(userRole);
      } catch (err) {
        console.error("Gagal mendapatkan role user:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRole();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
        <p className="text-sm text-neutral-500 font-medium">
          Memuat halaman setor sampah...
        </p>
      </div>
    );
  }

  if (role === "warmiendo") {
    return <WarmiendoSetorSampah />;
  }

  if (role === "bank-sampah") {
    return <BankSampahSetorSampah />;
  }

  // Fallback ke KonsumenSetorSampah jika konsumen atau role lainnya
  return <KonsumenSetorSampah />;
}

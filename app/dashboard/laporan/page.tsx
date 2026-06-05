"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCurrentUserRole } from "../setor-sampah/action";

export default function LaporanRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    getCurrentUserRole().then((role) => {
      if (role === "warmiendo") {
        router.replace("/dashboard/laporan/warmiendo");
      } else if (role === "bank-sampah") {
        router.replace("/dashboard/laporan/bank-sampah");
      } else {
        router.replace("/dashboard/laporan/konsumen");
      }
    });
  }, [router]);

  return (
    <div className="py-24 text-center">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
      <p className="text-neutral-500 text-sm">
        Mengarahkan ke halaman laporan...
      </p>
    </div>
  );
}

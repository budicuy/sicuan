import { getPetaSampahData } from "@/app/(warmiendo)/peta-sampah/action";
import PetaSampahWrapper from "@/app/components/warmiendo/PetaSampahWrapper";

export const metadata = {
  title: "Peta Sampah - Warmiendo Dashboard | SICUAN",
};

export default async function PetaSampahPage() {
  const data = await getPetaSampahData();

  if (!data.success || !data.warmiendo || !data.setoran) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200">
        <h2 className="font-bold">Akses Ditolak</h2>
        <p className="text-sm mt-1">{data.message ?? "Terjadi kesalahan"}</p>
      </div>
    );
  }

  return (
    <PetaSampahWrapper
      warmiendo={data.warmiendo}
      bankSampah={data.bankSampah ?? null}
      setoran={data.setoran}
    />
  );
}

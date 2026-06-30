import { getAdminPetaSampahData } from "@/app/(admin-superadmin)/peta-sampah/action";
import PetaSampahAdminWrapper from "@/app/components/admin/PetaSampahAdminWrapper";

export const metadata = {
  title: "Peta Sampah - Admin Dashboard | SICUAN",
};

export default async function PetaSampahAdminPage() {
  const data = await getAdminPetaSampahData();

  if (!data.success || !data.setoran || !data.indofood) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200">
        <h2 className="font-bold">Akses Ditolak</h2>
        <p className="text-sm mt-1">{data.message ?? "Terjadi kesalahan"}</p>
      </div>
    );
  }

  return (
    <PetaSampahAdminWrapper
      setoran={data.setoran}
      bankSampah={data.bankSampah ?? null}
      indofood={data.indofood}
    />
  );
}

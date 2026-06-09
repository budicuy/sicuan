import { seedEkspedisi } from "@/db/seeds/ekspedisi.seed";
import { seedHargaSampah } from "@/db/seeds/harga-sampah.seed";
import { seedKupon } from "@/db/seeds/kupon.seed";
import { seedNasabah } from "@/db/seeds/nasabah.seed";
import { seedRawMaterial } from "@/db/seeds/raw-material.seed";
import { seedSetorSampah } from "@/db/seeds/setor-sampah.seed";
import { seedUsers } from "@/db/seeds/users.seed";

export const seeders = [
  seedUsers,
  seedEkspedisi,
  seedHargaSampah,
  seedRawMaterial,
  seedKupon,
  seedSetorSampah,
  seedNasabah,
];

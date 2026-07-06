import { seedEkspedisi } from "@/db/seeds/ekspedisi.seed";
import { seedHargaSampah } from "@/db/seeds/harga-sampah.seed";
import { seedKupon } from "@/db/seeds/kupon.seed";
import { seedNasabah } from "@/db/seeds/nasabah.seed";
import { seedPoinSampah } from "@/db/seeds/poin-sampah.seed";
import { seedRawMaterial } from "@/db/seeds/raw-material.seed";
// import { seedSetorSampah } from "@/db/seeds/setor-sampah.seed";

export const seeders = [
  seedNasabah,
  seedEkspedisi,
  seedHargaSampah,
  seedPoinSampah,
  seedRawMaterial,
  seedKupon,
  // seedSetorSampah,
];

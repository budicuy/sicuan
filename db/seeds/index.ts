import { seedEkspedisi } from "@/db/seeds/ekspedisi.seed";
import { seedHargaSampah } from "@/db/seeds/harga-sampah.seed";
import { seedKupon } from "@/db/seeds/kupon.seed";
import { seedNasabah } from "@/db/seeds/nasabah.seed";
import { seedPoinSampah } from "@/db/seeds/poin-sampah.seed";
import { seedRawMaterial } from "@/db/seeds/raw-material.seed";
import { seedUsers } from "@/db/seeds/users.seed";
import { seedSetorSampah } from "./setor-sampah.seed";

export const seeders = [
  seedUsers,
  seedNasabah,
  seedEkspedisi,
  seedHargaSampah,
  seedPoinSampah,
  seedRawMaterial,
  seedKupon,
  seedSetorSampah,
];

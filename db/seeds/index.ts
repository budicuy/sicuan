import { seedEkspedisi } from "./ekspedisi.seed";
import { seedHargaSampah } from "./harga-sampah.seed";
import { seedKupon } from "./kupon.seed";
import { seedNasabah } from "./nasabah.seed";
import { seedRawMaterial } from "./raw-material.seed";
import { seedSetorSampah } from "./setor-sampah.seed";
import { seedUsers } from "./users.seed";

export const seeders = [
  seedUsers,
  seedNasabah,
  seedEkspedisi,
  seedHargaSampah,
  seedRawMaterial,
  seedKupon,
  seedSetorSampah,
];

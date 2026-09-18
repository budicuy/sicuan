import { seedEkspedisi } from "@/db/seeds/ekspedisi.seed";
import { seedHargaSampah } from "@/db/seeds/harga-sampah.seed";
import { seedNasabah } from "@/db/seeds/nasabah.seed";
import { seedPoinSampah } from "@/db/seeds/poin-sampah.seed";
import { seedPoinWarmindo } from "@/db/seeds/poin-warmindo.seed";
import { seedRawMaterial } from "@/db/seeds/raw-material.seed";
import { seedRewardWarmindo } from "@/db/seeds/reward-warmindo.seed";
import { seedUsers } from "@/db/seeds/users.seed";
import { seedVideoPost } from "@/db/seeds/video-post.seed";
import { seedSetorSampah } from "./setor-sampah.seed";

export const seeders = [
  seedUsers,
  seedNasabah,
  seedEkspedisi,
  seedHargaSampah,
  seedPoinSampah,
  seedPoinWarmindo,
  seedRewardWarmindo,
  seedRawMaterial,
  seedSetorSampah,
  seedVideoPost,
];

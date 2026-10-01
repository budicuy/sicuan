/**
 * master-data.ts — Types untuk master data (ekspedisi, harga, kupon, poin).
 * Re-ekspor langsung dari Drizzle ORM schemas.
 */

import type { Ekspedisi as BaseEkspedisi } from "@/db/schema/ekspedisi";

export type Ekspedisi = BaseEkspedisi & {
  bankSampah?: {
    id: number;
    name: string;
    username: string;
    noTelepon?: string | null;
    alamat?: string | null;
  } | null;
};
export type { HargaSampah } from "@/db/schema/harga-sampah";
export type { PoinSampah } from "@/db/schema/poin-sampah";
export type { PoinSampahWarmindo } from "@/db/schema/poin-warmindo";
export type {
  MasterReward,
  NewMasterReward,
  NewPenukaranReward,
  NewPenukaranRewardWarmindo,
  NewRewardWarmindo,
  PenukaranReward,
  PenukaranRewardWarmindo,
  RewardWarmindo,
} from "@/db/schema/reward-warmindo";
export type { NewVideoPost, VideoPost } from "@/db/schema/video-post";

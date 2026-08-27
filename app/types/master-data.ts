/**
 * master-data.ts — Types untuk master data (ekspedisi, harga, kupon, poin).
 * Re-ekspor langsung dari Drizzle ORM schemas.
 */

export type { Ekspedisi } from "@/db/schema/ekspedisi";
export type { HargaSampah } from "@/db/schema/harga-sampah";
export type { Kupon } from "@/db/schema/kupon";
export type { PoinSampah } from "@/db/schema/poin-sampah";
export type { PoinSampahWarmindo } from "@/db/schema/poin-warmindo";
export type {
  PenukaranRewardWarmindo,
  RewardWarmindo,
} from "@/db/schema/reward-warmindo";
export type { NewVideoPost, VideoPost } from "@/db/schema/video-post";

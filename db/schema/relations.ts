import { relations } from "drizzle-orm";
import { buktiPembayaran } from "@/db/schema/bukti-pembayaran";
import { ekspedisi } from "@/db/schema/ekspedisi";
import { kupon } from "@/db/schema/kupon";
import { nasabah, users } from "@/db/schema/nasabah";
import { pencairanDana } from "@/db/schema/pencairan-dana";
import { penukaranKupon } from "@/db/schema/penukaran-kupon";
import { setorSampah } from "@/db/schema/setor-sampah";

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(nasabah, {
    fields: [users.id],
    references: [nasabah.id],
  }),
}));

export const nasabahRelations = relations(nasabah, ({ one, many }) => ({
  user: one(users, {
    fields: [nasabah.id],
    references: [users.id],
  }),
  setorSampah: many(setorSampah),
  penukaranKupon: many(penukaranKupon),
}));

export const setorSampahRelations = relations(setorSampah, ({ one }) => ({
  user: one(nasabah, {
    fields: [setorSampah.userId],
    references: [nasabah.id],
  }),
  ekspedisi: one(ekspedisi, {
    fields: [setorSampah.ekspedisiId],
    references: [ekspedisi.id],
  }),
  bankSampah: one(nasabah, {
    fields: [setorSampah.bankSampahId],
    references: [nasabah.id],
  }),
}));

export const kuponRelations = relations(kupon, ({ many }) => ({
  penukaranKupon: many(penukaranKupon),
}));

export const penukaranKuponRelations = relations(penukaranKupon, ({ one }) => ({
  user: one(nasabah, {
    fields: [penukaranKupon.userId],
    references: [nasabah.id],
  }),
  kupon: one(kupon, {
    fields: [penukaranKupon.kuponId],
    references: [kupon.id],
  }),
}));

export const pencairanDanaRelations = relations(pencairanDana, ({ one }) => ({
  user: one(nasabah, {
    fields: [pencairanDana.userId],
    references: [nasabah.id],
  }),
  buktiPembayaran: one(buktiPembayaran, {
    fields: [pencairanDana.id],
    references: [buktiPembayaran.pencairanDanaId],
  }),
}));

export const buktiPembayaranRelations = relations(
  buktiPembayaran,
  ({ one }) => ({
    user: one(nasabah, {
      fields: [buktiPembayaran.userId],
      references: [nasabah.id],
    }),
    pencairanDana: one(pencairanDana, {
      fields: [buktiPembayaran.pencairanDanaId],
      references: [pencairanDana.id],
    }),
  }),
);

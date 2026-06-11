import { relations } from "drizzle-orm";
import { buktiPembayaran } from "@/db/schema/bukti-pembayaran";
import { ekspedisi } from "@/db/schema/ekspedisi";
import { kupon } from "@/db/schema/kupon";
import { nasabah } from "@/db/schema/nasabah";
import { pencairanDana } from "@/db/schema/pencairan-dana";
import { penukaranKupon } from "@/db/schema/penukaran-kupon";
import { setorSampahBankSampah } from "@/db/schema/setoran_bank_sampah";
import { setorSampahKonsumen } from "@/db/schema/setoran_konsumen";
import { setorSampahWarmiendo } from "@/db/schema/setoran_warmiendo";
import { users } from "@/db/schema/users";

export const usersRelations = relations(users, ({ one, many }) => ({
  nasabah: one(nasabah, {
    fields: [users.id],
    references: [nasabah.userId],
  }),
  setorSampahKonsumen: many(setorSampahKonsumen),
  setorSampahWarmiendo: many(setorSampahWarmiendo),
  setorSampahBankSampah: many(setorSampahBankSampah),
  penukaranKupon: many(penukaranKupon),
}));

export const nasabahRelations = relations(nasabah, ({ one }) => ({
  user: one(users, {
    fields: [nasabah.userId],
    references: [users.id],
  }),
}));

export const setorSampahKonsumenRelations = relations(
  setorSampahKonsumen,
  ({ one }) => ({
    user: one(users, {
      fields: [setorSampahKonsumen.userId],
      references: [users.id],
    }),
  }),
);

export const setorSampahWarmiendoRelations = relations(
  setorSampahWarmiendo,
  ({ one }) => ({
    user: one(users, {
      fields: [setorSampahWarmiendo.userId],
      references: [users.id],
    }),
    ekspedisi: one(ekspedisi, {
      fields: [setorSampahWarmiendo.ekspedisiId],
      references: [ekspedisi.id],
    }),
  }),
);

export const setorSampahBankSampahRelations = relations(
  setorSampahBankSampah,
  ({ one }) => ({
    user: one(users, {
      fields: [setorSampahBankSampah.userId],
      references: [users.id],
    }),
  }),
);

export const kuponRelations = relations(kupon, ({ many }) => ({
  penukaranKupon: many(penukaranKupon),
}));

export const penukaranKuponRelations = relations(penukaranKupon, ({ one }) => ({
  user: one(users, {
    fields: [penukaranKupon.userId],
    references: [users.id],
  }),
  kupon: one(kupon, {
    fields: [penukaranKupon.kuponId],
    references: [kupon.id],
  }),
}));

export const pencairanDanaRelations = relations(pencairanDana, ({ one }) => ({
  user: one(users, {
    fields: [pencairanDana.userId],
    references: [users.id],
  }),
  buktiPembayaran: one(buktiPembayaran, {
    fields: [pencairanDana.id],
    references: [buktiPembayaran.pencairanDanaId],
  }),
}));

export const buktiPembayaranRelations = relations(
  buktiPembayaran,
  ({ one }) => ({
    user: one(users, {
      fields: [buktiPembayaran.userId],
      references: [users.id],
    }),
    pencairanDana: one(pencairanDana, {
      fields: [buktiPembayaran.pencairanDanaId],
      references: [pencairanDana.id],
    }),
  }),
);

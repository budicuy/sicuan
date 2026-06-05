import { relations } from "drizzle-orm";
import { ekspedisi } from "./ekspedisi";
import { kupon } from "./kupon";
import { nasabah } from "./nasabah";
import { penukaranKupon } from "./penukaran-kupon";
import {
  setorSampahBankSampah,
  setorSampahKonsumen,
  setorSampahWarmiendo,
} from "./setor-sampah";
import { users } from "./users";

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

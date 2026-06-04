import { relations } from "drizzle-orm";
import { kupon } from "./kupon";
import { nasabah } from "./nasabah";
import { penukaranKupon } from "./penukaran-kupon";
import { setorSampah } from "./setor-sampah";
import { users } from "./users";

export const usersRelations = relations(users, ({ one, many }) => ({
  nasabah: one(nasabah, {
    fields: [users.id],
    references: [nasabah.userId],
  }),
  setorSampah: many(setorSampah),
  penukaranKupon: many(penukaranKupon),
}));

export const nasabahRelations = relations(nasabah, ({ one }) => ({
  user: one(users, {
    fields: [nasabah.userId],
    references: [users.id],
  }),
}));

export const setorSampahRelations = relations(setorSampah, ({ one }) => ({
  user: one(users, {
    fields: [setorSampah.userId],
    references: [users.id],
  }),
}));

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

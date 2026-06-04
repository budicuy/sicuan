import { relations } from "drizzle-orm";
import { nasabah } from "./nasabah";
import { setorSampah } from "./setor-sampah";
import { users } from "./users";

export const usersRelations = relations(users, ({ one, many }) => ({
  nasabah: one(nasabah, {
    fields: [users.id],
    references: [nasabah.userId],
  }),
  setorSampah: many(setorSampah),
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

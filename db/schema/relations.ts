import { relations } from "drizzle-orm";
import { nasabah } from "./nasabah";
import { users } from "./users";

export const usersRelations = relations(users, ({ one }) => ({
  nasabah: one(nasabah, {
    fields: [users.id],
    references: [nasabah.userId],
  }),
}));

export const nasabahRelations = relations(nasabah, ({ one }) => ({
  user: one(users, {
    fields: [nasabah.userId],
    references: [users.id],
  }),
}));

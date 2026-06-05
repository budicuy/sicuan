import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

export const pencairanDana = pgTable("pencairan_dana", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jumlah: integer("jumlah").notNull(),
  jenisBank: text("jenis_bank").notNull(),
  noRekening: text("no_rekening").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "berhasil", or "ditolak"
  buktiTransfer: text("bukti_transfer"), // proof photo uploaded by admin
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertPencairanDanaSchema = createInsertSchema(pencairanDana);
export const selectPencairanDanaSchema = createSelectSchema(pencairanDana);

export type PencairanDana = typeof pencairanDana.$inferSelect;
export type NewPencairanDana = typeof pencairanDana.$inferInsert;

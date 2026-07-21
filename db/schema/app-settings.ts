import { boolean, integer, pgTable, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey(),
  disableAiWarmindo: boolean("disable_ai_warmindo").notNull().default(false),
  disableAiBankSampah: boolean("disable_ai_bank_sampah")
    .notNull()
    .default(false),
  disableAiKonsumen: boolean("disable_ai_konsumen").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings);
export const selectAppSettingsSchema = createSelectSchema(appSettings);

export type AppSettings = typeof appSettings.$inferSelect;
export type NewAppSettings = typeof appSettings.$inferInsert;
